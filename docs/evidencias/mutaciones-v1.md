### Sensibilidad de la suite: mutaciones manuales sobre v1

Mutaciones detectadas: **15 de 15**

| # | Defecto introducido | Archivo | Resultado | Pruebas que fallaron |
|---|---|---|---|---|
| 1 | Plazo de CERTIFICADO 5 -> 6 días | `src/gestor.ts` | DETECTADA | 7 |
| 2 | Prioridad por defecto de BAJA (tipo) deja de ser ALTA | `src/gestor.ts` | DETECTADA | 6 |
| 3 | Tope del plazo de prioridad ALTA 3 -> 4 días | `src/gestor.ts` | DETECTADA | 2 |
| 4 | Largo mínimo de descripción 10 -> 9 | `src/gestor.ts` | DETECTADA | 1 |
| 5 | Plazo máximo permitido 60 -> 61 días | `src/gestor.ts` | DETECTADA | 1 |
| 6 | Se elimina el control de solicitudes activas duplicadas | `src/gestor.ts` | DETECTADA | 2 |
| 7 | EN_REVISION ya no puede volver a PENDIENTE | `src/gestor.ts` | DETECTADA | 1 |
| 8 | Se permite reasignar una solicitud CERRADA | `src/gestor.ts` | DETECTADA | 1 |
| 9 | El filtro por legajo de la búsqueda se ignora | `src/gestor.ts` | DETECTADA | 2 |
| 10 | El historial inicial guarda "" en lugar de null | `src/gestor.ts` | DETECTADA | 3 |
| 11 | Ventana de "próximas a vencer" 2 -> 3 días | `src/gestor.ts` | DETECTADA | 1 |
| 12 | El día del vencimiento pasa a contarse como vencida | `src/gestor.ts` | DETECTADA | 1 |
| 13 | El reporte cuenta también las solicitudes ya aprobadas como abiertas | `src/gestor.ts` | DETECTADA | 2 |
| 14 | El identificador pierde el relleno de ceros (SOL-1) | `src/gestor.ts` | DETECTADA | 62 |
| 15 | El código de salida ante un error de estado es 0 | `src/cli.ts` | DETECTADA | 20 |
