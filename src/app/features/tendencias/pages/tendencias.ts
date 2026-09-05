import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { TendenciasService } from '../data-access/tendencias.service';
import { EvolucionCategorias, SerieCategoria } from '../models/tendencias.models';

type Estado = 'cargando' | 'ok' | 'error';

interface PuntoGrafico {
  x: number;
  y: number;
  fecha: string;
  indice: number;
}

interface LineaGrafico {
  categoria: string;
  color: string;
  trazo: string;
  puntos: PuntoGrafico[];
}

/** Misma paleta que el histórico por producto: contraste, no semántica. */
const COLORES = ['#0e7b4b', '#c47f00', '#1565c0', '#8e24aa', '#b3261e', '#00838f', '#6d4c41'];

const ANCHO = 640;
const ALTO = 300;
const MARGEN = { arriba: 16, abajo: 32, izquierda: 56, derecha: 16 };

/**
 * Tendencias: la evolución de precios por categoría de captura como índice
 * encadenado base 100 (el backend arma los eslabones con canasta común;
 * acá solo se dibuja). La línea de 100 es la referencia "sin cambios".
 */
@Component({
  selector: 'app-tendencias',
  imports: [DecimalPipe],
  templateUrl: './tendencias.html',
  styleUrl: './tendencias.scss'
})
export class Tendencias {
  private readonly tendenciasService = inject(TendenciasService);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly datos = signal<EvolucionCategorias | null>(null);
  protected readonly errores = signal<string[]>([]);
  protected readonly dias = signal(90);
  protected readonly conPromos = signal(true);

  protected readonly ventanas = [30, 90, 180];

  protected readonly ancho = ANCHO;
  protected readonly alto = ALTO;
  protected readonly yEtiquetasX = ALTO - MARGEN.abajo + 20;

  constructor() {
    effect(() => {
      this.dias();
      this.conPromos();
      this.cargar();
    });
  }

  protected cargar(): void {
    this.estado.set('cargando');

    this.tendenciasService.getEvolucion(this.dias(), this.conPromos()).subscribe({
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

  protected colorDe(indice: number): string {
    return COLORES[indice % COLORES.length];
  }

  /** Series que ya tienen al menos un eslabón (las graficables). */
  protected readonly conDatos = computed<SerieCategoria[]>(
    () => (this.datos()?.series ?? []).filter((s) => s.puntos.length > 0)
  );

  protected readonly lineas = computed<LineaGrafico[]>(() => {
    const series = this.conDatos();
    if (series.length === 0) {
      return [];
    }

    const fechas = series.flatMap((s) => s.puntos.map((p) => Date.parse(p.fecha)));
    const indices = series.flatMap((s) => s.puntos.map((p) => p.indice));

    const xMin = Math.min(...fechas);
    const xMax = Math.max(...fechas);
    // La base 100 siempre visible: es la referencia de lectura.
    let yMin = Math.min(100, ...indices);
    let yMax = Math.max(100, ...indices);

    const respiro = yMax === yMin ? Math.max(yMax * 0.02, 0.5) : (yMax - yMin) * 0.15;
    yMin -= respiro;
    yMax += respiro;

    const anchoUtil = ANCHO - MARGEN.izquierda - MARGEN.derecha;
    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;

    const x = (fecha: string): number =>
      xMax === xMin
        ? MARGEN.izquierda + anchoUtil / 2
        : MARGEN.izquierda + ((Date.parse(fecha) - xMin) / (xMax - xMin)) * anchoUtil;

    const y = (indice: number): number => MARGEN.arriba + (1 - (indice - yMin) / (yMax - yMin)) * altoUtil;

    return series.map((serie, i) => {
      const puntos = serie.puntos.map((p) => ({ x: x(p.fecha), y: y(p.indice), fecha: p.fecha, indice: p.indice }));

      return {
        categoria: serie.categoria,
        color: COLORES[i % COLORES.length],
        trazo: puntos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
        puntos
      };
    });
  });

  /** La línea horizontal del índice 100 (referencia "sin cambios"). */
  protected readonly yBase100 = computed<number | null>(() => {
    const series = this.conDatos();
    if (series.length === 0) {
      return null;
    }

    const indices = series.flatMap((s) => s.puntos.map((p) => p.indice));
    let yMin = Math.min(100, ...indices);
    let yMax = Math.max(100, ...indices);
    const respiro = yMax === yMin ? Math.max(yMax * 0.02, 0.5) : (yMax - yMin) * 0.15;
    yMin -= respiro;
    yMax += respiro;

    const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    return MARGEN.arriba + (1 - (100 - yMin) / (yMax - yMin)) * altoUtil;
  });

  protected readonly etiquetasX = computed<{ x: number; texto: string; ancla: string }[]>(() => {
    const series = this.conDatos();
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
}
