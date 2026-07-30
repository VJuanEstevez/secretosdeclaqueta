import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { APP_CONFIG } from '../../core/config/app-config';
import { Movie } from '../../core/models/movie.model';
import { FavoritesService } from '../../core/services/favorites.service';
import { FavoritesPage } from './favorites';

function movie(id: number, genre: string): Movie {
  return {
    id,
    title: `Película ${id}`,
    originalTitle: `Película ${id}`,
    overview: '',
    posterUrl: null,
    backdropUrl: null,
    releaseYear: '2000',
    rating: 7,
    voteCount: 10,
    genres: [genre],
  };
}

describe('FavoritesPage', () => {
  let fixture: ComponentFixture<FavoritesPage>;
  let root: HTMLElement;
  let favorites: FavoritesService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [FavoritesPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: APP_CONFIG, useValue: { tmdbEndpoint: '', aiEndpoint: '' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesPage);
    root = fixture.nativeElement as HTMLElement;
    favorites = TestBed.inject(FavoritesService);
  });

  it('muestra el estado vacío con un enlace para explorar', () => {
    fixture.detectChanges();

    expect(root.querySelector('.favorites__cta')).not.toBeNull();
    expect(root.querySelector('.favorites__grid')).toBeNull();
  });

  it('pagina cuando hay más de seis favoritos', () => {
    for (let id = 1; id <= 8; id++) {
      favorites.toggle(movie(id, 'Drama'));
    }
    fixture.detectChanges();

    expect(root.querySelectorAll('.favorites__grid-item')).toHaveLength(6);
    expect(root.querySelector('.pagination')).not.toBeNull();

    const nextButton = root.querySelectorAll<HTMLButtonElement>('.pagination__control')[1];
    nextButton.click();
    fixture.detectChanges();

    expect(root.querySelectorAll('.favorites__grid-item')).toHaveLength(2);
  });

  it('filtra por género', () => {
    favorites.toggle(movie(1, 'Terror'));
    favorites.toggle(movie(2, 'Comedia'));
    fixture.detectChanges();

    const select = root.querySelector<HTMLSelectElement>('.genre-filter__select')!;
    select.value = 'Comedia';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(root.querySelectorAll('.favorites__grid-item')).toHaveLength(1);
  });

  it('cambia a vista de lista', () => {
    favorites.toggle(movie(1, 'Drama'));
    fixture.detectChanges();

    const listButton = root.querySelectorAll<HTMLButtonElement>('.view-toggle__button')[1];
    listButton.click();
    fixture.detectChanges();

    expect(root.querySelector('.favorites__grid--list')).not.toBeNull();
  });
});
