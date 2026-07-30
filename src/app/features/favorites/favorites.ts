import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Movie } from '../../core/models/movie.model';
import { FavoritesService } from '../../core/services/favorites.service';
import { CuriositiesDialogComponent } from '../../shared/components/curiosities-dialog/curiosities-dialog';
import { GenreFilterComponent } from '../../shared/components/genre-filter/genre-filter';
import { MovieCardComponent } from '../../shared/components/movie-card/movie-card';
import { PaginationComponent } from '../../shared/components/pagination/pagination';
import { StatusPanelComponent } from '../../shared/components/status-panel/status-panel';
import { ViewMode, ViewToggleComponent } from '../../shared/components/view-toggle/view-toggle';
import { uniqueGenres } from '../../shared/utils/genres';

const PAGE_SIZE = 6;

/** Vista dedicada a las películas guardadas, con filtro, vista y paginación. */
@Component({
  selector: 'app-favorites',
  imports: [
    CuriositiesDialogComponent,
    GenreFilterComponent,
    MovieCardComponent,
    PaginationComponent,
    RouterLink,
    StatusPanelComponent,
    ViewToggleComponent,
  ],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesPage {
  protected readonly favorites = inject(FavoritesService);

  private readonly dialog = viewChild.required(CuriositiesDialogComponent);

  protected readonly view = signal<ViewMode>('grid');
  protected readonly genre = signal<string | null>(null);
  protected readonly page = signal(1);

  protected readonly genres = computed(() => uniqueGenres(this.favorites.items()));

  protected readonly filtered = computed(() => {
    const genre = this.genre();
    const items = this.favorites.items();
    return genre ? items.filter((movie) => movie.genres.includes(genre)) : items;
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  protected readonly pagedItems = computed(() => {
    const page = Math.min(this.page(), this.totalPages());
    const start = (page - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  protected reveal(movie: Movie): void {
    this.dialog().open(movie);
  }

  protected onGenreChange(genre: string | null): void {
    this.genre.set(genre);
    this.page.set(1);
  }
}
