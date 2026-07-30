import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { Movie } from '../../core/models/movie.model';
import { CatalogStore } from '../../core/services/catalog.store';
import { CuriositiesDialogComponent } from '../../shared/components/curiosities-dialog/curiosities-dialog';
import { GenreFilterComponent } from '../../shared/components/genre-filter/genre-filter';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card';
import { MovieCarouselComponent } from '../../shared/components/movie-carousel/movie-carousel';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar';
import { StatusPanelComponent } from '../../shared/components/status-panel/status-panel';
import { ViewMode, ViewToggleComponent } from '../../shared/components/view-toggle/view-toggle';
import { uniqueGenres } from '../../shared/utils/genres';

const PAGE_SIZE = 6;

/**
 * Página de inicio: bienvenida con buscador y, según haya o no una búsqueda
 * activa, la rejilla de resultados (con filtro, vista y paginación) o el
 * carrusel de tendencias.
 */
@Component({
  selector: 'app-home',
  imports: [
    CuriositiesDialogComponent,
    GenreFilterComponent,
    MovieCardComponent,
    MovieCarouselComponent,
    PaginationComponent,
    SearchBarComponent,
    StatusPanelComponent,
    ViewToggleComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  protected readonly catalog = inject(CatalogStore);

  private readonly dialog = viewChild.required(CuriositiesDialogComponent);

  protected readonly view = signal<ViewMode>('grid');
  protected readonly genre = signal<string | null>(null);
  protected readonly page = signal(1);

  protected readonly genres = computed(() => uniqueGenres(this.catalog.results()));

  protected readonly filteredResults = computed(() => {
    const genre = this.genre();
    const results = this.catalog.results();
    return genre ? results.filter((movie) => movie.genres.includes(genre)) : results;
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredResults().length / PAGE_SIZE)),
  );

  protected readonly pagedResults = computed(() => {
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredResults().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    // Cada búsqueda nueva arranca sin filtro heredado y en la primera página.
    effect(() => {
      this.catalog.query();
      this.genre.set(null);
      this.page.set(1);
    });
  }

  ngOnInit(): void {
    this.catalog.loadTrending();
  }

  protected reveal(movie: Movie): void {
    this.dialog().open(movie);
  }

  protected onGenreChange(genre: string | null): void {
    this.genre.set(genre);
    this.page.set(1);
  }
}
