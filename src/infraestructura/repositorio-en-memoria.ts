import { RepositorioDeSolicitudes } from '../aplicacion/puertos';
import { Solicitud } from '../dominio/solicitud';

/**
 * Implementación en memoria del puerto: sirve para pruebas rápidas y para demostrar que el
 * núcleo no depende de `fs` (LSP: es intercambiable con el repositorio JSON).
 */
export class RepositorioEnMemoriaDeSolicitudes implements RepositorioDeSolicitudes {
  private readonly solicitudes: Solicitud[] = [];
  private contador = 0;

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
  }
}
