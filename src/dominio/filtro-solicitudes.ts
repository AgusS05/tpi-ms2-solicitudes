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
    const { estado, tipo, prioridad, legajo } = criterios;
    if (estado && !esEstado(estado)) throw new ErrorDeValidacion('estado inválido: ' + estado);
    if (tipo && !esTipo(tipo)) throw new ErrorDeValidacion('tipo de solicitud inválido: ' + tipo);
    if (prioridad && !esPrioridad(prioridad)) {
      throw new ErrorDeValidacion('prioridad inválida: ' + prioridad);
    }
    return new FiltroSolicitudes(
      (estado || undefined) as Estado | undefined,
      (tipo || undefined) as TipoSolicitud | undefined,
      (prioridad || undefined) as Prioridad | undefined,
      legajo || undefined,
    );
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
