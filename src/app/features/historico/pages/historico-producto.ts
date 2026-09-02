import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { HistoricoService } from '../data-access/historico.service';
import { HistoricoResumen } from '../models/historico.models';

type Estado = 'cargando' | 'ok' | 'error';

interface PuntoGrafico {
  x: number;
  y: number;
  fecha: string;
  precio: number;
}

interface LineaGrafico {
  cadenaId: number;
  cadena: string;
  color: string;
  /** Puntos "x,y x,y…" para la polyline. */
  trazo: string;
  puntos: PuntoGrafico[];
  ultimoPrecio: number;
}

interface TickEjeY {
  y: number;
  etiqueta: string;
}

/** Paleta fija por orden de serie: contraste entre líneas, no semántica. */
const COLORES = ['#0e7b4b', '#c47f00', '#1565c0', '#8e24aa', '#b3261e', '#00838f', '#6d4c41'];

const ANCHO = 640;
const ALTO = 300;
const MARGEN = { arriba: 16, abajo: 32, izquierda: 68, derecha: 16 };

/**
 * La historia de precios de un producto: una línea por cadena (mejor precio
 * efectivo por día) + la señal "¿conviene comprar hoy?" que calcula el backend.
 * El gráfico es SVG propio: una polyline por serie sobre la escala común.
 */
@Component({
  selector: 'app-historico-producto',
  imports: [CurrencyPipe],
  templateUrl: './historico-producto.html',
  styleUrl: './historico-producto.scss'
})
export class HistoricoProducto {
  private readonly historicoService = inject(HistoricoService);

  /** Viene de la ruta /historico/:productoId (withComponentInputBinding). */
  readonly productoId = input.required<string>();

  protected readonly estado = signal<Estado>('cargando');
  protected readonly datos = signal<HistoricoResumen | null>(null);
  protected readonly errores = signal<string[]>([]);
  protected readonly dias = signal(90);

  protected readonly ventanas = [30, 90, 180];

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;

  constructor() {
    effect(() => {
      this.productoId();
      this.dias();
      this.cargar();
    });
  }

  protected cargar(): void {
    this.estado.set('cargando');

    this.historicoService.getHistorico(Number(this.productoId()), this.dias()).subscribe({
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

  protected volver(): void {
    history.back();
  }

  // ---- Escalas y geometría del gráfico ----

  protected readonly lineas = computed<LineaGrafico[]>(() => {
    const series = this.datos()?.series ?? [];
    if (series.length === 0) {
      return [];
    }

    const fechas = series.flatMap((s) => s.puntos.map((p) => Date.parse(p.fecha)));
    const precios = series.flatMap((s) => s.puntos.map((p) => p.precio));

    const xMin = Math.min(...fechas);
    const xMax = Math.max(...fechas);
    let yMin = Math.min(...precios);
    let yMax = Math.max(...precios);

    // Respiro vertical del 5% (o fijo si la serie es plana) para que la línea
    // no toque los bordes.
    const respiro = yMax === yMin ? Math.max(yMax * 0.05, 1) : (yMax - yMin) * 0.08;
    yMin -= respiro;
    yMax += respiro;

    const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

    const x = (fecha: string): number =>
      xMax === xMin
        ? MARGEN.izquierda + anchoUtil / 2
        : MARGEN.izquierda + ((Date.parse(fecha) - xMin) / (xMax - xMin)) * anchoUtil;

    const y = (precio: number): number => MARGEN.arriba + (1 - (precio - yMin) / (yMax - yMin)) * altoUtil;

    return series.map((serie, indice) => {
      const puntos = serie.puntos.map((p) => ({ x: x(p.fecha), y: y(p.precio), fecha: p.fecha, precio: p.precio }));

      return {
        cadenaId: serie.cadenaId,
        cadena: serie.cadena,
        color: COLORES[indice % COLORES.length],
        trazo: puntos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
        puntos,
        ultimoPrecio: serie.puntos[serie.puntos.length - 1].precio
      };
    });
  });

  protected readonly ticksY = computed<TickEjeY[]>(() => {
    const series = this.datos()?.series ?? [];
    const precios = series.flatMap((s) => s.puntos.map((p) => p.precio));
    if (precios.length === 0) {
      return [];
    }

    let yMin = Math.min(...precios);
    let yMax = Math.max(...precios);
    const respiro = yMax === yMin ? Math.max(yMax * 0.05, 1) : (yMax - yMin) * 0.08;
    yMin -= respiro;
    yMax += respiro;

    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    const cantidad = 4;

    return Array.from({ length: cantidad }, (_, i) => {
      const precio = yMin + ((yMax - yMin) * i) / (cantidad - 1);
      return {
        y: MARGEN.arriba + (1 - i / (cantidad - 1)) * altoUtil,
        etiqueta: `$ ${Math.round(precio).toLocaleString('es-AR')}`
      };
    });
  });

  /** Etiquetas del eje X: primera y última fecha con datos. */
  protected readonly etiquetasX = computed<{ x: number; texto: string; ancla: string }[]>(() => {
    const series = this.datos()?.series ?? [];
    const fechas = [...new Set(series.flatMap((s) => s.puntos.map((p) => p.fecha)))].sort();
    if (fechas.length === 0) {
      return [];
    }

    const formatear = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

    if (fechas.length === 1) {
      return [{ x: ANCHO / 2, texto: formatear(fechas[0]), ancla: 'middle' }];
    }

    return [
      { x: MARGEN.izquierda, texto: formatear(fechas[0]), ancla: 'start' },
      { x: ANCHO - MARGEN.derecha, texto: formatear(fechas[fechas.length - 1]), ancla: 'end' }
    ];
  });

  protected readonly yEtiquetasX = ALTO - MARGEN.abajo + 20;
}
