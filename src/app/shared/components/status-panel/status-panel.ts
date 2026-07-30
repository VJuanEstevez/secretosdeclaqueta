import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusPanelTone = 'loading' | 'empty' | 'error';

/** Bloque reutilizable para los estados de carga, vacío y error de una vista. */
@Component({
  selector: 'app-status-panel',
  templateUrl: './status-panel.html',
  styleUrl: './status-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPanelComponent {
  readonly tone = input.required<StatusPanelTone>();
  readonly heading = input.required<string>();
  readonly description = input('');
}
