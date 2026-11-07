// Mide la calidad interna del código de un directorio (por defecto `src`).
// Uso:  node scripts/metricas.mjs [directorio] [--json salida.json] [--md salida.md] [--etiqueta v1]
//
// Qué mide (todo con herramientas estándar, sin números inventados):
//  - Por función: líneas, complejidad ciclomática y cantidad de parámetros (ESLint core).
//  - Por archivo: líneas de código (sin blancos ni comentarios).
//  - Violaciones de la config de calidad (eslint.calidad.config.js), agrupadas por regla.
//  - Porcentaje de código duplicado (jscpd).
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opcion = (nombre) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const directorio = args[0] && !args[0].startsWith('--') ? args[0] : 'src';
const etiqueta = opcion('etiqueta') ?? directorio;
const raiz = process.cwd();

const UMBRALES = { complejidad: 8, lineas: 30, parametros: 4 };

// 1) Medición por función: se fijan umbrales en 0 para que ESLint reporte TODAS las funciones.
const eslintMedicion = new ESLint({
  cwd: raiz,
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ['**/*.ts'],
      languageOptions: { parser: tseslint.parser },
      rules: {
        complexity: ['warn', { max: 0 }],
        'max-lines-per-function': ['warn', { max: 0, skipBlankLines: true, skipComments: true }],
        'max-params': ['warn', 0],
        'max-lines': ['warn', { max: 0, skipBlankLines: true, skipComments: true }],
      },
    },
  ],
});
const resultados = await eslintMedicion.lintFiles([`${directorio}/**/*.ts`]);

const funciones = new Map();
const archivos = [];
const numero = (texto, regex) => Number(texto.match(regex)?.[1] ?? NaN);
const nombreDe = (texto) => {
  const m = texto.match(
    /^(?:Async )?(?:Method|Function|Constructor|Arrow function|Static method|Getter|Setter)(?: '([^']+)')?/i,
  );
  if (/^Constructor/i.test(texto)) return 'constructor';
  return m?.[1] ?? '(anónima)';
};

for (const r of resultados) {
  const archivo = r.filePath.replace(`${raiz}/`, '');
  for (const m of r.messages) {
    if (m.ruleId === 'max-lines') {
      archivos.push({ archivo, lineas: numero(m.message, /\((\d+)\)/) });
      continue;
    }
    const clave = `${archivo}:${m.line}:${m.column}`;
    const f = funciones.get(clave) ?? { archivo, nombre: nombreDe(m.message), linea: m.line };
    if (m.ruleId === 'complexity') f.complejidad = numero(m.message, /complexity of (\d+)/);
    if (m.ruleId === 'max-lines-per-function') f.lineas = numero(m.message, /\((\d+)\)/);
    if (m.ruleId === 'max-params') f.parametros = numero(m.message, /\((\d+)\)/);
    funciones.set(clave, f);
  }
}
const lista = [...funciones.values()].map((f) => ({
  complejidad: 1,
  lineas: 0,
  parametros: 0,
  ...f,
}));

// 2) Violaciones de la config de calidad completa.
const eslintCalidad = new ESLint({ cwd: raiz, overrideConfigFile: 'eslint.calidad.config.js' });
const resCalidad = await eslintCalidad.lintFiles([`${directorio}/**/*.ts`]);
const porRegla = {};
for (const r of resCalidad)
  for (const m of r.messages)
    porRegla[m.ruleId ?? 'sintaxis'] = (porRegla[m.ruleId ?? 'sintaxis'] ?? 0) + 1;
const totalViolaciones = Object.values(porRegla).reduce((a, b) => a + b, 0);

// 3) Duplicación con jscpd.
let duplicacion = { porcentaje: null, clones: null };
try {
  const salida = mkdtempSync(join(tmpdir(), 'jscpd-'));
  execFileSync(
    'pnpm',
    [
      'exec',
      'jscpd',
      directorio,
      '--min-tokens',
      '40',
      '--silent',
      '--reporters',
      'json',
      '--output',
      salida,
    ],
    { cwd: raiz, stdio: 'pipe', shell: process.platform === 'win32' },
  );
  const reporte = join(salida, 'jscpd-report.json');
  if (existsSync(reporte)) {
    const t = JSON.parse(readFileSync(reporte, 'utf8')).statistics.total;
    duplicacion = {
      porcentaje: +t.percentage.toFixed(1),
      clones: t.clones,
      lineasDuplicadas: t.duplicatedLines,
    };
  }
} catch (e) {
  duplicacion.error = String(e.message).split('\n')[0];
}

