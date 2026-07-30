# Arquitectura frontend de SECRETOSDECLAQUETA

- **Objetivo:** levantar la SPA completa en Angular 22 (standalone + signals) con catálogo TMDB, buscador global, carrusel de novedades, favoritos persistentes y ficha modal de 5 curiosidades por IA.
- **Pasos ejecutados:** ver «Pasos ejecutados» más abajo.
- **Resultado:** aplicación que compila (`npm run build`), pasa 30 pruebas (`npm test`) y arranca sin claves gracias al modo demo.
- **Reutilización:** ver «Qué cambiar para reutilizarlo».

---

## Pasos ejecutados

1. Se movió el andamiaje de `secretosdeclaqueta-tmp/` a la raíz del repositorio y se renombró el proyecto en `angular.json` y `package.json`, para que la estructura coincida con la descrita en `AGENTS.md` (`src/`, `docs/`).
2. `npm install` (sin dependencias nuevas: solo las del andamiaje de Angular).
3. Configuración en tiempo de ejecución (`public/env.js`), modelos, servicios e interceptor en `core/`.
4. Componentes compartidos en `shared/components/` y páginas en `features/`.
5. Estilos globales con variables de diseño en `src/styles.css`; el resto, CSS por componente en BEM.
6. Pruebas unitarias junto a cada unidad probada y documentación en `docs/`.

## Árbol de carpetas

```
src/app/
├─ app.ts | app.html | app.css       Shell: cabecera + main + pie + splash
├─ app.config.ts                     Router, HttpClient, interceptor, APP_CONFIG
├─ app.routes.ts                     '' → Home, 'favoritos' → Favoritos (lazy)
├─ core/
│  ├─ config/app-config.ts           Lectura y saneado de window.__SDC_ENV__
│  ├─ data/demo-movies.ts            Catálogo local del modo demo
│  ├─ interceptors/http-error.…ts    Errores HTTP → mensajes en castellano
│  ├─ models/                        Movie, MovieDetail, Curiosity, DTOs de TMDB
│  └─ services/
│     ├─ tmdb.service.ts             Tendencias, búsqueda y detalle
│     ├─ tmdb.mapper.ts              DTO de TMDB → modelo de dominio
│     ├─ catalog.store.ts            Estado compartido: tendencias + búsqueda
│     ├─ ai-curiosities.service.ts   Proxy de IA + caché + saneado
│     ├─ curiosities.generator.ts    Generador local de respaldo
│     └─ favorites.service.ts        Favoritos con persistencia
├─ features/{home,favorites}/        Páginas cargadas de forma diferida; cada
│                                    una filtra por género, pagina y alterna
│                                    entre vista de cuadrícula y de lista
└─ shared/
   ├─ components/                    site-header, search-bar (vive dentro del
   │                                 Home), movie-card, movie-carousel (marquee
   │                                 automático), curiosities-dialog,
   │                                 status-panel, splash-screen, view-toggle,
   │                                 genre-filter, pagination
   └─ utils/genres.ts                Lista de géneros únicos de una colección
```

## Decisiones de arquitectura

**Estado con signals, efectos secundarios con RxJS.** Los servicios exponen
signals de solo lectura (`asReadonly()`, `computed()`); RxJS se reserva para lo
que es realmente un flujo: el `debounce` del buscador y las peticiones HTTP. Así
las plantillas no necesitan `async` ni suscripciones manuales.

**`CatalogStore` como única fuente de verdad de la búsqueda.** El campo de texto
vive en la cabecera y los resultados se pintan en el Home: si cada uno guardara
su propio estado habría que sincronizarlos. El store centraliza consulta,
resultados y estado de carga, y el Home solo lee.

**Modo demo en lugar de pantalla de error.** Sin claves configuradas,
`TmdbService` y `AiCuriositiesService` responden con datos locales en vez de
fallar. El proyecto se puede clonar y arrancar sin registrarse en ningún sitio,
y la interfaz avisa de que el contenido es simulado (`catalogLabel()` en el pie
y aviso en la ficha modal).

**`<dialog>` nativo para la ficha de curiosidades.** El navegador aporta captura
del foco, cierre con `Escape`, fondo inerte y devolución del foco al elemento que
la abrió. Reimplementar eso a mano es la fuente habitual de fallos de
accesibilidad en los modales. Guardar en favoritos se hace desde la tarjeta;
la ficha modal es solo de lectura.

**La ventana nunca hace scroll.** `html`/`body` están fijados a `100dvh`/`100vw`
con `overflow: hidden`; la única región que puede desplazarse es
`.app__main` (entre la cabecera y el pie), con `overflow-y: auto` como red de
seguridad para contenido que no quepa en pantallas pequeñas. El carrusel de
novedades se desplaza horizontalmente por sí mismo, lo que no cuenta como
scroll de página.

