import { Reloj } from '../aplicacion/puertos';

export class RelojDelSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
