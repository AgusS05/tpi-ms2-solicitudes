// Utilidades para probar el sistema "desde afuera": se ejecutan comandos del CLI
// y se observa la salida impresa, el código de salida y el archivo de datos.
// Así las mismas pruebas sirven antes y después del refactoring (caja negra).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';
import { main } from '../../src/cli';

export interface Resultado {
  salida: string[];
  texto: string;
  codigo: number;
}

/** Fecha fija para que las pruebas sean deterministas (mediodía UTC, sin cruces de día). */
export const FECHA_BASE = '2026-11-07T12:00:00Z';
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Prepara una base de datos temporal y un reloj simulado para cada prueba. */
export function usarEntornoAislado(): { rutaDb: () => string } {
  let carpeta = '';
  beforeEach(() => {
    carpeta = mkdtempSync(join(tmpdir(), 'solicitudes-test-'));
    process.env.SOLICITUDES_DB = join(carpeta, 'solicitudes.json');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FECHA_BASE));
    process.exitCode = undefined;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    rmSync(carpeta, { recursive: true, force: true });
    delete process.env.SOLICITUDES_DB;
    process.exitCode = undefined;
  });
  return { rutaDb: () => process.env.SOLICITUDES_DB as string };
}

/** Ejecuta un comando del CLI capturando lo que imprime y su código de salida. */
export function ejecutar(...args: string[]): Resultado {
  const lineas: string[] = [];
  const espia = vi.spyOn(console, 'log').mockImplementation((...partes: unknown[]) => {
    lineas.push(partes.join(' '));
  });
  process.exitCode = undefined;
  try {
    main(args);
  } finally {
    espia.mockRestore();
  }
  const codigo = Number(process.exitCode ?? 0);
  process.exitCode = undefined;
  return { salida: lineas, texto: lineas.join('\n'), codigo };
}

/** Avanza el reloj simulado la cantidad de días indicada. */
export function avanzarDias(dias: number): void {
  vi.setSystemTime(new Date(Date.now() + dias * MS_POR_DIA));
}

export interface DatosRegistro {
  legajo?: string;
  nombre?: string;
  email?: string;
  tipo?: string;
  descripcion?: string;
  prioridad?: string;
  dias?: string;
  responsable?: string;
}

/** Arma los argumentos del comando `registrar` con valores válidos por defecto. */
export function argsRegistrar(datos: DatosRegistro = {}): string[] {
  const d = {
    legajo: 'L1001',
    nombre: 'Ana Pérez',
    email: 'ana@mail.com',
    tipo: 'CERTIFICADO',
    descripcion: 'Certificado de alumno regular',
    ...datos,
  };
  const args = ['registrar'];
  for (const [clave, valor] of Object.entries(d)) {
    if (valor !== undefined) args.push(`--${clave}`, valor);
  }
  return args;
}

/** Registra una solicitud y verifica que haya salido bien (para preparar escenarios). */
export function registrar(datos: DatosRegistro = {}): Resultado {
  const r = ejecutar(...argsRegistrar(datos));
  if (r.codigo !== 0) throw new Error(`No se pudo preparar la solicitud: ${r.texto}`);
  return r;
}
