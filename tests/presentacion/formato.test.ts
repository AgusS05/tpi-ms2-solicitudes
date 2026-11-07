import { describe, expect, it } from 'vitest';
import { Reporte } from '../../src/aplicacion/servicio-reportes';
import {
  lineaDeAsignacion,
  lineaDeCambioDeEstado,
  lineaDeRegistro,
  lineasDeBusqueda,
  lineasDeDetalle,
  lineasDeReporte,
} from '../../src/presentacion/formato';
import { Estado } from '../../src/dominio/estado';
import { unaSolicitud } from '../helpers/construccion';

describe('formato (funciones puras)', () => {
  it('línea de registro', () => {
    expect(lineaDeRegistro(unaSolicitud())).toBe(
      'Solicitud SOL-0001 registrada (prioridad MEDIA, vence 2026-11-12, responsable: Alumnado)',
    );
  });

  it('línea de cambio de estado y de asignación', () => {
    expect(
      lineaDeCambioDeEstado({
        id: 'SOL-0001',
        fecha: '2026-11-08',
        de: Estado.PENDIENTE,
        a: Estado.EN_REVISION,
      }),
    ).toBe('Solicitud SOL-0001: PENDIENTE -> EN_REVISION');
    expect(lineaDeAsignacion(unaSolicitud({ responsable: 'Bedelía' }))).toBe(
      'Solicitud SOL-0001 asignada a Bedelía',
    );
  });

  it('búsqueda sin resultados muestra solo el total', () => {
    expect(lineasDeBusqueda([])).toEqual(['Total: 0']);
  });

  it('búsqueda lista una fila por solicitud y el total', () => {
    expect(lineasDeBusqueda([unaSolicitud()])).toEqual([
      'SOL-0001 | CERTIFICADO | MEDIA | PENDIENTE | Ana Pérez | Alumnado',
      'Total: 1',
    ]);
  });

  it('detalle incluye datos, fechas e historial con (inicio) en la primera entrada', () => {
    const lineas = lineasDeDetalle(unaSolicitud());
    expect(lineas[1]).toBe('Estudiante: Ana Pérez (L1001) <ana@mail.com>');
    expect(lineas.at(-1)).toBe('  2026-11-07: (inicio) -> PENDIENTE');
  });

  it('reporte con vencidas y próximas a vencer', () => {
    const reporte: Reporte = {
      fecha: '2026-11-07',
      total: 2,
      porEstado: [{ categoria: Estado.PENDIENTE, cantidad: 2 }],
      porTipo: [],
      porPrioridad: [],
      vencidas: [{ id: 'SOL-0001', responsable: 'Alumnado', dias: -3 }],
      porVencer: [{ id: 'SOL-0002', responsable: 'Bedelía', dias: 1 }],
    };
    const lineas = lineasDeReporte(reporte);
    expect(lineas[0]).toBe('=== REPORTE DE SOLICITUDES (2026-11-07) ===');
    expect(lineas).toContain('  PENDIENTE: 2');
    expect(lineas).toContain('  SOL-0001 vencida hace 3 días (responsable: Alumnado)');
    expect(lineas).toContain('Próximas a vencer (2 días o menos): 1');
    expect(lineas).toContain('  SOL-0002 vence en 1 días (responsable: Bedelía)');
  });
});
