import { RepositorioDeSolicitudes } from '../aplicacion/puertos';
import { Solicitud } from '../dominio/solicitud';

/**
 * Implementación en memoria del puerto: sirve para pruebas rápidas y para demostrar que el
 * núcleo no depende de `fs` (LSP: es intercambiable con el repositorio JSON).
 * Es además la base del repositorio JSON, que solo agrega cargar y volcar a disco
 * (Template Method: `alGuardar` es el punto de extensión).
 */
export class RepositorioEnMemoriaDeSolicitudes implements RepositorioDeSolicitudes {
  protected solicitudes: Solicitud[] = [];
  protected contador = 0;

  todas(): readonly Solicitud[] {
    return this.solicitudes;
  }

  buscarPorId(id: string): Solicitud | undefined {
    return this.solicitudes.find((s) => s.id === id);
  }

  siguienteNumero(): number {
    this.contador++;
    return this.contador;
  }

  guardar(solicitud: Solicitud): void {
    if (!this.solicitudes.includes(solicitud)) this.solicitudes.push(solicitud);
    this.alGuardar();
  }

  /** Gancho para las subclases que necesitan persistir después de cada cambio. */
  protected alGuardar(): void {}
}
