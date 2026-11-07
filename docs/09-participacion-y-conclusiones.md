# 9. Participación y conclusiones

## 9.1 Participación de cada integrante

> **Completar con la participación real.** La consigna evalúa el trabajo individual dentro del
> grupo; esta tabla tiene que coincidir con el historial de Git (commits y Pull Requests) y con
> lo que cada uno presenta en el video. La columna «Propuesta» es solo una sugerencia de reparto
> para que cada integrante pueda defender un tramo completo; reemplazarla por lo que de verdad
> ocurrió.

| Integrante                | Propuesta de tramo a revisar y defender                                                                 | Aporte real (completar) | Commits / PRs (completar) |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------- |
| Agustín Hurtado           | Diagnóstico y code smells (documentos 02–03), pruebas de caracterización y mutaciones (documento 06).   |                         |                           |
| Alejandro Agustín Pedrosa | Refactorings R1–R8 (documentos 04–05): Extract Method, Parameter Object, tablas de reglas, Move Method. |                         |                           |
| Luciano De La Rubia       | Refactorings R9–R14 y `fix(S8)`, arquitectura de puertos y adaptadores, code review (documento 07).     |                         |                           |

Reparto sugerido para el video (10 a 15 minutos, todos con cámara y voz propia): ver
`docs/guion-video.md`.

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
- El grupo todavía tiene que dejar su historial de Git reflejando la participación real mediante
  Pull Requests revisados entre integrantes.

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

> **Cada integrante escribe la suya con sus propias palabras** (entre 8 y 12 líneas). No se
> redactan por otra persona ni por la herramienta: se evalúan individualmente. Preguntas guía:
> ¿qué refactoring de los que me tocó fue el más difícil y por qué? ¿qué cambió en cómo leo código
> después de este trabajo? ¿qué haría distinto? ¿qué aprendí de usar IA para trabajar y qué
> controles necesité?

### Agustín Hurtado

_(completar)_

### Alejandro Agustín Pedrosa

_(completar)_

### Luciano De La Rubia

_(completar)_
