// Ejecuta un escenario de uso completo contra el CLI y muestra la transcripción.
// Uso: node scripts/demo.mjs [--out docs/evidencias/demo.txt]
// Usa una base de datos temporal: no toca data/solicitudes.json.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const db = join(mkdtempSync(join(tmpdir(), 'demo-solicitudes-')), 'solicitudes.json');

const escenario = [
  ['registrar', '--legajo', 'L1001', '--nombre', 'Ana Pérez', '--email', 'ana@mail.com', '--tipo', 'CERTIFICADO', '--descripcion', 'Certificado de alumno regular'],
  ['registrar', '--legajo', 'L1002', '--nombre', 'Bruno Díaz', '--email', 'bruno@mail.com', '--tipo', 'EQUIVALENCIA', '--descripcion', 'Equivalencia de Programación I', '--prioridad', 'ALTA', '--responsable', 'Prof. Gómez'],
  ['registrar', '--legajo', 'L1003', '--nombre', 'Carla Ruiz', '--email', 'carla@mail.com', '--tipo', 'BAJA', '--descripcion', 'Baja por motivos laborales'],
  ['registrar', '--legajo', 'L1001', '--nombre', 'Ana Pérez', '--email', 'ana@mail.com', '--tipo', 'CERTIFICADO', '--descripcion', 'Segundo certificado igual'],
  ['registrar', '--legajo', 'L1004', '--nombre', 'Diego Sosa', '--email', 'diego-sin-arroba', '--tipo', 'CERTIFICADO', '--descripcion', 'Certificado para trámite'],
  ['estado', 'SOL-0001', 'EN_REVISION'],
  ['estado', 'SOL-0001', 'CERRADA'],
  ['estado', 'SOL-0001', 'APROBADA'],
  ['asignar', 'SOL-0002', 'María López'],
  ['buscar', '--estado', 'PENDIENTE'],
  ['buscar', '--tipo', 'CERTIFICADO', '--prioridad', 'MEDIA'],
  ['ver', 'SOL-0001'],
  ['reporte'],
];

const lineas = [];
for (const argumentos of escenario) {
  const cmd = argumentos.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ');
  lineas.push(`$ pnpm start ${cmd}`);
  const r = spawnSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', ...argumentos], {
    env: { ...process.env, SOLICITUDES_DB: db },
    encoding: 'utf8',
  });
  lineas.push((r.stdout + r.stderr).trimEnd());
  if (r.status !== 0) lineas.push(`(código de salida: ${r.status})`);
  lineas.push('');
}
const texto = lineas.join('\n');
console.log(texto);
const i = process.argv.indexOf('--out');
if (i >= 0) writeFileSync(process.argv[i + 1], texto + '\n');
