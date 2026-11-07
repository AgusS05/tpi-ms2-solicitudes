import { pathToFileURL } from 'url';
import { ErrorDeDominio } from './dominio/errores';
import { ServicioDeReportes } from './aplicacion/servicio-reportes';
import { GestorSolicitudes } from './gestor';
import { RelojDelSistema } from './infraestructura/reloj-del-sistema';
import { RepositorioJsonDeSolicitudes } from './infraestructura/repositorio-json';
import { lineasDeReporte } from './presentacion/formato';

/**
 * Punto de entrada del CLI. Es el borde del sistema: acá (y solo acá) se traducen los errores
 * de dominio a un mensaje por consola y a un código de salida.
 */
export function main(args: string[]): void {
  try {
    ejecutarComando(args);
  } catch (error) {
    if (!(error instanceof ErrorDeDominio)) throw error;
    console.log('ERROR: ' + error.message);
    process.exitCode = 1;
  }
}

function ejecutarComando(args: string[]): void {
  const cmd = args[0];
  // Raíz de composición: acá se eligen las implementaciones concretas (único lugar que las conoce).
  const rutaDeDatos = process.env.SOLICITUDES_DB || './data/solicitudes.json';
  const repositorio = new RepositorioJsonDeSolicitudes(rutaDeDatos);
  const reloj = new RelojDelSistema();
  const g = new GestorSolicitudes(repositorio, reloj);

  function o(n: string): string | undefined {
    const i = args.indexOf('--' + n);
    if (i >= 0) return args[i + 1];
    return undefined;
  }

  if (cmd == 'registrar') {
    const dias = o('dias') ? Number(o('dias')) : undefined;
    g.registrarSolicitud({
      legajo: o('legajo') as string,
      nombre: o('nombre') as string,
      email: o('email') as string,
      tipo: o('tipo') as string,
      descripcion: o('descripcion') as string,
      prioridad: o('prioridad'),
      dias: dias,
      responsable: o('responsable'),
    });
  } else if (cmd == 'estado') {
    g.cambiarEstado(args[1], args[2]);
  } else if (cmd == 'asignar') {
    g.asignarResponsable(args[1], args[2]);
  } else if (cmd == 'buscar') {
    g.buscar({
      estado: o('estado'),
      tipo: o('tipo'),
      prioridad: o('prioridad'),
      legajo: o('legajo'),
    });
  } else if (cmd == 'ver') {
    g.mostrar(args[1]);
  } else if (cmd == 'reporte') {
    const reporte = new ServicioDeReportes(repositorio, reloj).generar();
    lineasDeReporte(reporte).forEach((linea) => console.log(linea));
  } else {
    console.log('Uso: pnpm start <comando> [opciones]');
    console.log(
      '  registrar --legajo L --nombre N --email E --tipo T --descripcion D [--prioridad P] [--dias N] [--responsable R]',
    );
    console.log('  estado <id> <nuevoEstado>');
    console.log('  asignar <id> <responsable>');
    console.log('  buscar [--estado E] [--tipo T] [--prioridad P] [--legajo L]');
    console.log('  ver <id>');
    console.log('  reporte');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
