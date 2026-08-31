import { Component, inject, signal } from '@angular/core';
import { Cadena } from '../../../core/api/cadena.model';
import { CadenasService } from '../../../core/api/cadenas.service';

type Estado = 'cargando' | 'ok' | 'error';

/**
 * Inicio: presenta la app y muestra las cadenas monitoreadas en vivo.
 * Además de bienvenida, funciona como smoke test visual de la conexión
 * FE -> proxy -> API -> Postgres.
 */
@Component({
  selector: 'app-inicio',
  imports: [],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss'
})
export class Inicio {
  private readonly cadenasService = inject(CadenasService);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly cadenas = signal<Cadena[]>([]);
  protected readonly errores = signal<string[]>([]);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');

    this.cadenasService.getAll().subscribe({
      next: (respuesta) => {
        if (respuesta.success && respuesta.result) {
          this.cadenas.set(respuesta.result);
          this.estado.set('ok');
        } else {
          this.errores.set(respuesta.errors.length ? respuesta.errors : ['La API respondió sin resultado.']);
          this.estado.set('error');
        }
      },
      error: () => {
        this.errores.set(['No se pudo conectar con la API. ¿Está levantado el backend en el puerto 5080?']);
        this.estado.set('error');
      }
    });
  }
}
