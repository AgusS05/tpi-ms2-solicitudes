import { describe, expect, it } from 'vitest';
import { ServicioDeReportes } from '../../src/aplicacion/servicio-reportes';
import { ServicioDeSolicitudes } from '../../src/aplicacion/servicio-solicitudes';
import { RepositorioEnMemoriaDeSolicitudes } from '../../src/infraestructura/repositorio-en-memoria';
import { RelojFijo } from '../helpers/construccion';

function armar() {
  const repositorio = new RepositorioEnMemoriaDeSolicitudes();
  const reloj = new RelojFijo();
  return {
    reloj,
    solicitudes: new ServicioDeSolicitudes(repositorio, reloj),
    reportes: new ServicioDeReportes(repositorio, reloj),
  };
}

const base = { nombre: 'Ana Pérez', email: 'ana@mail.com', descripcion: 'Certificado de alumno' };

describe('ServicioDeReportes', () => {
  it('con el repositorio vacío informa todo en cero (incluye categorías sin casos)', () => {
    const r = armar().reportes.generar();
    expect(r.total).toBe(0);
    expect(r.porEstado).toHaveLength(5);
    expect(r.porTipo).toHaveLength(5);
    expect(r.porPrioridad).toHaveLength(3);
    expect(r.porEstado.every((c) => c.cantidad === 0)).toBe(true);
  });

  it('cuenta por estado, tipo y prioridad', () => {
    const { solicitudes, reportes } = armar();
    solicitudes.registrar({ ...base, legajo: 'L1', tipo: 'CERTIFICADO' });
    solicitudes.registrar({ ...base, legajo: 'L2', tipo: 'BAJA' });
    solicitudes.cambiarEstado('SOL-0002', 'EN_REVISION');
    const r = reportes.generar();
    expect(r.total).toBe(2);
    expect(r.porEstado.find((c) => c.categoria === 'PENDIENTE')?.cantidad).toBe(1);
    expect(r.porEstado.find((c) => c.categoria === 'EN_REVISION')?.cantidad).toBe(1);
    expect(r.porTipo.find((c) => c.categoria === 'BAJA')?.cantidad).toBe(1);
    expect(r.porPrioridad.find((c) => c.categoria === 'ALTA')?.cantidad).toBe(1);
  });

  it('separa vencidas y próximas a vencer según la fecha del reloj', () => {
    const { solicitudes, reportes, reloj } = armar();
    solicitudes.registrar({ ...base, legajo: 'L1', tipo: 'CERTIFICADO' }); // vence 12-nov
    solicitudes.registrar({ ...base, legajo: 'L2', tipo: 'EQUIVALENCIA' }); // vence 22-nov
    reloj.avanzarDias(6);
    const r = reportes.generar();
    expect(r.vencidas).toEqual([{ id: 'SOL-0001', responsable: 'Alumnado', dias: -1 }]);
    expect(r.porVencer).toEqual([]);
    reloj.avanzarDias(4); // 17-nov: la segunda vence en 5 días
    expect(reportes.generar().porVencer).toEqual([]);
    reloj.avanzarDias(3); // 20-nov: faltan 2
    expect(reportes.generar().porVencer.map((a) => a.id)).toEqual(['SOL-0002']);
  });

  it('las solicitudes cerradas no figuran como vencidas', () => {
    const { solicitudes, reportes, reloj } = armar();
    solicitudes.registrar({ ...base, legajo: 'L1', tipo: 'CERTIFICADO' });
    solicitudes.cambiarEstado('SOL-0001', 'RECHAZADA');
    reloj.avanzarDias(30);
    expect(reportes.generar().vencidas).toEqual([]);
  });
});
