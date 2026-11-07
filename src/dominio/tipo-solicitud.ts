/** Tipos de trámite que se pueden solicitar. */
export const TipoSolicitud = {
  CERTIFICADO: 'CERTIFICADO',
  EQUIVALENCIA: 'EQUIVALENCIA',
  CAMBIO_COMISION: 'CAMBIO_COMISION',
  REINCORPORACION: 'REINCORPORACION',
  BAJA: 'BAJA',
} as const;

export type TipoSolicitud = (typeof TipoSolicitud)[keyof typeof TipoSolicitud];

/** Todos los tipos, en el orden en que se muestran en los reportes. */
export const TIPOS: readonly TipoSolicitud[] = Object.values(TipoSolicitud);

export function esTipo(valor: unknown): valor is TipoSolicitud {
  return TIPOS.includes(valor as TipoSolicitud);
}
