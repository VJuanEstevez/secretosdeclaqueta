/**
 * Genera `public/env.js`.
 *
 * - En local: si el fichero ya existe se deja tal cual (para no pisar claves
 *   editadas a mano); si no existe, se copia `env.example.js` (modo demo).
 * - En Vercel (`process.env.VERCEL` está definido): se regenera siempre a
 *   partir de variables de entorno del proyecto, porque `public/env.js` está
 *   en `.gitignore` y no llega al checkout que usa el build. `aiEndpoint` y
 *   `tmdbEndpoint` apuntan por defecto a las funciones serverless del propio
 *   proyecto (ver api/curiosities.ts, api/tmdb.ts y docs/integracion-ia.md).
 *   Los tokens de TMDB y la clave de Anthropic viven solo en el entorno de
 *   esas funciones: nunca se escriben en `public/env.js`.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'env.js');
const template = join(root, 'public', 'env.example.js');

if (process.env.VERCEL) {
  const hasTmdbCredentials = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);
  const config = {
    tmdbEndpoint: hasTmdbCredentials ? (process.env.TMDB_ENDPOINT ?? '/api/tmdb') : '',
    aiEndpoint: process.env.AI_ENDPOINT ?? '/api/curiosities',
  };

  writeFileSync(target, `window.__SDC_ENV__ = ${JSON.stringify(config, null, 2)};\n`);
  console.log('[secretosdeclaqueta] public/env.js generado desde variables de entorno de Vercel.');
  process.exit(0);
}

if (existsSync(target)) {
  process.exit(0);
}

copyFileSync(template, target);
console.log('[secretosdeclaqueta] public/env.js creado desde env.example.js (modo demo).');
