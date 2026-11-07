# ADR-0001 — Stack tecnológico: TypeScript estricto sobre Node.js

- **Estado:** aceptada
- **Fecha:** 2026-11-07
- **Etapa:** 1 (sistema base) — commit `ec760e2`

## Contexto

El trabajo necesita un lenguaje con tipos (para poder demostrar el _Primitive Obsession_ y su
solución), herramientas maduras de análisis estático y pruebas, y una instalación simple en las
máquinas de los tres integrantes.

## Decisión

- **TypeScript 5.9 en modo `strict`** sobre **Node.js 22**, gestor **pnpm**.
- **Vitest** para pruebas y cobertura (v8); ejecuta TypeScript sin paso de compilación.
- **ESLint** (typescript-eslint + sonarjs) para calidad estática, con dos configuraciones: una
  _base_ para el día a día y otra _de calidad_ con umbrales (complejidad 8, 30 líneas por función,
  4 parámetros) que alimenta las métricas del informe.
- **Prettier** para formato y **jscpd** para duplicación.
- Persistencia en **archivo JSON** (la consigna pide persistir o simular; no justifica una base).

TypeScript se fijó en `~5.9` porque `typescript-eslint` todavía no admitía la versión siguiente.

## Consecuencias

- (+) El compilador detecta clases enteras de errores (`strict`, tipos cerrados).
- (+) Todas las métricas del informe se reproducen con un comando.
- (−) Hace falta Node y pnpm instalados; se documenta en el README.

## Alternativas descartadas

- _Python:_ válido, pero sin tipado estático por defecto el smell de _Primitive Obsession_ se
  demostraría peor.
- _Java:_ más pesado de instalar y configurar para un trabajo de este tamaño.
