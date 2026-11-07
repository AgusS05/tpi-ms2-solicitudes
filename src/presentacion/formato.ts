// Presentación: convierte datos del dominio en las líneas de texto que ve el usuario.
// Son funciones puras (reciben datos, devuelven texto), por eso se prueban sin consola ni disco.
import { Conteo, Reporte } from '../aplicacion/servicio-reportes';
import { CambioRealizado } from '../aplicacion/servicio-solicitudes';
import { DIAS_AVISO_VENCIMIENTO } from '../dominio/reglas-de-negocio';
import { Solicitud } from '../dominio/solicitud';

function lineasDeConteo<T extends string>(titulo: string, conteos: Conteo<T>[]): string[] {
  return [titulo, ...conteos.map((c) => `  ${c.categoria}: ${c.cantidad}`)];
}

export function lineasDeReporte(reporte: Reporte): string[] {
  return [
    `=== REPORTE DE SOLICITUDES (${reporte.fecha}) ===`,
    `Total: ${reporte.total}`,
    ...lineasDeConteo('Por estado:', reporte.porEstado),
    ...lineasDeConteo('Por tipo:', reporte.porTipo),
    ...lineasDeConteo('Por prioridad:', reporte.porPrioridad),
    `Vencidas: ${reporte.vencidas.length}`,
    ...reporte.vencidas.map(
      (a) => `  ${a.id} vencida hace ${-a.dias} días (responsable: ${a.responsable})`,
    ),
    `Próximas a vencer (${DIAS_AVISO_VENCIMIENTO} días o menos): ${reporte.porVencer.length}`,
    ...reporte.porVencer.map(
      (a) => `  ${a.id} vence en ${a.dias} días (responsable: ${a.responsable})`,
    ),
  ];
}

export const LINEAS_DE_AYUDA: readonly string[] = [
  'Uso: pnpm start <comando> [opciones]',
  '  registrar --legajo L --nombre N --email E --tipo T --descripcion D [--prioridad P] [--dias N] [--responsable R]',
  '  estado <id> <nuevoEstado>',
  '  asignar <id> <responsable>',
  '  buscar [--estado E] [--tipo T] [--prioridad P] [--legajo L]',
  '  ver <id>',
  '  reporte',
];

export function lineaDeRegistro(s: Solicitud): string {
  return `Solicitud ${s.id} registrada (prioridad ${s.prioridad}, vence ${s.fechaLimite}, responsable: ${s.responsable})`;
}

export function lineaDeCambioDeEstado(c: CambioRealizado): string {
  return `Solicitud ${c.id}: ${c.de} -> ${c.a}`;
}

export function lineaDeAsignacion(s: Solicitud): string {
  return `Solicitud ${s.id} asignada a ${s.responsable}`;
}

export function lineasDeBusqueda(solicitudes: readonly Solicitud[]): string[] {
  const filas = solicitudes.map(
    (s) =>
      `${s.id} | ${s.tipo} | ${s.prioridad} | ${s.estado} | ${s.estudiante.nombre} | ${s.responsable}`,
  );
  return [...filas, `Total: ${solicitudes.length}`];
}

export function lineasDeDetalle(s: Solicitud): string[] {
  return [
    `${s.id} | ${s.tipo} | ${s.prioridad} | ${s.estado}`,
    `Estudiante: ${s.estudiante.nombre} (${s.estudiante.legajo}) <${s.estudiante.email}>`,
    `Descripción: ${s.descripcion}`,
    `Responsable: ${s.responsable}`,
    `Creada: ${s.fechaCreacion} | Vence: ${s.fechaLimite}`,
    'Historial:',
    ...s.historial.map((h) => `  ${h.fecha}: ${h.de ?? '(inicio)'} -> ${h.a}`),
  ];
}
