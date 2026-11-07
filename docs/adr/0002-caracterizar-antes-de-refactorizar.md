# ADR-0002 — Escribir pruebas de caracterización antes de refactorizar

- **Estado:** aceptada
- **Fecha:** 2026-11-07
- **Etapa:** 3 (pruebas previas) — commit `926f4c9`

## Contexto

La v1 no tiene pruebas y su lógica está en una sola clase con 119 líneas y complejidad 43 en la
función principal. Refactorizar sin red de seguridad significa no poder saber si se rompió algo.
Las reglas del negocio (plazos, prioridades, orden de validaciones, texto de los mensajes) no
están documentadas en otro lugar: **el código es la especificación**.

## Decisión

Antes de cambiar una línea de producción se escribe una suite de **caracterización** que fija el
comportamiento observable de la v1 desde afuera (comandos de la CLI, salida, código de salida y
archivo de datos), incluidas sus rarezas. Los defectos conocidos se prueban _como defectos_
(`DEFECTO CONOCIDO`) en lugar de ocultarlos. La suite se valida con mutaciones manuales.

## Consecuencias

- (+) Cada refactoring se verifica en segundos y sin modificar las pruebas.
- (+) Las pruebas de caja negra sobreviven al cambio de estructura interna (la v2 reemplazó casi
  todo el código y las 109 pruebas siguen valiendo).
- (−) Fijan también comportamientos accidentales (p. ej. `--dias 1.5` se acepta). Se documentan como
  deuda en el documento 07.
- (−) Son más lentas que unitarias (levantan la CLI completa), pero 109 casos corren en < 1 s.

## Alternativas descartadas

- _Refactorizar y probar a mano:_ no reproducible ni defendible.
- _Escribir solo pruebas unitarias de la v2:_ no demostrarían equivalencia con la v1.
