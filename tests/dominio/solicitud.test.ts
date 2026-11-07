import { describe, expect, it } from 'vitest';
import {
  ErrorDeValidacion,
  ReasignacionNoPermitida,
  TransicionNoPermitida,
} from '../../src/dominio/errores';
import { ESTADOS, Estado } from '../../src/dominio/estado';
import { Solicitud, identificadorDe } from '../../src/dominio/solicitud';
import { unaSolicitud } from '../helpers/construccion';

describe('Solicitud: estado y vencimiento', () => {
  it('abierta en PENDIENTE y EN_REVISION, cerrada en el resto', () => {
    const abiertas = ESTADOS.filter((estado) => unaSolicitud({ estado }).estaAbierta());
    expect(abiertas).toEqual([Estado.PENDIENTE, Estado.EN_REVISION]);
  });

  it('diasParaVencer es negativo cuando ya venció', () => {
    expect(unaSolicitud().diasParaVencer('2026-11-14')).toBe(-2);
  });

  it('el día del vencimiento todavía no está vencida', () => {
    const s = unaSolicitud();
    expect(s.estaVencida('2026-11-12')).toBe(false);
    expect(s.estaVencida('2026-11-13')).toBe(true);
  });

  it('una solicitud cerrada nunca figura como vencida ni por vencer', () => {
    const s = unaSolicitud({ estado: Estado.CERRADA });
    expect(s.estaVencida('2027-01-01')).toBe(false);
    expect(s.estaPorVencer('2026-11-11')).toBe(false);
  });

  it('por vencer: desde 2 días antes hasta el día del vencimiento inclusive', () => {
    const s = unaSolicitud();
    expect(s.estaPorVencer('2026-11-09')).toBe(false);
    expect(s.estaPorVencer('2026-11-10')).toBe(true);
    expect(s.estaPorVencer('2026-11-12')).toBe(true);
    expect(s.estaPorVencer('2026-11-13')).toBe(false);
  });

  it('el aviso se puede parametrizar', () => {
    expect(unaSolicitud().estaPorVencer('2026-11-09', 3)).toBe(true);
  });
});

describe('Solicitud: cambiarEstado', () => {
  it('aplica una transición válida y la anota en el historial', () => {
    const s = unaSolicitud();
    const cambio = s.cambiarEstado(Estado.EN_REVISION, '2026-11-08');
    expect(cambio).toEqual({ fecha: '2026-11-08', de: 'PENDIENTE', a: 'EN_REVISION' });
    expect(s.estado).toBe(Estado.EN_REVISION);
    expect(s.historial).toHaveLength(2);
  });

  it('rechaza una transición inválida sin tocar el estado ni el historial', () => {
    const s = unaSolicitud();
    expect(() => s.cambiarEstado(Estado.CERRADA, '2026-11-08')).toThrow(TransicionNoPermitida);
    expect(s.estado).toBe(Estado.PENDIENTE);
    expect(s.historial).toHaveLength(1);
  });

  it('el historial expuesto no permite modificar el estado interno', () => {
    const s = unaSolicitud();
    const copia = s.aRegistro().historial;
    copia.push({ fecha: 'x', de: null, a: Estado.CERRADA });
    expect(s.historial).toHaveLength(1);
  });
});

describe('Solicitud: reasignar', () => {
  it('cambia el responsable y recorta espacios', () => {
    const s = unaSolicitud();
    s.reasignar('  Bedelía ');
    expect(s.responsable).toBe('Bedelía');
  });

  it.each([undefined, '', '   '])('exige un responsable (%j)', (valor) => {
    expect(() => unaSolicitud().reasignar(valor)).toThrow(ErrorDeValidacion);
  });

  it('no permite reasignar una solicitud cerrada', () => {
    const s = unaSolicitud({ estado: Estado.APROBADA });
    expect(() => s.reasignar('Bedelía')).toThrow(ReasignacionNoPermitida);
  });

  it('valida el responsable antes que el estado (orden heredado de la v1)', () => {
    const s = unaSolicitud({ estado: Estado.APROBADA });
    expect(() => s.reasignar('')).toThrow(ErrorDeValidacion);
  });
});

describe('Solicitud: persistencia', () => {
  it('ida y vuelta por registro conserva todos los datos', () => {
    const original = unaSolicitud({ responsable: 'Bedelía' });
    original.cambiarEstado(Estado.EN_REVISION, '2026-11-08');
    const copia = Solicitud.desdeRegistro(original.aRegistro());
    expect(copia.aRegistro()).toEqual(original.aRegistro());
  });

  it('identificadorDe completa con ceros a 4 dígitos', () => {
    expect(identificadorDe(1)).toBe('SOL-0001');
    expect(identificadorDe(12345)).toBe('SOL-12345');
  });
});
