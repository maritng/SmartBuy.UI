import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError, map } from 'rxjs';
import { Cadena } from '../../../core/api/cadena.model';
import { CadenasService } from '../../../core/api/cadenas.service';
import { ProductoListado } from '../../../core/api/producto.model';
import { ProductosService } from '../../../core/api/productos.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { ListasApiService } from '../data-access/listas-api.service';
import { ListaStore } from '../state/lista.store';

/**
 * Armado de la lista: buscador de productos del catálogo, changuito con
 * cantidades y selector de "mis cadenas" (chips). El CTA lleva al resultado.
 */
@Component({
  selector: 'app-armar-lista',
  imports: [RouterLink],
  templateUrl: './armar-lista.html',
  styleUrl: './armar-lista.scss'
})
export class ArmarLista {
  private readonly productosService = inject(ProductosService);
  private readonly cadenasService = inject(CadenasService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(ListaStore);
  protected readonly auth = inject(AuthStore);
  private readonly listasApi = inject(ListasApiService);

  protected readonly termino = signal('');
  protected readonly resultados = signal<ProductoListado[]>([]);
  protected readonly buscando = signal(false);
  protected readonly errorBusqueda = signal<string | null>(null);

  protected readonly cadenas = signal<Cadena[]>([]);

  protected readonly guardando = signal(false);
  protected readonly avisoGuardado = signal<string | null>(null);
  protected readonly mostrarGuardarComo = signal(false);
  protected readonly nombreNuevaLista = signal('');

  private readonly busquedas = new Subject<string>();

  constructor() {
    this.cadenasService.getAll().subscribe({
      next: (respuesta) => this.cadenas.set(respuesta.result ?? []),
      error: () => this.cadenas.set([])
    });

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
          this.errorBusqueda.set('No se pudo buscar. Probá de nuevo.');
          this.resultados.set([]);
        } else {
          this.errorBusqueda.set(null);
          this.resultados.set(resultado);
        }
      });
  }

  protected buscar(texto: string): void {
    this.termino.set(texto);
    this.busquedas.next(texto);
  }

  protected agregar(producto: ProductoListado): void {
    this.store.agregar(producto);
  }

  protected enLista(productoId: number): boolean {
    return this.store.items().some((item) => item.productoId === productoId);
  }

  protected idsDeCadenas(): number[] {
    return this.cadenas().map((cadena) => cadena.id);
  }

  /** Toggle de chip + sincronización al servidor si hay sesión. */
  protected alternarCadena(cadenaId: number): void {
    this.store.toggleCadena(cadenaId, this.idsDeCadenas());

    if (this.auth.logueado()) {
      this.listasApi.guardarMisCadenas(this.store.cadenasIds() ?? []).subscribe({
        error: () => {
          // Sin drama: la preferencia local sigue; se re-sincroniza al próximo login.
        }
      });
    }
  }

  /** Guarda sobre la lista activa del servidor. */
  protected guardar(): void {
    const id = this.store.listaActivaId();
    const nombre = this.store.listaActivaNombre();
    if (id === null || !nombre) {
      return;
    }

    this.persistir(this.listasApi.guardarLista(id, nombre, this.itemsParaGuardar()), `"${nombre}" guardada ✓`);
  }

  /** Crea una lista nueva en el servidor con el changuito actual. */
  protected guardarComo(): void {
    const nombre = this.nombreNuevaLista().trim();
    if (!nombre) {
      return;
    }

    this.persistir(
      this.listasApi.crearLista(nombre, this.itemsParaGuardar()),
      `"${nombre}" creada ✓`,
      (id) => {
        this.store.marcarComoActiva(id, nombre);
        this.mostrarGuardarComo.set(false);
        this.nombreNuevaLista.set('');
      }
    );
  }

  private persistir(
    operacion: ReturnType<ListasApiService['crearLista']>,
    mensajeOk: string,
    alExito?: (id: number) => void
  ): void {
    this.guardando.set(true);
    this.avisoGuardado.set(null);

    operacion.subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        if (respuesta.success && respuesta.result) {
          alExito?.(respuesta.result.id);
          this.avisoGuardado.set(mensajeOk);
        } else {
          this.avisoGuardado.set(`No se pudo guardar: ${respuesta.errors.join(' ')}`);
        }
      },
      error: (error) => {
        this.guardando.set(false);
        const mensajes = error?.error?.errors as string[] | undefined;
        this.avisoGuardado.set(`No se pudo guardar: ${mensajes?.join(' ') ?? 'falló la conexión.'}`);
      }
    });
  }

  private itemsParaGuardar(): { productoId: number; cantidad: number }[] {
    return this.store.items().map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }));
  }
}
