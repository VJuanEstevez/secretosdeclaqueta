/**
 * Sin imports relativos a otros ficheros de `api/`: el builder de Vercel no
 * empaqueta módulos locales compartidos junto al de la función (el fichero
 * referenciado llega tal cual al runtime, sin transformar), así que cada
 * función va autocontenida a propósito.
 */

const API_BASE = 'https://api.themoviedb.org/3';
const LANGUAGE = 'es-ES';
const MAX_QUERY_LENGTH = 80;

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const hits = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return header?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}

const ROUTES = [
  {
    match: /^\/trending\/movie\/week$/,
    upstreamPath: () => '/trending/movie/week',
    allowedParams: [],
  },
  {
    match: /^\/search\/movie$/,
    upstreamPath: () => '/search/movie',
    allowedParams: ['query'],
  },
  {
    match: /^\/movie\/(\d+)$/,
    upstreamPath: ([id]) => `/movie/${id}`,
    allowedParams: ['append_to_response'],
  },
];

function authHeaders() {
  const token = process.env['TMDB_ACCESS_TOKEN'];
  return token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    : { Accept: 'application/json' };
}

/** El token v4 tiene prioridad; la api_key v3 solo se añade si no hay token. */
function applyApiKey(url) {
  if (!process.env['TMDB_ACCESS_TOKEN'] && process.env['TMDB_API_KEY']) {
    url.searchParams.set('api_key', process.env['TMDB_API_KEY']);
  }
}

export default async function handler(req, res) {
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

    if (!upstreamResponse.ok) {
      console.error('TMDB respondió con error:', upstreamResponse.status);
    }

    res.writeHead(upstreamResponse.status, { 'content-type': 'application/json' }).end(body);
  } catch (error) {
    console.error('Error de red al contactar con TMDB:', error);
    res
      .writeHead(502, { 'content-type': 'application/json' })
      .end(JSON.stringify({ error: 'No se ha podido contactar con TMDB.' }));
  }
}
