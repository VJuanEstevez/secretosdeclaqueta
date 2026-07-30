import { InjectionToken } from '@angular/core';

/**
 * Configuración leída en tiempo de ejecución desde `public/env.js`.
 * Al no compilarse dentro del bundle, el mismo artefacto puede desplegarse en
 * distintos entornos y las claves nunca llegan al control de versiones.
 */
export interface AppConfig {
  /**
   * Endpoint del proxy de catálogo (p. ej. `/api/tmdb`). El token de TMDB
   * vive solo en el servidor de ese proxy, nunca en el navegador.
   */
  readonly tmdbEndpoint: string;
  /** Endpoint del proxy de IA que genera las curiosidades. */
  readonly aiEndpoint: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('SDC_APP_CONFIG');

const EMPTY_CONFIG: AppConfig = {
  tmdbEndpoint: '',
  aiEndpoint: '',
};

function readString(source: Record<string, unknown>, key: keyof AppConfig): string {
  const value = source[key];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Solo se acepta una ruta same-origin (`/api/...`) o una URL `https://`
 * explícita: evita que un endpoint mal formado en `env.js` haga que la SPA
 * envíe datos a un destino arbitrario.
 */
function readEndpoint(source: Record<string, unknown>, key: keyof AppConfig): string {
  const value = readString(source, key);
  if (!value) {
    return '';
  }
  const isSameOriginPath = value.startsWith('/');
  const isHttps = /^https:\/\//.test(value);
  return isSameOriginPath || isHttps ? value : '';
}

/**
 * Normaliza `window.__SDC_ENV__`. Cualquier valor ausente o de tipo incorrecto
 * se degrada a cadena vacía, lo que activa el modo demo del servicio afectado.
 */
export function readRuntimeConfig(): AppConfig {
  const raw = (globalThis as { __SDC_ENV__?: unknown }).__SDC_ENV__;
  if (!raw || typeof raw !== 'object') {
    return EMPTY_CONFIG;
  }

  const source = raw as Record<string, unknown>;
  return {
    tmdbEndpoint: readEndpoint(source, 'tmdbEndpoint'),
    aiEndpoint: readEndpoint(source, 'aiEndpoint'),
  };
}
