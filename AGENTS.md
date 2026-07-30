# SECRETOSDECLAQUETA

Aplicación web SPA en Angular de alto rendimiento y diseño responsivo para descubrir curiosidades y secretos cinematográficos mediante TMDB e Inteligencia Artificial, dirigida a cinéfilos y entusiastas del cine.

## Stack

Lenguaje: TypeScript estricto
Framework / runtime: Angular (Standalone Components, Signals)
Estilos: CSS puro con metodología BEM
Accesibilidad: WCAG 2.1 (ARIA, contraste, navegación por teclado)
Tests: Vitest / Jasmine + Karma

## Comandos

npm run start — Arranca el servidor de desarrollo en local.
npm run test — Ejecuta las pruebas unitarias.
npm run lint — Revisa el estilo de código y normativas.
npm run build — Compila el proyecto para producción.

## Estructura del proyecto

docs/ — Guías técnicas, informes de ejecución y resultados de tareas (ver Convenciones).
src/ — Código fuente de la aplicación Angular (componentes, servicios, modelos).
tests/ — Pruebas unitarias e integración.

## Convenciones

Carpeta /docs: Se utiliza exclusivamente para almacenar guías técnicas, informes de ejecución y resultados de tareas.
Regla: Ningún archivo debe ser subido sin una breve explicación de qué se hizo y cómo se obtuvo el resultado, para facilitar su réplica en otros proyectos.
Estilo de nombres: camelCase para variables y funciones, PascalCase para clases y componentes, kebab-case para archivos de componentes y BEM para clases CSS.
Tests: Pruebas unitarias al lado del componente o servicio (ej. pelicula.service.spec.ts).
Manejo de errores: Uso de interceptores globales y gestión reactiva con Signals en servicios.
Validación: Validar toda entrada del usuario (búsqueda, favoritos) antes de procesarla.

## No hagas

Límite duro: No instalar dependencias externas sin justificación y aviso previo.
Zona prohibida: No alterar código legacy o endpoints simulados sin control de versiones.
Regla de seguridad: No subir claves de API de TMDB ni archivos .env* al repositorio.
Antipatrón: No usar `any` en TypeScript sin una justificación documentada.

## Flujo de trabajo

Generación de tareas / Registro: Al finalizar una tarea, es obligatorio guardar el entregable o informe en /docs.
Formato: Usa [nombre-de-la-tarea].md o [fecha]-tarea.md.
Propósito: Estas guías sirven como referencia. Si vas a realizar una tarea recurrente, revisa primero si existe documentación previa en /docs para reutilizar el conocimiento.
Antes de una tarea no trivial, propón un plan y espera mi OK.
Una tarea a la vez; al terminar, dime qué cambiaste para que lo revise.
Si no estás seguro al 80%, pregunta. No inventes.

## Plantilla para archivos en /docs

# [Nombre de la Tarea]

- **Objetivo:** Breve descripción.
- **Pasos ejecutados:** Lista rápida de comandos o acciones.
- **Resultado:** Enlace o descripción de lo obtenido.
- **Reutilización:** ¿Qué se debe cambiar si se aplica en otro proyecto?

## Documentación

- Requisitos técnicos de Angular y estándares WCAG 2.1.
- Documentación oficial de la API de TMDB (The Movie Database).
- Metodología BEM para CSS modular.
