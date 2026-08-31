import { Injectable, computed, effect, signal } from '@angular/core';
import { ProductoListado } from '../../../core/api/producto.model';

export interface ItemLista {
  productoId: number;
  nombre: string;
  cantidad: number;
}

interface ListaPersistida {
  items: ItemLista[];
  cadenasIds: number[] | null;
}

const STORAGE_KEY = 'smartbuy.lista.v1';
const CANTIDAD_MAX = 999;

/**
 * Estado de la lista de compras. Vive a nivel app (providedIn root) para
 * sobrevivir la navegación armar-lista <-> resultado, y persiste en
 * localStorage: sin usuarios todavía, el changuito del navegador es la
 * persistencia honesta. cadenasIds null = todas las cadenas.
 */
@Injectable({ providedIn: 'root' })
export class ListaStore {
  readonly items = signal<ItemLista[]>([]);
  readonly cadenasIds = signal<number[] | null>(null);

  readonly cantidadTotal = computed(() => this.items().reduce((suma, item) => suma + item.cantidad, 0));
  readonly vacia = computed(() => this.items().length === 0);

  constructor() {
    this.restaurar();

    // Persistencia automática: cualquier cambio de items o cadenas se guarda.
    effect(() => {
      const estado: ListaPersistida = { items: this.items(), cadenasIds: this.cadenasIds() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
      } catch {
        // Modo incógnito o storage lleno: la lista sigue funcionando en memoria.
      }
    });
  }

  agregar(producto: ProductoListado): void {
    const actual = this.items();
    const existente = actual.find((item) => item.productoId === producto.id);

    if (existente) {
      this.cambiarCantidad(producto.id, 1);
      return;
    }

    this.items.set([...actual, { productoId: producto.id, nombre: producto.nombre, cantidad: 1 }]);
  }

  cambiarCantidad(productoId: number, delta: number): void {
    this.items.set(
      this.items().map((item) =>
        item.productoId === productoId
          ? { ...item, cantidad: Math.min(Math.max(item.cantidad + delta, 1), CANTIDAD_MAX) }
          : item
      )
    );
  }

  quitar(productoId: number): void {
    this.items.set(this.items().filter((item) => item.productoId !== productoId));
  }

  limpiar(): void {
    this.items.set([]);
  }

  /**
   * Alterna una cadena. La semántica null = todas se resuelve acá: al
   * desmarcar la primera se pasa de "todas" al conjunto explícito, y si el
   * conjunto vuelve a estar completo se normaliza a null.
   */
  toggleCadena(cadenaId: number, todasLasCadenas: number[]): void {
    const actual = this.cadenasIds();
    const seleccionadas = new Set(actual ?? todasLasCadenas);

    if (seleccionadas.has(cadenaId)) {
      seleccionadas.delete(cadenaId);
    } else {
      seleccionadas.add(cadenaId);
    }

    this.cadenasIds.set(seleccionadas.size === todasLasCadenas.length ? null : [...seleccionadas]);
  }

  cadenaSeleccionada(cadenaId: number): boolean {
    const actual = this.cadenasIds();
    return actual === null || actual.includes(cadenaId);
  }

  private restaurar(): void {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      if (!crudo) {
        return;
      }

      const estado = JSON.parse(crudo) as ListaPersistida;
      this.items.set(Array.isArray(estado.items) ? estado.items : []);
      this.cadenasIds.set(Array.isArray(estado.cadenasIds) ? estado.cadenasIds : null);
    } catch {
      // Storage corrupto o inaccesible: se arranca con lista vacía.
    }
  }
}
