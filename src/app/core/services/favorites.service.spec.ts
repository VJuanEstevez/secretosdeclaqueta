import { TestBed } from '@angular/core/testing';

import { Movie } from '../models/movie.model';
import { FavoritesService } from './favorites.service';

function movie(id: number, title = `Película ${id}`): Movie {
  return {
    id,
    title,
    originalTitle: title,
    overview: '',
    posterUrl: null,
    backdropUrl: null,
    releaseYear: '2000',
    rating: 7,
    voteCount: 10,
    genres: ['Drama'],
  };
}

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
  });

  it('empieza vacío', () => {
    expect(service.isEmpty()).toBe(true);
    expect(service.count()).toBe(0);
  });

  it('añade y quita con toggle', () => {
    expect(service.toggle(movie(1))).toBe(true);
    expect(service.isFavorite(1)).toBe(true);
    expect(service.count()).toBe(1);

    expect(service.toggle(movie(1))).toBe(false);
    expect(service.isFavorite(1)).toBe(false);
    expect(service.count()).toBe(0);
  });

  it('coloca la última añadida en primer lugar', () => {
    service.toggle(movie(1, 'Primera'));
    service.toggle(movie(2, 'Segunda'));

    expect(service.items().map((item) => item.title)).toEqual(['Segunda', 'Primera']);
  });

  it('descarta entradas corruptas del almacenamiento', () => {
    localStorage.setItem('sdc.favorites.v1', JSON.stringify([{ id: 'no-numérico' }, movie(9)]));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(FavoritesService);

    expect(restored.count()).toBe(1);
    expect(restored.isFavorite(9)).toBe(true);
  });

  it('no lanza si el almacenamiento no es legible', () => {
    localStorage.setItem('sdc.favorites.v1', 'esto-no-es-json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(() => TestBed.inject(FavoritesService).count()).not.toThrow();
  });
});
