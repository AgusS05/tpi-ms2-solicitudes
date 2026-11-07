import { Prioridad } from './prioridad';
import { TipoSolicitud } from './tipo-solicitud';

/** Reglas de negocio que dependen del tipo de solicitud. */
export interface ReglaDeTipo {
  prioridadPorDefecto: Prioridad;
  plazoDias: number;
  areaResponsable: string;
}

/**
 * Tabla de reglas por tipo (OCP): para agregar un tipo nuevo se agrega UNA entrada aquí y su
 * nombre en `TipoSolicitud`. Al ser un `Record<TipoSolicitud, ...>`, el compilador exige que
 * todo tipo tenga su regla: ya no se puede olvidar un lugar.
 */
export const REGLAS_POR_TIPO: Readonly<Record<TipoSolicitud, ReglaDeTipo>> = {
  CERTIFICADO: { prioridadPorDefecto: Prioridad.MEDIA, plazoDias: 5, areaResponsable: 'Alumnado' },
  EQUIVALENCIA: {
    prioridadPorDefecto: Prioridad.BAJA,
    plazoDias: 15,
    areaResponsable: 'Secretaría Académica',
  },
  CAMBIO_COMISION: {
    prioridadPorDefecto: Prioridad.MEDIA,
    plazoDias: 7,
    areaResponsable: 'Alumnado',
  },
  REINCORPORACION: {
    prioridadPorDefecto: Prioridad.ALTA,
    plazoDias: 10,
    areaResponsable: 'Secretaría Académica',
  },
  BAJA: {
    prioridadPorDefecto: Prioridad.ALTA,
    plazoDias: 3,
    areaResponsable: 'Dirección de Carrera',
  },
};
