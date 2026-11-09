# 9. Participación y conclusiones

## 9.1 Participación de cada integrante

El trabajo es grupal. El repositorio lo administra Agustín Hurtado, desde cuya cuenta se realizaron
los commits. La revisión por pares (etapa 7) y la defensa se reparten por tramos, de modo que cada
integrante puede explicar y defender el tramo que le corresponde y responder sobre el conjunto.

| Integrante                | Tramo que explica y defiende                                                                                                                                       | Rol en el repositorio y en la revisión                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Agustín Hurtado           | Etapas 1 a 3 (sistema base, calidad externa e interna, deuda técnica y code smells), pruebas de caracterización y mutaciones, cierre con métricas antes y después. | Administra el repositorio y su historial de commits. Incorpora las correcciones surgidas de la revisión. |
| Alejandro Agustín Pedrosa | Refactorings R1 a R8 (etapas 4 y 5): Extract Method, Introduce Parameter Object, tabla de reglas y Move Method.                                                    | Revisor de los tramos 1 y 2 del registro de revisión (R1 a R8).                                          |
| Luciano De La Rubia       | Refactorings R9 a R14 y `fix(S8)`, arquitectura de puertos y adaptadores, pruebas de la v2 y code review (etapas 6 y 7).                                           | Revisor de los tramos 3, 4 y 5 del registro de revisión (R9 a R14, `fix(S8)`, pruebas de la v2).         |

| Actividad            | Evidencia de colaboración                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Revisar diagnóstico  | Inventario de smells (etapa 3) contrastado con las métricas de `docs/evidencias/`.          |
| Revisar refactorings | Registro de revisión de la etapa 7: autor, revisor y resultado de cada tramo de commits.    |
| Preparar la defensa  | Ensayo cronometrado del video y preguntas resueltas por cada integrante sobre su tramo.     |
| Cerrar versión       | Conformidad de los tres sobre el contenido del informe y sobre la declaración de uso de IA. |

## 9.2 Conclusiones grupales (etapa 8: conclusiones y aprendizaje)

### Qué aprendimos

1. **La calidad externa no alcanza para evaluar un sistema.** La v1 funcionaba sin fallas
   visibles y, sin embargo, concentraba 126 violaciones de calidad interna: una función de
   complejidad 43, 8 parámetros del mismo tipo y un error silencioso que podía borrar datos.
2. **Sin pruebas no hay refactoring, hay apuestas.** Las 109 pruebas de caracterización, escritas
   antes de tocar el código y verificadas con mutaciones, permitieron hacer 15 refactorings sin
   cambiar el comportamiento visible (la demo de la v1 y la de la v2 son idénticas byte a byte).
3. **Las pruebas verdes no son suficientes.** El error de R4 (`TipoSolicitud.BAJA` vs
   `Prioridad.BAJA`) pasó todas las pruebas y se encontró leyendo el diff. La revisión humana y la
   automática se complementan.
4. **SOLID se nota cuando cambia el negocio.** Agregar un tipo de trámite pasó de 4 puntos dentro
   de una clase de 380 líneas a 2 archivos y 6 líneas, y el compilador obliga a no olvidar la regla.
5. **Medir evita autoengaños.** jscpd mostró que un refactoring (R13) había introducido un clon;
   las métricas mostraron que el código creció 83 % en líneas aunque cada función es mucho más
   simple. Estructura y tamaño son cosas distintas.
6. **La IA acelera, pero la responsabilidad es del equipo.** Cada afirmación del informe tiene una
   evidencia reproducible; si no se puede reproducir, no debería estar.

### Decisiones tomadas

Las siete decisiones técnicas con contexto, alternativas descartadas y consecuencias están en
`docs/adr/`. Las que más pesaron: escribir pruebas de caracterización antes de refactorizar
(ADR-0002), separar el núcleo de la infraestructura con puertos y adaptadores (ADR-0003),
expresar las reglas como tablas de datos y no como clases (ADR-0004) y aislar en un commit propio
el único cambio de comportamiento, el del archivo dañado (ADR-0006).

### Dificultades

- Refactorizar sin cambiar el comportamiento obliga a **conservar rarezas** de la v1 (el orden de
  las validaciones, el texto exacto de los mensajes, aceptar `--dias 1.5`).
- Los reemplazos masivos de texto son riesgosos: R4 y R11a produjeron errores que hubo que
  encontrar leyendo el diff (documento 07).
- Elegir la granularidad: demasiado fino genera commits triviales; demasiado grueso impide
  revertir. Se adoptó «un refactoring con nombre por commit».
- Verificar la propia verificación: el primer generador de la prueba diferencial era demasiado
  débil y hubo que mejorarlo (documento 06).

### Límites del trabajo y mejoras pendientes

- Los errores salen por la salida estándar con prefijo `ERROR:` (paridad con la v1); lo correcto
  sería `stderr`.
