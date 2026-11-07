import { Estado, ESTADOS } from '../dominio/estado';
import { FechaISO, aFechaISO } from '../dominio/fecha';
import { PRIORIDADES, Prioridad } from '../dominio/prioridad';
import { Solicitud } from '../dominio/solicitud';
import { TIPOS, TipoSolicitud } from '../dominio/tipo-solicitud';
import { LectorDeSolicitudes, Reloj } from './puertos';

export interface Conteo<T extends string> {
  categoria: T;
  cantidad: number;
}

export interface AvisoDeVencimiento {
  id: string;
  responsable: string;
  /** Días que faltan para el vencimiento (negativo si ya venció). */
  dias: number;
}

/** Datos del reporte, sin formato: quien lo muestre decide cómo presentarlo. */
export interface Reporte {
  fecha: FechaISO;
  total: number;
  porEstado: Conteo<Estado>[];
  porTipo: Conteo<TipoSolicitud>[];
  porPrioridad: Conteo<Prioridad>[];
  vencidas: AvisoDeVencimiento[];
  porVencer: AvisoDeVencimiento[];
}

/**
 * Genera el reporte. Depende solo de la parte de LECTURA del repositorio (ISP):
 * no puede modificar datos aunque quisiera.
 */
export class ServicioDeReportes {
  constructor(
    private readonly lector: LectorDeSolicitudes,
    private readonly reloj: Reloj,
  ) {}

  generar(): Reporte {
    const hoy = aFechaISO(this.reloj.ahora());
    const solicitudes = this.lector.todas();
    const aviso = (s: Solicitud): AvisoDeVencimiento => ({
      id: s.id,
      responsable: s.responsable,
      dias: s.diasParaVencer(hoy),
    });
    return {
      fecha: hoy,
      total: solicitudes.length,
      porEstado: contar(solicitudes, ESTADOS, (s) => s.estado),
      porTipo: contar(solicitudes, TIPOS, (s) => s.tipo),
      porPrioridad: contar(solicitudes, PRIORIDADES, (s) => s.prioridad),
      vencidas: solicitudes.filter((s) => s.estaVencida(hoy)).map(aviso),
      porVencer: solicitudes.filter((s) => s.estaPorVencer(hoy)).map(aviso),
    };
  }
}

/** Cuenta cuántas solicitudes hay en cada categoría (incluye las categorías con cero). */
function contar<T extends string>(
  solicitudes: readonly Solicitud[],
  categorias: readonly T[],
  clasificar: (s: Solicitud) => T,
): Conteo<T>[] {
  return categorias.map((categoria) => ({
    categoria,
    cantidad: solicitudes.filter((s) => clasificar(s) === categoria).length,
  }));
}
