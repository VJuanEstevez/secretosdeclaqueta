import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';

import { Movie } from '../models/movie.model';
import { TmdbService } from './tmdb.service';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;
/** Caracteres de control ASCII: se eliminan antes de construir la consulta. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/**
 * Estado compartido del catálogo: tendencias del Home y búsqueda global.
 *
 * Vive en un único servicio porque el buscador está bajo la cabecera y los
 * resultados se pintan en el Home; ambos necesitan la misma fuente de verdad.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly tmdb = inject(TmdbService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly trendingState = signal<readonly Movie[]>([]);
  private readonly trendingStatusState = signal<LoadStatus>('idle');
  private readonly resultsState = signal<readonly Movie[]>([]);
  private readonly searchStatusState = signal<LoadStatus>('idle');
  private readonly queryState = signal('');
  private readonly errorState = signal<string | null>(null);

  private readonly queryInput = new Subject<string>();

  readonly trending = this.trendingState.asReadonly();
  readonly trendingStatus = this.trendingStatusState.asReadonly();
  readonly results = this.resultsState.asReadonly();
  readonly searchStatus = this.searchStatusState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  /** `true` mientras haya una búsqueda activa: el Home oculta el carrusel. */
  readonly isSearching = computed(() => this.queryState().length >= MIN_QUERY_LENGTH);

  /** Texto anunciado por el lector de pantalla al cambiar los resultados. */
  readonly resultsSummary = computed(() => {
    if (!this.isSearching()) {
      return '';
    }
    if (this.searchStatusState() === 'loading') {
      return 'Buscando películas…';
    }

    const total = this.resultsState().length;
    if (total === 0) {
      return `Sin resultados para «${this.queryState()}».`;
    }
    return total === 1
      ? `1 película encontrada para «${this.queryState()}».`
      : `${total} películas encontradas para «${this.queryState()}».`;
  });

  constructor() {
    this.queryInput
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        tap((term) => this.searchStatusState.set(term ? 'loading' : 'idle')),
        switchMap((term) =>
          term
            ? this.tmdb.searchMovies(term).pipe(
                catchError(() => {
                  this.searchStatusState.set('error');
                  this.errorState.set('No se ha podido completar la búsqueda. Inténtalo de nuevo.');
                  return of<Movie[]>([]);
                }),
              )
            : of<Movie[]>([]),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((movies) => {
        this.resultsState.set(movies);
        if (this.searchStatusState() === 'loading') {
          this.searchStatusState.set('ready');
        }
      });
  }

  /** Carga las tendencias una sola vez por sesión. */
  loadTrending(): void {
    const status = this.trendingStatusState();
    if (status === 'loading' || status === 'ready') {
      return;
    }

    this.trendingStatusState.set('loading');
    this.errorState.set(null);

    this.tmdb
      .getTrending()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movies) => {
          this.trendingState.set(movies);
          this.trendingStatusState.set('ready');
        },
        error: () => {
          this.trendingStatusState.set('error');
          this.errorState.set('No se han podido cargar las novedades. Revisa tu conexión.');
        },
      });
  }

  /** Normaliza y valida la entrada del usuario antes de disparar la búsqueda. */
  updateQuery(rawQuery: string): void {
    const term = sanitizeQuery(rawQuery);
    this.queryState.set(term);
    this.errorState.set(null);

    if (term.length < MIN_QUERY_LENGTH) {
      this.resultsState.set([]);
      this.searchStatusState.set('idle');
      this.queryInput.next('');
      return;
    }

    this.queryInput.next(term);
  }

  clearSearch(): void {
    this.updateQuery('');
  }
}

function sanitizeQuery(rawQuery: string): string {
  return rawQuery.replace(CONTROL_CHARS, '').trim().slice(0, MAX_QUERY_LENGTH);
}
