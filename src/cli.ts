import { pathToFileURL } from 'url';
import { ServicioDeReportes } from './aplicacion/servicio-reportes';
import { ServicioDeSolicitudes } from './aplicacion/servicio-solicitudes';
import { RelojDelSistema } from './infraestructura/reloj-del-sistema';
import { RepositorioJsonDeSolicitudes } from './infraestructura/repositorio-json';
import { ejecutarComando } from './presentacion/comandos';

/**
 * Raíz de composición: único lugar que conoce las implementaciones concretas y las conecta.
 * Todo lo demás depende de abstracciones (puertos).
 */
export function main(args: string[]): void {
  const rutaDeDatos = process.env.SOLICITUDES_DB || './data/solicitudes.json';
  const reloj = new RelojDelSistema();

  const codigoDeSalida = ejecutarComando(args, () => {
    const repositorio = new RepositorioJsonDeSolicitudes(rutaDeDatos);
    return {
      solicitudes: new ServicioDeSolicitudes(repositorio, reloj),
      reportes: new ServicioDeReportes(repositorio, reloj),
    };
  });
  if (codigoDeSalida !== 0) process.exitCode = codigoDeSalida;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
