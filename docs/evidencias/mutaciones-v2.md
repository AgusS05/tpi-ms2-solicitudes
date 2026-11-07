### Sensibilidad de la suite: mutaciones manuales sobre v2

Mutaciones detectadas: **23 de 23**

| # | Defecto introducido | Archivo | Resultado | Pruebas que fallaron |
|---|---|---|---|---|
| 1 | Plazo de CERTIFICADO 5 -> 6 días | `src/dominio/reglas-por-tipo.ts` | DETECTADA | 43 |
| 2 | Prioridad por defecto de BAJA (tipo) deja de ser ALTA | `src/dominio/reglas-por-tipo.ts` | DETECTADA | 9 |
| 3 | Tope del plazo de prioridad ALTA 3 -> 4 días | `src/dominio/reglas-de-negocio.ts` | DETECTADA | 5 |
| 4 | Largo mínimo de descripción 10 -> 9 | `src/dominio/reglas-de-negocio.ts` | DETECTADA | 5 |
| 5 | Plazo máximo permitido 60 -> 61 días | `src/dominio/reglas-de-negocio.ts` | DETECTADA | 8 |
| 6 | Se elimina el control de solicitudes activas duplicadas | `src/aplicacion/servicio-solicitudes.ts` | DETECTADA | 4 |
| 7 | EN_REVISION ya no puede volver a PENDIENTE | `src/dominio/estado.ts` | DETECTADA | 3 |
| 8 | APROBADA puede volver a PENDIENTE | `src/dominio/estado.ts` | DETECTADA | 2 |
| 9 | Se permite reasignar una solicitud cerrada | `src/dominio/solicitud.ts` | DETECTADA | 8 |
| 10 | El filtro por legajo de la búsqueda se ignora | `src/dominio/filtro-solicitudes.ts` | DETECTADA | 5 |
| 11 | El historial inicial guarda '' en lugar de null | `src/aplicacion/servicio-solicitudes.ts` | DETECTADA | 36 |
| 12 | Ventana de «próximas a vencer» 2 -> 3 días | `src/dominio/reglas-de-negocio.ts` | DETECTADA | 8 |
| 13 | El día del vencimiento pasa a contarse como vencida | `src/dominio/solicitud.ts` | DETECTADA | 3 |
| 14 | Las solicitudes aprobadas cuentan como abiertas | `src/dominio/estado.ts` | DETECTADA | 8 |
| 15 | El identificador pierde el relleno de ceros (SOL-1) | `src/dominio/solicitud.ts` | DETECTADA | 110 |
| 16 | El código de salida ante un error pasa a ser 0 | `src/presentacion/comandos.ts` | DETECTADA | 76 |
| 17 | El email deja de validar la arroba | `src/dominio/email.ts` | DETECTADA | 2 |
| 18 | La descripción no se recorta al guardarla | `src/dominio/datos-nueva-solicitud.ts` | DETECTADA | 2 |
| 19 | Un plazo explícito deja de prevalecer sobre la prioridad ALTA | `src/dominio/reglas-por-tipo.ts` | DETECTADA | 4 |
| 20 | El responsable indicado se ignora y siempre se usa el área | `src/aplicacion/servicio-solicitudes.ts` | DETECTADA | 3 |
| 21 | Un archivo de datos dañado vuelve a ignorarse en silencio (regresión del fix S8) | `src/infraestructura/repositorio-json.ts` | DETECTADA | 6 |
| 22 | El orden de los estados en el reporte se invierte | `src/dominio/estado.ts` | DETECTADA | 5 |
| 23 | Reasignar acepta un responsable vacío | `src/dominio/solicitud.ts` | DETECTADA | 13 |
