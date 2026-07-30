import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SiteHeaderComponent } from './shared/components/site-header/site-header';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen';

/**
 * Esqueleto de la aplicación: cabecera fija, contenido enrutado y pie.
 * Los landmarks (`header`, `main`, `footer`) los aportan los componentes
 * correspondientes; el buscador vive dentro del Home, bajo el eslogan.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeaderComponent, SplashScreenComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly showSplash = signal(true);
  protected readonly currentYear = new Date().getFullYear();
}
