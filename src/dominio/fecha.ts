import { MS_POR_DIA } from './reglas-de-negocio';

/** Fecha calendario en formato AAAA-MM-DD (así se guarda en el archivo de datos). */
export type FechaISO = string;

export function aFechaISO(fecha: Date): FechaISO {
  return fecha.toISOString().slice(0, 10);
}

export function sumarDias(desde: Date, dias: number): Date {
  return new Date(desde.getTime() + dias * MS_POR_DIA);
}

/** Días de calendario entre dos fechas (positivo si `hasta` es posterior a `desde`). */
export function diferenciaEnDias(desde: FechaISO, hasta: FechaISO): number {
  const ms = new Date(hasta + 'T00:00:00Z').getTime() - new Date(desde + 'T00:00:00Z').getTime();
  return Math.round(ms / MS_POR_DIA);
}
