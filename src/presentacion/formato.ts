// Presentación: convierte datos del dominio en las líneas de texto que ve el usuario.
// Son funciones puras (reciben datos, devuelven texto), por eso se prueban sin consola ni disco.
import { Conteo, Reporte } from '../aplicacion/servicio-reportes';
import { DIAS_AVISO_VENCIMIENTO } from '../dominio/reglas-de-negocio';

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
