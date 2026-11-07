/**
 * Errores de dominio: reemplazan a los códigos de error (-1, false, null) de la versión inicial.
 * Las reglas de negocio ya no imprimen ni devuelven códigos: lanzan una excepción con un nombre
 * que dice qué pasó, y el borde del sistema (la CLI) decide cómo mostrarla.
 */
export class ErrorDeDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** Un dato ingresado no cumple una regla de formato o de rango. */
export class ErrorDeValidacion extends ErrorDeDominio {}

export class SolicitudInexistente extends ErrorDeDominio {
  constructor(id: string) {
    super(`no existe la solicitud ${id}`);
  }
}

export class SolicitudDuplicada extends ErrorDeDominio {
  constructor(legajo: string) {
    super(`ya existe una solicitud activa de ese tipo para el legajo ${legajo}`);
  }
}

export class TransicionNoPermitida extends ErrorDeDominio {
  constructor(desde: string, hacia: string) {
    super(`transición no permitida: ${desde} -> ${hacia}`);
  }
}

export class ReasignacionNoPermitida extends ErrorDeDominio {
  constructor(estado: string) {
    super(`no se puede reasignar una solicitud en estado ${estado}`);
  }
}
