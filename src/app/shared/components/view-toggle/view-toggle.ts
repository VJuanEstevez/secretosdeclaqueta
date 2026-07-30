import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ViewMode = 'grid' | 'list';

/** Selector de vista en cuadrícula o en lista para colecciones de películas. */
@Component({
  selector: 'app-view-toggle',
  templateUrl: './view-toggle.html',
  styleUrl: './view-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewToggleComponent {
  readonly view = input.required<ViewMode>();
  readonly viewChange = output<ViewMode>();
}
