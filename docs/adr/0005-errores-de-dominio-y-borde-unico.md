# ADR-0005 — Excepciones de dominio y un único borde que las traduce

- **Estado:** aceptada
- **Fecha:** 2026-11-07
- **Etapa:** 4 (refactoring) — R6 `ddd74a0`, R11b `615acc3`

## Contexto

La v1 informaba errores con `return -1` / `return false` (18 retornos), imprimía el mensaje dentro
de la lógica y tenía un `catch (e) {}` vacío (S8). Quien llamaba tenía que acordarse de revisar el
valor devuelto.

## Decisión

- El dominio y los servicios **lanzan** subclases de `ErrorDeDominio` con el mensaje para el
  usuario (`ErrorDeValidacion`, `SolicitudInexistente`, `SolicitudDuplicada`,
  `TransicionNoPermitida`, `ReasignacionNoPermitida`, `BaseDeDatosCorrupta`).
- `ejecutarComando` (borde de la CLI) es el único lugar que atrapa `ErrorDeDominio`, imprime
  `ERROR: <mensaje>` y devuelve código de salida 1. Cualquier otra excepción se relanza: es un bug.
- Los mensajes **no** llevan el prefijo `ERROR:`; lo agrega la presentación.

## Consecuencias

- (+) No se puede ignorar un error por olvido; los servicios se prueban con `toThrow(Clase)`.
- (+) Un solo lugar decide cómo se muestran los errores.
- (−) Por paridad exacta con la v1 (la suite de caracterización lo exige) los errores siguen yendo
  a la salida estándar. Pasarlos a `stderr` es un cambio visible y queda como mejora futura.
