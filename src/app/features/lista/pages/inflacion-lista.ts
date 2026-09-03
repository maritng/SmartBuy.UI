import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InflacionCanasta, ListasApiService } from '../data-access/listas-api.service';

type Estado = 'cargando' | 'ok' | 'error';

interface PuntoGrafico {
  x: number;
  y: number;
  fecha: string;
  total: number;
  completo: boolean;
  productosConPrecio: number;
}

const ANCHO = 640;
const ALTO = 280;
const MARGEN = { arriba: 16, abajo: 32, izquierda: 76, derecha: 16 };

/**
 * La inflación personal de una canasta: el costo total óptimo de la lista día
 * a día. La línea une solo los días completos (comparables); los incompletos
 * se marcan huecos y no participan de la variación.
 */
@Component({
  selector: 'app-inflacion-lista',
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './inflacion-lista.html',
  styleUrl: './inflacion-lista.scss'
})
export class InflacionLista {
  private readonly listasApi = inject(ListasApiService);

  /** Viene de la ruta /listas/:listaId/inflacion. */
  readonly listaId = input.required<string>();

  protected readonly estado = signal<Estado>('cargando');
  protected readonly datos = signal<InflacionCanasta | null>(null);
  protected readonly errores = signal<string[]>([]);
  protected readonly dias = signal(90);

  protected readonly ventanas = [30, 90, 180];

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;
  protected readonly yEtiquetasX = ALTO - MARGEN.abajo + 20;

  constructor() {
    effect(() => {
      this.listaId();
      this.dias();
      this.cargar();
    });
  }

  protected cargar(): void {
    this.estado.set('cargando');

    this.listasApi.getInflacion(Number(this.listaId()), this.dias()).subscribe({
      next: (respuesta) => {
        if (respuesta.success && respuesta.result) {
          this.datos.set(respuesta.result);
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

  protected cambiarVentana(valor: number): void {
    this.dias.set(valor);
  }

  // ---- Geometría del gráfico (una sola serie: el total de la canasta) ----

  protected readonly puntosGrafico = computed<PuntoGrafico[]>(() => {
    const puntos = this.datos()?.puntos ?? [];
    if (puntos.length === 0) {
      return [];
    }

    const fechas = puntos.map((p) => Date.parse(p.fecha));
    const totales = puntos.map((p) => p.total);

    const xMin = Math.min(...fechas);
    const xMax = Math.max(...fechas);
    let yMin = Math.min(...totales);
    let yMax = Math.max(...totales);

    const respiro = yMax === yMin ? Math.max(yMax * 0.05, 1) : (yMax - yMin) * 0.12;
    yMin -= respiro;
    yMax += respiro;

    const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

    return puntos.map((p) => ({
      x: xMax === xMin
        ? MARGEN.izquierda + anchoUtil / 2
        : MARGEN.izquierda + ((Date.parse(p.fecha) - xMin) / (xMax - xMin)) * anchoUtil,
      y: MARGEN.arriba + (1 - (p.total - yMin) / (yMax - yMin)) * altoUtil,
      fecha: p.fecha,
      total: p.total,
      completo: p.completo,
      productosConPrecio: p.productosConPrecio
    }));
  });

  /** La línea (y su área) une solo los días completos: lo comparable. */
  protected readonly trazoCompletos = computed<string>(() =>
    this.puntosGrafico()
      .filter((p) => p.completo)
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ')
  );

  protected readonly areaCompletos = computed<string>(() => {
    const completos = this.puntosGrafico().filter((p) => p.completo);
    if (completos.length < 2) {
      return '';
    }

    const base = ALTO - MARGEN.abajo;
    const primera = completos[0];
    const ultima = completos[completos.length - 1];

    return `${primera.x.toFixed(1)},${base} ${completos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} ${ultima.x.toFixed(1)},${base}`;
  });

  protected readonly ticksY = computed<{ y: number; etiqueta: string }[]>(() => {
    const puntos = this.datos()?.puntos ?? [];
    if (puntos.length === 0) {
      return [];
    }

    const totales = puntos.map((p) => p.total);
    let yMin = Math.min(...totales);
    let yMax = Math.max(...totales);
    const respiro = yMax === yMin ? Math.max(yMax * 0.05, 1) : (yMax - yMin) * 0.12;
    yMin -= respiro;
    yMax += respiro;

    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    const cantidad = 4;

    return Array.from({ length: cantidad }, (_, i) => ({
      y: MARGEN.arriba + (1 - i / (cantidad - 1)) * altoUtil,
      etiqueta: `$ ${Math.round(yMin + ((yMax - yMin) * i) / (cantidad - 1)).toLocaleString('es-AR')}`
    }));
  });

  protected readonly etiquetasX = computed<{ x: number; texto: string; ancla: string }[]>(() => {
    const puntos = this.puntosGrafico();
    if (puntos.length === 0) {
      return [];
    }

    const formatear = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

    if (puntos.length === 1) {
      return [{ x: ANCHO / 2, texto: formatear(puntos[0].fecha), ancla: 'middle' }];
    }

    return [
      { x: MARGEN.izquierda, texto: formatear(puntos[0].fecha), ancla: 'start' },
      { x: ANCHO - MARGEN.derecha, texto: formatear(puntos[puntos.length - 1].fecha), ancla: 'end' }
    ];
  });

  protected formatearFecha(iso: string): string {
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  }
}
