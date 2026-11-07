// Prueba diferencial: la MISMA secuencia de comandos se ejecuta contra la v1 congelada
// (legacy/, tag `estado-inicial`) y contra la v2 refactorizada. Deben coincidir la salida
// impresa, el código de salida y el contenido del archivo de datos, comando por comando.
// Complementa a la suite de caracterización: acá las secuencias son generadas al azar
// (con semilla fija, así que el resultado es reproducible).
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main as mainV2 } from '../src/cli';
import { main as mainV1 } from '../legacy/v1-estado-inicial/src/cli';
import { FECHA_BASE, argsRegistrar } from './helpers/sistema';

type Main = (args: string[]) => void;

interface Ejecucion {
  salida: string[];
  codigo: number;
  datos: string | null;
}

function correr(main: Main, rutaDb: string, args: string[]): Ejecucion {
  process.env.SOLICITUDES_DB = rutaDb;
  const salida: string[] = [];
  const espia = vi.spyOn(console, 'log').mockImplementation((...p: unknown[]) => {
    salida.push(p.join(' '));
  });
  process.exitCode = undefined;
  try {
    main(args);
  } finally {
    espia.mockRestore();
  }
  const codigo = Number(process.exitCode ?? 0);
  process.exitCode = undefined;
  return { salida, codigo, datos: existsSync(rutaDb) ? readFileSync(rutaDb, 'utf8') : null };
}

