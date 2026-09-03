import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { StandarResponse } from '../../../core/api/standar-response.model';
import { EvolucionCategorias } from '../models/tendencias.models';

@Injectable({ providedIn: 'root' })
export class TendenciasService {
  private readonly http = inject(HttpClient);

  getEvolucion(dias: number): Observable<StandarResponse<EvolucionCategorias>> {
    const params = new HttpParams().set('dias', dias);

    return this.http.get<StandarResponse<EvolucionCategorias>>(`${API_BASE}/Tendencia/GetEvolucionCategorias`, { params });
  }
}