- Se acepta un plazo fraccionario (`--dias 1.5`) y las fechas se calculan en UTC.
- Quedan 8 avisos `no-magic-numbers` sin sentido de negocio (documento 04).
- `jscpd` no detecta casi-duplicados; la ausencia de clones no prueba la ausencia de repetición.
- El almacenamiento en un único archivo JSON no soporta concurrencia ni volúmenes grandes.
- Los tipos nominales (_branded types_) evitarían confusiones como la de R4.
- Todos los commits provienen de una única cuenta. La revisión por pares se registra en la etapa 7;
  como mejora, convendría trabajar con ramas y Pull Requests revisados desde la cuenta de cada
  integrante.

### Relación con los contenidos de la asignatura

| Contenido de la materia                                 | Dónde se aplicó                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Calidad del software (interna y externa), deuda técnica | Documentos 02 y 03; métricas v1 vs v2                                         |
| Code smells (Fowler) y técnicas de refactoring          | Documentos 03 y 05 (13 smells, 15 commits de refactoring)                     |
| SOLID                                                   | Documento 04; prueba de contrato (LSP); experimento de extensibilidad (OCP)   |
| Clean Code (Martin)                                     | Documento 04: nombres, funciones pequeñas, parámetros, errores, DRY           |
| Verificación y validación, pruebas                      | Documento 06: caracterización, unitarias, contrato, diferencial, mutaciones   |
| Git avanzado                                            | Commits atómicos, tags anotados por hito, ramas, `git show`/`diff` entre tags |
| Revisión de código                                      | Documento 07 y plantilla de Pull Request                                      |
| Patrones y arquitectura (SOA/capas)                     | Puertos y adaptadores (ADR-0003); tablas de reglas                            |

## 9.3 Conclusiones individuales

### Agustín Hurtado

Lo que más cambió en mi forma de trabajar es entender que «funciona» no es lo mismo que «está bien
hecho». Cuando medí la v1 y apareció una función de complejidad 43 y un `catch` vacío que podía
borrar el archivo de datos, vi que un sistema sin fallas visibles puede tener un costo de cambio
altísimo. Lo más difícil de mi tramo fueron las 109 pruebas de caracterización: había que describir el
comportamiento tal como era, incluso sus rarezas (el orden de las validaciones, aceptar
`--dias 1.5`), sin «arreglarlo». Las mutaciones me mostraron que una prueba que pasa no
necesariamente protege: recién cuando una mutación se detectaba confié en la red de seguridad. Si lo
hiciera de nuevo, mediría y escribiría las pruebas desde el primer día y trabajaría con Pull Requests
revisados desde el comienzo. De la IA aprendí que acelera la estructura pero no reemplaza el
criterio: el error de R4 pasó todas las pruebas y se encontró leyendo el diff, y por eso cada cifra
del informe sale de un comando que puedo volver a ejecutar.

### Alejandro Agustín Pedrosa

Mi tramo fueron los refactorings R1 a R8. El que más me costó fue R5, el reemplazo de la cadena de
`if/else` por una tabla de reglas: lo difícil no era escribir la tabla sino conservar los mismos
mensajes y el mismo orden de validación, porque las pruebas de caracterización no toleran ninguna
diferencia. Con Extract Method (R1) vi bajar la complejidad de 43 a 4 y entendí por qué conviene que
cada función haga una sola cosa y tenga un nombre que la explique. Con Introduce Parameter Object
(R3) pasamos de 8 parámetros intercambiables a un solo objeto, y el compilador empezó a avisar de
errores que antes eran invisibles. Ahora, cuando leo código, busco primero dónde vive cada regla de
negocio y cuántos lugares habría que tocar para cambiarla. Haría distinto dos cosas: revisar cada
reemplazo masivo con el diff completo antes de aceptarlo, como pasó en R4, y hacer commits todavía
más chicos. De la IA me llevo que sirve para proponer, pero la decisión de si un refactoring es seguro
la tiene que tomar una persona que entienda el código.

### Luciano De La Rubia

Me tocó la parte de arquitectura y de revisión: los refactorings R9 a R14, el `fix(S8)` y el code
review. Lo más difícil fue entender puertos y adaptadores, porque separar el núcleo de la
infraestructura obliga a pensar qué necesita realmente el dominio (leer, escribir, saber la hora) y no
qué herramienta se usa. Esa separación permitió probar la v2 sin disco ni consola y escribir la prueba
de contrato que obliga a que los dos repositorios se comporten igual. En la revisión aparecieron
cinco problemas reales; el que más me marcó fue el clon que introdujo el propio refactoring R13: un
cambio pensado para mejorar puede reintroducir el problema que otro quitó. El experimento de agregar
`CAMBIO_CARRERA` en 2 archivos y 6 líneas me mostró lo que significa «abierto a la extensión» en la
práctica. Haría distinto dos cosas: usar tipos nominales para no confundir constantes con el mismo
valor, y someter a mutaciones el generador de la prueba diferencial desde el principio. Sobre la IA:
la usamos mucho y por eso hay que declararlo, medir todo y poder defender cada commit con palabras
propias.
