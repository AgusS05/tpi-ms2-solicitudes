# 4. SOLID y Clean Code: diagnóstico y aplicación

Este documento muestra, principio por principio, **qué violaba la v1** (tag `estado-inicial`),
**qué hace la v2** (tag `estado-refactorizado`) y **cómo se puede comprobar** (archivo, prueba o
comando). Las afirmaciones numéricas salen de `docs/evidencias/` y se reproducen con
`pnpm metricas`, `pnpm test` y `pnpm lint:calidad`.

## 4.1 SOLID

### SRP — Responsabilidad única

|                   | v1                                                                                                                                                                                                             | v2                                                                                                                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Situación         | `GestorSolicitudes` (380 líneas) validaba, aplicaba reglas, leía y escribía el archivo, calculaba el reporte y lo imprimía con `console.log` (42 llamadas). Cinco razones para cambiar en una sola clase (S1). | Cada pieza tiene una razón para cambiar.                                                                                                                                                                                                                                            |
| Reparto           | —                                                                                                                                                                                                              | `Solicitud` (reglas de una solicitud) · `ServicioDeSolicitudes` (casos de uso) · `ServicioDeReportes` (cálculo del reporte) · `formato.ts` (texto) · `comandos.ts` (entrada/salida de la CLI) · `RepositorioJson…` (disco) · `RelojDelSistema` (hora) · `cli.ts` (arma las piezas). |
| Cómo se comprueba | `docs/evidencias/metricas-v1.md`: 1 clase, 13 funciones.                                                                                                                                                       | `docs/evidencias/metricas-v2.md`: 21 archivos; ninguno supera 160 líneas; ninguna función supera 21 líneas ni complejidad 8.                                                                                                                                                        |

Prueba de que la separación es real: el reporte se prueba **sin consola ni disco**
(`tests/aplicacion/servicio-reportes.test.ts`) y su texto se prueba **sin lógica**
(`tests/presentacion/formato.test.ts`). En la v1 no había forma de probar una sola de esas partes.

### OCP — Abierto a la extensión, cerrado a la modificación

La v1 resolvía las reglas con cadenas `if / else if`; la lista de tipos aparecía en 4 lugares (S6).
La v2 reemplaza cada cadena por una **tabla de datos**:

| Qué cambia en el negocio            | Dónde se toca en la v2                                                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Un tipo de trámite nuevo            | `tipo-solicitud.ts` (1 línea) + `reglas-por-tipo.ts` (1 entrada). El compilador exige la entrada porque la tabla es `Record<TipoSolicitud, …>`. |
| Un cambio en el circuito de estados | `TRANSICIONES` en `estado.ts`.                                                                                                                  |
| Un comando nuevo de la CLI          | Una entrada en `COMANDOS` de `comandos.ts`; `ejecutarComando` no cambia.                                                                        |

**Experimento de extensibilidad** (`docs/evidencias/experimento-extensibilidad.diff`): se agregó
el tipo `CAMBIO_CARRERA` (plazo 20 días, área Dirección de Carrera). Resultado: **2 archivos, 6
líneas agregadas, 0 líneas modificadas**; el registro, la búsqueda y el reporte lo soportaron sin
más cambios. En la v1 el mismo cambio exigía editar 4 puntos dentro de `gestor.ts`. Fallaron 6
pruebas, y es lo esperado: eran las que fijaban que el reporte lista exactamente 5 tipos (y la
prueba diferencial, porque la v1 no conoce el tipo nuevo). Una prueba que describe el
comportamiento anterior tiene que actualizarse cuando el comportamiento cambia a propósito.

Límite honesto: agregar un **estado** nuevo sigue requiriendo editar `Estado` y `TRANSICIONES`
(dos lugares contiguos). Los reportes se actualizan solos porque derivan de `ESTADOS`.

### LSP — Sustitución de Liskov

Hay dos implementaciones del puerto `RepositorioDeSolicitudes`: en memoria y en archivo JSON
(esta hereda de la primera y solo agrega carga y volcado a disco). La **prueba de contrato**
`tests/infraestructura/contrato-repositorio.test.ts` ejecuta la misma batería de expectativas
sobre ambas con `describe.each`: arrancan vacías, numeran desde 1, no duplican al guardar dos
veces y conservan el orden de inserción. Si una subclase rompiera una de esas promesas, la prueba
fallaría.

Todos los errores heredan de `ErrorDeDominio`, de modo que la CLI atrapa la clase base y trata
igual a cualquier subtipo.

### ISP — Segregación de interfaces

`puertos.ts` separa el repositorio en `LectorDeSolicitudes` (`todas`, `buscarPorId`) y
`EscritorDeSolicitudes` (`siguienteNumero`, `guardar`). `ServicioDeReportes` declara que solo
necesita el lector: **no puede modificar datos aunque quisiera**, y sus pruebas no necesitan
simular métodos de escritura. `Reloj` es una interfaz de un único método.

### DIP — Inversión de dependencias

