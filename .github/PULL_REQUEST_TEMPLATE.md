## Qué cambia y por qué

<!-- Una o dos frases. Si es un refactoring: qué técnica (Extract Method, Move Method, …) y qué smell resuelve (S1–S13). -->

## Tipo de cambio

- [ ] Refactoring (no cambia el comportamiento)
- [ ] Cambio de comportamiento (va en commit `fix:`/`feat:` separado y justificado)
- [ ] Pruebas
- [ ] Documentación

## Checklist de code review (ver `docs/07-code-review.md`)

**Corrección**

- [ ] Hace lo que dice el título y nada más
- [ ] Las pruebas existentes pasan **sin modificarse** (o está justificado)
- [ ] Revisé el diff completo (reemplazos masivos, constantes confundibles)
- [ ] Hay pruebas para lo nuevo y para los casos borde

**Diseño**

- [ ] SRP · OCP · LSP · ISP · DIP: sin violaciones nuevas
- [ ] La lógica de negocio no usa `fs`, `process`, `console` ni `new Date()`

**Clean Code**

- [ ] Nombres claros; funciones ≤ 30 líneas, complejidad ≤ 8, ≤ 4 parámetros
- [ ] Sin números mágicos, código muerto, duplicación ni `catch` vacíos
- [ ] Sin `any`; datos de ejemplo **sintéticos**

**Proceso**

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` y `pnpm test` en verde
- [ ] Documentación y README actualizados

## Evidencia

<!-- Salida de pruebas, métricas antes/después o captura relevante. -->

## Revisor/a

<!-- Persona distinta de quien escribió el cambio. -->
