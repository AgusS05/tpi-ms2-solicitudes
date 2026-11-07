# 5. Refactoring: técnicas aplicadas y trazabilidad smell → commit

Regla de trabajo (Fowler): **un refactoring por commit, con la suite de pruebas en verde antes y
después, sin modificar las pruebas**. La única excepción es el commit `fix(S8)`, que cambia un
comportamiento a propósito y por eso va separado y actualiza el único test que fijaba el defecto.

Cada fila se puede revisar con `git show <hash>`. Todos los hashes están en la rama `main`.

## 5.1 Tabla de trazabilidad

| ID   | Commit    | Técnica (Fowler)                                                                     | Smell que resuelve                      | Qué cambió                                                                                                                                                      | Principio         |
| ---- | --------- | ------------------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| R1   | `6ee5d9b` | **Extract Method**                                                                   | S2 Long Method                          | `registrarSolicitud` se divide en pasos con nombre (validar, resolver condiciones, armar, guardar). Complejidad **43 → 4**, **119 → 60** líneas.                | Clean Code        |
| R2   | `3bd5c02` | **Extract Method**                                                                   | S5 Duplicated Code (a, e)               | La búsqueda por id (×3) y `new Date().toISOString().slice(0,10)` (×3) pasan a un método cada uno.                                                               | DRY               |
| R3   | `07ca4de` | **Introduce Parameter Object**                                                       | S3 Long Parameter List                  | 8 parámetros `string` → `DatosNuevaSolicitud`.                                                                                                                  | Clean Code        |
| R4   | `1529078` | Replace Type Code (con tipos cerrados) + Replace Magic Number with Symbolic Constant | S4, S9                                  | `tipo`/`estado`/`prioridad` pasan a tipos cerrados; los números mágicos a `reglas-de-negocio.ts`.                                                               | Clean Code        |
| R5   | `3803ee5` | Replace Conditional with Polymorphism (versión por tabla de datos)                   | S6 / violación de OCP                   | Cadena `if/else if` por tipo → `REGLAS_POR_TIPO`; transiciones → `TRANSICIONES`.                                                                                | **OCP**           |
| R6   | `ddd74a0` | Replace Error Code with Exception                                                    | S8                                      | `return -1` / `false` → jerarquía `ErrorDeDominio`; un único punto traduce a mensaje y código de salida.                                                        | Clean Code        |
| R7   | `bd548d5` | Extract Class                                                                        | S4, S13 Data Clump                      | Nacen `Solicitud`, `Email` y `Estudiante`; se acaban los objetos `any`.                                                                                         | **SRP**           |
| R8   | `bdf7ab5` | **Move Method**                                                                      | S7 Feature Envy, S1                     | `estaVencida`, `diasParaVencer`, `estaPorVencer`, `cambiarEstado` y `reasignar` pasan del gestor/reporte a `Solicitud`.                                         | **SRP**, cohesión |
| R9   | `90af539` | **Introduce Parameter Object** + consolidación                                       | S5 (b, d)                               | Los 4 filtros copiados → `FiltroSolicitudes` (criterios como objeto, validación única).                                                                         | DRY               |
| R10  | `78a4022` | Extract Interface + Extract Class                                                    | S11 Acoplamiento a infraestructura      | Puertos `Lector`/`Escritor`/`Reloj`; `RepositorioJson…` y `RelojDelSistema` extraídos.                                                                          | **DIP, ISP**      |
| R11a | `8a86aee` | Extract Class                                                                        | S1 God Class                            | Reporte → `ServicioDeReportes` (datos) + `formato.ts` (texto).                                                                                                  | **SRP**           |
| R11b | `615acc3` | Extract Class                                                                        | S1 God Class                            | Casos de uso → `ServicioDeSolicitudes`; CLI → tabla de comandos; se **elimina `gestor.ts`**.                                                                    | **SRP**, OCP      |
| R12  | `dfebe07` | Extract Method                                                                       | Complejidad residual de los validadores | `validarDatosNuevaSolicitud` 15 → 3 y `FiltroSolicitudes.desde` 11 → 3. (El mensaje del commit lo etiqueta "S4"; en rigor es complejidad residual, familia S2.) | Clean Code        |
| R13  | `74e4cf7` | Extract Interface (2.ª implementación)                                               | S11                                     | `RepositorioEnMemoriaDeSolicitudes`: el núcleo se ejecuta sin disco.                                                                                            | **LSP, DIP**      |
| FIX  | `0abaec7` | _(cambio de comportamiento deliberado)_                                              | S8                                      | Un archivo de datos dañado se informa (`BaseDeDatosCorrupta`, código 1) y **no se sobrescribe**.                                                                | Clean Code        |
| R14  | `e33c12e` | Pull Up Method (Template Method)                                                     | S5                                      | jscpd detectó un clon de 15 líneas **introducido por R13**; lo común sube a la clase base. Duplicación 1,6 % → 0 %.                                             | DRY               |

