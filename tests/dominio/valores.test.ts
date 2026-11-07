import { describe, expect, it } from 'vitest';
import { Email } from '../../src/dominio/email';
import { ErrorDeValidacion } from '../../src/dominio/errores';
import { aFechaISO, diferenciaEnDias, sumarDias } from '../../src/dominio/fecha';
import { esEstado, ESTADOS, puedeTransicionar, TRANSICIONES } from '../../src/dominio/estado';
import { esPrioridad } from '../../src/dominio/prioridad';
import { esTipo, TIPOS } from '../../src/dominio/tipo-solicitud';

describe('Email', () => {
  it.each(['ana@mail.com', 'a@b.c', 'x.y@z.org'])('acepta %s', (valor) => {
    expect(Email.crear(valor).valor).toBe(valor);
  });

  it.each([undefined, '', 'sin-arroba.com', '@mail.com', 'ana@sinpunto'])(
    'rechaza %s con un error de validación',
    (valor) => {
      expect(() => Email.crear(valor)).toThrow(ErrorDeValidacion);
      expect(() => Email.crear(valor)).toThrow('email inválido');
    },
  );

  it('toString devuelve el valor original', () => {
    expect(String(Email.crear('ana@mail.com'))).toBe('ana@mail.com');
  });
});

describe('fechas', () => {
  it('aFechaISO usa el día calendario UTC', () => {
    expect(aFechaISO(new Date('2026-11-07T23:59:59Z'))).toBe('2026-11-07');
  });

  it('sumarDias cruza fin de mes y de año', () => {
    expect(aFechaISO(sumarDias(new Date('2026-12-30T12:00:00Z'), 3))).toBe('2027-01-02');
  });

  it('diferenciaEnDias es positiva hacia el futuro y negativa hacia el pasado', () => {
    expect(diferenciaEnDias('2026-11-07', '2026-11-10')).toBe(3);
    expect(diferenciaEnDias('2026-11-10', '2026-11-07')).toBe(-3);
    expect(diferenciaEnDias('2026-11-07', '2026-11-07')).toBe(0);
  });
});

describe('catálogos de estado, tipo y prioridad', () => {
  it('reconocen valores válidos e ignoran los inválidos', () => {
    expect(esEstado('CERRADA')).toBe(true);
    expect(esEstado('cerrada')).toBe(false);
    expect(esTipo('BAJA')).toBe(true);
    expect(esTipo('OTRO')).toBe(false);
    expect(esPrioridad('ALTA')).toBe(true);
    expect(esPrioridad(undefined)).toBe(false);
  });

  it('la tabla de transiciones cubre todos los estados', () => {
    expect(Object.keys(TRANSICIONES).sort()).toEqual([...ESTADOS].sort());
  });

  it('CERRADA es terminal', () => {
    ESTADOS.forEach((e) => expect(puedeTransicionar('CERRADA', e)).toBe(false));
  });

  it('hay 5 tipos de trámite', () => {
    expect(TIPOS).toHaveLength(5);
  });
});
