import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Filtro por género mediante un `<select>` nativo, accesible sin código extra. */
@Component({
  selector: 'app-genre-filter',
  templateUrl: './genre-filter.html',
  styleUrl: './genre-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreFilterComponent {
  readonly genres = input.required<readonly string[]>();
  readonly selected = input<string | null>(null);
  readonly selectedChange = output<string | null>();

  protected onChange(value: string): void {
    this.selectedChange.emit(value === '' ? null : value);
  }
}