// 4) Resumen.
const max = (xs) => (xs.length ? Math.max(...xs) : 0);
const prom = (xs) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : 0);
const resumen = {
  etiqueta,
  directorio,
  archivos: archivos.length,
  lineasDeCodigo: archivos.reduce((a, f) => a + f.lineas, 0),
  funciones: lista.length,
  complejidadMax: max(lista.map((f) => f.complejidad)),
  complejidadPromedio: prom(lista.map((f) => f.complejidad)),
  lineasPorFuncionMax: max(lista.map((f) => f.lineas)),
  lineasPorFuncionPromedio: prom(lista.map((f) => f.lineas)),
  parametrosMax: max(lista.map((f) => f.parametros)),
  funcionesSobreUmbralComplejidad: lista.filter((f) => f.complejidad > UMBRALES.complejidad).length,
  funcionesSobreUmbralLineas: lista.filter((f) => f.lineas > UMBRALES.lineas).length,
  funcionesSobreUmbralParametros: lista.filter((f) => f.parametros > UMBRALES.parametros).length,
  archivoMasGrande: archivos.sort((a, b) => b.lineas - a.lineas)[0] ?? null,
  violacionesCalidad: totalViolaciones,
  violacionesPorRegla: porRegla,
  duplicacion,
};
const peores = [...lista]
  .sort((a, b) => b.complejidad - a.complejidad || b.lineas - a.lineas)
  .slice(0, 8);

const md = [
  `### Métricas de calidad interna — ${etiqueta}`,
  '',
  '| Métrica | Valor |',
  '|---|---|',
  `| Archivos / líneas de código | ${resumen.archivos} / ${resumen.lineasDeCodigo} |`,
  `| Funciones y métodos medidos | ${resumen.funciones} |`,
  `| Complejidad ciclomática (máx / prom) | ${resumen.complejidadMax} / ${resumen.complejidadPromedio} |`,
  `| Líneas por función (máx / prom) | ${resumen.lineasPorFuncionMax} / ${resumen.lineasPorFuncionPromedio} |`,
  `| Parámetros por función (máx) | ${resumen.parametrosMax} |`,
  `| Funciones sobre umbral (complejidad > ${UMBRALES.complejidad}) | ${resumen.funcionesSobreUmbralComplejidad} |`,
  `| Funciones sobre umbral (líneas > ${UMBRALES.lineas}) | ${resumen.funcionesSobreUmbralLineas} |`,
  `| Funciones sobre umbral (parámetros > ${UMBRALES.parametros}) | ${resumen.funcionesSobreUmbralParametros} |`,
  `| Violaciones de la config de calidad | ${resumen.violacionesCalidad} |`,
  `| Código duplicado (jscpd) | ${duplicacion.porcentaje ?? 'n/d'} % (${duplicacion.clones ?? 'n/d'} clones) |`,
  '',
  'Funciones más complejas:',
  '',
  '| Función | Archivo | Complejidad | Líneas | Parámetros |',
  '|---|---|---|---|---|',
  ...peores.map(
    (f) =>
      `| ${f.nombre} | ${f.archivo}:${f.linea} | ${f.complejidad} | ${f.lineas} | ${f.parametros} |`,
  ),
  '',
  'Violaciones por regla: ' +
    (Object.entries(porRegla)
      .sort((a, b) => b[1] - a[1])
      .map(([r, n]) => `\`${r}\`: ${n}`)
      .join(', ') || 'ninguna'),
  '',
].join('\n');

console.log(md);
const salidaJson = opcion('json');
if (salidaJson)
  writeFileSync(salidaJson, JSON.stringify({ resumen, funciones: lista }, null, 2) + '\n');
const salidaMd = opcion('md');
if (salidaMd) writeFileSync(salidaMd, md);
