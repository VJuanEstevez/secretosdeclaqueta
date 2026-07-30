import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { APP_CONFIG } from '../../core/config/app-config';
import { CatalogStore } from '../../core/services/catalog.store';
import { FavoritesService } from '../../core/services/favorites.service';
import { HomePage } from './home';

/** jsdom no implementa el diálogo nativo; se sustituye por lo mínimo necesario. */
function stubNativeDialog(): void {
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  proto['showModal'] = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto['close'] = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

/** Latencia simulada del modo demo, con margen. */
const DEMO_LATENCY_MS = 320;
/** Latencia del modo demo más el debounce del buscador. */
const SEARCH_WAIT_MS = 700;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('HomePage (integración con catálogo demo)', () => {
  let fixture: ComponentFixture<HomePage>;
  let root: HTMLElement;

  beforeEach(async () => {
    stubNativeDialog();
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: APP_CONFIG, useValue: { tmdbEndpoint: '', aiEndpoint: '' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    root = fixture.nativeElement as HTMLElement;
  });

  /** Pinta la vista y espera a que llegue el catálogo simulado. */
  async function render(): Promise<void> {
    fixture.detectChanges();
    await wait(DEMO_LATENCY_MS);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('muestra la bienvenida y el carrusel con las novedades', async () => {
    await render();

    expect(root.querySelector('h1')?.textContent).toContain('Detrás de cada plano');
    expect(root.querySelectorAll('app-movie-card').length).toBeGreaterThan(0);
    expect(root.querySelector('.movie-carousel__viewport')?.getAttribute('aria-label')).toContain(
      'tendencia',
    );
    expect(root.querySelector('.movie-carousel__control')).toBeNull();
  });

  it('abre la ficha con exactamente cinco curiosidades al pulsar una tarjeta', async () => {
    await render();

    const trigger = root.querySelector<HTMLButtonElement>('.movie-card__trigger');
    expect(trigger).not.toBeNull();

    trigger!.click();
    await wait(DEMO_LATENCY_MS);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(root.querySelectorAll('.curiosities-dialog__item')).toHaveLength(5);
    expect(root.querySelector('.curiosities-dialog__notice')?.textContent).toContain(
      'Modo demostración',
    );
    expect(root.querySelector('.curiosities-dialog__favorite')).toBeNull();
  });

  it('guarda en favoritos desde la tarjeta y refleja el estado en aria-pressed', async () => {
    await render();

    const favoriteButton = root.querySelector<HTMLButtonElement>('.movie-card__favorite');
    expect(favoriteButton?.getAttribute('aria-pressed')).toBe('false');

    favoriteButton!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(favoriteButton!.getAttribute('aria-pressed')).toBe('true');
    expect(TestBed.inject(FavoritesService).count()).toBe(1);
  });

  it('cambia el carrusel por la rejilla de resultados al buscar', async () => {
    await render();

    TestBed.inject(CatalogStore).updateQuery('Blade');
    await wait(SEARCH_WAIT_MS);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('app-movie-carousel')).toBeNull();
    expect(root.querySelector('.home__grid')).not.toBeNull();
    expect(root.querySelector('.home__section-title')?.textContent).toContain('Blade');
    expect(root.querySelectorAll('.home__grid-item')).toHaveLength(1);
  });

  it('permite cambiar a vista de lista en los resultados de búsqueda', async () => {
    await render();

    TestBed.inject(CatalogStore).updateQuery('El');
    await wait(SEARCH_WAIT_MS);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector('app-genre-filter')).not.toBeNull();

    const listButton = root.querySelectorAll<HTMLButtonElement>('.view-toggle__button')[1];
    listButton.click();
    fixture.detectChanges();

    expect(root.querySelector('.home__grid--list')).not.toBeNull();
  });
});
