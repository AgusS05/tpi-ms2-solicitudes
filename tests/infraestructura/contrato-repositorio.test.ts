// Prueba de contrato (LSP): TODA implementación del puerto debe cumplir las mismas
// expectativas. La misma batería se corre sobre el repositorio en memoria y el JSON.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { RepositorioDeSolicitudes } from '../../src/aplicacion/puertos';
import { BaseDeDatosCorrupta } from '../../src/dominio/errores';
import { Estado } from '../../src/dominio/estado';
import { RepositorioEnMemoriaDeSolicitudes } from '../../src/infraestructura/repositorio-en-memoria';
import { RepositorioJsonDeSolicitudes } from '../../src/infraestructura/repositorio-json';
import { unaSolicitud } from '../helpers/construccion';

const carpetas: string[] = [];
afterEach(() => {
  carpetas.splice(0).forEach((c) => rmSync(c, { recursive: true, force: true }));
});

function rutaTemporal(): string {
  const carpeta = mkdtempSync(join(tmpdir(), 'repo-test-'));
  carpetas.push(carpeta);
  return join(carpeta, 'sub', 'solicitudes.json');
}

const implementaciones: [string, () => RepositorioDeSolicitudes][] = [
  ['en memoria', () => new RepositorioEnMemoriaDeSolicitudes()],
  ['JSON', () => new RepositorioJsonDeSolicitudes(rutaTemporal())],
];

describe.each(implementaciones)('contrato del repositorio (%s)', (_nombre, crear) => {
  it('arranca vacío', () => {
    expect(crear().todas()).toHaveLength(0);
  });

  it('los números correlativos arrancan en 1 y crecen de a uno', () => {
    const repo = crear();
    expect([repo.siguienteNumero(), repo.siguienteNumero(), repo.siguienteNumero()]).toEqual([
      1, 2, 3,
    ]);
  });

  it('guarda y recupera por id', () => {
    const repo = crear();
    repo.guardar(unaSolicitud());
    expect(repo.buscarPorId('SOL-0001')?.estudiante.nombre).toBe('Ana Pérez');
    expect(repo.buscarPorId('SOL-0002')).toBeUndefined();
  });

  it('guardar dos veces la misma solicitud no la duplica', () => {
    const repo = crear();
    const s = unaSolicitud();
    repo.guardar(s);
    repo.guardar(s);
    expect(repo.todas()).toHaveLength(1);
  });

  it('conserva el orden de inserción', () => {
    const repo = crear();
    repo.guardar(unaSolicitud({ id: 'SOL-0002' }));
    repo.guardar(unaSolicitud({ id: 'SOL-0001' }));
    expect(repo.todas().map((s) => s.id)).toEqual(['SOL-0002', 'SOL-0001']);
  });
});

describe('RepositorioJsonDeSolicitudes (propio del almacenamiento en archivo)', () => {
  it('lo guardado sobrevive a una nueva instancia (otro "proceso")', () => {
    const ruta = rutaTemporal();
    const a = new RepositorioJsonDeSolicitudes(ruta);
    a.siguienteNumero();
    const s = unaSolicitud();
    s.cambiarEstado(Estado.EN_REVISION, '2026-11-08');
    a.guardar(s);

    const b = new RepositorioJsonDeSolicitudes(ruta);
    expect(b.buscarPorId('SOL-0001')?.estado).toBe(Estado.EN_REVISION);
    expect(b.siguienteNumero()).toBe(2);
  });

  it('crea la carpeta si no existe', () => {
    const ruta = rutaTemporal();
    new RepositorioJsonDeSolicitudes(ruta).guardar(unaSolicitud());
    expect(JSON.parse(readFileSync(ruta, 'utf8')).solicitudes).toHaveLength(1);
  });

  it('el formato en disco conserva la forma de la v1 ({ solicitudes, contador })', () => {
    const ruta = rutaTemporal();
    const repo = new RepositorioJsonDeSolicitudes(ruta);
    repo.siguienteNumero();
    repo.guardar(unaSolicitud());
    const crudo = JSON.parse(readFileSync(ruta, 'utf8'));
    expect(Object.keys(crudo).sort()).toEqual(['contador', 'solicitudes']);
    expect(crudo.solicitudes[0]).toMatchObject({
      id: 'SOL-0001',
      legajo: 'L1001',
      nombre: 'Ana Pérez',
    });
  });

  it.each(['esto no es json {{{', '{"solicitudes": 5}', '{}', ''])(
    'un archivo dañado (%j) lanza BaseDeDatosCorrupta y no se modifica',
    (contenido) => {
      const ruta = rutaTemporal();
      new RepositorioJsonDeSolicitudes(ruta).guardar(unaSolicitud());
      writeFileSync(ruta, contenido);
      expect(() => new RepositorioJsonDeSolicitudes(ruta)).toThrow(BaseDeDatosCorrupta);
      expect(readFileSync(ruta, 'utf8')).toBe(contenido);
    },
  );
});
