import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** Controles de paginación numérica compactos para colecciones filtradas en el cliente. */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly canGoPrevious = computed(() => this.page() > 1);
  protected readonly canGoNext = computed(() => this.page() < this.totalPages());

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}
