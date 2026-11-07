import { ErrorDeValidacion } from './errores';

/** Value Object: un Email existe solo si es válido (antes era un string cualquiera). */
export class Email {
  private constructor(readonly valor: string) {}

  static esValido(valor: string | undefined): valor is string {
    return !!valor && valor.indexOf('@') >= 1 && valor.indexOf('.') >= 0;
  }

  static crear(valor: string | undefined): Email {
    if (!Email.esValido(valor)) throw new ErrorDeValidacion('email inválido');
    return new Email(valor);
  }

  toString(): string {
    return this.valor;
  }
}
