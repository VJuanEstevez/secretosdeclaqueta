# SECRETOSDECLAQUETA

Aplicación web SPA en Angular para descubrir curiosidades y secretos de rodaje
de películas, combinando el catálogo de **TMDB** con un servicio de
**inteligencia artificial**.

Angular 22 (standalone components + signals) · CSS puro con BEM · HTML
semántico · WCAG 2.1 AA.

## Arranque rápido

```bash
npm install
npm start          # http://localhost:4200
```

Arranca directamente en **modo demo**: catálogo local y curiosidades generadas
en el navegador, sin necesidad de ninguna clave.

## Configuración con datos reales

La SPA nunca guarda tokens: ni el de TMDB ni el de Anthropic viajan al
navegador. Ambos viven como variables de entorno de sus respectivos proxies
serverless ([`api/tmdb.js`](api/tmdb.js) y
[`api/curiosities.js`](api/curiosities.js)); `public/env.js` solo indica a qué
proxy llamar:

```js
window.__SDC_ENV__ = {
  tmdbEndpoint: '', // proxy de catálogo; en Vercel se rellena solo, ver más abajo
  aiEndpoint: '', // proxy de IA; en Vercel se rellena solo, ver más abajo
};
```

`npm start` crea `public/env.js` a partir de `public/env.example.js`.
`public/env.js` está en `.gitignore`: **nunca subas este fichero al repositorio.**

## Despliegue en Vercel (con TMDB e IA)

Los proxies son funciones serverless que se despliegan junto a la SPA sin
configuración extra. Pasos:

1. Importar el repositorio en Vercel (framework Angular autodetectado).
2. En Settings → Environment Variables, añadir `ANTHROPIC_API_KEY` y
   `TMDB_ACCESS_TOKEN` (o `TMDB_API_KEY` como alternativa v3).
3. Desplegar. El build genera `public/env.js` con `tmdbEndpoint: '/api/tmdb'`
   y `aiEndpoint: '/api/curiosities'` automáticamente en cuanto detecta esas
   variables (ver `scripts/ensure-env.mjs`). Sin ellas, la app sigue
   funcionando en modo demo.

Detalle completo de ambos contratos HTTP y de las decisiones de cada llamada
en [docs/integracion-ia.md](docs/integracion-ia.md).

## Funcionalidades

- **Cabecera** con logotipo a la izquierda y navegación (Inicio · Favoritos) a la derecha, con contador de guardadas.
- **Buscador** de ancho completo bajo la cabecera, en tiempo real (con _debounce_) y también por envío del formulario.
- **Inicio** con mensaje de bienvenida y carrusel fluido de tendencias de la semana.
- **Favoritos** en cuadrícula CSS Grid adaptable, con persistencia en `localStorage`.
- **Ficha modal** con exactamente 5 curiosidades por película, generadas por IA.

## Comandos

| Comando          | Descripción                           |
| ---------------- | ------------------------------------- |
| `npm start`      | Servidor de desarrollo.               |
| `npm run build`  | Compilación de producción en `dist/`. |
| `npm test`       | Pruebas unitarias (Vitest).           |
| `npm run lint`   | Comprobación de formato con Prettier. |
| `npm run format` | Aplica el formato.                    |

## Documentación

- [docs/arquitectura-frontend.md](docs/arquitectura-frontend.md) — estructura, decisiones de diseño, accesibilidad y convenciones BEM.
- [docs/integracion-ia.md](docs/integracion-ia.md) — contrato del proxy de IA y ejemplo de implementación.

## Créditos

Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
