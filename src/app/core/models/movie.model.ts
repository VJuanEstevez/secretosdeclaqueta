/** Película normalizada que consume toda la interfaz. */
export interface Movie {
  readonly id: number;
  readonly title: string;
  readonly originalTitle: string;
  readonly overview: string;
  /** URL absoluta del póster, o `null` si TMDB no tiene imagen. */
  readonly posterUrl: string | null;
  /** URL absoluta de la imagen de fondo, o `null`. */
  readonly backdropUrl: string | null;
  /** Año de estreno en formato AAAA, o `null` si se desconoce. */
  readonly releaseYear: string | null;
  /** Nota media sobre 10, redondeada a un decimal. */
  readonly rating: number;
  readonly voteCount: number;
  readonly genres: readonly string[];
}

/** Detalle ampliado que alimenta el prompt de la IA. */
export interface MovieDetail extends Movie {
  readonly runtimeMinutes: number | null;
  readonly tagline: string | null;
  readonly director: string | null;
  readonly cast: readonly string[];
  readonly productionCompanies: readonly string[];
}

export type MovieId = Movie['id'];
