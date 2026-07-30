import { Movie, MovieDetail } from '../models/movie.model';
import { TmdbMovieDetailDto, TmdbMovieDto } from '../models/tmdb.dto';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'w1280';

/** Géneros de TMDB en castellano, para las respuestas que solo traen `genre_ids`. */
const GENRE_NAMES: Readonly<Record<number, string>> = {
  28: 'Acción',
  12: 'Aventura',
  16: 'Animación',
  35: 'Comedia',
  80: 'Crimen',
  99: 'Documental',
  18: 'Drama',
  10751: 'Familia',
  14: 'Fantasía',
  36: 'Historia',
  27: 'Terror',
  10402: 'Música',
  9648: 'Misterio',
  10749: 'Romance',
  878: 'Ciencia ficción',
  10770: 'Película de TV',
  53: 'Suspense',
  10752: 'Bélica',
  37: 'Western',
};

function imageUrl(path: string | null | undefined, size: string): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

function releaseYear(releaseDate: string | undefined): string | null {
  return releaseDate && releaseDate.length >= 4 ? releaseDate.slice(0, 4) : null;
}

function genreNames(dto: TmdbMovieDto): string[] {
  if (dto.genres?.length) {
    return dto.genres.map((genre) => genre.name).filter(Boolean);
  }
  return (dto.genre_ids ?? [])
    .map((id) => GENRE_NAMES[id])
    .filter((name): name is string => !!name);
}

export function toMovie(dto: TmdbMovieDto): Movie {
  return {
    id: dto.id,
    title: dto.title?.trim() || dto.original_title?.trim() || 'Título no disponible',
    originalTitle: dto.original_title?.trim() ?? '',
    overview: dto.overview?.trim() ?? '',
    posterUrl: imageUrl(dto.poster_path, POSTER_SIZE),
    backdropUrl: imageUrl(dto.backdrop_path, BACKDROP_SIZE),
    releaseYear: releaseYear(dto.release_date),
    rating: Math.round((dto.vote_average ?? 0) * 10) / 10,
    voteCount: dto.vote_count ?? 0,
    genres: genreNames(dto),
  };
}

export function toMovieDetail(dto: TmdbMovieDetailDto): MovieDetail {
  const cast = (dto.credits?.cast ?? [])
    .slice()
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 5)
    .map((member) => member.name);

  const director =
    (dto.credits?.crew ?? []).find((member) => member.job === 'Director')?.name ?? null;

  return {
    ...toMovie(dto),
    runtimeMinutes: dto.runtime && dto.runtime > 0 ? dto.runtime : null,
    tagline: dto.tagline?.trim() || null,
    director,
    cast,
    productionCompanies: (dto.production_companies ?? [])
      .slice(0, 3)
      .map((company) => company.name),
  };
}

/** Descarta resultados sin identificador utilizable antes de pintarlos. */
export function toMovieList(results: readonly TmdbMovieDto[] | undefined): Movie[] {
  return (results ?? []).filter((dto) => typeof dto?.id === 'number').map(toMovie);
}
