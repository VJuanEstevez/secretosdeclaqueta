import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CatalogStore } from '../../../core/services/catalog.store';

/**
 * Buscador incrustado en la sección de bienvenida del Home, bajo el eslogan.
 *
 * Busca en tiempo real (el store aplica un `debounce`) y también acepta el
 * envío del formulario, para que funcione igual con teclado y con lector de
 * pantalla.
 */
@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  protected readonly catalog = inject(CatalogStore);

  protected onInput(value: string): void {
    this.catalog.updateQuery(value);
  }

  protected onSubmit(value: string): void {
    this.catalog.updateQuery(value);
  }

  protected onClear(input: HTMLInputElement): void {
    this.catalog.clearSearch();
    input.value = '';
    input.focus();
  }
}
