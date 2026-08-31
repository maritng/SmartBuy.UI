import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { StandarResponse } from '../../../core/api/standar-response.model';
import {
  CategoriaNodo,
  GeneracionPendientesResumen,
  GuardarProductoRequest,
  IdDto,
  Marca,
  ProductoDetalle
} from '../models/catalogo.models';

/**
 * ABM del catálogo maestro. El listado paginado usa ProductosService (core,
 * compartido con el buscador de la lista); acá vive todo lo demás.
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);

  getProductoById(id: number): Observable<StandarResponse<ProductoDetalle>> {
    return this.http.get<StandarResponse<ProductoDetalle>>(`${API_BASE}/Producto/GetProductoById`, {
      params: new HttpParams().set('id', id)
    });
  }

  crearProducto(request: GuardarProductoRequest): Observable<StandarResponse<IdDto>> {
    return this.http.post<StandarResponse<IdDto>>(`${API_BASE}/Producto/CrearProducto`, request);
  }

  actualizarProducto(request: GuardarProductoRequest): Observable<StandarResponse<IdDto>> {
    return this.http.put<StandarResponse<IdDto>>(`${API_BASE}/Producto/ActualizarProducto`, request);
  }

  eliminarProducto(id: number): Observable<StandarResponse<IdDto>> {
    return this.http.delete<StandarResponse<IdDto>>(`${API_BASE}/Producto/EliminarProducto`, {
      params: new HttpParams().set('id', id)
    });
  }

  getAllMarcas(): Observable<StandarResponse<Marca[]>> {
    return this.http.get<StandarResponse<Marca[]>>(`${API_BASE}/Producto/GetAllMarcas`);
  }

  crearMarca(nombre: string): Observable<StandarResponse<IdDto>> {
    return this.http.post<StandarResponse<IdDto>>(`${API_BASE}/Producto/CrearMarca`, { nombre });
  }

  getAllCategorias(): Observable<StandarResponse<CategoriaNodo[]>> {
    return this.http.get<StandarResponse<CategoriaNodo[]>>(`${API_BASE}/Producto/GetAllCategorias`);
  }

  generarDesdePendientes(minCadenas: number): Observable<StandarResponse<GeneracionPendientesResumen>> {
    return this.http.post<StandarResponse<GeneracionPendientesResumen>>(
      `${API_BASE}/Producto/GenerarDesdePendientes`,
      null,
      { params: new HttpParams().set('minCadenas', minCadenas) }
    );
  }
}
