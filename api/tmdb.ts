import type { IncomingMessage, ServerResponse } from 'node:http';
import { clientIp, createRateLimiter } from './_lib/rate-limit';

/**
 * Proxy de catálogo: es el único sitio que conoce el token/api_key de TMDB.
 * El cliente (TmdbService) llama a `/api/tmdb/...` en vez de a
 * api.themoviedb.org directamente, así el token nunca llega al navegador.
 *
 * Solo reenvía las tres rutas que usa la SPA, con una lista blanca de query
 * params por ruta: evita que un cliente inyecte parámetros arbitrarios en la
 * petición a TMDB (p. ej. forzar `include_adult=true`).
 */

const API_BASE = 'https://api.themoviedb.org/3';
const LANGUAGE = 'es-ES';
const MAX_QUERY_LENGTH = 80;

const isRateLimited = createRateLimiter({ limit: 30, windowMs: 60_000 });

interface Route {
  readonly match: RegExp;
  readonly upstreamPath: (groups: string[]) => string;
  readonly allowedParams: readonly string[];
}

const ROUTES: readonly Route[] = [
  {
    match: /^\/trending\/movie\/week$/,
    upstreamPath: () => '/trending/movie/week',
    allowedParams: [],
  },
  { match: /^\/search\/movie$/, upstreamPath: () => '/search/movie', allowedParams: ['query'] },
  {
    match: /^\/movie\/(\d+)$/,
    upstreamPath: ([id]) => `/movie/${id}`,
    allowedParams: ['append_to_response'],
  },
];

function authHeaders(): HeadersInit {
  const token = process.env.TMDB_ACCESS_TOKEN;
  return token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    : { Accept: 'application/json' };
}

/** El token v4 tiene prioridad; la api_key v3 solo se añade si no hay token. */
function applyApiKey(url: URL): void {
  if (!process.env.TMDB_ACCESS_TOKEN && process.env.TMDB_API_KEY) {
    url.searchParams.set('api_key', process.env.TMDB_API_KEY);
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
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

  const requestUrl = new URL(req.url ?? '', 'http://localhost');
  const path = requestUrl.pathname.replace(/^\/api\/tmdb/, '') || '/';

  const route = ROUTES.find((candidate) => candidate.match.test(path));
  if (!route) {
    res
      .writeHead(404, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: 'Ruta no soportada.' }));
    return;
  }

  const groups = path.match(route.match)?.slice(1) ?? [];
  const upstreamUrl = new URL(`${API_BASE}${route.upstreamPath(groups)}`);
  upstreamUrl.searchParams.set('language', LANGUAGE);
  applyApiKey(upstreamUrl);

  for (const param of route.allowedParams) {
    const value = requestUrl.searchParams.get(param);
    if (!value) continue;
    upstreamUrl.searchParams.set(
      param,
      param === 'query' ? value.slice(0, MAX_QUERY_LENGTH) : value,
    );
  }
  if (route.allowedParams.includes('query')) {
    upstreamUrl.searchParams.set('include_adult', 'false');
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, { headers: authHeaders() });
    const body = await upstreamResponse.text();
    res.writeHead(upstreamResponse.status, { 'content-type': 'application/json' }).end(body);
  } catch (error) {
    console.error(error);
    res
      .writeHead(502, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: 'No se ha podido contactar con TMDB.' }));
  }
}
