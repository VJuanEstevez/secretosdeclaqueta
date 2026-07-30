import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { Movie } from '../../../core/models/movie.model';
import { FavoritesService } from '../../../core/services/favorites.service';

export type MovieCardLayout = 'grid' | 'list';

/**
 * Tarjeta de película.
 *
 * El póster completo es el disparador que abre las curiosidades; el botón de
 * favorito se superpone pero es un control independiente, no anidado en el
 * anterior, para no romper la semántica ni la navegación por teclado.
 * Admite un `layout` de lista, usado por los selectores de vista de Home y
 * Favoritos.
 */
@Component({
  selector: 'app-movie-card',
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieCardComponent {
  private readonly favorites = inject(FavoritesService);

  readonly movie = input.required<Movie>();
  readonly layout = input<MovieCardLayout>('grid');
  /** Emite la película cuya ficha de curiosidades debe abrirse. */
  readonly reveal = output<Movie>();

  protected readonly isFavorite = computed(() => this.favorites.isFavorite(this.movie().id));

  protected readonly favoriteLabel = computed(() =>
    this.isFavorite()
      ? `Quitar «${this.movie().title}» de favoritos`
      : `Guardar «${this.movie().title}» en favoritos`,
  );

  /** Iniciales usadas por la carátula generada cuando no hay póster. */
  protected readonly initials = computed(
    () =>
      this.movie()
        .title.split(/\s+/)
        .filter((word) => word.length > 2)
        .slice(0, 2)
        .map((word) => word[0]?.toLocaleUpperCase('es') ?? '')
        .join('') || '★',
  );

  protected toggleFavorite(): void {
    this.favorites.toggle(this.movie());
  }
}
