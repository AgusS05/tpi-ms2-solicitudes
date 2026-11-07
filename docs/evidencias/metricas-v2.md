### Métricas de calidad interna — v2

| Métrica | Valor |
|---|---|
| Archivos / líneas de código | 21 / 759 |
| Funciones y métodos medidos | 102 |
| Complejidad ciclomática (máx / prom) | 8 / 1.5 |
| Líneas por función (máx / prom) | 21 / 4.9 |
| Parámetros por función (máx) | 4 |
| Funciones sobre umbral (complejidad > 8) | 0 |
| Funciones sobre umbral (líneas > 30) | 0 |
| Funciones sobre umbral (parámetros > 4) | 0 |
| Violaciones de la config de calidad | 8 |
| Código duplicado (jscpd) | 0 % (0 clones) |

Funciones más complejas:

| Función | Archivo | Complejidad | Líneas | Parámetros |
|---|---|---|---|---|
| coincide | src/dominio/filtro-solicitudes.ts:46 | 8 | 8 | 1 |
| ejecutarComando | src/presentacion/comandos.ts:71 | 5 | 15 | 2 |
| exigirPlazoValido | src/dominio/datos-nueva-solicitud.ts:55 | 5 | 8 | 1 |
| resolverCondiciones | src/dominio/reglas-por-tipo.ts:51 | 4 | 15 | 3 |
| reasignar | src/dominio/solicitud.ts:121 | 4 | 7 | 1 |
| estaPorVencer | src/dominio/solicitud.ts:105 | 4 | 4 | 2 |
| validarDatosNuevaSolicitud | src/dominio/datos-nueva-solicitud.ts:68 | 3 | 18 | 1 |
| constructor | src/infraestructura/repositorio-json.ts:9 | 3 | 13 | 1 |

Violaciones por regla: `no-magic-numbers`: 8
