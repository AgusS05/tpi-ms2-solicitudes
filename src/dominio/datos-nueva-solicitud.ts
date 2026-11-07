import { Email } from './email';
import { ErrorDeValidacion } from './errores';
import { Estudiante } from './estudiante';
import { Prioridad, esPrioridad } from './prioridad';
import {
  LARGO_MINIMO_DESCRIPCION,
  PLAZO_MAXIMO_DIAS,
  PLAZO_MINIMO_DIAS,
} from './reglas-de-negocio';
import { TipoSolicitud, esTipo } from './tipo-solicitud';

/**
 * Parameter Object: agrupa los datos que ingresan para registrar una solicitud.
 * Reemplaza a los 8 parámetros sueltos de `registrarSolicitud`.
 */
export interface DatosNuevaSolicitud {
  legajo: string;
  nombre: string;
  email: string;
  tipo: string;
  descripcion: string;
  prioridad?: string;
  dias?: number;
  responsable?: string;
}

/** Los mismos datos, ya validados y con sus tipos de dominio. */
export interface SolicitudValidada {
  estudiante: Estudiante;
  tipo: TipoSolicitud;
  descripcion: string;
  prioridad?: Prioridad;
  plazoDias?: number;
  responsable?: string;
}

function exigirTexto(valor: string, campo: string): void {
  if (!valor || valor.trim() === '') throw new ErrorDeValidacion(`el ${campo} es obligatorio`);
}

function exigirDescripcion(descripcion: string): void {
  if (!descripcion || descripcion.trim().length < LARGO_MINIMO_DESCRIPCION) {
    throw new ErrorDeValidacion(
      `la descripción debe tener al menos ${LARGO_MINIMO_DESCRIPCION} caracteres`,
    );
  }
}

function parsearPrioridad(prioridad: string | undefined): Prioridad | undefined {
  if (!prioridad) return undefined;
  if (!esPrioridad(prioridad)) throw new ErrorDeValidacion('prioridad inválida: ' + prioridad);
  return prioridad;
}

function exigirPlazoValido(dias: number | undefined): void {
  if (dias === undefined) return;
  if (isNaN(dias) || dias < PLAZO_MINIMO_DIAS || dias > PLAZO_MAXIMO_DIAS) {
    throw new ErrorDeValidacion(
      `plazo inválido (${PLAZO_MINIMO_DIAS} a ${PLAZO_MAXIMO_DIAS} días)`,
    );
  }
}

/**
 * "Parsear en vez de validar": devuelve los datos tipados o lanza ErrorDeValidacion con el
 * primer problema encontrado (el orden de las comprobaciones es parte del comportamiento).
 */
export function validarDatosNuevaSolicitud(datos: DatosNuevaSolicitud): SolicitudValidada {
  const { legajo, nombre, email, tipo, descripcion, prioridad, dias } = datos;
  exigirTexto(legajo, 'legajo');
  exigirTexto(nombre, 'nombre');
  const emailValido = Email.crear(email);
  if (!esTipo(tipo)) throw new ErrorDeValidacion('tipo de solicitud inválido: ' + tipo);
  exigirDescripcion(descripcion);
  const prioridadValida = parsearPrioridad(prioridad);
  exigirPlazoValido(dias);
  return {
    estudiante: new Estudiante(legajo, nombre, emailValido),
    tipo,
    descripcion: descripcion.trim(),
    prioridad: prioridadValida,
    plazoDias: dias,
    responsable: datos.responsable || undefined,
  };
}
