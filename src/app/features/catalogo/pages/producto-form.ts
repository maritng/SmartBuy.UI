import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogoService } from '../data-access/catalogo.service';
import { CategoriaNodo, Marca, UNIDADES_VALIDAS } from '../models/catalogo.models';

type Estado = 'cargando' | 'ok' | 'error';

/**
 * Alta y edición de producto. La misma página atiende /catalogo/nuevo y
 * /catalogo/:id (el id llega por input de ruta). Marcas con alta inline
 * (la API es idempotente: si existe, devuelve el id).
 */
@Component({
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.scss'
})
export class ProductoForm {
  private readonly fb = inject(FormBuilder);
  private readonly catalogoService = inject(CatalogoService);
  private readonly router = inject(Router);

  /** Id de ruta (withComponentInputBinding): undefined en el alta. */
  readonly id = input<string | undefined>();

  protected readonly esEdicion = computed(() => !!this.id());
  protected readonly estado = signal<Estado>('cargando');
  protected readonly errores = signal<string[]>([]);
  protected readonly guardando = signal(false);
  protected readonly inactivo = signal(false);

  protected readonly marcas = signal<Marca[]>([]);
  protected readonly categorias = signal<CategoriaNodo[]>([]);

  protected readonly unidades = UNIDADES_VALIDAS;

  protected readonly mostrarNuevaMarca = signal(false);
  protected readonly nombreNuevaMarca = signal('');
  protected readonly creandoMarca = signal(false);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    marcaId: [null as number | null],
    categoriaId: [null as number | null],
    contenidoValor: [null as number | null, [Validators.min(0.001)]],
    contenidoUnidad: [null as string | null],
    ean: ['', [Validators.pattern(/^\d{8,14}$/)]]
  });

  constructor() {
    this.cargarCombos();
  }

  private cargarCombos(): void {
    this.estado.set('cargando');

    this.catalogoService.getAllMarcas().subscribe({
      next: (marcas) => {
        this.marcas.set(marcas.result ?? []);

        this.catalogoService.getAllCategorias().subscribe({
          next: (categorias) => {
            this.categorias.set(categorias.result ?? []);
            this.esEdicion() ? this.cargarProducto() : this.estado.set('ok');
          },
          error: () => this.fallo('No se pudieron cargar las categorías.')
        });
      },
      error: () => this.fallo('No se pudieron cargar las marcas.')
    });
  }

  private cargarProducto(): void {
    this.catalogoService.getProductoById(Number(this.id())).subscribe({
      next: (respuesta) => {
        const producto = respuesta.result;
        if (!respuesta.success || !producto) {
          this.fallo(respuesta.errors.join(' ') || 'No se encontró el producto.');
          return;
        }

        this.inactivo.set(!producto.activo);
        this.form.patchValue({
          nombre: producto.nombre,
          marcaId: producto.marcaId,
          categoriaId: producto.categoriaId,
          contenidoValor: producto.contenidoValor,
          contenidoUnidad: producto.contenidoUnidad,
          ean: producto.ean ?? ''
        });
        this.estado.set('ok');
      },
      error: () => this.fallo('No se pudo cargar el producto.')
    });
  }

  protected guardar(): void {
    this.errores.set([]);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();

    // Contenido: valor y unidad van juntos o no van (misma regla que el backend,
    // validada acá para un mensaje inmediato).
    if ((valores.contenidoValor === null) !== !valores.contenidoUnidad) {
      this.errores.set(['Contenido: informá valor y unidad juntos, o ninguno.']);
      return;
    }

    const request = {
      id: this.esEdicion() ? Number(this.id()) : 0,
      nombre: valores.nombre!.trim(),
      marcaId: valores.marcaId,
      categoriaId: valores.categoriaId,
      contenidoValor: valores.contenidoValor,
      contenidoUnidad: valores.contenidoUnidad || null,
      ean: valores.ean?.trim() || null
    };

    this.guardando.set(true);

    const operacion = this.esEdicion()
      ? this.catalogoService.actualizarProducto(request)
      : this.catalogoService.crearProducto(request);

    operacion.subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        if (respuesta.success) {
          this.router.navigate(['/catalogo']);
        } else {
          this.errores.set(respuesta.errors);
        }
      },
      error: () => {
        this.guardando.set(false);
        this.errores.set(['No se pudo guardar. ¿Está levantado el backend?']);
      }
    });
  }

  protected crearMarca(): void {
    const nombre = this.nombreNuevaMarca().trim();
    if (!nombre) {
      return;
    }

    this.creandoMarca.set(true);

    this.catalogoService.crearMarca(nombre).subscribe({
      next: (respuesta) => {
        this.creandoMarca.set(false);
        if (respuesta.success && respuesta.result) {
          const id = respuesta.result.id;
          // Refresca el combo y deja la marca nueva seleccionada.
          this.catalogoService.getAllMarcas().subscribe((marcas) => {
            this.marcas.set(marcas.result ?? []);
            this.form.patchValue({ marcaId: id });
          });
          this.mostrarNuevaMarca.set(false);
          this.nombreNuevaMarca.set('');
        } else {
          this.errores.set(respuesta.errors);
        }
      },
      error: () => {
        this.creandoMarca.set(false);
        this.errores.set(['No se pudo crear la marca.']);
      }
    });
  }

  protected etiquetaCategoria(categoria: CategoriaNodo): string {
    return categoria.padre ? `${categoria.padre} › ${categoria.nombre}` : categoria.nombre;
  }

  private fallo(mensaje: string): void {
    this.errores.set([mensaje]);
    this.estado.set('error');
  }
}
