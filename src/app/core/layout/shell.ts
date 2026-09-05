import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { ListaStore } from '../../features/lista/state/lista.store';

/**
 * Layout general: barra superior con la marca, la navegación y la sesión.
 * Mobile-first: en pantallas chicas la navegación pasa a una fila scrolleable.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  protected readonly auth = inject(AuthStore);
  private readonly listaStore = inject(ListaStore);
  private readonly router = inject(Router);

  protected readonly secciones = [
    { ruta: '/inicio', etiqueta: 'Inicio', disponible: true },
    { ruta: '/lista', etiqueta: 'Mi chango', disponible: true },
    { ruta: '/catalogo', etiqueta: 'Catálogo', disponible: true },
    { ruta: '/tendencias', etiqueta: 'Tendencias', disponible: true },
    { ruta: '/matching', etiqueta: 'Matching', disponible: true },
    { ruta: '/capturas', etiqueta: 'Capturas', disponible: true }
  ];

  protected salir(): void {
    this.auth.cerrarSesion();
    // La lista activa era de la cuenta: el changuito local sigue, pero suelto.
    this.listaStore.cerrarListaActiva();
    this.router.navigate(['/lista']);
  }
}