**Carrusel en marquesina automática.** La pista se duplica y se anima con
`translateX` en bucle continuo (de derecha a izquierda); la copia lleva
`inert` + `aria-hidden` para no duplicar contenido de cara al teclado ni a
los lectores de pantalla. Se detiene al pasar el ratón o el foco por encima,
y en `prefers-reduced-motion` se convierte en una lista estática con
desplazamiento manual en lugar de animarse indefinidamente.

**Vista, filtro y paginación como componentes reutilizables.** `ViewToggleComponent`,
`GenreFilterComponent` y `PaginationComponent` son genéricos y los usan tanto
Home (resultados de búsqueda) como Favoritos; cada página mantiene su propio
signal de vista/género/página y filtra en el cliente con `computed()`.

**Claves fuera del bundle.** `public/env.js` se carga desde `index.html` y está
en `.gitignore`; se versiona `public/env.example.js`. `scripts/ensure-env.mjs` lo
copia automáticamente en `prestart`/`prebuild`, así que un clon limpio arranca a
la primera. Detalles del proxy de IA en [integracion-ia.md](./integracion-ia.md).

## Accesibilidad (WCAG 2.1 AA)

| Requisito                      | Cómo se cumple                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.3.1 Información y relaciones | `header`, `nav`, `main`, `section`, `article`, `footer`; listas reales para rejillas y carrusel; encabezados jerárquicos (un solo `h1` por vista). |
| 1.4.3 Contraste                | Crema `#f5f3ee` sobre negro `#0b0b0f` (16:1); texto secundario `#b3b0c2` (7,4:1); oro `#e8b54b` con texto `#14100a` encima.                        |
| 2.1.1 Teclado                  | Todo son `button`/`a` nativos; el carril del carrusel es enfocable (`tabindex="0"`) y se desplaza con las flechas.                                 |
| 2.2.2 Pausar y detener         | El carrusel se anima solo, pero se detiene al enfocarlo o pasar el ratón, y se convierte en una lista estática con `prefers-reduced-motion`.       |
| 2.4.1 Saltar bloques           | Enlace «Saltar al contenido principal» visible al tabular.                                                                                         |
| 2.4.7 Foco visible             | `:focus-visible` global con contorno de 3 px en color de acento.                                                                                   |
| 3.3.2 Etiquetas                | El campo de búsqueda tiene `<label>` asociado; los botones de icono, `aria-label`.                                                                 |
| 4.1.2 Nombre, función, valor   | El botón de favorito usa `aria-pressed`; el enlace activo, `aria-current="page"`.                                                                  |
| 4.1.3 Mensajes de estado       | Resumen de resultados en `role="status" aria-live="polite"`; errores en `role="alert"`.                                                            |
| 2.3.3 Animación                | Todas las transiciones y animaciones se anulan bajo `prefers-reduced-motion`.                                                                      |

## Convenciones de CSS (BEM)

Un bloque por componente, con el mismo nombre que el selector:
`site-header`, `search-bar`, `movie-card`, `movie-carousel`,
`curiosities-dialog`, `status-panel`, `home`, `favorites`, `app`.

```text
.movie-card               → bloque
.movie-card__poster       → elemento
.movie-card__favorite--on → modificador
```

Las variables de diseño (`--sdc-*`) viven en `src/styles.css`; los componentes
nunca escriben colores ni espaciados literales. Prefijo `sdc-` para las pocas
utilidades globales (`.sdc-visually-hidden`, `.sdc-skip-link`).

## Verificación

```bash
npm run build   # compila sin errores ni avisos de presupuesto
npm test        # 30 pruebas en 5 ficheros
npm run lint    # formato con Prettier
```

## Qué cambiar para reutilizarlo

- **Otro proveedor de catálogo:** reescribir `tmdb.service.ts` y `tmdb.mapper.ts`. El resto de la aplicación solo conoce `Movie`/`MovieDetail`.
- **Otro proveedor de IA:** cambiar solo el proxy (`docs/integracion-ia.md`); el contrato `{ curiosities: [{title, body}] }` no varía.
- **Otro número de curiosidades:** `CURIOSITIES_PER_MOVIE` en `core/models/curiosity.model.ts`.
- **Otra identidad visual:** el bloque `:root` de `src/styles.css`. Al cambiar colores hay que recomprobar los contrastes de la tabla anterior.
- **Otro idioma:** `LANGUAGE` en `tmdb.service.ts`, el mapa `GENRE_NAMES` del mapeador y los textos de las plantillas.
