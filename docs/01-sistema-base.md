# 1. Selección y descripción del sistema base

> Referencia del repositorio: tag `estado-inicial` (commit `feat: sistema base ... (versión inicial)`).
> Los números de línea de este documento y de los documentos 02 y 03 corresponden a ese tag.

## 1.1 Dominio y problema

El caso elegido es el **Sistema de Gestión de Solicitudes Académicas** sugerido por la cátedra.
Una secretaría académica recibe trámites de estudiantes (certificados, equivalencias, cambios de
comisión, reincorporaciones y bajas). Cada trámite debe registrarse, clasificarse por tipo y
prioridad, asignarse a un responsable, avanzar por un circuito de estados y poder consultarse y
resumirse en un reporte.

Elegimos este caso porque tiene reglas de negocio reales (plazos distintos por tipo, circuito de
estados con transiciones válidas, unicidad de solicitudes activas) que **crecen con el tiempo**.
Es justo el tipo de código donde la calidad interna decide cuánto cuesta cambiar.

El prototipo es un módulo desarrollado por el equipo para este trabajo, escrito con el estilo
"hacer que funcione rápido" de un primer cuatrimestre. No se trata de agregar funcionalidad, sino de
**diagnosticar, mejorar y justificar** (ver consigna oficial, sección 2).

## 1.2 Alcance y actores

| Actor                                  | Rol en el sistema                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Personal de Alumnado (usuario del CLI) | Registra solicitudes, cambia estados, asigna responsables, consulta y emite reportes.                                 |
| Estudiante                             | No usa el sistema: es el titular de la solicitud (legajo, nombre, email).                                             |
| Responsable / Área                     | Persona o área a cargo de resolver la solicitud (Alumnado, Secretaría Académica, Dirección de Carrera o una persona). |

Fuera de alcance: autenticación, interfaz gráfica, notificaciones por email y base de datos
relacional. El sistema se opera por línea de comandos y persiste en un archivo JSON.

## 1.3 Funcionalidades (casos de uso)

| #   | Operación           | Comando                                               | Regla de negocio principal                                                                                                |
| --- | ------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Registrar solicitud | `registrar`                                           | Valida datos; define prioridad, plazo y área según el tipo; impide dos solicitudes activas del mismo tipo para un legajo. |
| 2   | Cambiar estado      | `estado <id> <estado>`                                | Solo transiciones válidas del circuito (ver 1.5).                                                                         |
| 3   | Asignar responsable | `asignar <id> <responsable>`                          | No se reasignan solicitudes aprobadas, rechazadas o cerradas.                                                             |
| 4   | Buscar / filtrar    | `buscar [--estado] [--tipo] [--prioridad] [--legajo]` | Filtros combinables (AND).                                                                                                |
| 5   | Ver detalle         | `ver <id>`                                            | Muestra datos, vencimiento e historial de cambios.                                                                        |
| 6   | Reporte básico      | `reporte`                                             | Totales por estado, tipo y prioridad; vencidas y próximas a vencer.                                                       |

## 1.4 Entidades y estructuras

| Entidad / estructura   | Atributos                                                                        | Representación en la versión inicial                   |
| ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Solicitud**          | id, tipo, prioridad, estado, descripción, fechas de creación y límite, historial | Objeto JSON sin tipo (`any`) dentro de un arreglo.     |
| **Estudiante**         | legajo, nombre, email                                                            | Tres campos sueltos copiados dentro de cada solicitud. |
| **Responsable / Área** | nombre                                                                           | Un `string` dentro de la solicitud.                    |
| **Estado**             | PENDIENTE, EN_REVISION, APROBADA, RECHAZADA, CERRADA                             | `string` libre comparado con literales.                |

## 1.5 Reglas de negocio

**Reglas por tipo de solicitud**

| Tipo            | Prioridad por defecto | Plazo (días corridos) | Área responsable por defecto |
| --------------- | --------------------- | --------------------- | ---------------------------- |
| CERTIFICADO     | MEDIA                 | 5                     | Alumnado                     |
| EQUIVALENCIA    | BAJA                  | 15                    | Secretaría Académica         |
| CAMBIO_COMISION | MEDIA                 | 7                     | Alumnado                     |
| REINCORPORACION | ALTA                  | 10                    | Secretaría Académica         |
| BAJA            | ALTA                  | 3                     | Dirección de Carrera         |

Si la prioridad es ALTA y no se indica un plazo explícito, el plazo se acota a 3 días. Con
`--dias N` (1 a 60) el plazo indicado prevalece.

**Circuito de estados**

| Estado actual | Transiciones permitidas        |
| ------------- | ------------------------------ |
| PENDIENTE     | EN_REVISION, RECHAZADA         |
| EN_REVISION   | APROBADA, RECHAZADA, PENDIENTE |
| APROBADA      | CERRADA                        |
| RECHAZADA     | CERRADA                        |
| CERRADA       | (estado terminal: ninguna)     |

## 1.6 Tecnología

| Aspecto              | Elección                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| Lenguaje             | TypeScript 5.9 (modo `strict`) sobre Node.js 22                                |
| Persistencia         | Archivo JSON (`data/solicitudes.json`, ruta configurable con `SOLICITUDES_DB`) |
| Pruebas              | Vitest                                                                         |
| Calidad estática     | ESLint + typescript-eslint + sonarjs, Prettier, jscpd                          |
| Control de versiones | Git (tags `estado-inicial`, `etapa-*`, `estado-refactorizado`)                 |

La decisión de usar TypeScript está registrada en `docs/adr/0001-stack-tecnologico.md`.

## 1.7 Cumplimiento de los requisitos mínimos de la consigna

| Requisito (consigna, sección 4)                           | Cumplimiento                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Al menos 3 entidades o estructuras                        | 4: Solicitud, Estudiante, Responsable/Área, Estado                     |
| Al menos 4 operaciones funcionales verificables           | 6 (tabla 1.3), todas cubiertas por pruebas                             |
| Persistir o simular datos                                 | Archivo JSON                                                           |
| Versión inicial con problemas reales de diseño            | 13 problemas relevados (documento 03)                                  |
| Demostrar que la versión final conserva el comportamiento | Mismo juego de pruebas ejecutado contra ambas versiones (documento 06) |

## 1.8 Evidencia de funcionamiento de la versión inicial

Transcripción real de una ejecución del escenario completo (archivo
`docs/evidencias/demo-v1.txt`, generado con `node scripts/demo.mjs`):

```text
$ pnpm start registrar --legajo L1001 --nombre "Ana Pérez" --email ana@mail.com --tipo CERTIFICADO --descripcion "Certificado de alumno regular"
Solicitud SOL-0001 registrada (prioridad MEDIA, vence 2026-11-12, responsable: Alumnado)

$ pnpm start registrar --legajo L1001 ... --tipo CERTIFICADO --descripcion "Segundo certificado igual"
ERROR: ya existe una solicitud activa de ese tipo para el legajo L1001
(código de salida: 1)

$ pnpm start estado SOL-0001 EN_REVISION
Solicitud SOL-0001: PENDIENTE -> EN_REVISION

$ pnpm start estado SOL-0001 CERRADA
ERROR: transición no permitida: EN_REVISION -> CERRADA
(código de salida: 1)
```

## 1.9 Datos y privacidad

Todos los datos de ejemplo (legajos, nombres, correos) son **sintéticos**. No se utilizan datos
personales reales, conforme a la sección 10 de la consigna.
