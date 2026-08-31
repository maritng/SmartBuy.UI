/** Espejos de los DTOs de catálogo del backend. */

export interface ProductoDetalle {
  id: number;
  nombre: string;
  marcaId: number | null;
  marca: string | null;
  categoriaId: number | null;
  categoria: string | null;
  contenidoValor: number | null;
  contenidoUnidad: string | null;
  ean: string | null;
  activo: boolean;
}

export interface GuardarProductoRequest {
  id: number;
  nombre: string;
  marcaId: number | null;
  categoriaId: number | null;
  contenidoValor: number | null;
  contenidoUnidad: string | null;
  ean: string | null;
}

export interface Marca {
  id: number;
  nombre: string;
}

export interface CategoriaNodo {
  id: number;
  nombre: string;
  padreId: number | null;
  padre: string | null;
}

export interface IdDto {
  id: number;
}

export interface GeneracionPendientesResumen {
  productosCreados: number;
  publicacionesMatcheadas: number;
}

export const UNIDADES_VALIDAS = ['L', 'ml', 'kg', 'g', 'un'] as const;
