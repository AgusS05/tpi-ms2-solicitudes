import { ServicioDeReportes } from '../aplicacion/servicio-reportes';
import { ServicioDeSolicitudes } from '../aplicacion/servicio-solicitudes';
import { DatosNuevaSolicitud } from '../dominio/datos-nueva-solicitud';
import { ErrorDeDominio } from '../dominio/errores';
import {
  LINEAS_DE_AYUDA,
  lineaDeAsignacion,
  lineaDeCambioDeEstado,
  lineaDeRegistro,
  lineasDeBusqueda,
  lineasDeDetalle,
  lineasDeReporte,
} from './formato';

export interface Servicios {
  solicitudes: ServicioDeSolicitudes;
  reportes: ServicioDeReportes;
}

/** Un comando recibe los argumentos y los servicios, y devuelve las líneas a mostrar. */
type Comando = (args: string[], servicios: Servicios) => string[];

/** Valor de una opción del tipo `--nombre valor`. */
function opcion(args: string[], nombre: string): string | undefined {
  const posicion = args.indexOf('--' + nombre);
  return posicion >= 0 ? args[posicion + 1] : undefined;
}

function datosDeRegistro(args: string[]): DatosNuevaSolicitud {
  const dias = opcion(args, 'dias');
  return {
    legajo: opcion(args, 'legajo') as string,
    nombre: opcion(args, 'nombre') as string,
    email: opcion(args, 'email') as string,
    tipo: opcion(args, 'tipo') as string,
    descripcion: opcion(args, 'descripcion') as string,
    prioridad: opcion(args, 'prioridad'),
    dias: dias ? Number(dias) : undefined,
    responsable: opcion(args, 'responsable'),
  };
}

/** Tabla de comandos (OCP): un comando nuevo es una entrada nueva, sin tocar el despacho. */
const COMANDOS: Readonly<Record<string, Comando>> = {
  registrar: (args, { solicitudes }) => [
    lineaDeRegistro(solicitudes.registrar(datosDeRegistro(args))),
  ],
  estado: (args, { solicitudes }) => [
    lineaDeCambioDeEstado(solicitudes.cambiarEstado(args[1], args[2])),
  ],
  asignar: (args, { solicitudes }) => [
    lineaDeAsignacion(solicitudes.asignarResponsable(args[1], args[2])),
  ],
  buscar: (args, { solicitudes }) =>
    lineasDeBusqueda(
      solicitudes.buscar({
        estado: opcion(args, 'estado'),
        tipo: opcion(args, 'tipo'),
        prioridad: opcion(args, 'prioridad'),
        legajo: opcion(args, 'legajo'),
      }),
    ),
  ver: (args, { solicitudes }) => lineasDeDetalle(solicitudes.obtener(args[1])),
  reporte: (_args, { reportes }) => lineasDeReporte(reportes.generar()),
};

/**
 * Ejecuta un comando e imprime su resultado. Es el borde del sistema: acá (y solo acá) se
 * traducen los errores de dominio a un mensaje y a un código de salida (0 = ok, 1 = error).
 */
export function ejecutarComando(args: string[], servicios: Servicios): number {
  const nombre = args[0];
  if (nombre === undefined || !Object.hasOwn(COMANDOS, nombre)) {
    LINEAS_DE_AYUDA.forEach((linea) => console.log(linea));
    return 1;
  }
  try {
    COMANDOS[nombre](args, servicios).forEach((linea) => console.log(linea));
    return 0;
  } catch (error) {
    if (!(error instanceof ErrorDeDominio)) throw error;
    console.log('ERROR: ' + error.message);
    return 1;
  }
}
