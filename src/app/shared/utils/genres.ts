import { Movie } from '../../core/models/movie.model';

/** Géneros presentes en una colección de películas, sin duplicados y ordenados. */
export function uniqueGenres(movies: readonly Movie[]): string[] {
  const set = new Set<string>();
  for (const movie of movies) {
    for (const genre of movie.genres) {
      set.add(genre);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}
