# 3. Deuda técnica y code smells

Se relevaron **13 problemas** de diseño e implementación en la versión inicial (la consigna exige
al menos 8). Cada uno incluye evidencia, ubicación, impacto, riesgo de mantenimiento y prioridad.
Las ubicaciones corresponden al tag `estado-inicial`.

## 3.1 Criterio de priorización

Para decidir el orden de corrección se usó una matriz simple y reproducible:

**Prioridad = Impacto × Frecuencia de cambio** (cada factor de 1 a 3)

- _Impacto_: 1 = molesta, 2 = encarece los cambios, 3 = puede producir errores graves o pérdida de datos.
- _Frecuencia de cambio_: 1 = casi nunca se toca, 2 = a veces, 3 = es la zona donde más cambia el negocio.
- _Resultado_: **Alta** si es 6 o más, **Media** de 3 a 5, **Baja** si es 2 o menos.

## 3.2 Inventario

| ID      | Smell                                                          | Evidencia y ubicación                                                                                                                                                                                                                                                                                                                                                                                  | Impacto                                                                              | Riesgo de mantenimiento                                                                | Prioridad           |
| ------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------- |
| **S1**  | **God Class** (Large Class)                                    | `GestorSolicitudes` (`gestor.ts:7-387`, 380 líneas) valida, aplica reglas, persiste en disco, formatea reportes e imprime por consola: 5 razones para cambiar. Viola SRP.                                                                                                                                                                                                                              | Cualquier cambio toca la misma clase; imposible trabajar en paralelo sin conflictos. | Alto: los cambios en una responsabilidad rompen otras.                                 | **Alta** (3×3 = 9)  |
| **S2**  | **Long Method**                                                | `registrarSolicitud` (`gestor.ts:31-156`): 119 líneas, complejidad ciclomática 43, hace validación, reglas por tipo, control de duplicados, armado del objeto, persistencia y mensaje.                                                                                                                                                                                                                 | Difícil de leer, de probar y de modificar con seguridad.                             | Alto: 43 caminos posibles; una regla nueva puede romper otra.                          | **Alta** (3×3 = 9)  |
| **S3**  | **Long Parameter List**                                        | `registrarSolicitud(legajo, nombre, email, tipo, descripcion, prioridad, dias, responsable)` — 8 parámetros del mismo tipo `string` (`gestor.ts:31-40`; llamado en `cli.ts:16-25`).                                                                                                                                                                                                                    | Fácil intercambiar argumentos por error sin que el compilador avise.                 | Medio-alto: agregar un dato obliga a cambiar firma y llamadores.                       | **Alta** (2×3 = 6)  |
| **S4**  | **Primitive Obsession**                                        | `tipo`, `estado` y `prioridad` son `string` libres comparados con **72 literales** repetidos; email y legajo son `string` sin tipo propio; fechas son `'YYYY-MM-DD'`; las solicitudes son `any` (`gestor.ts:8`).                                                                                                                                                                                       | El compilador no detecta un `'PENDEINTE'` mal escrito; reglas de formato dispersas.  | Alto: valores inválidos se propagan; no hay lugar único para validar.                  | **Alta** (3×2 = 6)  |
| **S5**  | **Duplicated Code**                                            | (a) búsqueda por id repetida 3 veces: `gestor.ts:158-163`, `198-203`, `305-310`; (b) 4 bloques de filtro casi idénticos en `buscar` (`249-284`); (c) 3 bucles de conteo en `generarReporte` (`332-358`); (d) validación de tipo/estado/prioridad repetida en `registrarSolicitud`, `buscar` y `cambiarEstado`; (e) `new Date().toISOString().slice(0, 10)` ×3. jscpd detecta 2 clones exactos (4,3 %). | Mismo cambio en varios lugares.                                                      | Alto: arreglar una validación en un lugar y olvidarla en otro produce inconsistencias. | **Alta** (3×3 = 9)  |
| **S6**  | **Cadenas condicionales / violación de OCP (Shotgun Surgery)** | Reglas por tipo en cadena `if / else if` (`gestor.ts:82-102`); transiciones de estado en otra cadena (`176-185`); la lista de tipos aparece en 4 lugares (`55`, `82`, `235`, `341`).                                                                                                                                                                                                                   | Agregar un tipo o estado obliga a modificar código que ya funciona.                  | Alto: es el cambio más probable del negocio.                                           | **Alta** (3×3 = 9)  |
| **S7**  | **Feature Envy**                                               | `generarReporte` (`gestor.ts:360-381`) calcula si una solicitud está vencida y cuántos días le quedan usando solo datos de la solicitud (`fechaLimite`, `estado`) y aritmética de fechas con `86400000`.                                                                                                                                                                                               | La regla "vencida" pertenece a la solicitud pero vive en el reporte.                 | Medio: no se puede reutilizar ni probar por separado.                                  | **Media** (2×2 = 4) |
| **S8**  | **Manejo de errores deficiente**                               | Errores informados con `return -1` / `return false` (18 retornos de error); tipos de retorno `any` (`gestor.ts:40`, `221`); `catch (e) {}` **vacío** al leer el archivo (`gestor.ts:20`): un JSON corrupto se ignora y el siguiente guardado lo **sobrescribe**.                                                                                                                                       | El llamador debe recordar chequear códigos; fallas graves quedan ocultas.            | **Muy alto**: riesgo de pérdida silenciosa de datos.                                   | **Alta** (3×2 = 6)  |
| **S9**  | **Magic Numbers y strings mágicos**                            | `10` (largo mínimo de descripción), `60` (plazo máximo), `3` (plazo de prioridad alta), `5/15/7/10/3` (plazos por tipo), `86400000` (ms por día), `2` (ventana "próximas a vencer"), nombres de áreas repetidos.                                                                                                                                                                                       | Las reglas del negocio quedan escondidas en el código.                               | Medio: nadie sabe qué significa cada número sin leer todo.                             | **Media** (1×3 = 3) |
| **S10** | **Nombres poco expresivos**                                    | `p`, `a`, `s`, `t`, `r`, `x`, `o()`, `lim`, `venc`, `prox`, `resp`, `ok`, `dif` (`gestor.ts` y `cli.ts:8`).                                                                                                                                                                                                                                                                                            | Se lee con esfuerzo; contradice los nombres del dominio.                             | Medio.                                                                                 | **Media** (2×2 = 4) |
| **S11** | **Acoplamiento a infraestructura (viola DIP)**                 | La lógica de negocio usa directamente `fs`, `path`, `new Date()` (7 veces), `process.env` (`gestor.ts:14`) y `console.log` (42 veces).                                                                                                                                                                                                                                                                 | No se puede probar sin disco, sin reloj real y capturando la consola.                | Alto: no se puede cambiar el almacenamiento ni reutilizar las reglas.                  | **Alta** (3×2 = 6)  |
| **S12** | **Código muerto y comentarios obsoletos**                      | Campo `modoDebug` sin uso (`gestor.ts:11`); variable `tmp` sin uso (`:81`); regla vieja comentada (`:103`); `TODO` sin dueño. El linter base lo marca como error (`prefer-const`, `no-unused-vars`).                                                                                                                                                                                                   | Ruido; hace dudar si es código importante.                                           | Bajo.                                                                                  | **Baja** (1×1 = 1)  |
| **S13** | **Data Clump / entidad faltante (Estudiante)**                 | `legajo`, `nombre` y `email` viajan siempre juntos (en los parámetros y copiados en cada solicitud); no existe la entidad `Estudiante` que la consigna sugiere.                                                                                                                                                                                                                                        | Datos del mismo estudiante duplicados y sin validar en un solo lugar.                | Medio.                                                                                 | **Media** (2×2 = 4) |

