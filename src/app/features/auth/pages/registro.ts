import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-registro',
  imports: [RouterLink],
  templateUrl: './registro.html',
  styleUrl: './login.scss'
})
export class Registro {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly nombre = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly enviando = signal(false);
  protected readonly errores = signal<string[]>([]);

  protected crearCuenta(): void {
    this.errores.set([]);
    this.enviando.set(true);

    this.authService
      .registrar({ nombre: this.nombre().trim(), email: this.email().trim(), password: this.password() })
      .subscribe({
        next: (respuesta) => {
          this.enviando.set(false);
          if (respuesta.success && respuesta.result) {
            // El registro ya devuelve sesión: entra directo, sin doble login.
            this.authStore.iniciarSesion(respuesta.result);
            this.router.navigateByUrl('/lista');
          } else {
            this.errores.set(respuesta.errors.length ? respuesta.errors : ['No se pudo crear la cuenta.']);
          }
        },
        error: (error) => {
          this.enviando.set(false);
          const mensajes = error?.error?.errors as string[] | undefined;
          this.errores.set(mensajes?.length ? mensajes : ['No se pudo crear la cuenta. ¿Está levantado el backend?']);
        }
      });
  }
}
