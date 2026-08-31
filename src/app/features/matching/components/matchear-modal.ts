import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError, map } from 'rxjs';
import { ProductoListado } from '../../../core/api/producto.model';
import { ProductosService } from '../../../core/api/productos.service';
import { PublicacionPendiente } from '../models/matching.models';

/**
 * Modal para matchear una publicación pendiente contra un producto del
 * catálogo: muestra el texto crudo del súper como referencia y busca en el
 * catálogo. Emite el producto elegido; el padre resuelve contra la API.
 */
@Component({
  selector: 'app-matchear-modal',
  imports: [],
  templateUrl: './matchear-modal.html',
  styleUrl: './matchear-modal.scss'
})
export class MatchearModal {
  private readonly productosService = inject(ProductosService);
  private readonly destroyRef = inject(DestroyRef);

  readonly publicacion = input.required<PublicacionPendiente>();

  readonly confirmar = output<ProductoListado>();
  readonly cerrar = output<void>();

  protected readonly termino = signal('');
  protected readonly resultados = signal<ProductoListado[]>([]);
  protected readonly buscando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly seleccionado = signal<ProductoListado | null>(null);

  private readonly busquedas = new Subject<string>();

  constructor() {
    this.busquedas
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) => {
          if (texto.trim().length < 2) {
            return of<ProductoListado[] | null>([]);
          }
          this.buscando.set(true);
          return this.productosService.getAll(texto.trim(), 8, 0).pipe(
            map((respuesta) => (respuesta.success ? respuesta.result ?? [] : null)),
            catchError(() => of<ProductoListado[] | null>(null))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((resultado) => {
        this.buscando.set(false);
        if (resultado === null) {
          this.error.set('No se pudo buscar. Probá de nuevo.');
          this.resultados.set([]);
        } else {
          this.error.set(null);
          this.resultados.set(resultado);
        }
      });
  }

  protected buscar(texto: string): void {
    this.termino.set(texto);
    this.seleccionado.set(null);
    this.busquedas.next(texto);
  }

  protected elegir(producto: ProductoListado): void {
    this.seleccionado.set(producto);
  }

  protected confirmarSeleccion(): void {
    const producto = this.seleccionado();
    if (producto) {
      this.confirmar.emit(producto);
    }
  }
}
