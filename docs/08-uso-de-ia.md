# 8. Declaración de uso de inteligencia artificial y registro de prompts

> **Importante.** Este documento es parte de la entrega y tiene que ser **veraz**. Lo que está
> escrito describe lo que efectivamente se hizo con la herramienta. Los campos marcados
> _(completar)_ los tiene que completar el grupo con lo que realmente hizo cada integrante.

## 8.1 Declaración

| Campo                          | Detalle                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Herramienta                    | Claude (Anthropic), modelo Claude Sonnet 5.5, usado desde la aplicación de Claude con un entorno de ejecución de código (terminal, Node.js, Git).                                                                                                                                                                                                                      |
| Quién la usó                   | Agustín Hurtado, en nombre del grupo (Agustín Hurtado, Alejandro Agustín Pedrosa, Luciano De La Rubia).                                                                                                                                                                                                                                                                |
| Finalidad                      | Generar el material del trabajo a partir de la consigna, los apuntes y el modelo de referencia: (1) el sistema base con deuda técnica, (2) el diagnóstico y los code smells, (3) las pruebas de caracterización, (4) la secuencia de refactorings, (5) las pruebas de la v2, (6) la documentación, el informe, el guion del video y la configuración (CI, plantillas). |
| Grado de intervención de la IA | **Alto.** La herramienta redactó y escribió el código, las pruebas, los scripts de medición y los documentos, y ejecutó los comandos (pruebas, linter, métricas, mutaciones) para obtener las evidencias.                                                                                                                                                              |
| Intervención del grupo         | _(completar)_ Por ejemplo: leer y entender cada refactoring, ejecutar los comandos en su propia máquina, revisar el diff de cada commit, corregir o reescribir textos, grabar el video con voz propia.                                                                                                                                                                 |
| Qué NO hizo la herramienta     | No grabó el video, no completó las conclusiones individuales, no publicó el repositorio, no completó la participación real de cada integrante ni el revisor del code review.                                                                                                                                                                                           |
| Datos                          | Todos los datos son **sintéticos** (nombres y legajos inventados). No se cargó ningún dato personal real en la herramienta.                                                                                                                                                                                                                                            |

## 8.2 Cómo se verificó lo que generó la IA

La salida de una herramienta de IA no se acepta por confianza. Cada afirmación del informe se
respalda con algo que cualquier integrante puede reproducir:

- **Comportamiento:** 109 pruebas de caracterización escritas _antes_ de refactorizar, y una
  prueba diferencial que compara la v1 original con la v2 sobre 3 600 comandos (documento 06).
- **Calidad medida, no opinada:** complejidad, tamaño de funciones, parámetros y duplicación
  salen de `pnpm metricas` (ESLint + jscpd) y están guardadas en `docs/evidencias/`.
- **Calidad de las pruebas:** 15 y 23 mutaciones manuales que las pruebas tienen que detectar.
- **Errores propios de la herramienta que se encontraron al revisar** (documento 07, CR-01 a
  CR-05): una constante confundida que las pruebas no detectaban, una llamada duplicada, un clon
  introducido por un refactoring, un mensaje de commit mal etiquetado y un generador de pruebas
  demasiado débil. Estos casos muestran por qué la revisión humana es necesaria.

## 8.3 Registro ordenado de prompts

Se listan los prompts en el orden en que se enviaron, con su finalidad y el uso que se hizo del
resultado. Los dos primeros son los reales de esta sesión; los siguientes son del grupo.

| Nº  | Fecha         | Quién           | Prompt (texto exacto)                                                                                                                                                                                                                                     | Archivos adjuntos                                                                                                                                                                                                                    | Finalidad                              | Resultado y uso                                                                                                                                     |
| --- | ------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 2026-11-07    | Agustín Hurtado | «Holaaa, por favor, genera los archivos para este TPI de Metodologia de sistemas, te paso los apuntes, la consigna y el archivo de referencia: El grupo esta conformado por Agustin Hurtado (yo jaja), Alejandro Agustin Pedrosa, y Luciano De La Rubia.» | Consigna (.txt); modelo de presentación (zip con PPTX, guía rápida y README); `TP_MS2V2.pdf`; apuntes de SOLID, Clean Code, Calidad, Git avanzado (semanas 1–3), V&V y testing (semanas 1–3), patrones y SOA, libro «Código limpio». | Generar todos los entregables del TPI. | Se produjo el repositorio completo (código, pruebas, documentos, evidencias), a partir del cual se arman el PDF, el ZIP anexo y el guion del video. |
| 2   | 2026-11-07    | Agustín Hurtado | «Ahi van los que faltaron»                                                                                                                                                                                                                                | Apuntes de requerimientos, comunicación, negociación, IA y prompt engineering, presentaciones.                                                                                                                                       | Completar el material de referencia.   | Se revisaron; son de contenido no técnico (comunicación, negociación, requerimientos) y se usaron solo como contexto.                               |
| 3   | _(completar)_ | _(completar)_   | _(completar)_                                                                                                                                                                                                                                             |                                                                                                                                                                                                                                      |                                        |                                                                                                                                                     |

> Agregar una fila por cada nuevo prompt que use el grupo (por ejemplo, para ajustar un texto,
> pedir una explicación de un refactoring o preparar la defensa). Conservar el texto exacto.

## 8.4 Reflexión sobre el uso de la IA

- **Qué aportó:** velocidad para producir la estructura completa, consistencia entre código,
  pruebas y documentos, y disciplina de medición (todo número del informe sale de un comando).
- **Qué riesgos tuvo:** una herramienta puede producir cambios que _parecen_ correctos y no lo
  son (CR-01) o afirmar cifras sin medirlas (se corrigió el mensaje de R1). Se mitigó midiendo,
  revisando diffs y exigiendo que cada claim tenga evidencia.
- **Qué responsabilidad queda en el grupo:** entender y poder explicar cada decisión en la
  defensa. Un integrante que no puede explicar un refactoring de su tramo no lo "tiene" aunque
  esté en el repositorio. _(Completar con la experiencia real del grupo.)_
