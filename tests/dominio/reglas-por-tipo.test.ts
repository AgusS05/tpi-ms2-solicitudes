import { describe, expect, it } from 'vitest';
import { Prioridad } from '../../src/dominio/prioridad';
import { REGLAS_POR_TIPO, resolverCondiciones } from '../../src/dominio/reglas-por-tipo';
import { TIPOS, TipoSolicitud } from '../../src/dominio/tipo-solicitud';

describe('resolverCondiciones', () => {
  it.each([
    [TipoSolicitud.CERTIFICADO, Prioridad.MEDIA, 5, 'Alumnado'],
    [TipoSolicitud.EQUIVALENCIA, Prioridad.BAJA, 15, 'Secretaría Académica'],
    [TipoSolicitud.CAMBIO_COMISION, Prioridad.MEDIA, 7, 'Alumnado'],
    [TipoSolicitud.REINCORPORACION, Prioridad.ALTA, 3, 'Secretaría Académica'],
    [TipoSolicitud.BAJA, Prioridad.ALTA, 3, 'Dirección de Carrera'],
  ])('%s sin opciones → prioridad %s, plazo %i, área %s', (tipo, prioridad, plazo, area) => {
    expect(resolverCondiciones(tipo)).toEqual({ prioridad, plazoDias: plazo, area });
  });

  it('una prioridad ALTA explícita acota el plazo a 3 días', () => {
    expect(resolverCondiciones(TipoSolicitud.EQUIVALENCIA, Prioridad.ALTA).plazoDias).toBe(3);
  });

  it('la prioridad ALTA no alarga un plazo que ya era menor', () => {
    const regla = REGLAS_POR_TIPO[TipoSolicitud.BAJA];
    expect(resolverCondiciones(TipoSolicitud.BAJA, Prioridad.ALTA).plazoDias).toBe(regla.plazoDias);
  });

  it('un plazo explícito prevalece sobre la prioridad ALTA', () => {
    expect(resolverCondiciones(TipoSolicitud.CERTIFICADO, Prioridad.ALTA, 20).plazoDias).toBe(20);
  });

  it('una prioridad baja explícita no cambia el plazo del tipo', () => {
    expect(resolverCondiciones(TipoSolicitud.CERTIFICADO, Prioridad.BAJA).plazoDias).toBe(5);
  });

  it('todo tipo tiene su regla (garantiza el Record exhaustivo)', () => {
    TIPOS.forEach((tipo) => expect(REGLAS_POR_TIPO[tipo].plazoDias).toBeGreaterThan(0));
  });
});
