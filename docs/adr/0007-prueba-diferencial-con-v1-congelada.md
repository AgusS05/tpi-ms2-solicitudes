# ADR-0007 — Prueba diferencial contra la v1 congelada

- **Estado:** aceptada
- **Fecha:** 2026-11-07
- **Etapa:** 5 (pruebas) — commit `8830b3d`

## Contexto

Las 109 pruebas de caracterización cubren los casos que se pensaron. Un refactoring grande puede
alterar combinaciones que nadie pensó. El tag `estado-inicial` conserva la v1, pero para ejecutarla
junto a la v2 dentro de una misma prueba hace falta tener su código accesible.

## Decisión

Copiar `cli.ts` y `gestor.ts` del tag a `legacy/v1-estado-inicial/` (excluidos de ESLint y
Prettier, con un `LEEME.md`) y escribir `tests/equivalencia-v1-v2.test.ts`, que ejecuta secuencias
idénticas contra ambas versiones y compara salida, código de salida y archivo de datos:

- 3 600 comandos aleatorios con semilla fija, sesgados a datos válidos;
- matriz exhaustiva de transiciones y reasignación por estado;
- compatibilidad de la base de datos en ambos sentidos.

## Consecuencias

- (+) Evidencia fuerte de equivalencia, más allá de los casos escritos a mano.
- (+) La prueba se valida con mutaciones de control (y mostró un límite del primer generador).
- (−) El directorio `legacy/` duplica código que ya está en el historial. Es deliberado, está
  marcado como congelado y se puede borrar cuando la v2 deje de necesitar la comparación.
