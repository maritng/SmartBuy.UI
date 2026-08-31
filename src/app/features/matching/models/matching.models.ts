/** Espejos de los DTOs de la cola de matching del backend. */

export interface PublicacionPendiente {
  id: number;
  cadenaId: number;
  cadena: string;
  codigoExterno: string;
  nombrePublicado: string;
  eanPublicado: string | null;
  url: string | null;
  fechaCreacion: string;
  ultimoPrecioLista: number | null;
  ultimoPrecioOferta: number | null;
  ultimaFechaPrecio: string | null;
  /** Total de pendientes del filtro (sin paginar). */
  total: number;
}

export interface ResolverMatchingRequest {
  publicacionId: number;
  productoId: number | null;
  descartar: boolean;
}
