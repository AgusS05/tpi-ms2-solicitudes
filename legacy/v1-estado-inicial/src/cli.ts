import { pathToFileURL } from 'url';
import { GestorSolicitudes } from './gestor';

export function main(args: string[]): void {
  const cmd = args[0];
  const g = new GestorSolicitudes();

  function o(n: string): string | undefined {
    const i = args.indexOf('--' + n);
    if (i >= 0) return args[i + 1];
    return undefined;
  }

  if (cmd == 'registrar') {
    const dias = o('dias') ? Number(o('dias')) : undefined;
    const r = g.registrarSolicitud(
      o('legajo') as string,
      o('nombre') as string,
      o('email') as string,
      o('tipo') as string,
      o('descripcion') as string,
      o('prioridad') as string,
      dias as number,
      o('responsable') as string,
    );
    if (r === -1) process.exitCode = 1;
  } else if (cmd == 'estado') {
    if (!g.cambiarEstado(args[1], args[2])) process.exitCode = 1;
  } else if (cmd == 'asignar') {
    if (!g.asignarResponsable(args[1], args[2])) process.exitCode = 1;
  } else if (cmd == 'buscar') {
    const r = g.buscar(o('estado'), o('tipo'), o('prioridad'), o('legajo'));
    if (r === -1) process.exitCode = 1;
  } else if (cmd == 'ver') {
    if (!g.mostrar(args[1])) process.exitCode = 1;
  } else if (cmd == 'reporte') {
    g.generarReporte();
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