Distribución: **8 prioridades Alta (S1, S2, S3, S4, S5, S6, S8, S11), 4 Media y 1 Baja** (se priorizan las Alta primero en el plan de
refactoring).

## 3.3 Fragmentos de evidencia

**S2 / S3 / S6 — Long Method, Long Parameter List y cadena condicional por tipo**

```ts
registrarSolicitud(
  legajo: string, nombre: string, email: string, tipo: string,
  descripcion: string, prioridad: string, dias: number, responsable: string,   // 8 parámetros
): any {                                                                       // retorno `any`
  if (!legajo || legajo.trim() == '') { console.log('ERROR: el legajo es obligatorio'); return -1; }
  // ... 6 validaciones más, cada una con su console.log y return -1 ...
  if (tipo == 'CERTIFICADO') {
    if (!p) p = 'MEDIA'; plazo = 5; area = 'Alumnado';
  } else if (tipo == 'EQUIVALENCIA') {
    if (!p) p = 'BAJA'; plazo = 15; area = 'Secretaría Académica';
  } else if (tipo == 'CAMBIO_COMISION') { /* ... */ } else if (tipo == 'REINCORPORACION') { /* ... */ }
  else if (tipo == 'BAJA') { /* ... */ }
  // ... duplicados, armado del objeto, guardar(), console.log(...)
}
```

