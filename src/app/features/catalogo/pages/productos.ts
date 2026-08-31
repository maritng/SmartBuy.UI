import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductoListado } from '../../../core/api/producto.model';
import { ProductosService } from '../../../core/api/productos.service';
import { CatalogoService } from '../data-access/catalogo.service';

type Estado = 'cargando' | 'ok' | 'error';

const TAMANIO_PAGINA = 20;

/**
 * Listado del catálogo maestro: tabla paginada server-side con filtro, badge
 * "sin curar" para los productos generados desde pendientes, baja lógica con
 * confirmación y la acción masiva "Generar desde pendientes".
 */
@Component({
  selector: 'app-productos',
  imports: [RouterLink],
  templateUrl: './productos.html',
  styleUrl: './productos.scss'
})
export class Productos {
  private readonly productosService = inject(ProductosService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly filas = signal<ProductoListado[]>([]);
  protected readonly errores = signal<string[]>([]);

  protected readonly filtro = signal('');
  protected readonly pagina = signal(0);
  protected readonly total = signal(0);

  protected readonly desde = computed(() => (this.total() === 0 ? 0 : this.pagina() * TAMANIO_PAGINA + 1));
  protected readonly hasta = computed(() => Math.min((this.pagina() + 1) * TAMANIO_PAGINA, this.total()));
  protected readonly hayAnterior = computed(() => this.pagina() > 0);
  protected readonly haySiguiente = computed(() => this.hasta() < this.total());

  /** Resultado de la última generación desde pendientes (banner). */
  protected readonly resumenGeneracion = signal<string | null>(null);
  protected readonly generando = signal(false);

  /** Feedback de la baja (id en curso, para deshabilitar el botón). */
  protected readonly eliminando = signal<number | null>(null);

  private readonly cambiosDeFiltro = new Subject<string>();

  constructor() {
    this.cambiosDeFiltro
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pagina.set(0);
        this.cargar();
      });

    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');

    const filtro = this.filtro().trim() || null;

    this.productosService.getAll(filtro, TAMANIO_PAGINA, this.pagina() * TAMANIO_PAGINA).subscribe({
      next: (respuesta) => {
        if (respuesta.success && respuesta.result) {
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

  protected filtrar(texto: string): void {
    this.filtro.set(texto);
    this.cambiosDeFiltro.next(texto.trim());
  }

  protected irA(delta: number): void {
    this.pagina.set(this.pagina() + delta);
    this.cargar();
  }

  protected eliminar(fila: ProductoListado): void {
    if (!confirm(`¿Dar de baja "${fila.nombre}"? Deja de aparecer en listados y recomendaciones (su historial se conserva).`)) {
      return;
    }

    this.eliminando.set(fila.id);

    this.catalogoService.eliminarProducto(fila.id).subscribe({
      next: (respuesta) => {
        this.eliminando.set(null);
        if (respuesta.success) {
          this.cargar();
        } else {
          alert(respuesta.errors.join('\n'));
        }
      },
      error: () => {
        this.eliminando.set(null);
        alert('No se pudo dar de baja. Probá de nuevo.');
      }
    });
  }

  protected generarDesdePendientes(): void {
    if (!confirm('Crea un producto provisorio (marcado "sin curar") por cada código EAN pendiente presente en 2 o más cadenas, y matchea sus publicaciones. ¿Continuar?')) {
      return;
    }

    this.generando.set(true);
    this.resumenGeneracion.set(null);

    this.catalogoService.generarDesdePendientes(2).subscribe({
      next: (respuesta) => {
        this.generando.set(false);
        if (respuesta.success && respuesta.result) {
          const r = respuesta.result;
          this.resumenGeneracion.set(
            r.productosCreados === 0
              ? 'No había pendientes nuevos para incorporar.'
              : `Se crearon ${r.productosCreados} productos y matchearon ${r.publicacionesMatcheadas} publicaciones.`
          );
          this.cargar();
        } else {
          this.resumenGeneracion.set(`Falló la generación: ${respuesta.errors.join(' ')}`);
        }
      },
      error: () => {
        this.generando.set(false);
        this.resumenGeneracion.set('Falló la generación: no se pudo conectar con la API.');
      }
    });
  }
}
