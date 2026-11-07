# 6. Pruebas y verificación (antes y después)

La estrategia sigue la regla de oro del refactoring: **primero una red de seguridad, después los
cambios**. Como la v1 no tenía ninguna prueba, la primera tarea fue escribirlas _contra la v1
sin tocarla_, y recién entonces refactorizar.

## 6.1 Resumen

|                                       | Antes del refactoring (v1)                           | Después (v2)                                                                              |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Pruebas automáticas                   | 0 al recibir el sistema → **109** de caracterización | **253** en 10 archivos                                                                    |
| Tipo de pruebas                       | Caja negra por la CLI                                | Caja negra (las mismas 109, sin modificar salvo una) + unitarias + contrato + diferencial |
| Cobertura de sentencias / ramas       | 99,63 % / 96,6 %                                     | 99,14 % / 96,9 %                                                                          |
| Sensibilidad (mutaciones manuales)    | 15 de 15 detectadas                                  | 23 de 23 detectadas                                                                       |
| Se pueden probar sin disco ni consola | No                                                   | Sí (servicios, dominio y formato)                                                         |

Evidencia: `docs/evidencias/tests-v1.txt`, `tests-v2.txt`, `cobertura-v1.txt`, `cobertura-v2.txt`,
`mutaciones-v1.md`, `mutaciones-v2.md`. Todo se reproduce con `pnpm test`, `pnpm coverage` y
`node scripts/mutaciones.mjs v2`.

## 6.2 Pruebas de caracterización sobre la v1 (`tests/comportamiento.test.ts`)

Una prueba de caracterización **no dice cómo debería comportarse el sistema: fija cómo se
comporta hoy**, incluidas sus rarezas. Así el refactoring puede demostrar que no cambió nada.

- Ejecutan los comandos reales de la CLI (`main(args)`) con una base de datos temporal y el reloj
  simulado en `2026-11-07T12:00:00Z` (determinismo).
- Estructura Arrange–Act–Assert, nombres que describen el comportamiento y un helper común
  (`tests/helpers/sistema.ts`).
- Cubren: 5 tipos × reglas de prioridad/plazo/área, validaciones campo por campo y su orden,
  duplicados, la **matriz completa de 25 transiciones** de estado, reasignación, búsqueda con
  filtros combinados, reporte con vencidas y próximas a vencer, persistencia entre ejecuciones,
  códigos de salida y texto de ayuda.
- Un test documentó un defecto de la v1 en lugar de ocultarlo: _"DEFECTO CONOCIDO (S8): un archivo
  de datos corrupto se ignora en silencio y se sobrescribe"_. Es el único que se modificó durante
  el refactoring, en el commit `fix(S8)` (`0abaec7`), y quedó como _"CAMBIO DELIBERADO"_.

**¿Cómo sabemos que la red de seguridad es buena?** La cobertura mide qué líneas se ejecutan, no
si las pruebas _detectarían_ un error. Por eso se hizo además una **verificación por mutaciones
manuales** (`scripts/mutaciones.mjs`): se introduce un defecto deliberado (por ejemplo, plazo de
CERTIFICADO 5 → 6, permitir reasignar una solicitud cerrada, perder el relleno de ceros del
identificador), se corre la suite y se exige que falle. Resultado en la v1: **15 de 15** detectadas.

## 6.3 Pruebas nuevas de la v2

