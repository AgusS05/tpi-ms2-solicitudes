import { describe, expect, it } from 'vitest';
import {
  DatosNuevaSolicitud,
  validarDatosNuevaSolicitud,
} from '../../src/dominio/datos-nueva-solicitud';
import { ErrorDeValidacion } from '../../src/dominio/errores';
import { FiltroSolicitudes } from '../../src/dominio/filtro-solicitudes';
import { Estado } from '../../src/dominio/estado';
import { unaSolicitud } from '../helpers/construccion';

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

describe('validarDatosNuevaSolicitud', () => {
  it('devuelve los datos con tipos de dominio y descripción recortada', () => {
    const r = validarDatosNuevaSolicitud(datos({ descripcion: '  Certificado de alumno  ' }));
    expect(r.estudiante.email.valor).toBe('ana@mail.com');
    expect(r.descripcion).toBe('Certificado de alumno');
    expect(r.prioridad).toBeUndefined();
  });

  it.each([
    ['legajo vacío', { legajo: '  ' }, 'el legajo es obligatorio'],
    ['nombre vacío', { nombre: '' }, 'el nombre es obligatorio'],
    ['email inválido', { email: 'ana.com' }, 'email inválido'],
    ['tipo inexistente', { tipo: 'OTRO' }, 'tipo de solicitud inválido: OTRO'],
    ['descripción corta', { descripcion: 'corta' }, 'la descripción debe tener al menos 10'],
    ['prioridad inexistente', { prioridad: 'URGENTE' }, 'prioridad inválida: URGENTE'],
    ['plazo en cero', { dias: 0 }, 'plazo inválido (1 a 60 días)'],
    ['plazo excesivo', { dias: 61 }, 'plazo inválido (1 a 60 días)'],
    ['plazo no numérico', { dias: NaN }, 'plazo inválido (1 a 60 días)'],
  ])('rechaza %s', (_nombre, cambios, mensaje) => {
    expect(() => validarDatosNuevaSolicitud(datos(cambios))).toThrow(ErrorDeValidacion);
    expect(() => validarDatosNuevaSolicitud(datos(cambios))).toThrow(mensaje);
  });

  it('informa el primer problema según el orden fijado por la v1', () => {
    expect(() => validarDatosNuevaSolicitud(datos({ legajo: '', nombre: '', email: 'x' }))).toThrow(
      'el legajo es obligatorio',
    );
  });

  it('acepta los límites del plazo (1 y 60 días)', () => {
    expect(validarDatosNuevaSolicitud(datos({ dias: 1 })).plazoDias).toBe(1);
    expect(validarDatosNuevaSolicitud(datos({ dias: 60 })).plazoDias).toBe(60);
  });

  it('un responsable vacío equivale a no indicarlo', () => {
    expect(validarDatosNuevaSolicitud(datos({ responsable: '' })).responsable).toBeUndefined();
  });
});

describe('FiltroSolicitudes', () => {
  it('sin criterios deja pasar todo', () => {
    expect(FiltroSolicitudes.desde({}).coincide(unaSolicitud())).toBe(true);
  });

  it('combina los criterios con AND', () => {
    const s = unaSolicitud();
    expect(FiltroSolicitudes.desde({ estado: 'PENDIENTE', tipo: 'CERTIFICADO' }).coincide(s)).toBe(
      true,
    );
    expect(FiltroSolicitudes.desde({ estado: 'PENDIENTE', tipo: 'BAJA' }).coincide(s)).toBe(false);
  });

  it('filtra por legajo, prioridad y estado', () => {
    const s = unaSolicitud({ estado: Estado.APROBADA });
    expect(FiltroSolicitudes.desde({ legajo: 'L1001' }).coincide(s)).toBe(true);
    expect(FiltroSolicitudes.desde({ legajo: 'L9999' }).coincide(s)).toBe(false);
    expect(FiltroSolicitudes.desde({ prioridad: 'MEDIA' }).coincide(s)).toBe(true);
    expect(FiltroSolicitudes.desde({ estado: 'PENDIENTE' }).coincide(s)).toBe(false);
  });

  it('un criterio vacío se ignora', () => {
    expect(FiltroSolicitudes.desde({ estado: '', tipo: '' }).coincide(unaSolicitud())).toBe(true);
  });

  it.each([
    [{ estado: 'X' }, 'estado inválido: X'],
    [{ tipo: 'X' }, 'tipo de solicitud inválido: X'],
    [{ prioridad: 'X' }, 'prioridad inválida: X'],
  ])('rechaza criterios inválidos %j', (criterios, mensaje) => {
    expect(() => FiltroSolicitudes.desde(criterios)).toThrow(mensaje);
  });
});
