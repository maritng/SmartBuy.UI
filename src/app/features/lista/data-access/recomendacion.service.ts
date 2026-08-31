import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { StandarResponse } from '../../../core/api/standar-response.model';
import { ListaCompraRequest, ListaCompraResumen } from '../models/recomendacion.models';

@Injectable({ providedIn: 'root' })
export class RecomendacionService {
  private readonly http = inject(HttpClient);

  resolverLista(request: ListaCompraRequest): Observable<StandarResponse<ListaCompraResumen>> {
    return this.http.post<StandarResponse<ListaCompraResumen>>(`${API_BASE}/Recomendacion/ResolverLista`, request);
  }
}
