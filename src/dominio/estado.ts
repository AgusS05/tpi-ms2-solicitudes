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

/** Estados en los que una solicitud sigue en trámite. */
export const ESTADOS_ABIERTOS: readonly Estado[] = [Estado.PENDIENTE, Estado.EN_REVISION];

export function esEstado(valor: unknown): valor is Estado {
  return ESTADOS.includes(valor as Estado);
}

/**
 * Circuito de estados (OCP): para cambiar el circuito se edita esta tabla, no el código.
 * CERRADA es terminal.
 */
export const TRANSICIONES: Readonly<Record<Estado, readonly Estado[]>> = {
  PENDIENTE: [Estado.EN_REVISION, Estado.RECHAZADA],
  EN_REVISION: [Estado.APROBADA, Estado.RECHAZADA, Estado.PENDIENTE],
  APROBADA: [Estado.CERRADA],
  RECHAZADA: [Estado.CERRADA],
  CERRADA: [],
};

export function puedeTransicionar(desde: Estado, hacia: Estado): boolean {
  return TRANSICIONES[desde].includes(hacia);
}
