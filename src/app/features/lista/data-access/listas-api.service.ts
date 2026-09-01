import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { StandarResponse } from '../../../core/api/standar-response.model';

/** Espejos del contrato de /api/Lista y /api/Usuario del backend. */

export interface ListaResumen {
  id: number;
  nombre: string;
  cantItems: number;
  fecha: string;
}

export interface ListaDetalleItem {
  productoId: number;
  producto: string;
  cantidad: number;
}

export interface ListaDetalle {
  id: number;
  nombre: string;
  items: ListaDetalleItem[];
}

export interface GuardarListaItem {
  productoId: number;
  cantidad: number;
}

/** Endpoints protegidos: el interceptor agrega el Bearer solo. */
@Injectable({ providedIn: 'root' })
export class ListasApiService {
  private readonly http = inject(HttpClient);

  getMisListas(): Observable<StandarResponse<ListaResumen[]>> {
    return this.http.get<StandarResponse<ListaResumen[]>>(`${API_BASE}/Lista/GetMisListas`);
  }

  getLista(id: number): Observable<StandarResponse<ListaDetalle>> {
    return this.http.get<StandarResponse<ListaDetalle>>(`${API_BASE}/Lista/GetLista`, {
      params: new HttpParams().set('id', id)
    });
  }

  crearLista(nombre: string, items: GuardarListaItem[]): Observable<StandarResponse<{ id: number }>> {
    return this.http.post<StandarResponse<{ id: number }>>(`${API_BASE}/Lista/CrearLista`, { id: 0, nombre, items });
  }

  guardarLista(id: number, nombre: string, items: GuardarListaItem[]): Observable<StandarResponse<{ id: number }>> {
    return this.http.put<StandarResponse<{ id: number }>>(`${API_BASE}/Lista/GuardarLista`, { id, nombre, items });
  }

  eliminarLista(id: number): Observable<StandarResponse<{ id: number }>> {
    return this.http.delete<StandarResponse<{ id: number }>>(`${API_BASE}/Lista/EliminarLista`, {
      params: new HttpParams().set('id', id)
    });
  }

  getMisCadenas(): Observable<StandarResponse<number[]>> {
    return this.http.get<StandarResponse<number[]>>(`${API_BASE}/Usuario/GetMisCadenas`);
  }

  guardarMisCadenas(cadenasIds: number[]): Observable<StandarResponse<unknown>> {
    return this.http.put<StandarResponse<unknown>>(`${API_BASE}/Usuario/GuardarMisCadenas`, { cadenasIds });
  }
}
