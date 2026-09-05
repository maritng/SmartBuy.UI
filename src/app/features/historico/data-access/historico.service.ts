import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { StandarResponse } from '../../../core/api/standar-response.model';
import { HistoricoResumen } from '../models/historico.models';

@Injectable({ providedIn: 'root' })
export class HistoricoService {
  private readonly http = inject(HttpClient);

  getHistorico(productoId: number, dias: number, conPromos: boolean): Observable<StandarResponse<HistoricoResumen>> {
    const params = new HttpParams().set('productoId', productoId).set('dias', dias).set('conPromos', conPromos);

    return this.http.get<StandarResponse<HistoricoResumen>>(`${API_BASE}/Producto/GetHistorico`, { params });
  }
}
