import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';

import { APP_CONFIG } from '../config/app-config';
import { DEMO_MOVIES } from '../data/demo-movies';
import { Movie, MovieDetail, MovieId } from '../models/movie.model';
import { TmdbMovieDetailDto, TmdbMovieDto, TmdbPageDto } from '../models/tmdb.dto';
import { toMovieDetail, toMovieList } from './tmdb.mapper';

const DEMO_LATENCY_MS = 220;

/**
 * Acceso al catálogo de TMDB.
 *
 * Nunca habla con `api.themoviedb.org` directamente: el token de TMDB se
 * quedaría visible en el navegador de cualquier visitante. En su lugar llama
 * al proxy propio configurado en `tmdbEndpoint` (ver `api/tmdb.ts` y
 * `docs/integracion-ia.md`). Sin proxy configurado entra en modo demo y
 * responde con el catálogo local, de forma que la aplicación es navegable sin
 * claves y las vistas no necesitan ramas especiales.
 */
@Injectable({ providedIn: 'root' })
export class TmdbService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private readonly demoMode = signal(!this.config.tmdbEndpoint);

  /** `true` cuando se sirven datos locales en lugar de datos reales de TMDB. */
  readonly isDemoMode = this.demoMode.asReadonly();

  readonly catalogLabel = computed(() =>
    this.demoMode() ? 'Catálogo local de demostración' : 'Datos en directo de TMDB',
  );

  /** Películas en tendencia de la semana. */
  getTrending(): Observable<Movie[]> {
    if (this.demoMode()) {
      return this.demoResponse([...DEMO_MOVIES]);
    }

    return this.http
      .get<TmdbPageDto<TmdbMovieDto>>(`${this.config.tmdbEndpoint}/trending/movie/week`)
      .pipe(map((page) => toMovieList(page.results)));
  }

  /**
   * Busca películas por título. La consulta ya llega validada desde el store,
   * pero se vuelve a comprobar aquí para no emitir peticiones vacías.
   */
  searchMovies(query: string): Observable<Movie[]> {
    const term = query.trim();
    if (!term) {
      return of([]);
    }

    if (this.demoMode()) {
      const needle = term.toLocaleLowerCase('es');
      const matches = DEMO_MOVIES.filter(
        (movie) =>
          movie.title.toLocaleLowerCase('es').includes(needle) ||
          movie.originalTitle.toLocaleLowerCase('es').includes(needle) ||
          movie.genres.some((genre) => genre.toLocaleLowerCase('es').includes(needle)),
      );
      return this.demoResponse([...matches]);
    }

    return this.http
      .get<TmdbPageDto<TmdbMovieDto>>(`${this.config.tmdbEndpoint}/search/movie`, {
        params: new HttpParams().set('query', term),
      })
      .pipe(map((page) => toMovieList(page.results)));
  }

  /** Detalle con reparto y equipo, necesario para construir el prompt de la IA. */
  getMovieDetail(id: MovieId): Observable<MovieDetail> {
    if (this.demoMode()) {
      const movie = DEMO_MOVIES.find((candidate) => candidate.id === id);
      return movie
        ? this.demoResponse(movie)
        : throwError(() => new Error('La película no está en el catálogo de demostración.'));
    }

    return this.http
      .get<TmdbMovieDetailDto>(`${this.config.tmdbEndpoint}/movie/${id}`, {
        params: new HttpParams().set('append_to_response', 'credits'),
      })
      .pipe(map(toMovieDetail));
  }

  /** Simula la latencia de red para que los estados de carga sean visibles. */
  private demoResponse<T>(payload: T): Observable<T> {
    return of(payload).pipe(delay(DEMO_LATENCY_MS));
  }
}
