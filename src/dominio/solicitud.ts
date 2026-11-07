import { Email } from './email';
import { ErrorDeValidacion, ReasignacionNoPermitida, TransicionNoPermitida } from './errores';
import { ESTADOS_ABIERTOS, Estado, puedeTransicionar } from './estado';
import { Estudiante } from './estudiante';
import { FechaISO, diferenciaEnDias } from './fecha';
import { Prioridad } from './prioridad';
import { DIAS_AVISO_VENCIMIENTO } from './reglas-de-negocio';
import { TipoSolicitud } from './tipo-solicitud';

export interface CambioDeEstado {
  fecha: FechaISO;
  de: Estado | null;
  a: Estado;
}

export interface PropiedadesDeSolicitud {
  id: string;
  estudiante: Estudiante;
  tipo: TipoSolicitud;
  descripcion: string;
  prioridad: Prioridad;
  estado: Estado;
  responsable: string;
  fechaCreacion: FechaISO;
  fechaLimite: FechaISO;
  historial: CambioDeEstado[];
}

/** Forma en que se guarda una solicitud en el archivo de datos (no cambia respecto de la v1). */
export interface RegistroDeSolicitud {
  id: string;
  legajo: string;
  nombre: string;
  email: string;
  tipo: TipoSolicitud;
  descripcion: string;
  prioridad: Prioridad;
  estado: Estado;
  responsable: string;
  fechaCreacion: FechaISO;
  fechaLimite: FechaISO;
  historial: CambioDeEstado[];
}

/**
 * Entidad Solicitud. Conoce y protege sus propias reglas: el estado y el responsable solo
 * cambian a través de sus métodos (antes cualquiera podía modificar el objeto `any`).
 */
export class Solicitud {
  readonly id: string;
  readonly estudiante: Estudiante;
  readonly tipo: TipoSolicitud;
  readonly descripcion: string;
  readonly prioridad: Prioridad;
  readonly fechaCreacion: FechaISO;
  readonly fechaLimite: FechaISO;
  private estadoActual: Estado;
  private responsableActual: string;
  private readonly cambios: CambioDeEstado[];

  constructor(propiedades: PropiedadesDeSolicitud) {
    this.id = propiedades.id;
    this.estudiante = propiedades.estudiante;
    this.tipo = propiedades.tipo;
    this.descripcion = propiedades.descripcion;
    this.prioridad = propiedades.prioridad;
    this.fechaCreacion = propiedades.fechaCreacion;
    this.fechaLimite = propiedades.fechaLimite;
    this.estadoActual = propiedades.estado;
    this.responsableActual = propiedades.responsable;
    this.cambios = [...propiedades.historial];
  }

  get estado(): Estado {
    return this.estadoActual;
  }

  get responsable(): string {
    return this.responsableActual;
  }

  get historial(): readonly CambioDeEstado[] {
    return this.cambios;
  }

  /** Sigue en trámite (PENDIENTE o EN_REVISION). */
  estaAbierta(): boolean {
    return ESTADOS_ABIERTOS.includes(this.estadoActual);
  }

  /** Días que faltan para el vencimiento (negativo si ya venció). */
  diasParaVencer(hoy: FechaISO): number {
    return diferenciaEnDias(hoy, this.fechaLimite);
  }

  estaVencida(hoy: FechaISO): boolean {
    return this.estaAbierta() && this.diasParaVencer(hoy) < 0;
  }

  estaPorVencer(hoy: FechaISO, diasDeAviso: number = DIAS_AVISO_VENCIMIENTO): boolean {
    const dias = this.diasParaVencer(hoy);
    return this.estaAbierta() && dias >= 0 && dias <= diasDeAviso;
  }

  /** Aplica una transición del circuito de estados y la registra en el historial. */
  cambiarEstado(nuevo: Estado, hoy: FechaISO): CambioDeEstado {
    const anterior = this.estadoActual;
    if (!puedeTransicionar(anterior, nuevo)) throw new TransicionNoPermitida(anterior, nuevo);
    this.estadoActual = nuevo;
    const cambio: CambioDeEstado = { fecha: hoy, de: anterior, a: nuevo };
    this.cambios.push(cambio);
    return cambio;
  }

  /** Solo se puede reasignar mientras la solicitud sigue abierta. */
  reasignar(responsable: string | undefined): void {
    if (!responsable || responsable.trim() === '') {
      throw new ErrorDeValidacion('el responsable es obligatorio');
    }
    if (!this.estaAbierta()) throw new ReasignacionNoPermitida(this.estadoActual);
    this.responsableActual = responsable.trim();
  }

  static desdeRegistro(r: RegistroDeSolicitud): Solicitud {
    return new Solicitud({
      id: r.id,
      estudiante: new Estudiante(r.legajo, r.nombre, Email.crear(r.email)),
      tipo: r.tipo,
      descripcion: r.descripcion,
      prioridad: r.prioridad,
      estado: r.estado,
      responsable: r.responsable,
      fechaCreacion: r.fechaCreacion,
      fechaLimite: r.fechaLimite,
      historial: r.historial,
    });
  }

  aRegistro(): RegistroDeSolicitud {
    return {
      id: this.id,
      legajo: this.estudiante.legajo,
      nombre: this.estudiante.nombre,
      email: this.estudiante.email.valor,
      tipo: this.tipo,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      estado: this.estadoActual,
      responsable: this.responsableActual,
      fechaCreacion: this.fechaCreacion,
      fechaLimite: this.fechaLimite,
      historial: [...this.cambios],
    };
  }
}
