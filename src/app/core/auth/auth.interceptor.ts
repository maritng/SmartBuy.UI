import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

/**
 * Agrega el Bearer a todo request cuando hay sesión, y ante un 401 con sesión
 * activa (token vencido o inválido) cierra sesión y manda al login. El 401 de
 * un login fallido no dispara nada: en ese momento no hay sesión.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  const token = store.token();
  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && store.logueado()) {
        store.cerrarSesion();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
