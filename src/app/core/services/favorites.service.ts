import { Injectable, computed, effect, signal } from '@angular/core';

import { Movie, MovieId } from '../models/movie.model';

const STORAGE_KEY = 'sdc.favorites.v1';

/**
 * Favoritos del usuario, con persistencia en `localStorage`.
 *
 * El estado vive en un signal y un `effect` lo vuelca a disco, de modo que las
 * vistas solo leen `items()` y nunca tocan el almacenamiento directamente.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly favorites = signal<readonly Movie[]>(this.restore());

  readonly items = this.favorites.asReadonly();
  readonly count = computed(() => this.favorites().length);
  readonly isEmpty = computed(() => this.favorites().length === 0);

  private readonly ids = computed(() => new Set(this.favorites().map((movie) => movie.id)));

  constructor() {
    effect(() => this.persist(this.favorites()));
  }

  isFavorite(movieId: MovieId): boolean {
    return this.ids().has(movieId);
  }

  /** Añade o quita la película y devuelve el estado resultante. */
  toggle(movie: Movie): boolean {
    if (this.isFavorite(movie.id)) {
      this.favorites.update((current) => current.filter((item) => item.id !== movie.id));
      return false;
    }

    this.favorites.update((current) => [movie, ...current]);
    return true;
  }

  remove(movieId: MovieId): void {
    this.favorites.update((current) => current.filter((item) => item.id !== movieId));
  }

  clear(): void {
    this.favorites.set([]);
  }

  /**
   * Lee el almacenamiento validando la forma de cada entrada: un `localStorage`
   * manipulado a mano no debe poder romper el renderizado.
   */
  private restore(): readonly Movie[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isMovie) : [];
    } catch {
      return [];
    }
  }

  private persist(movies: readonly Movie[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
    } catch {
      // Cuota agotada o almacenamiento bloqueado: la sesión sigue en memoria.
    }
  }
}

function isMovie(value: unknown): value is Movie {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Movie>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.genres)
  );
}
