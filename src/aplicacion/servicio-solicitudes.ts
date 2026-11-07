import { DatosNuevaSolicitud, validarDatosNuevaSolicitud } from '../dominio/datos-nueva-solicitud';
import { ErrorDeValidacion, SolicitudDuplicada, SolicitudInexistente } from '../dominio/errores';
import { CambioDeEstado } from '../dominio/solicitud';
import { Estado, esEstado } from '../dominio/estado';
import { aFechaISO, sumarDias } from '../dominio/fecha';
import { CriteriosDeBusqueda, FiltroSolicitudes } from '../dominio/filtro-solicitudes';
import { resolverCondiciones } from '../dominio/reglas-por-tipo';
import { Solicitud, identificadorDe } from '../dominio/solicitud';
import { TipoSolicitud } from '../dominio/tipo-solicitud';
import { RepositorioDeSolicitudes, Reloj } from './puertos';

/** Resultado de un cambio de estado: a qué solicitud y de qué estado a qué estado. */
export interface CambioRealizado extends CambioDeEstado {
  id: string;
}

/**
 * Casos de uso sobre solicitudes. Coordina dominio y puertos: no imprime, no toca disco ni
 * lee el reloj directamente, y no conoce el formato de la salida. Los errores son excepciones.
 */
export class ServicioDeSolicitudes {
  constructor(
    private readonly repositorio: RepositorioDeSolicitudes,
    private readonly reloj: Reloj,
  ) {}

  registrar(datos: DatosNuevaSolicitud): Solicitud {
    const nueva = validarDatosNuevaSolicitud(datos);
    const condiciones = resolverCondiciones(nueva.tipo, nueva.prioridad, nueva.plazoDias);
    this.verificarQueNoHayUnaActiva(nueva.estudiante.legajo, nueva.tipo);

    const ahora = this.reloj.ahora();
    const hoy = aFechaISO(ahora);
    const solicitud = new Solicitud({
      id: identificadorDe(this.repositorio.siguienteNumero()),
      estudiante: nueva.estudiante,
      tipo: nueva.tipo,
      descripcion: nueva.descripcion,
      prioridad: condiciones.prioridad,
      estado: Estado.PENDIENTE,
      responsable: nueva.responsable ?? condiciones.area,
      fechaCreacion: hoy,
      fechaLimite: aFechaISO(sumarDias(ahora, condiciones.plazoDias)),
      historial: [{ fecha: hoy, de: null, a: Estado.PENDIENTE }],
    });
    this.repositorio.guardar(solicitud);
    return solicitud;
  }

  cambiarEstado(id: string, nuevoEstado: string): CambioRealizado {
    const solicitud = this.obtener(id);
    if (!esEstado(nuevoEstado)) throw new ErrorDeValidacion('estado inválido: ' + nuevoEstado);
    const cambio = solicitud.cambiarEstado(nuevoEstado, aFechaISO(this.reloj.ahora()));
    this.repositorio.guardar(solicitud);
    return { id, ...cambio };
  }

  asignarResponsable(id: string, responsable: string | undefined): Solicitud {
    const solicitud = this.obtener(id);
    solicitud.reasignar(responsable);
    this.repositorio.guardar(solicitud);
    return solicitud;
  }

  buscar(criterios: CriteriosDeBusqueda): Solicitud[] {
    const filtro = FiltroSolicitudes.desde(criterios);
    return this.repositorio.todas().filter((s) => filtro.coincide(s));
  }

  obtener(id: string): Solicitud {
    const solicitud = this.repositorio.buscarPorId(id);
    if (!solicitud) throw new SolicitudInexistente(id);
    return solicitud;
  }

  private verificarQueNoHayUnaActiva(legajo: string, tipo: TipoSolicitud): void {
    const hayUnaActiva = this.repositorio
      .todas()
      .some((s) => s.estudiante.legajo === legajo && s.tipo === tipo && s.estaAbierta());
    if (hayUnaActiva) throw new SolicitudDuplicada(legajo);
  }
}
