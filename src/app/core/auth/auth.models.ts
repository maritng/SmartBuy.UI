/** Espejos del contrato de /api/Auth del backend. */

export interface UsuarioSesion {
  id: number;
  email: string;
  nombre: string;
}

export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

export interface RegistrarRequest {
  email: string;
  nombre: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
