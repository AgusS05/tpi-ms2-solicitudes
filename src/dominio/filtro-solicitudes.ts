import { ErrorDeValidacion } from './errores';
import { Estado, esEstado } from './estado';
import { Prioridad, esPrioridad } from './prioridad';
import { Solicitud } from './solicitud';
import { TipoSolicitud, esTipo } from './tipo-solicitud';

/** Criterios tal como llegan desde afuera (sin validar). Todos son opcionales. */
export interface CriteriosDeBusqueda {
  estado?: string;
  tipo?: string;
  prioridad?: string;
  legajo?: string;
}

/** Un criterio vacío se ignora; uno con valor debe pertenecer al conjunto válido. */
function parsearOpcional<T extends string>(
  valor: string | undefined,
  esValido: (v: string) => v is T,
  prefijoDeError: string,
): T | undefined {
  if (!valor) return undefined;
  if (!esValido(valor)) throw new ErrorDeValidacion(prefijoDeError + valor);
  return valor;
}

/**
 * Parameter Object + Specification: reemplaza los cuatro parámetros sueltos y los cuatro
 * bloques de filtro casi idénticos de la versión inicial. Los criterios se combinan con AND.
 */
export class FiltroSolicitudes {
  private constructor(
    private readonly estado?: Estado,
    private readonly tipo?: TipoSolicitud,
    private readonly prioridad?: Prioridad,
    private readonly legajo?: string,
  ) {}

  /** Valida en el orden estado, tipo, prioridad. Un criterio vacío se ignora. */
  static desde(criterios: CriteriosDeBusqueda): FiltroSolicitudes {
    const estado = parsearOpcional(criterios.estado, esEstado, 'estado inválido: ');
    const tipo = parsearOpcional(criterios.tipo, esTipo, 'tipo de solicitud inválido: ');
    const prioridad = parsearOpcional(criterios.prioridad, esPrioridad, 'prioridad inválida: ');
    return new FiltroSolicitudes(estado, tipo, prioridad, criterios.legajo || undefined);
  }

  coincide(solicitud: Solicitud): boolean {
    return (
      (!this.estado || solicitud.estado === this.estado) &&
      (!this.tipo || solicitud.tipo === this.tipo) &&
      (!this.prioridad || solicitud.prioridad === this.prioridad) &&
      (!this.legajo || solicitud.estudiante.legajo === this.legajo)
    );
  }
}
