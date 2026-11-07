/** Estados del circuito de una solicitud. */
export const Estado = {
  PENDIENTE: 'PENDIENTE',
  EN_REVISION: 'EN_REVISION',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  CERRADA: 'CERRADA',
} as const;

export type Estado = (typeof Estado)[keyof typeof Estado];

/** Todos los estados, en el orden en que se muestran en los reportes. */
export const ESTADOS: readonly Estado[] = Object.values(Estado);

export function esEstado(valor: unknown): valor is Estado {
  return ESTADOS.includes(valor as Estado);
}
