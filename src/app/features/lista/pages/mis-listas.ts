import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ListaResumen, ListasApiService } from '../data-access/listas-api.service';
import { ListaStore } from '../state/lista.store';

type Estado = 'cargando' | 'ok' | 'error';

/**
 * Las listas guardadas del usuario (ruta con guard). Abrir una carga el
 * changuito y te lleva a armar-lista para seguir trabajando o resolverla.
 */
@Component({
  selector: 'app-mis-listas',
  imports: [DatePipe, RouterLink],
  templateUrl: './mis-listas.html',
  styleUrl: './mis-listas.scss'
})
export class MisListas {
  private readonly listasApi = inject(ListasApiService);
  private readonly store = inject(ListaStore);
  private readonly router = inject(Router);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly listas = signal<ListaResumen[]>([]);
  protected readonly errores = signal<string[]>([]);
  protected readonly abriendo = signal<number | null>(null);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');

    this.listasApi.getMisListas().subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          this.listas.set(respuesta.result ?? []);
          this.estado.set('ok');
        } else {
          this.errores.set(respuesta.errors);
          this.estado.set('error');
        }
      },
      error: () => {
        this.errores.set(['No se pudieron cargar tus listas.']);
        this.estado.set('error');
      }
    });
  }

  protected abrir(lista: ListaResumen): void {
    this.abriendo.set(lista.id);

    this.listasApi.getLista(lista.id).subscribe({
      next: (respuesta) => {
        this.abriendo.set(null);
        if (respuesta.success && respuesta.result) {
          this.store.abrirLista(respuesta.result.id, respuesta.result.nombre, respuesta.result.items);
          this.router.navigate(['/lista']);
        } else {
          alert(respuesta.errors.join('\n'));
        }
      },
      error: () => {
        this.abriendo.set(null);
        alert('No se pudo abrir la lista.');
      }
    });
  }

  protected eliminar(lista: ListaResumen): void {
    if (!confirm(`¿Eliminar "${lista.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.listasApi.eliminarLista(lista.id).subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          // Si era la lista activa del changuito, deja de estarlo.
          if (this.store.listaActivaId() === lista.id) {
            this.store.cerrarListaActiva();
          }
          this.cargar();
        } else {
          alert(respuesta.errors.join('\n'));
        }
      },
      error: () => alert('No se pudo eliminar la lista.')
    });
  }

  protected nuevaLista(): void {
    this.store.limpiar();
    this.router.navigate(['/lista']);
  }
}
