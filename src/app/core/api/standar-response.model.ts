/**
 * Espejo del StandarResponse<T> del backend: toda la API responde esta forma.
 * Los servicios de data-access la destapan una sola vez; los componentes
 * trabajan con el resultado tipado o con la lista de errores.
 */
export interface StandarResponse<T> {
  success: boolean;
  result: T | null;
  errors: string[];
}
