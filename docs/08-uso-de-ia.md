# 8. Declaración de uso de inteligencia artificial y registro de prompts

La consigna admite el uso de IA como apoyo siempre que se declare y se adjunte evidencia. Este documento describe lo que se hizo con la herramienta y registra los prompts enviados.

## 8.1 Declaración

| Campo                          | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Herramienta                    | Claude (Anthropic), modelo Claude Sonnet 5.5, usado desde la aplicación de Claude con un entorno de ejecución de código (terminal, Node.js, Git). Para las presentaciones de apoyo se usaron además los conectores de Google Slides y Canva.                                                                                                                                                                                                               |
| Quién la usó                   | Agustín Hurtado, en nombre del grupo (Agustín Hurtado, Alejandro Agustín Pedrosa, Luciano De La Rubia).                                                                                                                                                                                                                                                                                                                                                    |
| Finalidad                      | Generar el material del trabajo a partir de la consigna, los apuntes y el modelo de referencia: (1) el sistema base con deuda técnica, (2) el diagnóstico y los code smells, (3) las pruebas de caracterización, (4) la secuencia de refactorings, (5) las pruebas de la v2, (6) la documentación, el informe y la configuración (CI, plantillas), (7) las presentaciones de apoyo para el video y (8) la adaptación del informe al formato institucional. |
| Grado de intervención de la IA | **Alto.** La herramienta redactó y escribió el código, las pruebas, los scripts de medición y los documentos, y ejecutó los comandos (pruebas, linter, métricas, mutaciones) para obtener las evidencias.                                                                                                                                                                                                                                                  |
| Intervención del grupo         | Los tres integrantes leen y revisan el material completo, ejecutan los comandos del repositorio en su propio equipo para reproducir las cifras (`pnpm test`, `pnpm metricas`), hacen la revisión por pares registrada en la etapa 7, ajustan y asumen como propias las conclusiones individuales (redactadas con asistencia de la herramienta a partir del trabajo realizado) y presentan el video con su propia voz.                                      |
| Alcance de la herramienta      | No grabó el video ni publicó el repositorio. Las voces del video son las de los integrantes; no se usó ninguna voz generada por IA.                                                                                                                                                                                                                                                                                                                        |
| Datos                          | Todos los datos son **sintéticos** (nombres y legajos inventados). No se cargó ningún dato personal real en la herramienta.                                                                                                                                                                                                                                                                                                                                |

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

## 8.3 Registro de prompts

Se listan, en orden cronológico, los prompts enviados a la herramienta. Los cuatro primeros se
transcriben con su texto exacto; el quinto se resume. La conversación completa (con los archivos
adjuntos) queda a disposición de la cátedra. Las copias de los prompts están también en el archivo
`ia/registro-de-prompts.md` del anexo ZIP.

### Prompt 1: generación del trabajo

| Campo             | Detalle                                                                                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fecha y autor     | 7 de noviembre de 2026, Agustín Hurtado                                                                                                                                                                                                                   |
| Prompt            | «Holaaa, por favor, genera los archivos para este TPI de Metodologia de sistemas, te paso los apuntes, la consigna y el archivo de referencia: El grupo esta conformado por Agustin Hurtado (yo jaja), Alejandro Agustin Pedrosa, y Luciano De La Rubia.» |
| Archivos adjuntos | Consigna (.txt); modelo de presentación (zip con PPTX, guía rápida y README); `TP_MS2V2.pdf`; apuntes de SOLID, Clean Code, Calidad, Git avanzado (semanas 1–3), V&V y testing (semanas 1–3), patrones y SOA, libro «Código limpio».                      |
| Resultado y uso   | Se produjo el repositorio completo (código, pruebas, documentos y evidencias) con 15 refactorings, 253 pruebas y los tags pedidos. De ahí se arman el informe, el anexo ZIP y el material de defensa.                                                     |

### Prompt 2: material de referencia restante

| Campo             | Detalle                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fecha y autor     | 7 de noviembre de 2026, Agustín Hurtado                                                                                                          |
| Prompt            | «Ahi van los que faltaron»                                                                                                                       |
| Archivos adjuntos | Apuntes de requerimientos, comunicación, negociación, IA y prompt engineering, presentaciones profesionales.                                     |
| Resultado y uso   | Se revisaron. Son de contenido no técnico (comunicación, negociación, requerimientos) y se usaron solo como contexto para ordenar la exposición. |

### Prompt 3: presentación de apoyo en Google Slides

| Campo             | Detalle                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Fecha y autor     | 7 de noviembre de 2026, Agustín Hurtado                                                                                                      |
| Prompt            | «Podes generar la presentacion para el video acorde al guion y al trabajo en slides de google porfa»                                         |
| Archivos adjuntos | Ninguno nuevo.                                                                                                                               |
| Resultado y uso   | Presentación de 14 diapositivas con notas del orador, usada como apoyo visual del video. Las cifras salen de las evidencias del repositorio. |

### Prompt 4: presentación de apoyo en Canva

| Campo             | Detalle                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Fecha y autor     | 8 de noviembre de 2026, Agustín Hurtado                                                                                        |
| Prompt            | «Podes armar la presentacion en canvas porfa? con imagenes lindas y demas»                                                     |
| Archivos adjuntos | Ninguno nuevo.                                                                                                                 |
| Resultado y uso   | Versión en Canva de la misma presentación (14 diapositivas), con imágenes de apoyo. Alternativa a la versión de Google Slides. |

### Prompt 5: adaptación del informe al formato institucional

| Campo             | Detalle                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fecha y autor     | 8 de noviembre de 2026, Agustín Hurtado                                                                                                                                                                                                                                                                                                                                                                         |
| Prompt (resumen)  | Rehacer el informe del TPI de Metodología con el formato del informe de Legislación, completar los campos que estaban pendientes, quitar la comisión (el TPI es intercomisión), dejar los anexos listos para entregar y dejar fuera del informe el material de preparación del video.                                                                                                                           |
| Archivos adjuntos | Informe del TPI de Legislación (PDF), tomado solo como modelo de formato.                                                                                                                                                                                                                                                                                                                                       |
| Resultado y uso   | Informe rehecho con el formato institucional (portada, índice, encabezado y pie, etapas numeradas, bibliografía). Se completaron la participación, la revisión por pares y las conclusiones individuales a partir del trabajo realizado, y el material de preparación del video quedó fuera del informe. Los textos de la participación y de las conclusiones individuales los revisa y ajusta cada integrante. |

## 8.4 Reflexión sobre el uso de la IA

- **Qué aportó:** velocidad para producir la estructura completa, consistencia entre código,
  pruebas y documentos, y disciplina de medición (todo número del informe sale de un comando).
- **Qué riesgos tuvo:** una herramienta puede producir cambios que _parecen_ correctos y no lo
  son (CR-01) o afirmar cifras sin medirlas (se corrigió el mensaje de R1). Se mitigó midiendo,
  revisando diffs y exigiendo que cada afirmación tenga evidencia.
- **Qué responsabilidad queda en el grupo:** entender y poder explicar cada decisión en la
  defensa. Un integrante que no puede explicar un refactoring de su tramo no lo «tiene» aunque
  esté en el repositorio. Por eso el reparto de la defensa por tramos (etapa 8) y la revisión por
  pares (etapa 7) forman parte del trabajo y no solo del informe.