| Archivo                                              | Qué verifica                                                                                                                                           | Casos |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `tests/dominio/valores.test.ts`                      | `Email`, fechas (cruce de mes/año), catálogos de tipos/estados/prioridades, tabla de transiciones exhaustiva.                                          | 16    |
| `tests/dominio/reglas-por-tipo.test.ts`              | Prioridad, plazo y área por tipo; tope de prioridad ALTA; el plazo explícito prevalece.                                                                | 10    |
| `tests/dominio/solicitud.test.ts`                    | Vencimiento (bordes: día exacto, 2 días antes), `cambiarEstado`, `reasignar` y su orden de validación, ida y vuelta por registro.                      | 17    |
| `tests/dominio/validacion.test.ts`                   | `validarDatosNuevaSolicitud` (9 rechazos parametrizados, orden, límites 1 y 60) y `FiltroSolicitudes`.                                                 | 20    |
| `tests/aplicacion/servicio-solicitudes.test.ts`      | Casos de uso con repositorio en memoria y reloj fijo: ids correlativos, duplicados, atomicidad ante datos inválidos, historial con la fecha del reloj. | 20    |
| `tests/aplicacion/servicio-reportes.test.ts`         | Reporte en cero, conteos, vencidas/por vencer con el reloj avanzando.                                                                                  | 4     |
| `tests/presentacion/formato.test.ts`                 | Texto de cada comando como función pura.                                                                                                               | 6     |
| `tests/infraestructura/contrato-repositorio.test.ts` | **Contrato (LSP)** sobre las dos implementaciones + persistencia, formato en disco y archivos dañados.                                                 | 17    |
| `tests/equivalencia-v1-v2.test.ts`                   | **Prueba diferencial** v1 ↔ v2 (6.4).                                                                                                                  | 34    |
| `tests/comportamiento.test.ts`                       | Las 109 de caracterización.                                                                                                                            | 109   |

_(Los conteos por archivo son los de `docs/evidencias/tests-v2.txt`; el total es 253.)_

## 6.4 Prueba diferencial v1 ↔ v2 (`tests/equivalencia-v1-v2.test.ts`)

La v1 original está congelada en `legacy/v1-estado-inicial/` (copiada del tag `estado-inicial`).
La prueba corre **la misma secuencia de comandos contra las dos versiones** y exige que coincidan,
comando por comando, la salida impresa, el código de salida y el archivo de datos.

1. **3 600 comandos aleatorios** (120 secuencias de 30), con semilla fija para que sea
   reproducible. El generador produce datos válidos casi siempre y, con 10 % de probabilidad por
   campo, un valor inválido; así llega a estados avanzados en lugar de fallar en la validación.
2. **Matriz exhaustiva** de las 25 transiciones y de `asignar` en cada uno de los 5 estados.
3. **Compatibilidad de datos en ambos sentidos**: una base creada por la v1 se sigue usando con la
   v2 (continúa la numeración y el historial) y viceversa.
4. **La única diferencia intencional**, documentada como test: ante un archivo dañado la v1 lo
   pisa y la v2 lo conserva y avisa.

Verificación de la propia prueba (mutaciones de control sobre la v2): plazo de EQUIVALENCIA
15 → 14, tope de prioridad ALTA 3 → 4, ventana de aviso `<=` → `<`, plazo máximo 60 → 61 y
APROBADA → PENDIENTE permitida; las cinco hicieron fallar la prueba. Un hallazgo del proceso:
**la primera versión del generador no detectaba la última** (las secuencias casi nunca llegaban a
registrar una solicitud válida y pasarla a APROBADA), y por eso se sumó la matriz exhaustiva.
Mostrar este tipo de límite es parte de la verificación.

## 6.5 Mutaciones sobre la v2 (23 de 23)

Las 15 de la v1 traducidas a la nueva estructura, más 8 que apuntan a lo agregado: regresión del
fix del archivo dañado, email sin validar la arroba, descripción sin recortar, responsable
indicado ignorado, plazo explícito que deja de prevalecer, orden del reporte invertido,
reasignación con responsable vacío y aprobadas contadas como abiertas. Detalle y cantidad de
pruebas que falla cada una en `docs/evidencias/mutaciones-v2.md`.

## 6.6 Cobertura

`pnpm coverage` (proveedor v8): **99,14 %** de sentencias, **96,9 %** de ramas, **100 %** de
funciones. Lo no cubierto: la guarda de ejecución directa de `cli.ts` (`import.meta.url`), que no corre al
importar `main` desde las pruebas, y la rama que relanza los errores que **no** son de dominio en
`comandos.ts` (línea 81), para la cual no hay un camino alcanzable desde la CLI con datos
válidos o inválidos.

## 6.7 Cómo reproducir todo

```bash
pnpm install
pnpm test                       # 253 pruebas
pnpm coverage                   # cobertura v8
node scripts/mutaciones.mjs v2  # 23 mutaciones (≈ 1 min)
pnpm metricas                   # complejidad, tamaño de funciones, duplicación
pnpm typecheck && pnpm lint && pnpm format:check
```
