# 7. Code review: checklist, aplicación y registro

El code review es una verificación hecha por una persona distinta de quien escribió el cambio. Las
pruebas automáticas y el linter encuentran cierto tipo de errores; la revisión humana encuentra los
que son "correctos para la máquina pero equivocados para el negocio" (ver hallazgo CR-01).

## 7.1 Checklist de code review (la que se usa en cada Pull Request)

Esta lista también está en `.github/PULL_REQUEST_TEMPLATE.md`, para que cada PR la traiga marcada.

**A. Corrección y comportamiento**

- [ ] El cambio hace lo que dice el título del PR y nada más (sin cambios oportunistas).
- [ ] Un refactoring **no cambia comportamiento**: las pruebas existentes pasan sin modificarse. Si se modificó una prueba, está justificado en la descripción y va en un commit aparte.
- [ ] Se leyó el diff completo, no solo el resumen: se buscan reemplazos masivos que hayan tocado de más.
- [ ] Hay pruebas nuevas para el comportamiento nuevo o para el bug corregido.
- [ ] Se cubren los casos borde (vacío, límite inferior/superior, orden de validaciones).

**B. Diseño (SOLID)**

- [ ] **SRP**: cada clase/función tiene una sola razón para cambiar y se puede describir sin usar "y".
- [ ] **OCP**: una variante nueva del negocio se agrega con datos o clases nuevas, no editando cadenas `if/else`.
- [ ] **LSP**: una implementación nueva de una interfaz cumple las mismas promesas (¿pasa la prueba de contrato?).
- [ ] **ISP**: nadie depende de métodos que no usa.
- [ ] **DIP**: la lógica de negocio no importa `fs`, `process`, `console` ni usa `new Date()` directamente.

**C. Clean Code**

- [ ] Nombres que revelan intención; sin abreviaturas ni `data`, `tmp`, `x`.
- [ ] Funciones ≤ 30 líneas, complejidad ≤ 8, ≤ 4 parámetros (`pnpm lint:calidad` sin avisos nuevos).
- [ ] Sin números ni textos mágicos: constantes con nombre.
- [ ] Sin código muerto, sin código comentado, sin `TODO` sin dueño.
- [ ] Sin duplicación nueva (`pnpm duplicacion`).
- [ ] Los errores son excepciones del dominio; no hay `catch` vacíos ni códigos de retorno.
- [ ] Los comentarios explican el **porqué**, no repiten el código.

**D. Tipos y datos**

- [ ] Sin `any`; los valores del dominio usan tipos propios (no `string` sueltos).
- [ ] Constantes distintas con el mismo valor textual no se pueden confundir (ver CR-01).
- [ ] Los datos de prueba y de ejemplo son **sintéticos** (sin datos personales reales).

**E. Proceso**

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` y `pnpm test` pasan (lo verifica el CI).
- [ ] Mensajes de commit claros (`tipo(alcance): resumen`), un cambio lógico por commit.
- [ ] La documentación y el README reflejan el cambio.

## 7.2 Registro de revisión

> **Completar antes de entregar.** Los hallazgos CR-01 a CR-05 son reales: ocurrieron durante el
> trabajo y se detectaron al revisar el diff o al medir. Falta que **quien revisó cada cambio**
> deje su nombre: la consigna pide que la revisión la haga una persona distinta de la que
> escribió el código (por ejemplo, cada integrante revisa un tramo de los commits que no
> escribió).

| Nº  | Alcance revisado                | Autor del cambio | Revisor       | Resultado                     |
| --- | ------------------------------- | ---------------- | ------------- | ----------------------------- |
| 1   | R1–R4 (`6ee5d9b`…`1529078`)     | _(completar)_    | _(completar)_ | Observaciones CR-01           |
| 2   | R5–R8 (`3803ee5`…`bdf7ab5`)     | _(completar)_    | _(completar)_ | Sin observaciones bloqueantes |
| 3   | R9–R11 (`90af539`…`615acc3`)    | _(completar)_    | _(completar)_ | Observaciones CR-02, CR-04    |
| 4   | R12–R14 y `fix(S8)`             | _(completar)_    | _(completar)_ | Observaciones CR-03           |
| 5   | Pruebas v2 y prueba diferencial | _(completar)_    | _(completar)_ | Observación CR-05             |

## 7.3 Hallazgos

| ID        | Dónde                     | Qué se encontró                                                                                                                                              | Sección de la checklist                                | Cómo se resolvió                                                                                                                         |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **CR-01** | R4, regla de EQUIVALENCIA | Un reemplazo masivo confundió `TipoSolicitud.BAJA` con `Prioridad.BAJA`. Ambas valen `'BAJA'`, así que **las 109 pruebas pasaban**, pero el código leía mal. | A (leer el diff completo), D (constantes confundibles) | Corregido a mano en el mismo commit. Mejora posible: tipos nominales (_branded types_) para que el compilador distinga ambas constantes. |
| **CR-02** | R11a, `cli.ts`            | Tras un reemplazo de texto quedó una llamada duplicada a `generar()` (el reporte se calculaba dos veces).                                                    | A                                                      | Simplificado antes del commit.                                                                                                           |
| **CR-03** | R13                       | El repositorio en memoria duplicaba 15 líneas del JSON; lo detectó `jscpd` al medir.                                                                         | C (duplicación)                                        | R14: Pull Up Method con un gancho `alGuardar`. Duplicación 1,6 % → 0 %.                                                                  |
| **CR-04** | R12 (mensaje de commit)   | El commit se etiquetó "S4" pero resuelve complejidad residual (familia S2).                                                                                  | E                                                      | No se reescribió la historia (los tags ya apuntaban a esos commits); se aclara en el documento 05.                                       |
| **CR-05** | Prueba diferencial        | El primer generador de secuencias no detectaba la mutación `APROBADA → PENDIENTE` porque casi nunca registraba solicitudes válidas.                          | A (casos borde)                                        | Generador sesgado a datos válidos + matriz exhaustiva de transiciones; las 5 mutaciones de control se detectan.                          |

**Observaciones abiertas (no bloqueantes, quedan como deuda técnica consciente):**

1. Los errores se imprimen por la salida estándar con el prefijo `ERROR:` (paridad con la v1). Lo
   correcto sería `stderr`.
2. `--dias 1.5` se acepta (herencia de la v1); un plazo en días enteros sería más coherente.
3. Las fechas se calculan en UTC: cerca de medianoche en Argentina (UTC−3) el "hoy" puede diferir
   del calendario local.
4. Las advertencias `no-magic-numbers` restantes (8) son aceptables según el documento 04.
5. Todos los commits del repositorio llevan el mismo autor. Conviene que cada integrante revise y
   mergee mediante Pull Requests para que la historia refleje la participación real.
