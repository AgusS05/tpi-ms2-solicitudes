/** Prioridad de atención de una solicitud. */
export const Prioridad = {
  ALTA: 'ALTA',
  MEDIA: 'MEDIA',
  BAJA: 'BAJA',
} as const;

export type Prioridad = (typeof Prioridad)[keyof typeof Prioridad];

/** Todas las prioridades, de mayor a menor. */
export const PRIORIDADES: readonly Prioridad[] = Object.values(Prioridad);

export function esPrioridad(valor: unknown): valor is Prioridad {
  return PRIORIDADES.includes(valor as Prioridad);
}
