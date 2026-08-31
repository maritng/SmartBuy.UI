import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../config/api.config';
import { ProductoListado } from './producto.model';
import { StandarResponse } from './standar-response.model';

/**
 * Productos del catálogo maestro. En core porque lo usan varias features:
 * el buscador de la lista de compras, el ABM del catálogo y el modal de
 * matching de la cola de pendientes.
 */
@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);

  getAll(filtro: string | null, limit: number, offset: number): Observable<StandarResponse<ProductoListado[]>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);

    if (filtro) {
      params = params.set('filtro', filtro);
    }

    return this.http.get<StandarResponse<ProductoListado[]>>(`${API_BASE}/Producto/GetAllProductos`, { params });
  }
}
