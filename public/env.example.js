/**
 * Configuración de entorno en tiempo de ejecución de SECRETOSDECLAQUETA.
 *
 * Copia este fichero a `public/env.js` y rellena los valores para tu entorno.
 * `public/env.js` está en .gitignore: NUNCA subas este fichero al repositorio.
 * `npm start` / `npm run build` lo crean automáticamente si no existe.
 *
 * Los tokens de TMDB y la clave de Anthropic NUNCA van aquí: viven solo como
 * variables de entorno de los proxies serverless (api/tmdb.ts,
 * api/curiosities.ts). Este fichero solo indica a qué proxy llamar.
 *
 * Si dejas los valores vacíos la aplicación arranca en MODO DEMO, con un
 * catálogo local incluido y curiosidades generadas en el propio navegador.
 */
window.__SDC_ENV__ = {
  /**
   * URL de tu proxy de catálogo (por ejemplo /api/tmdb si usas `vercel dev`).
   * Ver docs/integracion-ia.md.
   */
  tmdbEndpoint: '',

  /**
   * URL de tu proxy de IA (por ejemplo /api/curiosities si usas `vercel dev`).
   * El proxy es obligatorio para no exponer la clave de Anthropic en el
   * navegador. Ver docs/integracion-ia.md para el detalle de la implementación.
   */
  aiEndpoint: '',
};
