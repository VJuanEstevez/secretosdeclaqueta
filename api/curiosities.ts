import type { IncomingMessage, ServerResponse } from 'node:http';
import Anthropic from '@anthropic-ai/sdk';
import { clientIp, createRateLimiter } from './_lib/rate-limit';

/**
 * Función serverless de Vercel: es el único sitio que conoce
 * ANTHROPIC_API_KEY. El cliente (AiCuriositiesService) llama a este mismo
 * origen en `/api/curiosities`, así que no hace falta configurar CORS.
 * Ver docs/integracion-ia.md para el contrato HTTP completo.
 */

interface MoviePayload {
  id?: unknown;
  title?: unknown;
  originalTitle?: unknown;
  releaseYear?: unknown;
  director?: unknown;
  cast?: unknown;
  genres?: unknown;
  runtimeMinutes?: unknown;
  tagline?: unknown;
  overview?: unknown;
  productionCompanies?: unknown;
}

const SYSTEM_PROMPT = `Eres documentalista de cine. Devuelves curiosidades verificables
sobre el rodaje, la producción o la recepción de una película: decisiones de dirección,
accidentes de rodaje, cambios de guion, efectos prácticos, datos de taquilla.

Reglas:
- Exactamente 5 curiosidades, en castellano de España.
- Cada una debe ser un hecho concreto y comprobable. Si no estás razonablemente
  seguro de un dato, elige otro en su lugar: es preferible una curiosidad menos
  llamativa a una inventada.
- Nada de resumir la trama ni de repetir la sinopsis.
- "title" es un titular de 3 a 6 palabras; "body", 1 o 2 frases.`;

// Sin minItems/maxItems: el esquema no los admite, el recuento se pide en el prompt.
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    curiosities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['title', 'body'],
        additionalProperties: false,
      },
    },
  },
  required: ['curiosities'],
  additionalProperties: false,
} as const;

const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno de Vercel

// Cada llamada exitosa cuesta una petición real a Claude: límite más estricto que el del catálogo.
const isRateLimited = createRateLimiter({ limit: 10, windowMs: 60_000 });

const MAX_BODY_BYTES = 20_000;
const MAX_FIELD_LENGTH = 500;

function truncate(value: unknown, max = MAX_FIELD_LENGTH): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function truncateList(value: unknown, maxItems: number, maxLength: number): string[] {
  return Array.isArray(value)
    ? value.slice(0, maxItems).map((item) => truncate(item, maxLength))
    : [];
}

/** Evita que un payload adversario infle el prompt en tokens y coste. */
function sanitizeMovie(movie: MoviePayload): MoviePayload {
  return {
    id: movie.id,
    title: truncate(movie.title, 200),
    originalTitle: truncate(movie.originalTitle, 200),
    releaseYear: truncate(movie.releaseYear, 10),
    director: truncate(movie.director, 100),
    cast: truncateList(movie.cast, 10, 100),
    genres: truncateList(movie.genres, 10, 50),
    runtimeMinutes: movie.runtimeMinutes,
    tagline: truncate(movie.tagline, 200),
    overview: truncate(movie.overview, 1000),
    productionCompanies: truncateList(movie.productionCompanies, 5, 100),
  };
}

async function generate(movie: MoviePayload) {
  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
    },
    // Si los clasificadores de seguridad rechazan la petición, reintenta sola
    // en el modelo de reserva recomendado en vez de devolver el fallo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: [
      {
        role: 'user',
        content: `Dame 5 curiosidades de rodaje de esta película:\n${JSON.stringify(movie)}`,
      },
    ],
  });

  // Comprobar SIEMPRE stop_reason antes de leer content: en un rechazo puede venir vacío.
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('La petición ha sido rechazada.'), { status: 422 });
  }

  const text = response.content.find((block) => block.type === 'text')?.text ?? '';
  const parsed = JSON.parse(text);
  return { curiosities: parsed.curiosities.slice(0, 5) };
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) {
      throw Object.assign(new Error('Cuerpo de la petición demasiado grande.'), { status: 413 });
    }
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res
      .writeHead(405, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: 'Método no permitido.' }));
    return;
  }

  if (isRateLimited(clientIp(req))) {
    res
      .writeHead(429, { 'content-type': 'application/json' })
      .end(
        JSON.stringify({ error: 'Se ha superado el límite de peticiones. Inténtalo más tarde.' }),
      );
    return;
  }

  try {
    const body = (await readJsonBody(req)) as { movie?: MoviePayload };
    const movie = body.movie;

    if (!movie?.title) {
      res
        .writeHead(400, { 'content-type': 'application/json' })
        .end(JSON.stringify({ error: 'Falta el título de la película.' }));
      return;
    }

    const payload = await generate(sanitizeMovie(movie));
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(payload));
  } catch (error) {
    console.error(error);
    const status = (error as { status?: number })?.status ?? 502;
    res
      .writeHead(status, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: 'No se han podido generar las curiosidades.' }));
  }
}
