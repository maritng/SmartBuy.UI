import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CapturasService } from '../data-access/capturas.service';
import { CapturaListado } from '../models/capturas.models';

type Estado = 'cargando' | 'ok' | 'error';

const LIMITE = 50;

/**
 * Panel de capturas: la bitácora de los bots. Muestra las últimas corridas
 * con su estado, cuántos ítems trajeron y cuánto tardaron, sin abrir SQL.
 * Solo lectura: los bots se disparan solos (o desde Swagger con la API key).
 */
@Component({
  selector: 'app-panel-capturas',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './panel-capturas.html',
  styleUrl: './panel-capturas.scss'
})
export class PanelCapturas {
  private readonly capturasService = inject(CapturasService);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly filas = signal<CapturaListado[]>([]);
  protected readonly errores = signal<string[]>([]);

  /** Fila con el detalle de error desplegado (null = ninguno). */
  protected readonly detalleAbierto = signal<number | null>(null);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');
    this.detalleAbierto.set(null);

    this.capturasService.getCapturas(LIMITE).subscribe({
      next: (respuesta) => {
        if (respuesta.success && respuesta.result) {
          this.filas.set(respuesta.result);
          this.estado.set('ok');
        } else {
          this.errores.set(respuesta.errors.length ? respuesta.errors : ['La API respondió sin resultado.']);
          this.estado.set('error');
        }
      },
      error: () => {
        this.errores.set(['No se pudo conectar con la API.']);
        this.estado.set('error');
      }
    });
  }

  protected alternarDetalle(id: number): void {
    this.detalleAbierto.set(this.detalleAbierto() === id ? null : id);
  }

  protected duracion(fila: CapturaListado): string | null {
    if (fila.duracionSegundos === null) {
      return null;
    }

    const minutos = Math.floor(fila.duracionSegundos / 60);
    const segundos = fila.duracionSegundos % 60;

    return minutos > 0 ? `${minutos} min ${segundos} s` : `${segundos} s`;
  }
}
