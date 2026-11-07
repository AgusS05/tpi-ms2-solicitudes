# ADR-0004 — Reglas del negocio como tablas de datos (y no como jerarquía de clases)

- **Estado:** aceptada
- **Fecha:** 2026-11-07
- **Etapa:** 4 (refactoring) — R5 `3803ee5`

## Contexto

Las reglas por tipo (prioridad por defecto, plazo, área) y el circuito de estados estaban en
cadenas `if / else if` repetidas en 4 lugares (S6). Agregar un tipo obligaba a tocar código que ya
funcionaba (violación de OCP). La técnica clásica (_Replace Conditional with Polymorphism_)
propone una clase por tipo.

## Decisión

Usar **tablas de datos tipadas**: `REGLAS_POR_TIPO: Record<TipoSolicitud, ReglaDeTipo>` y
`TRANSICIONES: Record<Estado, Estado[]>`. Las tres reglas por tipo solo difieren en _valores_, no
en _comportamiento_, así que una clase por tipo sería ceremonia sin beneficio. `Record` hace que
el compilador exija la entrada de cada tipo nuevo.

## Consecuencias

- (+) Agregar `CAMBIO_CARRERA` requirió 2 archivos y 6 líneas agregadas
  (`docs/evidencias/experimento-extensibilidad.diff`).
- (+) Las reglas son legibles de un vistazo y se pueden probar enumerándolas.
- (−) Si en el futuro un tipo necesita **comportamiento** propio (p. ej. un flujo de aprobación
  distinto), habrá que pasar a polimorfismo o a una estrategia por tipo. Hoy no hay ese
  requerimiento (YAGNI).
