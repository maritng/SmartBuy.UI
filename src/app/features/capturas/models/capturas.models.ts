/** Una corrida de bot tal como la devuelve GET /api/Captura/GetCapturas. */
export interface CapturaListado {
  id: number;
  cadenaId: number;
  cadena: string;
  fuente: string;
  estado: 'ok' | 'error' | 'en_proceso';
  fechaInicio: string;
  fechaFin: string | null;
  cantItems: number | null;
  errorDetalle: string | null;
  duracionSegundos: number | null;
}