Cobertura de los requisitos de la consigna:

| Requisito                                  | Cumplimiento                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| ≥ 4 refactorings                           | 15 commits de refactoring (R1–R14, con R11 en dos pasos), más un `fix` aparte. |
| **Extract Method** obligatorio             | R1, R2, R12.                                                                   |
| **Move Method** obligatorio                | R8.                                                                            |
| **Introduce Parameter Object** obligatorio | R3 y R9.                                                                       |
| Smells resueltos                           | S1–S13 (ver 5.3).                                                              |

## 5.2 Cuatro refactorings, antes y después

### R1 — Extract Method (S2)

Antes (`registrarSolicitud`, 119 líneas, complejidad 43): validaciones, reglas por tipo,
duplicados, armado, persistencia y mensaje en un único bloque.

Después: lee de arriba abajo como una receta. (Se muestra la forma final, ya movida a
`ServicioDeSolicitudes.registrar` en `servicio-solicitudes.ts`; en el commit R1 el método todavía
vivía en `gestor.ts`.)

```ts
registrar(datos: DatosNuevaSolicitud): Solicitud {
  const nueva = validarDatosNuevaSolicitud(datos);
  const condiciones = resolverCondiciones(nueva.tipo, nueva.prioridad, nueva.plazoDias);
  this.verificarQueNoHayUnaActiva(nueva.estudiante.legajo, nueva.tipo);
  // … arma la Solicitud con id, fechas e historial inicial …
  this.repositorio.guardar(solicitud);
  return solicitud;
}
```

### R3 — Introduce Parameter Object (S3)

```ts
// antes: 8 strings intercambiables sin aviso del compilador
registrarSolicitud(legajo, nombre, email, tipo, descripcion, prioridad, dias, responsable)

// después: un objeto con nombre por campo
registrar(datos: DatosNuevaSolicitud)
```

### R5 — Reemplazo de la cadena condicional por una tabla (S6, OCP)

```ts
// antes: if (tipo == 'CERTIFICADO') {…} else if (tipo == 'EQUIVALENCIA') {…} else if …  (×4 lugares)
// después: una entrada por tipo; el compilador obliga a completarla
export const REGLAS_POR_TIPO: Readonly<Record<TipoSolicitud, ReglaDeTipo>> = {
  CERTIFICADO: { prioridadPorDefecto: Prioridad.MEDIA, plazoDias: 5, areaResponsable: 'Alumnado' },
  // …
};
```

### R8 — Move Method (S7)

La regla "una solicitud está vencida" usaba solo datos de la solicitud pero vivía en el reporte,
con aritmética de fechas incluida. Ahora es un método de `Solicitud`:

```ts
estaVencida(hoy: FechaISO): boolean {
  return this.estaAbierta() && this.diasParaVencer(hoy) < 0;
}
```

Se puede probar sin reporte, sin disco y sin reloj (`tests/dominio/solicitud.test.ts`).

## 5.3 Estado final de cada smell

