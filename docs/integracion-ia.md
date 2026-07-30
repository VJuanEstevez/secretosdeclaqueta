# Integración de IA y TMDB — proxies serverless (Vercel Functions)

- **Objetivo:** generar las 5 curiosidades exclusivas por película con Claude y servir el catálogo de TMDB, sin que ninguna de las dos claves (Anthropic, TMDB) llegue nunca al navegador.
- **Pasos ejecutados:** definición de ambos contratos HTTP, implementación de los proxies como funciones serverless de Vercel (`api/curiosities.ts`, `api/tmdb.ts`), conexión desde `AiCuriositiesService`/`TmdbService` y generación de `public/env.js` en build a partir de variables de entorno de Vercel (`scripts/ensure-env.mjs`).
- **Resultado:** la SPA hace `POST` a `aiEndpoint` y `GET` a `tmdbEndpoint` (por defecto `/api/curiosities` y `/api/tmdb`, mismo origen); las funciones son las únicas que conocen `ANTHROPIC_API_KEY` y `TMDB_ACCESS_TOKEN`/`TMDB_API_KEY`.
- **Reutilización:** para otro proyecto solo cambian el _system prompt_/esquema de salida del proxy de IA, y la lista blanca de rutas del proxy de TMDB.

---

## Por qué hace falta un proxy

Una SPA se descarga entera en el navegador: **cualquier clave incrustada en el
bundle es pública**, aunque esté en una variable de entorno de compilación. Por
eso ni `AiCuriositiesService` habla con `api.anthropic.com` ni `TmdbService`
habla con `api.themoviedb.org` directamente; ambos llaman a un endpoint propio
que se configura en `public/env.js`:

```js
window.__SDC_ENV__ = {
  tmdbEndpoint: '/api/tmdb',
  aiEndpoint: '/api/curiosities',
};
```

Al desplegar en Vercel, `api/curiosities.ts` y `api/tmdb.ts` se publican
automáticamente como funciones serverless en el mismo dominio que la SPA: no
hace falta configurar CORS ni una URL absoluta, y las claves viven solo como
variables de entorno del proyecto en Vercel, nunca en el bundle.

Si algún endpoint está vacío (por ejemplo, en `ng serve` local sin variables de
Vercel), la aplicación funciona igualmente en modo demo: catálogo local
(`demo-movies.ts`) y curiosidades generadas en el navegador
(`curiosities.generator.ts`), marcadas siempre como `demo` en la interfaz.

## Contrato HTTP — curiosidades (`api/curiosities.ts`)

**Petición** — `POST {aiEndpoint}`

```json
{
  "movie": {
    "id": 694,
    "title": "El resplandor",
    "originalTitle": "The Shining",
    "releaseYear": "1980",
    "director": "Stanley Kubrick",
    "cast": ["Jack Nicholson", "Shelley Duvall"],
    "genres": ["Terror", "Drama"],
    "runtimeMinutes": 144,
    "tagline": "Una obra maestra del terror moderno.",
    "overview": "Un escritor acepta cuidar un hotel aislado…",
    "productionCompanies": ["Warner Bros."]
  }
}
```

**Respuesta** — `200 OK`

```json
{
  "curiosities": [
    { "title": "El plano de la sangre", "body": "…" },
    { "title": "Las 127 tomas", "body": "…" }
  ]
}
```

El cliente sanea siempre la respuesta: descarta entradas sin `body`, recorta
títulos a 80 caracteres y cuerpos a 400, y garantiza exactamente cinco
elementos. Un proxy que devuelva de más o de menos no rompe la interfaz.

## Contrato HTTP — catálogo (`api/tmdb.ts`)

El proxy solo reenvía tres rutas, con una lista blanca de query params por
ruta (cualquier otro parámetro se ignora):

| Ruta                          | Query params aceptados | Uso                                   |
| ------------------------------ | ----------------------- | -------------------------------------- |
| `GET {tmdbEndpoint}/trending/movie/week` | ninguno                 | Carrusel de tendencias del Home.       |
| `GET {tmdbEndpoint}/search/movie`        | `query`                 | Buscador (`include_adult` se fuerza a `false` en el servidor). |
| `GET {tmdbEndpoint}/movie/:id`           | `append_to_response`    | Ficha de detalle para el prompt de IA. |

