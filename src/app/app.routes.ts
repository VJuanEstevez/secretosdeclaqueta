import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'SECRETOSDECLAQUETA — Descubre los secretos del cine',
    loadComponent: () => import('./features/home/home').then((m) => m.HomePage),
  },
  {
    path: 'favoritos',
    title: 'Tus favoritos — SECRETOSDECLAQUETA',
    loadComponent: () => import('./features/favorites/favorites').then((m) => m.FavoritesPage),
  },
  { path: '**', redirectTo: '' },
];
