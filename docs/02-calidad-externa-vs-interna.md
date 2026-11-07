# 2. Calidad externa vs. calidad interna

La **calidad externa** es lo que percibe quien usa el sistema (que haga lo que debe, que no falle,
que responda claro). La **calidad interna** es cómo está construido el código (legibilidad,
cohesión, acoplamiento, testabilidad) y la sufre o disfruta quien lo mantiene. Un sistema puede
tener excelente calidad externa y mala calidad interna: es exactamente el caso de la versión inicial.

## 2.1 Calidad externa de la versión inicial: funciona

Se verificó ejecutando el escenario completo (`docs/evidencias/demo-v1.txt`) y, luego, con una
suite de pruebas de caracterización (documento 06).

| Atributo externo | Qué se observa desde el usuario                                                                                                            | Evidencia                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Eficacia         | Las 6 operaciones hacen lo que dicen. Los plazos, prioridades y áreas por tipo se calculan bien.                                           | Demo y pruebas de comportamiento                         |
| Fiabilidad       | Rechaza datos inválidos con mensajes claros y código de salida 1; respeta el circuito de estados; no permite duplicar solicitudes activas. | `ERROR: transición no permitida: EN_REVISION -> CERRADA` |
| Usabilidad       | Comandos simples, mensajes en español, resumen final en cada búsqueda (`Total: n`).                                                        | Demo                                                     |
| Rendimiento      | Con 1000 solicitudes sintéticas: `reporte` 113 ms y `buscar` con dos filtros 166 ms (el arranque de `tsx` sin datos ya toma ~112 ms).      | Medición local (Node 22)                                 |

Conclusión parcial: **un usuario no notaría ningún problema**. Por eso el diagnóstico no puede
basarse en "si anda o no anda".

## 2.2 Calidad interna de la versión inicial: se pudo medir

Se midió con herramientas estándar (`pnpm metricas`; reporte completo en
`docs/evidencias/metricas-v1.md`):

| Métrica                                       | Valor v1                      | Referencia de la config de calidad |
| --------------------------------------------- | ----------------------------- | ---------------------------------- |
| Líneas de código (sin blancos ni comentarios) | 415 en 2 archivos             | `max-lines` 200 por archivo        |
| Complejidad ciclomática máxima                | **43** (`registrarSolicitud`) | umbral 8                           |
| Complejidad ciclomática promedio              | 11,4                          | umbral 8                           |
| Líneas por función (máx / prom.)              | **119** / 31,3                | umbral 30                          |
| Parámetros por función (máx)                  | **8**                         | umbral 4                           |
| Funciones sobre el umbral de complejidad      | 6 de 13                       | —                                  |
| Violaciones de la config de calidad           | **126** (75 son `eqeqeq`)     | —                                  |
| Código duplicado exacto (jscpd)               | 4,3 % (2 clones)              | —                                  |
| Uso de `any`                                  | 6 apariciones                 | —                                  |

El linter base (`pnpm lint`) ya marca **4 errores** reales: un `catch` vacío, una variable `tmp`
sin uso y su declaración innecesaria (`docs/evidencias/lint-base-v1.txt`).

> **Limitación de la herramienta.** jscpd solo detecta clones de tokens idénticos. No detecta los
> cuatro bloques de filtro casi iguales de `buscar` (`gestor.ts:249-284`), que difieren solo en el
> nombre del campo. La duplicación real es mayor que el 4,3 % medido. Se la relevó manualmente
> (documento 03, smell S5).

## 2.3 Qué significa esa brecha para el futuro del sistema

La calidad interna no se ve en la interfaz, pero determina el **costo del cambio**. Tres
escenarios de evolución realistas, medidos sobre el código de la versión inicial:

| Escenario de cambio                                                      | Qué obliga a tocar en la v1                                                                                                                                                                                                                                                | Riesgo                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **A.** Agregar un nuevo tipo de solicitud (`CAMBIO_CARRERA`)             | 4 lugares de `gestor.ts`: validación en `registrarSolicitud` (l. 55), cadena `if/else` de reglas (l. 82), validación en `buscar` (l. 235) y lista de tipos del reporte (l. 341). Olvidar uno produce un error silencioso: el tipo se acepta pero no aparece en el reporte. | Alto (Shotgun Surgery)                |
| **B.** Cambiar la persistencia (JSON → SQLite)                           | La clase de negocio usa `fs` en su constructor y en `guardar()` (invocado por 3 operaciones). Para cambiar el almacenamiento hay que modificar la lógica de negocio.                                                                                                       | Alto (acoplamiento a infraestructura) |
| **C.** Probar una regla de negocio aislada (p. ej. el plazo de una BAJA) | No se puede sin un archivo real en disco, un reloj simulado y capturar `console.log`. No hay unidades testeables.                                                                                                                                                          | Alto (baja testabilidad)              |

En los tres casos el cambio _funcional_ es pequeño, pero el costo y el riesgo son altos por la
estructura interna. Es la "deuda técnica" de Cunningham: el atajo de hoy se paga con intereses en
cada cambio futuro.

La comparación con la versión refactorizada para estos mismos escenarios se presenta en el
documento 05 (sección "Experimento de extensibilidad") y en el documento 06.

## 2.4 Relación entre lo visible y lo estructural

| Lo que el usuario ve (externo)                  | Lo que lo sostiene (interno)                                                  | Riesgo latente                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| "Registrar una solicitud" siempre responde bien | Un método de 119 líneas y complejidad 43                                      | Cualquier ajuste puede romper una de 43 rutas                                                           |
| Los datos persisten entre ejecuciones           | Un `catch` vacío al leer el archivo                                           | Un archivo corrupto se descarta en silencio y el próximo guardado lo **sobrescribe** (pérdida de datos) |
| El reporte muestra vencimientos correctos       | Cálculo de fechas con strings y 86 400 000 ms hardcodeados dentro del reporte | Cambiar la regla de vencimiento obliga a editar el reporte                                              |
| Mensajes de error claros                        | Los errores se imprimen desde la lógica y se informan con `-1`/`false`        | No se pueden reutilizar las reglas desde otra interfaz (web, API)                                       |
