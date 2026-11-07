import * as fs from 'fs';
import * as path from 'path';
import { BaseDeDatosCorrupta } from '../dominio/errores';
import { RegistroDeSolicitud, Solicitud } from '../dominio/solicitud';
import { RepositorioEnMemoriaDeSolicitudes } from './repositorio-en-memoria';

/** Persiste las solicitudes en un archivo JSON. El formato es el mismo que el de la v1. */
export class RepositorioJsonDeSolicitudes extends RepositorioEnMemoriaDeSolicitudes {
  constructor(private readonly ruta: string) {
    super();
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

  protected override alGuardar(): void {
    fs.mkdirSync(path.dirname(this.ruta), { recursive: true });
    const datos = {
      solicitudes: this.solicitudes.map((s) => s.aRegistro()),
      contador: this.contador,
    };
    fs.writeFileSync(this.ruta, JSON.stringify(datos, null, 2));
  }
}
