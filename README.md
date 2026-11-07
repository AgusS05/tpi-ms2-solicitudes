# Gestión de Solicitudes Académicas

Sistema de línea de comandos para registrar y gestionar solicitudes de estudiantes
(certificados, equivalencias, cambios de comisión, reincorporaciones y bajas).

> Trabajo Práctico Integrador — Metodología de Sistemas II (UTN, Tecnicatura Universitaria en Programación).

## Instalación y uso

```bash
pnpm install        # o: npm install
pnpm start registrar --legajo L1001 --nombre "Ana Pérez" --email ana@mail.com \
  --tipo CERTIFICADO --descripcion "Certificado de alumno regular"
pnpm start estado SOL-0001 EN_REVISION
pnpm start asignar SOL-0001 "María López"
pnpm start buscar --estado EN_REVISION
pnpm start ver SOL-0001
pnpm start reporte
```

Los datos se guardan en `data/solicitudes.json` (se puede cambiar con la variable `SOLICITUDES_DB`).
