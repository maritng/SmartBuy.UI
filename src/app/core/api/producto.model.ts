/** Fila del listado paginado de productos (espejo de ProductoListado del backend). */
export interface ProductoListado {
  id: number;
  nombre: string;
  marcaId: number | null;
  marca: string | null;
  categoriaId: number | null;
  categoria: string | null;
  contenidoValor: number | null;
  contenidoUnidad: string | null;
  ean: string | null;
  /** false = generado desde pendientes, con nombre provisorio (pendiente de curación). */
  curado: boolean;
  /** Total de filas del filtro (sin paginar), para paginación. */
  total: number;
}