| ID  | Smell                          | Estado en la v2                                                                                                                                                                                     | Refactorings   |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| S1  | God Class                      | Resuelto: `gestor.ts` eliminado; sus responsabilidades se reparten en `Solicitud`, `ServicioDeSolicitudes`, `ServicioDeReportes`, `formato.ts`, `comandos.ts` y los adaptadores de infraestructura. | R8, R11a, R11b |
| S2  | Long Method                    | Resuelto: máximo 21 líneas y complejidad 8.                                                                                                                                                         | R1, R12        |
| S3  | Long Parameter List            | Resuelto: máximo 4 parámetros.                                                                                                                                                                      | R3             |
| S4  | Primitive Obsession            | Resuelto: tipos cerrados, `Email`, `Estudiante`, `FechaISO`, 0 `any`.                                                                                                                               | R4, R7         |
| S5  | Duplicated Code                | Resuelto: 4,3 % → 0 %. Un clon nuevo (R13) se detectó y se eliminó (R14).                                                                                                                           | R2, R9, R14    |
| S6  | Cadenas condicionales / OCP    | Resuelto: tablas de datos; extensión verificada con el experimento.                                                                                                                                 | R5             |
| S7  | Feature Envy                   | Resuelto.                                                                                                                                                                                           | R8             |
| S8  | Manejo de errores              | Resuelto, incluido el catch vacío (cambio deliberado en `0abaec7`).                                                                                                                                 | R6, FIX        |
| S9  | Magic Numbers                  | Resuelto salvo 4 factores dentro de la propia constante `MS_POR_DIA` y 4 usos no de negocio (documento 04).                                                                                         | R4             |
| S10 | Nombres poco expresivos        | Resuelto, de forma transversal a R1–R12.                                                                                                                                                            | R1, R4, R7     |
| S11 | Acoplamiento a infraestructura | Resuelto: `fs`, `Date`, `process.env`, `console` confinados al borde.                                                                                                                               | R10, R13       |
| S12 | Código muerto                  | Resuelto: desaparecido con `gestor.ts`; ESLint base sin hallazgos.                                                                                                                                  | R11b           |
| S13 | Data Clump                     | Resuelto: entidad `Estudiante`.                                                                                                                                                                     | R7             |

## 5.4 Antes y después (métricas medidas)

| Métrica                                                    | v1 `estado-inicial` | v2 `estado-refactorizado`                                                                 |
| ---------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| Archivos / líneas de código                                | 2 / 415             | 21 / 759                                                                                  |
| Funciones y métodos                                        | 13                  | 102                                                                                       |
| Complejidad ciclomática (máx / prom)                       | 43 / 11,4           | 8 / 1,5                                                                                   |
| Líneas por función (máx / prom)                            | 119 / 31,3          | 21 / 4,9                                                                                  |
| Parámetros por función (máx)                               | 8                   | 4                                                                                         |
| Funciones sobre umbral (complejidad / líneas / parámetros) | 6 / 5 / 1           | 0 / 0 / 0                                                                                 |
| Violaciones de la config de calidad                        | 126                 | 8 (todas `no-magic-numbers`, ver documento 04)                                            |
| Código duplicado (jscpd)                                   | 4,3 % (2 clones)    | 0 % (0 clones)                                                                            |
| Comportamiento visible                                     | —                   | **Idéntico**: la demo de 13 comandos coincide byte a byte (`demo-v1.txt` = `demo-v2.txt`) |

Fuentes: `docs/evidencias/metricas-v1.md`, `metricas-v2.md`, `duplicacion-*.txt`, `demo-*.txt`.

## 5.5 Lecciones del proceso (errores reales cometidos y cómo se detectaron)

1. **R4: confusión entre `TipoSolicitud.BAJA` y `Prioridad.BAJA`.** Ambos valen `'BAJA'`; un
   reemplazo masivo puso el valor equivocado en la regla de EQUIVALENCIA. **Las 109 pruebas
   seguían en verde** porque ambas constantes son iguales en tiempo de ejecución. Se detectó al
   releer el diff. Moraleja: la revisión de código humana no es reemplazable por las pruebas, y
   los tipos nominales ayudarían (ver documento 07).
2. **R11a: llamada duplicada a `generar()`** tras un reemplazo de texto en `cli.ts`. La detectó la
   revisión del diff antes del commit.
3. **R13: un clon de 15 líneas** entre los dos repositorios. Lo detectó jscpd al medir; se
   resolvió con R14. Un refactoring puede introducir el smell que otro quitó.
4. **Mensaje de R1** decía "~40 líneas" sin medir; se corrigió con `git commit --amend` a los
   valores medidos (complejidad 43 → 4, 119 → 60 líneas).
5. **Formateo:** Prettier modificó archivos que ya se habían leído; se aprendió a releer antes de
   editar y a commitear el formato en commits `style:` separados.
