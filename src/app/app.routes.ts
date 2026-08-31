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
  {
    path: 'catalogo',
    loadComponent: () => import('./features/catalogo/pages/productos').then((m) => m.Productos)
  },
  {
    path: 'catalogo/nuevo',
    loadComponent: () => import('./features/catalogo/pages/producto-form').then((m) => m.ProductoForm)
  },
  {
    path: 'catalogo/:id',
    loadComponent: () => import('./features/catalogo/pages/producto-form').then((m) => m.ProductoForm)
  },
  {
    path: 'matching',
    loadComponent: () => import('./features/matching/pages/pendientes').then((m) => m.Pendientes)
  },
  { path: '', pathMatch: 'full', redirectTo: 'lista' },
  { path: '**', redirectTo: 'lista' }
];
