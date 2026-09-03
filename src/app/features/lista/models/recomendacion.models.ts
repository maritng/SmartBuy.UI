/** Espejos de los DTOs de Recomendacion del backend. */

export interface ListaCompraItemRequest {
  productoId: number;
  cantidad: number;
}

export interface ListaCompraRequest {
  items: ListaCompraItemRequest[];
  /** null o ausente = todas las cadenas. */
  cadenasIds: number[] | null;
}

export interface RecomendacionItem {
  productoId: number;
  producto: string;
  cantidad: number;
  cadenaId: number;
  cadena: string;
  nombrePublicado: string;
  /** SKU en la cadena elegida (alimenta el deep link de carrito). */
  codigoExterno: string;
  /** Página del producto en el sitio de la cadena, si está capturada. */
  url: string | null;
  precioUnitario: number;
  tipoOferta: string | null;
  fechaPrecio: string;
  /** Precio normalizado por unidad base ($/L, $/kg, $/un); null sin contenido cargado. */
  precioPorUnidad: number | null;
  unidadBase: string | null;
  subtotal: number;
  cadenasComparadas: number;
}

export interface ProductoNoDisponible {
  productoId: number;
  producto: string;
}

export interface MejorCadenaUnica {
  cadenaId: number;
  cadena: string;
  total: number;
}

export interface RecomendacionTotales {
  totalOptimizado: number;
  cadenasInvolucradas: number;
  mejorCadenaUnica: MejorCadenaUnica | null;
  ahorro: number | null;
}

/** Un click que arma el carrito real de la cadena con lo que va ahí (solo VTEX). */
export interface CarritoCadena {
  cadenaId: number;
  cadena: string;
  url: string;
}

export interface ListaCompraResumen {
  items: RecomendacionItem[];
  noDisponibles: ProductoNoDisponible[];
  totales: RecomendacionTotales;
  carritos: CarritoCadena[];
}
