# ADR-0003 — Separar el núcleo de la infraestructura con puertos y adaptadores

- **Estado:** aceptada
- **Fecha:** 2026-11-07
- **Etapa:** 4 (refactoring) — R10 `78a4022`, R11 `8a86aee` / `615acc3`, R13 `74e4cf7`

## Contexto

`GestorSolicitudes` usaba `fs`, `new Date()`, `process.env` y `console.log` (42 llamadas) dentro de
la lógica de negocio (S11). Eso hacía imposible probar una regla sin disco, reloj real y captura de
consola, y mezclaba cinco razones de cambio (S1).

## Decisión

Organizar `src/` en capas con dependencias hacia adentro:

```
presentacion  → aplicacion → dominio
infraestructura ─────────────↗ (implementa los puertos de aplicacion)
cli.ts: raíz de composición (único lugar que conoce las implementaciones concretas)
```

- `dominio/`: entidades, objetos de valor, reglas; sin E/S.
- `aplicacion/`: casos de uso y **puertos** (`LectorDeSolicitudes`, `EscritorDeSolicitudes`,
  `Reloj`).
- `infraestructura/`: adaptadores (`RepositorioJson…`, `RepositorioEnMemoria…`, `RelojDelSistema`).
- `presentacion/`: comandos y formato de texto.

El repositorio se parte en lector y escritor (ISP) para que los reportes solo reciban lo que
necesitan.

## Consecuencias

- (+) Los casos de uso se prueban con un repositorio en memoria y un `RelojFijo`.
- (+) Cambiar el almacenamiento (JSON → base de datos) afecta a un único archivo.
- (+) Una prueba de contrato garantiza que cualquier repositorio sea intercambiable (LSP).
- (−) Más archivos y más indirección: 2 archivos / 415 líneas pasaron a 21 / 759. Se acepta
  porque cada pieza es corta, tiene nombre y se puede probar.

## Alternativas descartadas

- _Mantener una clase y solo extraer métodos:_ no resuelve el acoplamiento a `fs`/`Date`.
- _Un framework de inyección de dependencias:_ sobredimensionado para este alcance; el armado a
  mano en `cli.ts` es de 10 líneas.