**S8 / S11 — error silenciado y acoplamiento al disco**

```ts
constructor() {
  this.ruta = process.env.SOLICITUDES_DB || './data/solicitudes.json';
  try {
    const raw = fs.readFileSync(this.ruta, 'utf8');
    const d = JSON.parse(raw);
    this.solicitudes = d.solicitudes;
    this.contador = d.contador;
  } catch (e) {}      // <- archivo corrupto: se ignora y se pisa en el próximo guardado
}
```

**S5 — cuatro bloques de filtro idénticos salvo por el campo**

```ts
if (estado)    { const t = []; for (...) if (r[i].estado    == estado)    t.push(r[i]); r = t; }
if (tipo)      { const t = []; for (...) if (r[i].tipo      == tipo)      t.push(r[i]); r = t; }
if (prioridad) { const t = []; for (...) if (r[i].prioridad == prioridad) t.push(r[i]); r = t; }
if (legajo)    { const t = []; for (...) if (r[i].legajo    == legajo)    t.push(r[i]); r = t; }
```

## 3.4 Deuda técnica: el "interés" que se paga hoy

Aplicando la metáfora de Ward Cunningham, los atajos tomados al construir el prototipo (sin
tests, copiando bloques, resolviendo todo en una clase) generan un interés medible:

- **Costo de cambio**: agregar un tipo de solicitud exige tocar 4 puntos de una clase de 380 líneas (documento 02, escenario A).
- **Costo de verificación**: cero pruebas automáticas y cero unidades aislables antes del trabajo (documento 06).
- **Riesgo de datos**: un archivo corrupto se descarta y se pisa en silencio (S8).
- **Costo de incorporación**: una persona nueva debe leer las 380 líneas para entender cualquier regla.

## 3.5 Plan de corrección (hoja de ruta)

El orden sigue la prioridad y respeta la regla de oro de Fowler: **primero una red de seguridad de
pruebas, después refactorizar en pasos pequeños**, un commit por refactoring.

| Orden | Refactoring                                                                   | Resuelve            | Principios                      |
| ----- | ----------------------------------------------------------------------------- | ------------------- | ------------------------------- |
| 0     | Pruebas de caracterización sobre la v1                                        | Riesgo de regresión | —                               |
| 1     | Extract Method en `registrarSolicitud`                                        | S2, S10             | Clean Code (funciones pequeñas) |
| 2     | Introduce Parameter Object (`DatosNuevaSolicitud`)                            | S3, S13             | Clean Code (parámetros)         |
| 3     | Replace Primitive with Object (tipos, estados, prioridad, Email, Legajo)      | S4, S9              | Clean Code                      |
| 4     | Replace Conditional with Polymorphism / tabla de reglas                       | S6, S9              | **OCP**                         |
| 5     | Move Method (`estaVencida`, `diasRestantes`, transiciones → `Solicitud`)      | S7                  | **SRP**, cohesión               |
| 6     | Consolidar filtros y búsqueda duplicada (`FiltroSolicitudes`, Extract Method) | S5                  | DRY                             |
| 7     | Extract Class + Extract Interface: repositorio, reloj y presentación          | S1, S11             | **SRP, DIP, ISP**               |
| 8     | Replace Error Code with Exception                                             | S8                  | Clean Code (errores)            |
| 9     | Eliminar código muerto                                                        | S12                 | Clean Code                      |

La trazabilidad completa smell → commit está en el documento 05.
