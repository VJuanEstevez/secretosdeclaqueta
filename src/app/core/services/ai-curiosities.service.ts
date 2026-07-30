import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import { CURIOSITIES_PER_MOVIE, CuriositiesResult, Curiosity } from '../models/curiosity.model';
import { MovieDetail, MovieId } from '../models/movie.model';
import { generateDemoCuriosities, padToExactCount } from './curiosities.generator';

/** Respuesta esperada del proxy de IA. */
interface CuriositiesResponseDto {
  curiosities?: { title?: unknown; body?: unknown }[];
}

const MAX_TITLE_LENGTH = 80;
const MAX_BODY_LENGTH = 400;

/**
 * Obtiene las cinco curiosidades exclusivas de una película.
 *
 * La clave de Anthropic nunca vive en el navegador: la petición va contra el
 * proxy configurado en `aiEndpoint`, que es quien habla con la API de Claude
 * (ver `docs/integracion-ia.md`). Sin proxy configurado se usa el generador
 * local y el resultado se marca como `demo` para avisar al usuario.
 */
@Injectable({ providedIn: 'root' })
export class AiCuriositiesService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  /** Caché en memoria: una película solo se consulta una vez por sesión. */
  private readonly cache = signal<ReadonlyMap<MovieId, CuriositiesResult>>(new Map());

  readonly isDemoMode = computed(() => !this.config.aiEndpoint);

  /** Devuelve el resultado cacheado si existe, sin volver a llamar al proxy. */
  cachedFor(movieId: MovieId): CuriositiesResult | undefined {
    return this.cache().get(movieId);
  }

  loadCuriosities(movie: MovieDetail): Observable<CuriositiesResult> {
    const cached = this.cache().get(movie.id);
    if (cached) {
      return of(cached);
    }

    if (this.isDemoMode()) {
      return of(this.buildResult(movie.id, 'demo', generateDemoCuriosities(movie))).pipe(
        tap((result) => this.remember(result)),
      );
    }

    return this.http
      .post<CuriositiesResponseDto>(this.config.aiEndpoint, { movie: this.toPromptPayload(movie) })
      .pipe(
        map((response) => this.parseResponse(movie, response)),
        tap((result) => this.remember(result)),
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof Error
              ? error
              : new Error('El servicio de curiosidades no ha respondido correctamente.'),
          ),
        ),
      );
  }

  /** Solo se envía al proxy lo que el prompt necesita. */
  private toPromptPayload(movie: MovieDetail) {
    return {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.originalTitle,
      releaseYear: movie.releaseYear,
      director: movie.director,
      cast: movie.cast,
      genres: movie.genres,
      runtimeMinutes: movie.runtimeMinutes,
      tagline: movie.tagline,
      overview: movie.overview,
      productionCompanies: movie.productionCompanies,
    };
  }

  /**
   * Sanea la respuesta del proxy: descarta entradas mal formadas, recorta
   * textos desmedidos y completa hasta cinco si la IA devolviera menos.
   */
  private parseResponse(movie: MovieDetail, response: CuriositiesResponseDto): CuriositiesResult {
    const items = (response?.curiosities ?? [])
      .map((item) => this.toCuriosity(item))
      .filter((item): item is Curiosity => item !== null);

    if (!items.length) {
      throw new Error('La IA no ha devuelto ninguna curiosidad válida para esta película.');
    }

    return this.buildResult(movie.id, 'ai', padToExactCount(items, movie));
  }

  private toCuriosity(raw: { title?: unknown; body?: unknown }): Curiosity | null {
    const title = typeof raw?.title === 'string' ? raw.title.trim() : '';
    const body = typeof raw?.body === 'string' ? raw.body.trim() : '';
    if (!body) {
      return null;
    }

    return {
      title: (title || 'Secreto de rodaje').slice(0, MAX_TITLE_LENGTH),
      body: body.slice(0, MAX_BODY_LENGTH),
    };
  }

  private buildResult(
    movieId: MovieId,
    source: CuriositiesResult['source'],
    items: readonly Curiosity[],
  ): CuriositiesResult {
    return { movieId, source, items: items.slice(0, CURIOSITIES_PER_MOVIE) };
  }

  private remember(result: CuriositiesResult): void {
    const next = new Map(this.cache());
    next.set(result.movieId, result);
    this.cache.set(next);
  }
}
