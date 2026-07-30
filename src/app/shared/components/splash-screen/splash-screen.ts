import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

const SPLASH_VISIBLE_MS = 1100;
const SPLASH_FADE_MS = 450;

/**
 * Pantalla de bienvenida mostrada al arrancar la aplicación.
 *
 * Se retira sola tras un tiempo fijo; no depende de que ningún dato haya
 * terminado de cargar. `prefers-reduced-motion` (regla global) reduce la
 * animación de entrada y el desvanecido casi a un cambio instantáneo.
 */
@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashScreenComponent {
  readonly finished = output<void>();

  protected readonly leaving = signal(false);

  constructor() {
    setTimeout(() => this.leaving.set(true), SPLASH_VISIBLE_MS);
    setTimeout(() => this.finished.emit(), SPLASH_VISIBLE_MS + SPLASH_FADE_MS);
  }
}
