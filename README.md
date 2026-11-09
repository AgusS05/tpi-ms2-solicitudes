# Gestión de Solicitudes Académicas

Sistema de línea de comandos para registrar y gestionar solicitudes de estudiantes
(certificados, equivalencias, cambios de comisión, reincorporaciones y bajas).

> **Trabajo Práctico Integrador — Metodología de Sistemas II**
> UTN · Tecnicatura Universitaria en Programación
> Integrantes: Agustín Hurtado · Alejandro Agustín Pedrosa · Luciano De La Rubia

El repositorio cuenta la historia de un **refactoring seguro**: se parte de una versión inicial que
funciona pero tiene deuda técnica real (`estado-inicial`), se la diagnostica con métricas, se
construye una red de pruebas y se mejora el diseño paso a paso hasta una versión que se comporta
exactamente igual (`estado-refactorizado`).

## Instalación y uso

Requisitos: Node.js 20 o superior (probado con 22) y [pnpm](https://pnpm.io) 10.

```bash
pnpm install

pnpm start registrar --legajo L1001 --nombre "Ana Pérez" --email ana@mail.com \
  --tipo CERTIFICADO --descripcion "Certificado de alumno regular"
pnpm start estado SOL-0001 EN_REVISION
pnpm start asignar SOL-0001 "María López"
pnpm start buscar --estado EN_REVISION
pnpm start ver SOL-0001
pnpm start reporte
```

Los datos se guardan en `data/solicitudes.json`. La ruta se cambia con la variable de entorno
`SOLICITUDES_DB`. Si el archivo existe pero está dañado, el sistema **informa el error y no lo
modifica**.

Para ver un escenario completo de 13 comandos con una base temporal: `node scripts/demo.mjs`.

## Funcionalidades

| Comando                      | Qué hace                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `registrar`                  | Valida los datos; define prioridad, plazo y área según el tipo; impide dos solicitudes activas del mismo tipo para un legajo. Opciones: `--prioridad`, `--dias` (1–60), `--responsable`. |
| `estado <id> <estado>`       | Cambia el estado respetando el circuito (PENDIENTE → EN_REVISION → APROBADA/RECHAZADA → CERRADA).                                                                                        |
| `asignar <id> <responsable>` | Reasigna mientras la solicitud siga abierta.                                                                                                                                             |
| `buscar`                     | Filtra por `--estado`, `--tipo`, `--prioridad`, `--legajo` (combinables).                                                                                                                |
| `ver <id>`                   | Muestra el detalle y el historial.                                                                                                                                                       |
| `reporte`                    | Totales por estado, tipo y prioridad; solicitudes vencidas y próximas a vencer (≤ 2 días).                                                                                               |

Reglas por tipo: ver `docs/01-sistema-base.md`, sección 1.5.

## Tecnologías

TypeScript 5.9 (`strict`) · Node.js 22 · Vitest (cobertura v8) · ESLint + typescript-eslint +
sonarjs · Prettier · jscpd · GitHub Actions.

## Arquitectura

```
src/
  dominio/          Reglas y entidades puras: Solicitud, Email, Estudiante, tablas de reglas y de estados
  aplicacion/       Casos de uso (ServicioDeSolicitudes, ServicioDeReportes) y puertos (interfaces)
  infraestructura/  Adaptadores: repositorio JSON, repositorio en memoria, reloj del sistema
  presentacion/     Comandos de la CLI y formato de texto
  cli.ts            Raíz de composición: conecta todo
legacy/             Copia congelada de la v1, solo para la prueba diferencial
tests/              253 pruebas
scripts/            Métricas, demo y verificación por mutaciones
docs/               Informe técnico (documentos 01–09), ADRs y evidencias
```

Las dependencias apuntan hacia adentro: el dominio no conoce `fs`, la consola ni el reloj
(ADR-0003).

## Calidad: antes y después

| Métrica                             | `estado-inicial` | `estado-refactorizado` |
| ----------------------------------- | ---------------- | ---------------------- |
| Complejidad ciclomática máxima      | 43               | 8                      |
| Líneas de la función más larga      | 119              | 21                     |
| Parámetros máximos                  | 8                | 4                      |
| Código duplicado (jscpd)            | 4,3 %            | 0 %                    |
| Violaciones de la config de calidad | 126              | 8                      |
| Pruebas                             | 0                | 253                    |
| Mutaciones detectadas               | —                | 23 / 23                |

El comportamiento visible es idéntico: la demo de 13 comandos produce la misma salida byte a byte
y una prueba diferencial compara ambas versiones con 3 600 comandos aleatorios.

## Desarrollo

```bash
pnpm test            # pruebas
pnpm coverage        # cobertura
pnpm typecheck       # tipos
pnpm lint            # ESLint
pnpm lint:calidad    # ESLint con umbrales de calidad (complejidad, tamaño, parámetros)
pnpm metricas        # tabla de métricas de calidad interna
pnpm duplicacion     # código duplicado
pnpm format          # Prettier
node scripts/mutaciones.mjs v2   # verifica que las pruebas detecten defectos introducidos
```

## Tags del repositorio

| Tag                    | Qué marca                                   |
| ---------------------- | ------------------------------------------- |
| `estado-inicial`       | Versión inicial con deuda técnica           |
| `etapa-diagnostico`    | Diagnóstico y code smells                   |
| `etapa-refactoring`    | Refactorings R1–R14 terminados              |
| `etapa-pruebas`        | Pruebas antes/después y evidencia v2        |
| `etapa-docs`           | Documentación completa                      |
| `estado-refactorizado` | Versión final (alias `estadorefactorizado`) |

Para comparar: `git diff estado-inicial estado-refactorizado --stat`.

## Documentación

| #   | Documento                                                                |
| --- | ------------------------------------------------------------------------ |
| 1   | [Sistema base](docs/01-sistema-base.md)                                  |
| 2   | [Calidad externa vs. interna](docs/02-calidad-externa-vs-interna.md)     |
| 3   | [Deuda técnica y code smells](docs/03-deuda-tecnica-y-code-smells.md)    |
| 4   | [SOLID y Clean Code](docs/04-solid-y-clean-code.md)                      |
| 5   | [Refactoring y trazabilidad](docs/05-refactoring-y-trazabilidad.md)      |
| 6   | [Pruebas y verificación](docs/06-pruebas-y-verificacion.md)              |
| 7   | [Code review (checklist y registro)](docs/07-code-review.md)             |
| 8   | [Uso de IA y registro de prompts](docs/08-uso-de-ia.md)                  |
| 9   | [Participación y conclusiones](docs/09-participacion-y-conclusiones.md)  |
| —   | [Decisiones técnicas (ADRs)](docs/adr/) · [Evidencias](docs/evidencias/) |

## Entregables del TPI

- Informe en PDF único: se entrega por separado (portada, resumen, 8 etapas, evidencias, prompts de IA, conclusiones)
- Video de defensa: se carga en la plataforma institucional junto con el PDF y se enlaza en el informe
- Repositorio: este repositorio, con los tags `estado-inicial` y `estado-refactorizado`

Todos los datos de ejemplo son **sintéticos**. Ver `CONTRIBUTING.md` para el flujo de trabajo.
