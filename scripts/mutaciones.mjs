// Verifica que la suite de pruebas "detecta" cambios de comportamiento.
// Introduce defectos deliberados (mutaciones manuales), corre las pruebas y restaura el archivo.
// Cada mutación DEBE hacer fallar al menos una prueba; si no, la red de seguridad tiene un hueco.
// Uso: node scripts/mutaciones.mjs <v1|v2> [--md salida.md]
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { MUTACIONES } from './mutaciones-definidas.mjs';

const version = process.argv[2];
const lista = MUTACIONES[version];
if (!lista) {
  console.error('Uso: node scripts/mutaciones.mjs <' + Object.keys(MUTACIONES).join('|') + '>');
  process.exit(2);
}

function correrPruebas() {
  const r = spawnSync('pnpm', ['exec', 'vitest', 'run', '--reporter=dot'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const salida = r.stdout + r.stderr;
  const fallidas = Number(salida.match(/Tests\s+(\d+) failed/)?.[1] ?? 0);
  return { ok: r.status === 0, fallidas };
}

const base = correrPruebas();
if (!base.ok) {
  console.error('Las pruebas ya fallan sin mutaciones: no se puede continuar.');
  process.exit(2);
}

const filas = [];
for (const m of lista) {
  const original = readFileSync(m.archivo, 'utf8');
  if (!original.includes(m.buscar)) {
    filas.push({ ...m, estado: 'NO APLICA (texto no encontrado)', fallidas: 0 });
    continue;
  }
  try {
    writeFileSync(m.archivo, original.replace(m.buscar, m.reemplazar));
    const r = correrPruebas();
    filas.push({ ...m, estado: r.ok ? 'SOBREVIVIÓ (hueco)' : 'DETECTADA', fallidas: r.fallidas });
  } finally {
    writeFileSync(m.archivo, original);
  }
}

const detectadas = filas.filter((f) => f.estado === 'DETECTADA').length;
const md = [
  `### Sensibilidad de la suite: mutaciones manuales sobre ${version}`,
  '',
  `Mutaciones detectadas: **${detectadas} de ${filas.length}**`,
  '',
  '| # | Defecto introducido | Archivo | Resultado | Pruebas que fallaron |',
  '|---|---|---|---|---|',
  ...filas.map(
    (f, i) => `| ${i + 1} | ${f.descripcion} | \`${f.archivo}\` | ${f.estado} | ${f.fallidas} |`,
  ),
  '',
].join('\n');
console.log(md);
const i = process.argv.indexOf('--md');
if (i >= 0) writeFileSync(process.argv[i + 1], md);
process.exit(detectadas === filas.length ? 0 : 1);
