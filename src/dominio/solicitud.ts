import { Email } from './email';
import { Estado } from './estado';
import { Estudiante } from './estudiante';
import { Prioridad } from './prioridad';
import { TipoSolicitud } from './tipo-solicitud';

export interface CambioDeEstado {
  fecha: string;
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
  fechaCreacion: string;
  fechaLimite: string;
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
  fechaCreacion: string;
  fechaLimite: string;
  historial: CambioDeEstado[];
}

/** Entidad Solicitud: reemplaza a los objetos `any` sueltos de la versión inicial. */
export class Solicitud {
  id: string;
  estudiante: Estudiante;
  tipo: TipoSolicitud;
  descripcion: string;
  prioridad: Prioridad;
  estado: Estado;
  responsable: string;
  fechaCreacion: string;
  fechaLimite: string;
  historial: CambioDeEstado[];

  constructor(propiedades: PropiedadesDeSolicitud) {
    this.id = propiedades.id;
    this.estudiante = propiedades.estudiante;
    this.tipo = propiedades.tipo;
    this.descripcion = propiedades.descripcion;
    this.prioridad = propiedades.prioridad;
    this.estado = propiedades.estado;
    this.responsable = propiedades.responsable;
    this.fechaCreacion = propiedades.fechaCreacion;
    this.fechaLimite = propiedades.fechaLimite;
    this.historial = propiedades.historial;
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
      estado: this.estado,
      responsable: this.responsable,
      fechaCreacion: this.fechaCreacion,
      fechaLimite: this.fechaLimite,
      historial: this.historial,
    };
  }
}
