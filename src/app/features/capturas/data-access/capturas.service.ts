import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { StandarResponse } from '../../../core/api/standar-response.model';
import { CapturaListado } from '../models/capturas.models';

@Injectable({ providedIn: 'root' })
export class CapturasService {
  private readonly http = inject(HttpClient);

  getCapturas(limite: number): Observable<StandarResponse<CapturaListado[]>> {
    const params = new HttpParams().set('limite', limite);

    return this.http.get<StandarResponse<CapturaListado[]>>(`${API_BASE}/Captura/GetCapturas`, { params });
  }
}
