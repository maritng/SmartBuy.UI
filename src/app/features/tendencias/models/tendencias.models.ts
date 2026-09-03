/** Respuesta de GET /api/Tendencia/GetEvolucionCategorias. */
export interface EvolucionCategorias {
  dias: number;
  series: SerieCategoria[];
}

/** El índice base 100 de una categoría de captura. */
export interface SerieCategoria {
  categoria: string;
  puntos: PuntoIndice[];
  variacionVentana: number | null;
  variacionUltimoDia: number | null;
  publicacionesUltimoDia: number;
  mensaje: string;
}

export interface PuntoIndice {
  /** ISO yyyy-MM-dd. */
  fecha: string;
  indice: number;
  variacionDia: number;
  publicaciones: number;
}
