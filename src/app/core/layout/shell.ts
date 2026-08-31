import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Layout general: barra superior con la marca y la navegación, contenido
 * ruteado abajo. Mobile-first: en pantallas chicas la navegación pasa a una
 * fila scrolleable debajo de la marca.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  protected readonly secciones = [
    { ruta: '/inicio', etiqueta: 'Inicio', disponible: true },
    { ruta: '/lista', etiqueta: 'Mi lista', disponible: true },
    { ruta: '/catalogo', etiqueta: 'Catálogo', disponible: false },
    { ruta: '/matching', etiqueta: 'Matching', disponible: false }
  ];
}
