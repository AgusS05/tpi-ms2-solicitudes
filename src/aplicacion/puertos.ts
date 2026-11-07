import { Solicitud } from '../dominio/solicitud';

/**
 * Puertos (DIP): la lógica de negocio depende de estas interfaces, no de `fs` ni de `Date`.
 * Las implementaciones concretas viven en `infraestructura/` y se inyectan desde el borde.
 */

/** Solo lectura: lo que necesitan las consultas y los reportes (ISP). */
export interface LectorDeSolicitudes {
  todas(): readonly Solicitud[];
  buscarPorId(id: string): Solicitud | undefined;
}

/** Escritura: lo que necesitan los casos de uso que modifican datos (ISP). */
export interface EscritorDeSolicitudes {
  /** Reserva y devuelve el siguiente número correlativo (1, 2, 3, ...). */
  siguienteNumero(): number;
  /** Persiste una solicitud nueva o los cambios de una existente. */
  guardar(solicitud: Solicitud): void;
}

export interface RepositorioDeSolicitudes extends LectorDeSolicitudes, EscritorDeSolicitudes {}

export interface Reloj {
  ahora(): Date;
}
