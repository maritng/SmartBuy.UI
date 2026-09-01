import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../config/api.config';
import { StandarResponse } from '../api/standar-response.model';
import { LoginRequest, RegistrarRequest, Sesion } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<StandarResponse<Sesion>> {
    return this.http.post<StandarResponse<Sesion>>(`${API_BASE}/Auth/Login`, request);
  }

  registrar(request: RegistrarRequest): Observable<StandarResponse<Sesion>> {
    return this.http.post<StandarResponse<Sesion>>(`${API_BASE}/Auth/Registrar`, request);
  }
}
