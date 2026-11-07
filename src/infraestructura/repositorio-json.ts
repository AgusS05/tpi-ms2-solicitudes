import * as fs from 'fs';
import * as path from 'path';
import { RepositorioDeSolicitudes } from '../aplicacion/puertos';
import { BaseDeDatosCorrupta } from '../dominio/errores';
import { RegistroDeSolicitud, Solicitud } from '../dominio/solicitud';

/** Persiste las solicitudes en un archivo JSON. El formato es el mismo que el de la v1. */
export class RepositorioJsonDeSolicitudes implements RepositorioDeSolicitudes {
  private solicitudes: Solicitud[] = [];
  private contador = 0;

  constructor(private readonly ruta: string) {
    if (!fs.existsSync(ruta)) return; // primer uso: todavía no hay datos
    try {
      const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
      this.solicitudes = datos.solicitudes.map((r: RegistroDeSolicitud) =>
        Solicitud.desdeRegistro(r),
      );
      this.contador = datos.contador;
    } catch {
      throw new BaseDeDatosCorrupta(ruta);
    }
  }

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
    fs.mkdirSync(path.dirname(this.ruta), { recursive: true });
    fs.writeFileSync(
      this.ruta,
      JSON.stringify(
        { solicitudes: this.solicitudes.map((s) => s.aRegistro()), contador: this.contador },
        null,
        2,
      ),
    );
  }
}
