import type { IncomingMessage } from 'node:http';

interface RateLimiterOptions {
  readonly limit: number;
  readonly windowMs: number;
}

/**
 * Limitador en memoria de la instancia serverless. No sobrevive entre
 * invocaciones frías ni se comparte entre regiones: para un límite real bajo
 * tráfico serio, sustituir por Vercel KV / Upstash Ratelimit.
 */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function isRateLimited(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  };
}

export function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return header?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
}
