import { Injectable, computed, effect, signal } from '@angular/core';
import { Sesion, UsuarioSesion } from './auth.models';

const STORAGE_KEY = 'smartbuy.sesion.v1';

/**
 * Estado de sesión de toda la app: usuario y token en signals (el shell, el
 * interceptor y las páginas reaccionan solos), persistidos en localStorage
 * para que cerrar el navegador no desloguee (el token dura 7 días).
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly usuario = signal<UsuarioSesion | null>(null);
  readonly token = signal<string | null>(null);

  readonly logueado = computed(() => this.token() !== null);

  constructor() {
    this.restaurar();

    effect(() => {
      const sesion = this.token() ? { token: this.token(), usuario: this.usuario() } : null;
      try {
        if (sesion) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Storage inaccesible: la sesión vive solo en memoria.
      }
    });
  }

  iniciarSesion(sesion: Sesion): void {
    this.usuario.set(sesion.usuario);
    this.token.set(sesion.token);
  }

  cerrarSesion(): void {
    this.usuario.set(null);
    this.token.set(null);
  }

  private restaurar(): void {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      if (!crudo) {
        return;
      }
      const sesion = JSON.parse(crudo) as Sesion;
      if (sesion?.token && sesion?.usuario) {
        this.usuario.set(sesion.usuario);
        this.token.set(sesion.token);
      }
    } catch {
      // Storage corrupto: se arranca sin sesión.
    }
  }
}
