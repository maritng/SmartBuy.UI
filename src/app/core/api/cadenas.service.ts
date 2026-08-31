import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../config/api.config';
import { Cadena } from './cadena.model';
import { StandarResponse } from './standar-response.model';

/**
 * Cadenas de supermercados. Vive en core (y no en una feature) porque la usan
 * varias: los chips de "mis cadenas" de la lista, el filtro de la cola de
 * matching y el inicio.
 */
@Injectable({ providedIn: 'root' })
export class CadenasService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<StandarResponse<Cadena[]>> {
    return this.http.get<StandarResponse<Cadena[]>>(`${API_BASE}/Cadena/GetAllCadenas`);
  }
}