/** Generador pseudoaleatorio determinista (mulberry32). */
function aleatorio(semilla: number): () => number {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cada campo es válido casi siempre; con poca probabilidad se inyecta un valor inválido.
// (Si todos los campos fueran inválidos con frecuencia, casi nunca se llegaría a registrar nada.)
const LEGAJOS = { validos: ['L1', 'L2', 'L3'], invalidos: [''] };
const TIPOS = {
  validos: ['CERTIFICADO', 'EQUIVALENCIA', 'CAMBIO_COMISION', 'REINCORPORACION', 'BAJA'],
  invalidos: ['OTRO'],
};
const PRIORIDADES = {
  validos: [undefined, undefined, 'ALTA', 'MEDIA', 'BAJA'],
  invalidos: ['URGENTE'],
};
const DIAS = {
  validos: [undefined, undefined, undefined, '1', '5', '60'],
  invalidos: ['0', '61', 'abc', '1.5', '-2'],
};
const EMAILS = { validos: ['a@m.com', 'b@m.com'], invalidos: ['sin-arroba', ''] };
const NOMBRES = { validos: ['Ana Pérez', 'Luis Gómez'], invalidos: [''] };
const DESCRIPCIONES = {
  validos: ['Descripción suficiente', 'Otra descripción válida'],
  invalidos: ['corta', '   '],
};
const RESPONSABLES = { validos: [undefined, undefined, 'Bedelía', '  Mesa  '], invalidos: [''] };
const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CERRADA', 'XX'];
const PROBABILIDAD_DE_ERROR = 0.1;

interface Dominio<T> {
  validos: readonly T[];
  invalidos: readonly T[];
}

function valor<T>(azar: () => number, d: Dominio<T>): T {
  return azar() < PROBABILIDAD_DE_ERROR ? elegir(azar, d.invalidos) : elegir(azar, d.validos);
}

function elegir<T>(azar: () => number, opciones: readonly T[]): T {
  return opciones[Math.floor(azar() * opciones.length)];
}

function comandoAleatorio(azar: () => number): string[] {
  const id = 'SOL-' + String(1 + Math.floor(azar() * 4)).padStart(4, '0');
  const dado = azar();
  if (dado < 0.3) {
    return argsRegistrar({
      legajo: valor(azar, LEGAJOS),
      nombre: valor(azar, NOMBRES),
      email: valor(azar, EMAILS),
      tipo: valor(azar, TIPOS),
      descripcion: valor(azar, DESCRIPCIONES),
      prioridad: valor(azar, PRIORIDADES),
      dias: valor(azar, DIAS),
      responsable: valor(azar, RESPONSABLES),
    });
  }
  if (dado < 0.7) return ['estado', id, elegir(azar, ESTADOS)];
  if (dado < 0.77) return ['asignar', id, ...(valor(azar, RESPONSABLES) ?? [])].slice(0, 3);
  if (dado < 0.85) {
    const filtros: string[] = [];
    if (azar() < 0.5) filtros.push('--estado', elegir(azar, ESTADOS));
    if (azar() < 0.4) filtros.push('--tipo', valor(azar, TIPOS) as string);
    if (azar() < 0.3) filtros.push('--prioridad', elegir(azar, ['ALTA', 'MEDIA', 'BAJA', 'ZZ']));
    if (azar() < 0.3) filtros.push('--legajo', valor(azar, LEGAJOS));
    return ['buscar', ...filtros];
  }
  if (dado < 0.9) return ['ver', id];
  if (dado < 0.97) return ['reporte'];
  return [elegir(azar, ['', 'desconocido', 'ayuda'])];
}

describe('equivalencia v1 ↔ v2', () => {
  let carpeta = '';
  let rutaV1 = '';
  let rutaV2 = '';

  beforeEach(() => {
    carpeta = mkdtempSync(join(tmpdir(), 'equivalencia-'));
    rutaV1 = join(carpeta, 'v1.json');
    rutaV2 = join(carpeta, 'v2.json');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FECHA_BASE));
  });
  afterEach(() => {
    vi.useRealTimers();
    rmSync(carpeta, { recursive: true, force: true });
    delete process.env.SOLICITUDES_DB;
  });

  function compararPaso(args: string[]): void {
    const v1 = correr(mainV1, rutaV1, args);
    const v2 = correr(mainV2, rutaV2, args);
    expect({ args, ...v2 }).toEqual({ args, ...v1 });
  }

  it('120 secuencias aleatorias de 30 comandos producen exactamente lo mismo', () => {
    let comparados = 0;
    for (let semilla = 1; semilla <= 120; semilla++) {
      const azar = aleatorio(semilla);
      rmSync(rutaV1, { force: true });
      rmSync(rutaV2, { force: true });
      vi.setSystemTime(new Date(FECHA_BASE));
      for (let paso = 0; paso < 30; paso++) {
        if (azar() < 0.1)
          vi.setSystemTime(new Date(Date.now() + Math.floor(azar() * 6) * 86400000));
        compararPaso(comandoAleatorio(azar));
        comparados++;
      }
    }
    expect(comparados).toBe(3600);
  });

  describe('matriz exhaustiva de transiciones (5 × 5) y reasignación en cada estado', () => {
    const CAMINO_HASTA: Record<string, string[]> = {
      PENDIENTE: [],
      EN_REVISION: ['EN_REVISION'],
      APROBADA: ['EN_REVISION', 'APROBADA'],
      RECHAZADA: ['RECHAZADA'],
      CERRADA: ['RECHAZADA', 'CERRADA'],
    };
    const pares = Object.keys(CAMINO_HASTA).flatMap((origen) =>
      Object.keys(CAMINO_HASTA).map((destino) => [origen, destino] as const),
    );

    it.each(pares)('%s -> %s', (origen, destino) => {
      for (const main of [mainV1, mainV2]) {
        const ruta = main === mainV1 ? rutaV1 : rutaV2;
        correr(main, ruta, argsRegistrar());
        CAMINO_HASTA[origen].forEach((e) => correr(main, ruta, ['estado', 'SOL-0001', e]));
      }
      compararPaso(['estado', 'SOL-0001', destino]);
      compararPaso(['ver', 'SOL-0001']);
    });

    it.each(Object.keys(CAMINO_HASTA))('asignar estando en %s', (origen) => {
      for (const main of [mainV1, mainV2]) {
        const ruta = main === mainV1 ? rutaV1 : rutaV2;
        correr(main, ruta, argsRegistrar());
        CAMINO_HASTA[origen].forEach((e) => correr(main, ruta, ['estado', 'SOL-0001', e]));
      }
      compararPaso(['asignar', 'SOL-0001', 'Bedelía']);
      compararPaso(['asignar', 'SOL-0001']);
    });
  });

  it('una base de datos creada por la v1 se puede seguir usando con la v2', () => {
    correr(mainV1, rutaV1, argsRegistrar({ legajo: 'L1', tipo: 'BAJA' }));
    correr(mainV1, rutaV1, argsRegistrar({ legajo: 'L2', tipo: 'EQUIVALENCIA' }));
    correr(mainV1, rutaV1, ['estado', 'SOL-0001', 'EN_REVISION']);
    writeFileSync(rutaV2, readFileSync(rutaV1, 'utf8'));

    // Mismos comandos sobre la copia: la v2 continúa la numeración y respeta el historial.
    const v1 = correr(mainV1, rutaV1, argsRegistrar({ legajo: 'L3', tipo: 'CERTIFICADO' }));
    const v2 = correr(mainV2, rutaV2, argsRegistrar({ legajo: 'L3', tipo: 'CERTIFICADO' }));
    expect(v2).toEqual(v1);
    expect(v2.salida[0]).toContain('SOL-0003');
    expect(correr(mainV2, rutaV2, ['ver', 'SOL-0001']).salida).toEqual(
      correr(mainV1, rutaV1, ['ver', 'SOL-0001']).salida,
    );
  });

  it('una base creada por la v2 también la lee la v1 (compatibilidad en ambos sentidos)', () => {
    correr(mainV2, rutaV2, argsRegistrar({ legajo: 'L1', tipo: 'REINCORPORACION' }));
    correr(mainV2, rutaV2, ['estado', 'SOL-0001', 'RECHAZADA']);
    writeFileSync(rutaV1, readFileSync(rutaV2, 'utf8'));
    expect(correr(mainV1, rutaV1, ['reporte'])).toEqual(correr(mainV2, rutaV2, ['reporte']));
  });

  it('ÚNICA DIFERENCIA INTENCIONAL: ante un archivo dañado la v1 lo pisa y la v2 lo conserva', () => {
    const dañado = 'esto no es json {{{';
    writeFileSync(rutaV1, dañado);
    writeFileSync(rutaV2, dañado);
    const v1 = correr(mainV1, rutaV1, argsRegistrar());
    const v2 = correr(mainV2, rutaV2, argsRegistrar());
    expect(v1.codigo).toBe(0);
    expect(v1.datos).not.toBe(dañado); // v1: datos perdidos sin aviso
    expect(v2.codigo).toBe(1);
    expect(v2.datos).toBe(dañado); // v2: avisa y no toca el archivo
  });
});
