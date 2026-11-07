### Métricas de calidad interna — v1 - estado-inicial

| Métrica | Valor |
|---|---|
| Archivos / líneas de código | 2 / 415 |
| Funciones y métodos medidos | 13 |
| Complejidad ciclomática (máx / prom) | 43 / 11.4 |
| Líneas por función (máx / prom) | 119 / 31.3 |
| Parámetros por función (máx) | 8 |
| Funciones sobre umbral (complejidad > 8) | 6 |
| Funciones sobre umbral (líneas > 30) | 5 |
| Funciones sobre umbral (parámetros > 4) | 1 |
| Violaciones de la config de calidad | 126 |
| Código duplicado (jscpd) | 4.3 % (2 clones) |

Funciones más complejas:

| Función | Archivo | Complejidad | Líneas | Parámetros |
|---|---|---|---|---|
| registrarSolicitud | src/gestor.ts:31 | 43 | 119 | 8 |
| buscar | src/gestor.ts:221 | 30 | 83 | 4 |
| cambiarEstado | src/gestor.ts:158 | 21 | 39 | 2 |
| generarReporte | src/gestor.ts:327 | 17 | 57 | 0 |
| main | src/cli.ts:4 | 13 | 45 | 1 |
| asignarResponsable | src/gestor.ts:198 | 9 | 22 | 2 |
| mostrar | src/gestor.ts:305 | 6 | 21 | 1 |
| constructor | src/gestor.ts:13 | 3 | 9 | 0 |

Violaciones por regla: `eqeqeq`: 75, `no-magic-numbers`: 22, `complexity`: 6, `@typescript-eslint/no-explicit-any`: 6, `max-lines-per-function`: 5, `sonarjs/cognitive-complexity`: 5, `@typescript-eslint/no-unused-vars`: 2, `no-empty`: 1, `max-params`: 1, `prefer-const`: 1, `sonarjs/no-duplicate-string`: 1, `max-lines`: 1
