# ADR-0006 — Un archivo de datos dañado se informa y no se sobrescribe

- **Estado:** aceptada (**cambio de comportamiento deliberado**)
- **Fecha:** 2026-11-07
- **Etapa:** 4 — commit `0abaec7`

## Contexto

El constructor de la v1 leía el archivo dentro de un `try { … } catch (e) {}` vacío. Si el JSON
estaba corrupto, el sistema arrancaba con la lista vacía y **el siguiente guardado sobrescribía el
archivo**: pérdida silenciosa de datos (S8, el hallazgo de mayor impacto). La suite de
caracterización lo había fijado como `DEFECTO CONOCIDO`.

## Decisión

Distinguir dos situaciones:

1. El archivo **no existe** (primer uso): se arranca vacío, como antes.
2. El archivo **existe pero no se puede interpretar**: se lanza `BaseDeDatosCorrupta`, la CLI
   informa el error con código 1 y **el archivo no se modifica**.

Es la única diferencia de comportamiento entre la v1 y la v2. Va en un commit `fix:` propio,
separado de los refactorings, y actualiza el único test que fijaba el defecto (ahora
`CAMBIO DELIBERADO`). La prueba diferencial la documenta como excepción explícita.

## Consecuencias

- (+) Nunca se pierden datos por un archivo dañado; el usuario puede repararlo o restaurarlo.
- (+) Mezclar un cambio de comportamiento con refactorings habría invalidado la afirmación
  «el refactoring no cambia el comportamiento»; por eso se separó.
- (−) Quien dependiera (sin saberlo) de que el sistema «se recupere solo» ahora ve un error.
  Se considera preferible a perder datos.
