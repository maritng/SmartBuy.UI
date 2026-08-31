import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListaStore } from '../state/lista.store';
import { RecomendacionService } from '../data-access/recomendacion.service';
import { ListaCompraResumen, RecomendacionItem } from '../models/recomendacion.models';

type Estado = 'cargando' | 'ok' | 'error' | 'sin-lista';

interface GrupoCadena {
  cadenaId: number;
  cadena: string;
  items: RecomendacionItem[];
  subtotal: number;
}

/**
 * Resultado de la recomendación. Decisión UX central: agrupado POR CADENA
 * (no por producto), porque el uso real es "estoy en este súper: ¿qué me
 * llevo de acá?". Arriba, los tres números que importan: total optimizado,
 * mejor cadena única y el ahorro en grande.
 */
@Component({
  selector: 'app-resultado',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './resultado.html',
  styleUrl: './resultado.scss'
})
export class Resultado {
  private readonly recomendacionService = inject(RecomendacionService);
  private readonly store = inject(ListaStore);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly resumen = signal<ListaCompraResumen | null>(null);
  protected readonly errores = signal<string[]>([]);

  protected readonly grupos = computed<GrupoCadena[]>(() => {
    const items = this.resumen()?.items ?? [];
    const porCadena = new Map<number, GrupoCadena>();

    for (const item of items) {
      const grupo = porCadena.get(item.cadenaId) ?? { cadenaId: item.cadenaId, cadena: item.cadena, items: [], subtotal: 0 };
      grupo.items.push(item);
      grupo.subtotal += item.subtotal;
      porCadena.set(item.cadenaId, grupo);
    }

    return [...porCadena.values()].sort((a, b) => b.subtotal - a.subtotal);
  });

  constructor() {
    this.resolver();
  }

  protected resolver(): void {
    if (this.store.vacia()) {
      this.estado.set('sin-lista');
      return;
    }

    this.estado.set('cargando');

    this.recomendacionService
      .resolverLista({
        items: this.store.items().map((item) => ({ productoId: item.productoId, cantidad: item.cantidad })),
        cadenasIds: this.store.cadenasIds()
      })
      .subscribe({
        next: (respuesta) => {
          if (respuesta.success && respuesta.result) {
            this.resumen.set(respuesta.result);
            this.estado.set('ok');
          } else {
            this.errores.set(respuesta.errors.length ? respuesta.errors : ['La API respondió sin resultado.']);
            this.estado.set('error');
          }
        },
        error: () => {
          this.errores.set(['No se pudo conectar con la API. ¿Está levantado el backend?']);
          this.estado.set('error');
        }
      });
  }
}
