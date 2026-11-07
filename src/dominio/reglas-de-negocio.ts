/** Constantes con nombre de las reglas de negocio (antes eran números "mágicos"). */
export const LARGO_MINIMO_DESCRIPCION = 10;
export const PLAZO_MINIMO_DIAS = 1;
export const PLAZO_MAXIMO_DIAS = 60;
/** Tope de plazo (en días) para las solicitudes de prioridad ALTA sin plazo explícito. */
export const PLAZO_MAXIMO_PRIORIDAD_ALTA = 3;
/** Una solicitud abierta se informa como "próxima a vencer" si le quedan estos días o menos. */
export const DIAS_AVISO_VENCIMIENTO = 2;
export const MS_POR_DIA = 24 * 60 * 60 * 1000;
