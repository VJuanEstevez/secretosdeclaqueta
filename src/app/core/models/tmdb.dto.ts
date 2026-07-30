/**
 * Contratos parciales de la API de TMDB: solo los campos que consumimos.
 * Todo lo opcional se valida en el mapeador antes de llegar a la interfaz.
 */

export interface TmdbGenreDto {
  id: number;
  name: string;
}

export interface TmdbMovieDto {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: TmdbGenreDto[];
}

export interface TmdbMovieDetailDto extends TmdbMovieDto {
  runtime?: number | null;
  tagline?: string | null;
  production_companies?: { id: number; name: string }[];
  credits?: {
    cast?: { id: number; name: string; order?: number }[];
    crew?: { id: number; name: string; job?: string }[];
  };
}

export interface TmdbPageDto<T> {
  page?: number;
  results?: T[];
  total_pages?: number;
  total_results?: number;
}
