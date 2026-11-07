// Constructores de datos de prueba para las pruebas unitarias (todos los datos son sintéticos).
import { Email } from '../../src/dominio/email';
import { Estado } from '../../src/dominio/estado';
import { Estudiante } from '../../src/dominio/estudiante';
import { Prioridad } from '../../src/dominio/prioridad';
import { PropiedadesDeSolicitud, Solicitud } from '../../src/dominio/solicitud';
import { TipoSolicitud } from '../../src/dominio/tipo-solicitud';
import { Reloj } from '../../src/aplicacion/puertos';

export function unaSolicitud(cambios: Partial<PropiedadesDeSolicitud> = {}): Solicitud {
  return new Solicitud({
    id: 'SOL-0001',
    estudiante: new Estudiante('L1001', 'Ana Pérez', Email.crear('ana@mail.com')),
    tipo: TipoSolicitud.CERTIFICADO,
    descripcion: 'Certificado de alumno regular',
    prioridad: Prioridad.MEDIA,
    estado: Estado.PENDIENTE,
    responsable: 'Alumnado',
    fechaCreacion: '2026-11-07',
    fechaLimite: '2026-11-12',
    historial: [{ fecha: '2026-11-07', de: null, a: Estado.PENDIENTE }],
    ...cambios,
  });
}

/** Reloj controlable: se fija la hora y se avanza a mano (reemplaza a Date en las pruebas). */
export class RelojFijo implements Reloj {
  constructor(private instante: Date = new Date('2026-11-07T12:00:00Z')) {}
  ahora(): Date {
    return this.instante;
  }
  avanzarDias(dias: number): void {
    this.instante = new Date(this.instante.getTime() + dias * 24 * 60 * 60 * 1000);
  }
}
