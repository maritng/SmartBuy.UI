/** Respuesta de GET /api/Producto/GetHistorico. */
export interface HistoricoResumen {
  productoId: number;
  producto: string;
  dias: number;
  series: HistoricoSerieCadena[];
  senal: SenalCompra;
}

/** Una línea del gráfico: la serie diaria de una cadena. */
export interface HistoricoSerieCadena {
  cadenaId: number;
  cadena: string;
  puntos: HistoricoPunto[];
}

export interface HistoricoPunto {
  /** ISO yyyy-MM-dd. */
  fecha: string;
  precio: number;
}

/** El veredicto "¿conviene comprar hoy?" que calcula el backend. */
export interface SenalCompra {
  veredicto: 'sin_datos' | 'minimo' | 'bueno' | 'normal' | 'caro' | 'maximo';
  mensaje: string;
  precioActual: number | null;
  promedio: number | null;
  minimo: number | null;
  maximo: number | null;
  variacionVsPromedio: number | null;
  diasConDatos: number;
}
