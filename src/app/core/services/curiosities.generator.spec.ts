import { CURIOSITIES_PER_MOVIE } from '../models/curiosity.model';
import { MovieDetail } from '../models/movie.model';
import { generateDemoCuriosities, padToExactCount } from './curiosities.generator';

const COMPLETE: MovieDetail = {
  id: 1,
  title: 'Blade Runner',
  originalTitle: 'Blade Runner',
  overview: 'Un cazador de replicantes persigue a cuatro androides.',
  posterUrl: null,
  backdropUrl: null,
  releaseYear: '1982',
  rating: 8.1,
  voteCount: 14200,
  genres: ['Ciencia ficción'],
  runtimeMinutes: 117,
  tagline: 'El hombre ha creado a su rival.',
  director: 'Ridley Scott',
  cast: ['Harrison Ford', 'Rutger Hauer'],
  productionCompanies: ['The Ladd Company'],
};

const EMPTY: MovieDetail = {
  ...COMPLETE,
  id: 2,
  overview: '',
  releaseYear: null,
  voteCount: 0,
  genres: [],
  runtimeMinutes: null,
  tagline: null,
  director: null,
  cast: [],
  productionCompanies: [],
};

describe('generateDemoCuriosities', () => {
  it('devuelve exactamente cinco curiosidades con una ficha completa', () => {
    expect(generateDemoCuriosities(COMPLETE)).toHaveLength(CURIOSITIES_PER_MOVIE);
  });

  it('devuelve exactamente cinco curiosidades con una ficha vacía', () => {
    expect(generateDemoCuriosities(EMPTY)).toHaveLength(CURIOSITIES_PER_MOVIE);
  });

  it('solo usa metadatos reales de la película', () => {
    const bodies = generateDemoCuriosities(COMPLETE).map((item) => item.body);
    expect(bodies.some((body) => body.includes('Ridley Scott'))).toBe(true);
    expect(bodies.some((body) => body.includes('117'))).toBe(true);
  });
});

describe('padToExactCount', () => {
  it('rellena hasta cinco cuando llegan menos', () => {
    const result = padToExactCount([{ title: 'Uno', body: 'Cuerpo' }], COMPLETE);
    expect(result).toHaveLength(CURIOSITIES_PER_MOVIE);
    expect(result[0].title).toBe('Uno');
  });

  it('recorta cuando llegan más de cinco', () => {
    const many = Array.from({ length: 9 }, (_, index) => ({
      title: `T${index}`,
      body: `B${index}`,
    }));
    expect(padToExactCount(many, COMPLETE)).toHaveLength(CURIOSITIES_PER_MOVIE);
  });
});
