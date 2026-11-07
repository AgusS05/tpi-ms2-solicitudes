import { Email } from './email';

/** Estudiante titular de una solicitud. Agrupa los datos que antes viajaban sueltos (data clump). */
export class Estudiante {
  constructor(
    readonly legajo: string,
    readonly nombre: string,
    readonly email: Email,
  ) {}
}