`language=es-ES` se añade siempre en el servidor. El token/api_key de TMDB se
añade también en el servidor (cabecera `Authorization` o param `api_key`,
según cuál esté configurada); el cliente nunca los ve ni los envía.

## Implementación: funciones serverless de Vercel

Los proxies viven en [`api/curiosities.ts`](../api/curiosities.ts) y
[`api/tmdb.ts`](../api/tmdb.ts), en la raíz del proyecto, con un limitador de
peticiones compartido en [`api/_lib/rate-limit.ts`](../api/_lib/rate-limit.ts)
(en memoria de la instancia; para un límite persistente entre invocaciones
frías, sustituir por Vercel KV / Upstash Ratelimit). Vercel detecta cualquier
fichero bajo `api/` y lo publica como función serverless en el mismo dominio
que la SPA, sin configuración adicional. La dependencia `@anthropic-ai/sdk`
está en el `package.json` del proyecto; el proxy de TMDB usa solo `fetch`
nativo, sin dependencias nuevas.

Puntos clave:

- **Mismo origen:** al no haber otro dominio de por medio no hace falta
  `Access-Control-Allow-Origin` ni preflight `OPTIONS`.
- **`ANTHROPIC_API_KEY` / `TMDB_ACCESS_TOKEN` / `TMDB_API_KEY`** se definen
  como variables de entorno del proyecto en el panel de Vercel (Settings →
  Environment Variables), nunca en el repositorio ni en `public/env.js`.
- **`aiEndpoint` / `tmdbEndpoint`** se rellenan solo en build:
  `scripts/ensure-env.mjs` detecta `process.env.VERCEL` y genera
  `public/env.js` con `aiEndpoint: '/api/curiosities'` y, si hay credenciales
  de TMDB, `tmdbEndpoint: '/api/tmdb'` (configurable con `AI_ENDPOINT` /
  `TMDB_ENDPOINT` si algún proxy viviera en otro sitio). En local
  (`ng serve`), si no hay `public/env.js` con un endpoint real, la app sigue
  arrancando en modo demo.
- **Lista blanca de rutas y parámetros** en `api/tmdb.ts`: el proxy no reenvía
  cualquier ruta de TMDB, solo las tres que usa la SPA, y descarta cualquier
  query param que el cliente no debería poder controlar (por ejemplo,
  `include_adult` siempre se fuerza a `false` en el servidor).

### Despliegue en Vercel

1. Importar el repo en Vercel (framework Angular, detectado automáticamente).
2. En Settings → Environment Variables del proyecto, añadir `ANTHROPIC_API_KEY`
   y `TMDB_ACCESS_TOKEN` (o `TMDB_API_KEY` como alternativa v3); `AI_ENDPOINT` /
   `TMDB_ENDPOINT` solo si algún proxy no es el de este mismo proyecto.
3. Desplegar. El build (`npm run build`) genera `public/env.js` con esas
   variables y Vercel publica `api/curiosities.ts` y `api/tmdb.ts` como
   funciones.

## Decisiones de la llamada a la API

| Parámetro              | Valor             | Motivo                                                                                                                                          |
| ---------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`                | `claude-opus-5`   | Modelo Opus actual.                                                                                                                             |
| `max_tokens`           | `16000`           | En Claude Opus 5 el razonamiento está activo por defecto y consume del mismo presupuesto que la respuesta; un valor ajustado truncaría el JSON. |
| `output_config.format` | `json_schema`     | Fuerza un JSON válido y evita tener que rescatar el objeto de un texto libre.                                                                   |
| `output_config.effort` | `medium`          | Tarea corta y acotada; `medium` da buen resultado con menos coste y latencia.                                                                   |
| `fallbacks`            | `'default'`       | Si los clasificadores rechazan la petición, la API la reintenta en el modelo de reserva recomendado en lugar de devolver el fallo.              |
| `thinking`             | _sin especificar_ | En Claude Opus 5 omitirlo equivale a razonamiento adaptativo. **No** enviar `budget_tokens`: devuelve error 400.                                |

## Antes de subirlo a producción

- El rate limiting de ambos proxies vive en memoria de la instancia: para un
  límite que sobreviva entre invocaciones frías, migrar a Vercel KV / Upstash
  Ratelimit antes de tráfico serio.
- Cachear por `movie.id` también en el servidor; el cliente ya cachea en memoria,
  pero esa caché se pierde al recargar.
- No registrar en los logs el contenido completo de las respuestas si el
  despliegue tiene requisitos de privacidad.
