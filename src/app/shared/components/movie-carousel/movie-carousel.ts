import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Movie } from '../../../core/models/movie.model';
import { MovieCardComponent } from '../movie-card/movie-card';

/**
 * Carrusel de novedades con desplazamiento automático y continuo de derecha a
 * izquierda. La pista se duplica para lograr un bucle sin costuras; la copia
 * se marca `inert` y `aria-hidden` para no duplicar el contenido de cara al
 * teclado y a los lectores de pantalla. Se detiene al pasar el ratón o el
 * foco por encima y, en `prefers-reduced-motion`, se convierte en una lista
 * estática con desplazamiento manual.
 */
@Component({
  selector: 'app-movie-carousel',
  imports: [MovieCardComponent],
  templateUrl: './movie-carousel.html',
  styleUrl: './movie-carousel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieCarouselComponent {
  readonly movies = input.required<readonly Movie[]>();
  readonly label = input('Novedades');
  readonly reveal = output<Movie>();
}
