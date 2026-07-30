import { MovieId } from './movie.model';

/** Una de las cinco curiosidades exclusivas mostradas por película. */
export interface Curiosity {
  readonly title: string;
  readonly body: string;
}

/** Origen del contenido, para poder avisar al usuario cuando es simulado. */
export type CuriositiesSource = 'ai' | 'demo';

export interface CuriositiesResult {
  readonly movieId: MovieId;
  readonly source: CuriositiesSource;
  readonly items: readonly Curiosity[];
}

/** Número exacto de curiosidades que la aplicación muestra por película. */
export const CURIOSITIES_PER_MOVIE = 5;
