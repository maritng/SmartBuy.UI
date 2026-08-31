import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Cadena } from '../../../core/api/cadena.model';
import { CadenasService } from '../../../core/api/cadenas.service';
import { ProductoListado } from '../../../core/api/producto.model';
import { MatchearModal } from '../components/matchear-modal';
import { MatchingService } from '../data-access/matching.service';
import { PublicacionPendiente } from '../models/matching.models';

type Estado = 'cargando' | 'ok' | 'error';

const TAMANIO_PAGINA = 20;

/**
 * Cola de revisión de matching: las publicaciones capturadas por los bots que
 * todavía no apuntan a ningún producto del catálogo. Las más viejas primero.
 * Acciones por fila: matchear (modal con buscador) o descartar.
 */
@Component({
  selector: 'app-pendientes',
  imports: [CurrencyPipe, DatePipe, MatchearModal],
  templateUrl: './pendientes.html',
  styleUrl: './pendientes.scss'
})
export class Pendientes {
  private readonly matchingService = inject(MatchingService);
  private readonly cadenasService = inject(CadenasService);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly filas = signal<PublicacionPendiente[]>([]);
  protected readonly errores = signal<string[]>([]);

  protected readonly cadenas = signal<Cadena[]>([]);
  protected readonly cadenaFiltro = signal<number | null>(null);

  protected readonly pagina = signal(0);
  protected readonly total = signal(0);

  protected readonly desde = computed(() => (this.total() === 0 ? 0 : this.pagina() * TAMANIO_PAGINA + 1));
  protected readonly hasta = computed(() => Math.min((this.pagina() + 1) * TAMANIO_PAGINA, this.total()));
  protected readonly hayAnterior = computed(() => this.pagina() > 0);
  protected readonly haySiguiente = computed(() => this.hasta() < this.total());

  /** Publicación abierta en el modal de matcheo (null = modal cerrado). */
  protected readonly matcheando = signal<PublicacionPendiente | null>(null);
  protected readonly resolviendo = signal<number | null>(null);
  protected readonly aviso = signal<string | null>(null);

  constructor() {
    this.cadenasService.getAll().subscribe({
      next: (respuesta) => this.cadenas.set(respuesta.result ?? []),
      error: () => this.cadenas.set([])
    });

    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');

    this.matchingService.getPendientes(this.cadenaFiltro(), TAMANIO_PAGINA, this.pagina() * TAMANIO_PAGINA).subscribe({
      next: (respuesta) => {
        if (respuesta.success && respuesta.result) {
          // Si la página quedó vacía tras resolver (o por filtro), retrocede.
          if (respuesta.result.length === 0 && this.pagina() > 0) {
            this.pagina.set(this.pagina() - 1);
            this.cargar();
            return;
          }
          this.filas.set(respuesta.result);
          this.total.set(respuesta.result[0]?.total ?? 0);
          this.estado.set('ok');
        } else {
          this.errores.set(respuesta.errors.length ? respuesta.errors : ['La API respondió sin resultado.']);
          this.estado.set('error');
        }
      },
      error: () => {
        this.errores.set(['No se pudo conectar con la API.']);
        this.estado.set('error');
      }
    });
  }

  protected filtrarPorCadena(valor: string): void {
    this.cadenaFiltro.set(valor === '' ? null : Number(valor));
    this.pagina.set(0);
    this.cargar();
  }

  protected irA(delta: number): void {
    this.pagina.set(this.pagina() + delta);
    this.cargar();
  }

  protected abrirMatcheo(fila: PublicacionPendiente): void {
    this.aviso.set(null);
    this.matcheando.set(fila);
  }

  protected confirmarMatcheo(producto: ProductoListado): void {
    const publicacion = this.matcheando();
    if (!publicacion) {
      return;
    }

    this.resolver(
      { publicacionId: publicacion.id, productoId: producto.id, descartar: false },
      `"${publicacion.nombrePublicado}" matcheada con "${producto.nombre}" ✓`
    );
    this.matcheando.set(null);
  }

  protected descartar(fila: PublicacionPendiente): void {
    if (!confirm(`¿Descartar "${fila.nombrePublicado}" (${fila.cadena})? No va a participar de comparaciones ni volver a la cola.`)) {
      return;
    }

    this.resolver({ publicacionId: fila.id, productoId: null, descartar: true }, `"${fila.nombrePublicado}" descartada.`);
  }

  private resolver(request: { publicacionId: number; productoId: number | null; descartar: boolean }, mensajeOk: string): void {
    this.aviso.set(null);
    this.resolviendo.set(request.publicacionId);

    this.matchingService.resolver(request).subscribe({
      next: (respuesta) => {
        this.resolviendo.set(null);
        if (respuesta.success) {
          this.aviso.set(mensajeOk);
          this.cargar();
        } else {
          // Incluye la protección de concurrencia: "ya fue resuelta".
          this.aviso.set(`No se pudo resolver: ${respuesta.errors.join(' ')}`);
          this.cargar();
        }
      },
      error: () => {
        this.resolviendo.set(null);
        this.aviso.set('No se pudo resolver: falló la conexión con la API.');
      }
    });
  }
}
