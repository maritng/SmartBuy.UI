import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../../../core/config/api.config';
import { StandarResponse } from '../../../core/api/standar-response.model';
import { PublicacionPendiente, ResolverMatchingRequest } from '../models/matching.models';

@Injectable({ providedIn: 'root' })
export class MatchingService {
  private readonly http = inject(HttpClient);

  getPendientes(cadenaId: number | null, limit: number, offset: number): Observable<StandarResponse<PublicacionPendiente[]>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);

    if (cadenaId !== null) {
      params = params.set('cadenaId', cadenaId);
    }

    return this.http.get<StandarResponse<PublicacionPendiente[]>>(`${API_BASE}/Publicacion/GetPendientes`, { params });
  }

  resolver(request: ResolverMatchingRequest): Observable<StandarResponse<{ id: number }>> {
    return this.http.post<StandarResponse<{ id: number }>>(`${API_BASE}/Publicacion/ResolverMatching`, request);
  }
}
