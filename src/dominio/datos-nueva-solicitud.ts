/**
 * Parameter Object: agrupa los datos que ingresan para registrar una solicitud.
 * Reemplaza a los 8 parámetros sueltos de `registrarSolicitud`.
 */
export interface DatosNuevaSolicitud {
  legajo: string;
  nombre: string;
  email: string;
  tipo: string;
  descripcion: string;
  prioridad?: string;
  dias?: number;
  responsable?: string;
}
