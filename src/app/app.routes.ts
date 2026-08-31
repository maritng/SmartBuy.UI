import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () => import('./features/inicio/pages/inicio').then((m) => m.Inicio)
  },
  {
    path: 'lista',
    loadComponent: () => import('./features/lista/pages/armar-lista').then((m) => m.ArmarLista)
  },
  {
    path: 'lista/resultado',
    loadComponent: () => import('./features/lista/pages/resultado').then((m) => m.Resultado)
  },
  { path: '', pathMatch: 'full', redirectTo: 'lista' },
  { path: '**', redirectTo: 'lista' }
];
