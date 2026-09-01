import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/** Protege rutas que requieren sesión; guarda a dónde ibas para volver tras el login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);

  if (store.logueado()) {
    return true;
  }

  return inject(Router).createUrlTree(['/login'], { queryParams: { volverA: state.url } });
};
