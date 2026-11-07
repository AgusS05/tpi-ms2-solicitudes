import { beforeEach, describe, expect, it } from 'vitest';
import { ServicioDeSolicitudes } from '../../src/aplicacion/servicio-solicitudes';
import { DatosNuevaSolicitud } from '../../src/dominio/datos-nueva-solicitud';
import {
  ErrorDeValidacion,
  SolicitudDuplicada,
  SolicitudInexistente,
  TransicionNoPermitida,
} from '../../src/dominio/errores';
import { RepositorioEnMemoriaDeSolicitudes } from '../../src/infraestructura/repositorio-en-memoria';
import { RelojFijo } from '../helpers/construccion';

function datos(cambios: Partial<DatosNuevaSolicitud> = {}): DatosNuevaSolicitud {
  return {
    legajo: 'L1001',
    nombre: 'Ana Pérez',
    email: 'ana@mail.com',
    tipo: 'CERTIFICADO',
    descripcion: 'Certificado de alumno regular',
    ...cambios,
  };
}

describe('ServicioDeSolicitudes (sin disco ni consola: repositorio en memoria y reloj fijo)', () => {
  let repositorio: RepositorioEnMemoriaDeSolicitudes;
  let reloj: RelojFijo;
  let servicio: ServicioDeSolicitudes;

  beforeEach(() => {
    repositorio = new RepositorioEnMemoriaDeSolicitudes();
    reloj = new RelojFijo();
    servicio = new ServicioDeSolicitudes(repositorio, reloj);
  });

  describe('registrar', () => {
    it('asigna id correlativo, prioridad, área y vencimiento según el tipo', () => {
      const s = servicio.registrar(datos());
      expect(s.id).toBe('SOL-0001');
      expect(s.prioridad).toBe('MEDIA');
      expect(s.responsable).toBe('Alumnado');
      expect(s.fechaLimite).toBe('2026-11-12');
      expect(s.historial).toEqual([{ fecha: '2026-11-07', de: null, a: 'PENDIENTE' }]);
    });

    it('el responsable indicado reemplaza al del área', () => {
      expect(servicio.registrar(datos({ responsable: 'Bedelía' })).responsable).toBe('Bedelía');
    });

    it('persiste la solicitud en el repositorio', () => {
      servicio.registrar(datos());
      expect(repositorio.todas()).toHaveLength(1);
    });

    it('rechaza una segunda solicitud activa del mismo tipo y legajo', () => {
      servicio.registrar(datos());
      expect(() => servicio.registrar(datos())).toThrow(SolicitudDuplicada);
    });

    it('permite otra del mismo tipo cuando la anterior ya se cerró', () => {
      servicio.registrar(datos());
      servicio.cambiarEstado('SOL-0001', 'RECHAZADA');
      expect(servicio.registrar(datos()).id).toBe('SOL-0002');
    });

    it('permite el mismo tipo para otro legajo y otro tipo para el mismo legajo', () => {
      servicio.registrar(datos());
      expect(() => servicio.registrar(datos({ legajo: 'L2002' }))).not.toThrow();
      expect(() => servicio.registrar(datos({ tipo: 'BAJA' }))).not.toThrow();
    });

    it('no consume número ni guarda nada cuando los datos son inválidos', () => {
      expect(() => servicio.registrar(datos({ email: 'malo' }))).toThrow(ErrorDeValidacion);
      expect(repositorio.todas()).toHaveLength(0);
      expect(servicio.registrar(datos()).id).toBe('SOL-0001');
    });

    it('usa la fecha del reloj inyectado', () => {
      reloj.avanzarDias(10);
      expect(servicio.registrar(datos()).fechaCreacion).toBe('2026-11-17');
    });
  });

  describe('cambiarEstado', () => {
    it('informa la transición y registra el historial con la fecha del reloj', () => {
      servicio.registrar(datos());
      reloj.avanzarDias(1);
      const cambio = servicio.cambiarEstado('SOL-0001', 'EN_REVISION');
      expect(cambio).toEqual({
        id: 'SOL-0001',
        fecha: '2026-11-08',
        de: 'PENDIENTE',
        a: 'EN_REVISION',
      });
    });

    it('lanza SolicitudInexistente si el id no existe', () => {
      expect(() => servicio.cambiarEstado('SOL-9999', 'EN_REVISION')).toThrow(SolicitudInexistente);
    });

    it('verifica la existencia antes que la validez del estado (orden de la v1)', () => {
      expect(() => servicio.cambiarEstado('SOL-9999', 'XX')).toThrow(SolicitudInexistente);
    });

    it('rechaza un estado que no existe', () => {
      servicio.registrar(datos());
      expect(() => servicio.cambiarEstado('SOL-0001', 'XX')).toThrow('estado inválido: XX');
    });

    it('rechaza una transición no permitida y deja la solicitud igual', () => {
      servicio.registrar(datos());
      expect(() => servicio.cambiarEstado('SOL-0001', 'CERRADA')).toThrow(TransicionNoPermitida);
      expect(servicio.obtener('SOL-0001').estado).toBe('PENDIENTE');
    });
  });

  describe('asignarResponsable', () => {
    it('reasigna una solicitud abierta', () => {
      servicio.registrar(datos());
      expect(servicio.asignarResponsable('SOL-0001', 'Bedelía').responsable).toBe('Bedelía');
    });

    it('lanza SolicitudInexistente si el id no existe', () => {
      expect(() => servicio.asignarResponsable('SOL-0001', 'Bedelía')).toThrow(
        SolicitudInexistente,
      );
    });
  });

  describe('buscar y obtener', () => {
    beforeEach(() => {
      servicio.registrar(datos());
      servicio.registrar(datos({ legajo: 'L2002', nombre: 'Luis Gómez', tipo: 'BAJA' }));
      servicio.cambiarEstado('SOL-0002', 'EN_REVISION');
    });

    it('sin criterios devuelve todas', () => {
      expect(servicio.buscar({})).toHaveLength(2);
    });

    it('filtra por estado', () => {
      expect(servicio.buscar({ estado: 'EN_REVISION' }).map((s) => s.id)).toEqual(['SOL-0002']);
    });

    it('filtra por legajo y tipo combinados', () => {
      expect(servicio.buscar({ legajo: 'L1001', tipo: 'BAJA' })).toHaveLength(0);
    });

    it('un criterio inválido es un error de validación', () => {
      expect(() => servicio.buscar({ estado: 'XX' })).toThrow(ErrorDeValidacion);
    });

    it('obtener devuelve la solicitud o lanza SolicitudInexistente', () => {
      expect(servicio.obtener('SOL-0001').estudiante.nombre).toBe('Ana Pérez');
      expect(() => servicio.obtener('SOL-0003')).toThrow('no existe la solicitud SOL-0003');
    });
  });
});
