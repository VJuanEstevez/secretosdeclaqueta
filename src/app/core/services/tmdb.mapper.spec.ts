import { TmdbMovieDetailDto } from '../models/tmdb.dto';
import { toMovie, toMovieDetail, toMovieList } from './tmdb.mapper';

describe('toMovie', () => {
  it('construye las URLs absolutas de las imágenes', () => {
    const movie = toMovie({ id: 1, poster_path: '/a.jpg', backdrop_path: '/b.jpg' });

    expect(movie.posterUrl).toBe('https://image.tmdb.org/t/p/w500/a.jpg');
    expect(movie.backdropUrl).toBe('https://image.tmdb.org/t/p/w1280/b.jpg');
  });

  it('deja las imágenes a null cuando TMDB no las tiene', () => {
    const movie = toMovie({ id: 1, poster_path: null });
    expect(movie.posterUrl).toBeNull();
  });

  it('cae al título original y luego a un texto de reserva', () => {
    expect(toMovie({ id: 1, original_title: 'Alien' }).title).toBe('Alien');
    expect(toMovie({ id: 1 }).title).toBe('Título no disponible');
  });

  it('extrae el año de la fecha de estreno', () => {
    expect(toMovie({ id: 1, release_date: '1982-06-25' }).releaseYear).toBe('1982');
    expect(toMovie({ id: 1, release_date: '' }).releaseYear).toBeNull();
  });

  it('traduce los identificadores de género a nombres', () => {
    expect(toMovie({ id: 1, genre_ids: [878, 27, 999999] }).genres).toEqual([
      'Ciencia ficción',
      'Terror',
    ]);
  });

  it('redondea la puntuación a un decimal', () => {
    expect(toMovie({ id: 1, vote_average: 8.146 }).rating).toBe(8.1);
  });
});

describe('toMovieDetail', () => {
  const dto: TmdbMovieDetailDto = {
    id: 7,
    title: 'Alien',
    runtime: 117,
    credits: {
      cast: [
        { id: 2, name: 'Tom Skerritt', order: 1 },
        { id: 1, name: 'Sigourney Weaver', order: 0 },
      ],
      crew: [
        { id: 3, name: 'Editor X', job: 'Editor' },
        { id: 4, name: 'Ridley Scott', job: 'Director' },
      ],
    },
  };

  it('ordena el reparto por relevancia', () => {
    expect(toMovieDetail(dto).cast).toEqual(['Sigourney Weaver', 'Tom Skerritt']);
  });

  it('localiza al director dentro del equipo', () => {
    expect(toMovieDetail(dto).director).toBe('Ridley Scott');
  });

  it('deja el director a null si no figura', () => {
    expect(toMovieDetail({ id: 7, credits: { crew: [] } }).director).toBeNull();
  });
});

describe('toMovieList', () => {
  it('descarta resultados sin identificador numérico', () => {
    const list = toMovieList([{ id: 1 }, { title: 'Sin id' } as never, { id: 2 }]);
    expect(list.map((movie) => movie.id)).toEqual([1, 2]);
  });

  it('tolera una respuesta sin resultados', () => {
    expect(toMovieList(undefined)).toEqual([]);
  });
});
