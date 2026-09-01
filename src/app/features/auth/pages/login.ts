import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { ListasApiService } from '../../lista/data-access/listas-api.service';
import { ListaStore } from '../../lista/state/lista.store';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly listasApi = inject(ListasApiService);
  private readonly listaStore = inject(ListaStore);
  private readonly router = inject(Router);

  /** A dónde volver tras loguear (lo setea el guard vía query param). */
  readonly volverA = input<string | undefined>();

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly enviando = signal(false);
  protected readonly errores = signal<string[]>([]);

  protected ingresar(): void {
    this.errores.set([]);
    this.enviando.set(true);

    this.authService.login({ email: this.email().trim(), password: this.password() }).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        if (respuesta.success && respuesta.result) {
          this.authStore.iniciarSesion(respuesta.result);
          this.sincronizarCadenas();
          this.router.navigateByUrl(this.volverA() ?? '/lista');
        } else {
          this.errores.set(respuesta.errors.length ? respuesta.errors : ['No se pudo iniciar sesión.']);
        }
      },
      error: (error) => {
        this.enviando.set(false);
        const mensajes = error?.error?.errors as string[] | undefined;
        this.errores.set(mensajes?.length ? mensajes : ['No se pudo iniciar sesión. ¿Está levantado el backend?']);
      }
    });
  }

  /** La preferencia "mis cadenas" del servidor pisa los chips locales. */
  private sincronizarCadenas(): void {
    this.listasApi.getMisCadenas().subscribe({
      next: (respuesta) => {
        if (respuesta.success) {
          const cadenas = respuesta.result ?? [];
          this.listaStore.cadenasIds.set(cadenas.length > 0 ? cadenas : null);
        }
      },
      error: () => {
        // Sin drama: quedan los chips locales.
      }
    });
  }
}