| Dependencia         | v1                                | v2                                                                                                                              |
| ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Disco (`fs`)        | Importado en la clase de negocio. | Solo en `repositorio-json.ts`.                                                                                                  |
| Hora (`new Date()`) | 7 llamadas dentro de la lógica.   | Solo en `reloj-del-sistema.ts`; la lógica recibe un `Reloj`. (`fecha.ts` usa `Date` como cálculo puro sobre valores recibidos.) |
| Variable de entorno | En el constructor del gestor.     | Solo en `cli.ts`, la raíz de composición.                                                                                       |
| Consola             | 42 `console.log` en la lógica.    | 3 `console.log`, todos en `comandos.ts` (el borde).                                                                             |

La verificación es mecánica: `grep -rn "console.log" src` solo encuentra `presentacion/comandos.ts`,
y `grep -rn "from 'fs'\|import \* as fs" src` solo encuentra `infraestructura/`.
Consecuencia práctica: las pruebas unitarias de los servicios usan
`RepositorioEnMemoriaDeSolicitudes` y un `RelojFijo`, sin tocar disco ni usar temporizadores
simulados.

## 4.2 Clean Code

| Criterio (apunte "Código limpio")               | Estado en la v1                                                                                   | Cómo quedó en la v2                                                                                                                                                          | Evidencia                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Nombres que revelan intención**               | `p`, `a`, `s`, `t`, `r`, `x`, `o()`, `lim`, `venc`, `prox`, `ok`, `dif` (S10).                    | `prioridadFinal`, `diasParaVencer`, `estaPorVencer`, `FiltroSolicitudes`, `exigirPlazoValido`, `opcion(args, 'dias')`. Vocabulario del dominio en español, sin abreviaturas. | Lectura de `src/` y checklist de revisión (documento 07).                           |
| **Funciones pequeñas, un nivel de abstracción** | `registrarSolicitud`: 119 líneas, complejidad 43.                                                 | Máximo 21 líneas y complejidad 8 en todo `src/`; promedio 4,9 líneas y 1,5 de complejidad.                                                                                   | `metricas-v1.md` vs `metricas-v2.md`.                                               |
| **Pocos parámetros**                            | 8 parámetros `string` (S3).                                                                       | Máximo 4; el alta recibe un objeto `DatosNuevaSolicitud`.                                                                                                                    | `max-params` sin violaciones.                                                       |
| **Sin números ni textos mágicos**               | `10`, `60`, `3`, `5/15/7/10/3`, `86400000`, `2` y 72 literales de tipo/estado/prioridad (S4, S9). | Constantes con nombre en `reglas-de-negocio.ts`; tipos, estados y prioridades son tipos cerrados del dominio. 0 literales de dominio fuera de sus definiciones.              | `grep` de literales; ver límite abajo.                                              |
| **Manejo de errores con excepciones**           | `return -1` / `return false` / `catch (e) {}` vacío (S8).                                         | Jerarquía `ErrorDeDominio`; un único lugar traduce a mensaje y código de salida; un archivo dañado ya no se sobrescribe en silencio.                                         | `tests/comportamiento.test.ts` (CAMBIO DELIBERADO), `contrato-repositorio.test.ts`. |
| **DRY**                                         | 2 clones exactos (4,3 %), búsqueda por id ×3, 4 filtros idénticos, validación repetida (S5).      | 0 clones (jscpd). Un solo lugar por validación (`datos-nueva-solicitud.ts`, `filtro-solicitudes.ts`).                                                                        | `duplicacion-v2.txt`.                                                               |
| **Tipos en lugar de comentarios**               | Objetos `any`.                                                                                    | 0 usos de `any`; `strict` activado; `Email` y `Estudiante` como objetos de valor.                                                                                            | `grep ': any' src` → 0.                                                             |
| **Comentarios útiles**                          | Código muerto y un `TODO` sin dueño (S12).                                                        | Comentarios que explican el **por qué** (p. ej. "el orden de las comprobaciones es parte del comportamiento").                                                               | Revisión de código (documento 07).                                                  |
| **Formato consistente**                         | Sin formateador.                                                                                  | Prettier en CI y `pnpm format:check` limpio.                                                                                                                                 | `.prettierrc.json`.                                                                 |

**Límites que conviene declarar** (se prefieren a esconderlos):

- La config de calidad todavía marca **8 advertencias `no-magic-numbers`**: 4 son los factores
  `24·60·60·1000` dentro de la propia constante `MS_POR_DIA` (la definición con nombre que
  reemplaza al `86400000` suelto de la v1), y las otras 4 son el recorte `slice(0, 10)` de la fecha
  ISO, `argv.slice(2)` en `cli.ts`, `padStart(4, …)` del identificador y la sangría `2` del
  `JSON.stringify`. Ninguna es una regla de negocio; no se ocultaron con `eslint-disable`.
- El código pasó de 415 a 759 líneas efectivas (+83 %). Es el costo de separar responsabilidades,
  tipar el dominio y documentar el porqué. Se compensa con funciones más pequeñas y probables, no
  con menos código.
- Los errores siguen saliendo por la salida estándar con el prefijo `ERROR:` para mantener
  paridad exacta con la v1. Pasarlos a `stderr` sería una mejora futura (cambio de comportamiento
  visible, por eso no se hizo dentro de un refactoring).
