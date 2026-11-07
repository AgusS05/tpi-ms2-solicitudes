# Guía de contribución

## Flujo de trabajo

1. Crear una rama desde `main`: `refactor/extract-method-filtro`, `fix/…`, `docs/…`, `test/…`.
2. Hacer cambios **pequeños**: un cambio lógico por commit.
3. Antes de cada commit: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`.
4. Abrir un Pull Request con la plantilla; **lo revisa una persona distinta de quien lo escribió**
   usando la checklist de `docs/07-code-review.md`.
5. Integrar solo con el CI en verde.

## Mensajes de commit

Formato: `tipo(alcance): resumen en presente`, por ejemplo
`refactor(R8): Move Method de vencimiento a Solicitud (S7)`.

| Tipo       | Uso                                                              |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | Funcionalidad nueva                                              |
| `fix`      | Corrección de un defecto (**cambia el comportamiento**: va solo) |
| `refactor` | Cambia la estructura, **no** el comportamiento                   |
| `test`     | Pruebas                                                          |
| `docs`     | Documentación y evidencias                                       |
| `style`    | Solo formato                                                     |
| `chore`    | Herramientas y configuración                                     |

## Reglas de oro del refactoring

- Las pruebas tienen que estar en verde **antes** y **después**.
- Un refactoring no modifica pruebas. Si hace falta modificar una, es un cambio de
  comportamiento y va en otro commit.
- Si aparece un defecto mientras se refactoriza, se anota y se corrige después, por separado.

## Convenciones de código

- TypeScript `strict`, sin `any`.
- La lógica de negocio no usa `fs`, `process`, `console` ni `new Date()`: depende de puertos
  (`src/aplicacion/puertos.ts`).
- Las reglas de negocio nuevas son datos (`reglas-por-tipo.ts`, `estado.ts`), no `if/else`.
- Constantes con nombre en `src/dominio/reglas-de-negocio.ts`.
- Los errores son subclases de `ErrorDeDominio`.
- Datos de ejemplo siempre **sintéticos**.

## Tags del trabajo

| Tag                    | Qué marca                                                                         |
| ---------------------- | --------------------------------------------------------------------------------- |
| `estado-inicial`       | v1 con deuda técnica sin tratar                                                   |
| `etapa-diagnostico`    | Diagnóstico y code smells completos                                               |
| `etapa-refactoring`    | Refactorings terminados                                                           |
| `etapa-pruebas`        | Pruebas antes/después y evidencia de la v2                                        |
| `etapa-docs`           | Documentación completa                                                            |
| `estado-refactorizado` | Versión final (alias: `estadorefactorizado`, como figura en el PDF de la cátedra) |
