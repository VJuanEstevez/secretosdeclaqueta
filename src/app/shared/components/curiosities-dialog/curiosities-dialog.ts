import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { switchMap } from 'rxjs';

import { CuriositiesResult } from '../../../core/models/curiosity.model';
import { Movie } from '../../../core/models/movie.model';
import { AiCuriositiesService } from '../../../core/services/ai-curiosities.service';
import { LoadStatus } from '../../../core/services/catalog.store';
import { TmdbService } from '../../../core/services/tmdb.service';

/**
 * Ficha modal con las cinco curiosidades de una película.
 *
 * Usa el elemento nativo `<dialog>` con `showModal()`: el navegador aporta ya
 * la captura del foco, el cierre con Escape, el fondo inerte y la devolución
 * del foco al elemento que lo abrió, sin reimplementarlo a mano. Guardar en
 * favoritos se hace desde la tarjeta, no desde aquí.
 */
@Component({
  selector: 'app-curiosities-dialog',
  templateUrl: './curiosities-dialog.html',
  styleUrl: './curiosities-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuriositiesDialogComponent {
  private readonly tmdb = inject(TmdbService);
  private readonly ai = inject(AiCuriositiesService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly movie = signal<Movie | null>(null);
  protected readonly result = signal<CuriositiesResult | null>(null);
  protected readonly status = signal<LoadStatus>('idle');
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly isSimulated = computed(() => this.result()?.source === 'demo');

  /** Abre la ficha y lanza la carga de curiosidades para esa película. */
  open(movie: Movie): void {
    this.movie.set(movie);
    this.errorMessage.set(null);
    this.result.set(null);
    this.dialog().nativeElement.showModal();
    this.load(movie);
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected retry(): void {
    const current = this.movie();
    if (current) {
      this.load(current);
    }
  }

  private load(movie: Movie): void {
    const cached = this.ai.cachedFor(movie.id);
    if (cached) {
      this.result.set(cached);
      this.status.set('ready');
      return;
    }

    this.status.set('loading');
    this.tmdb
      .getMovieDetail(movie.id)
      .pipe(switchMap((detail) => this.ai.loadCuriosities(detail)))
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.status.set('ready');
        },
        error: (error: unknown) => {
          this.status.set('error');
          this.errorMessage.set(
            error instanceof Error
              ? error.message
              : 'No hemos podido revelar los secretos de esta película.',
          );
        },
      });
  }
}
