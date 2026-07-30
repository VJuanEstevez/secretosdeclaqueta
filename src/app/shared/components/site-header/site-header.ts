import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { FavoritesService } from '../../../core/services/favorites.service';

/** Cabecera fija: marca a la izquierda y navegación principal a la derecha. */
@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly favorites = inject(FavoritesService);
}
