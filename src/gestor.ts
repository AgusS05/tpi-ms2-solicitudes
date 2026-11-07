import * as fs from 'fs';
import * as path from 'path';
import { DatosNuevaSolicitud } from './dominio/datos-nueva-solicitud';
import {
  ErrorDeValidacion,
  ReasignacionNoPermitida,
  SolicitudDuplicada,
  SolicitudInexistente,
  TransicionNoPermitida,
} from './dominio/errores';
import { ESTADOS, Estado, esEstado, puedeTransicionar } from './dominio/estado';
import { PRIORIDADES, Prioridad, esPrioridad } from './dominio/prioridad';
import {
  DIAS_AVISO_VENCIMIENTO,
  LARGO_MINIMO_DESCRIPCION,
  MS_POR_DIA,
  PLAZO_MAXIMO_DIAS,
  PLAZO_MAXIMO_PRIORIDAD_ALTA,
  PLAZO_MINIMO_DIAS,
} from './dominio/reglas-de-negocio';
import { REGLAS_POR_TIPO } from './dominio/reglas-por-tipo';
import { TIPOS, TipoSolicitud, esTipo } from './dominio/tipo-solicitud';

// Gestor de solicitudes academicas.
// Se encarga de todo: valida, calcula, guarda en archivo e imprime por consola.
// OJO: funciona, no tocar mucho (version prototipo del primer cuatrimestre)
export class GestorSolicitudes {
  solicitudes: any[] = [];
  contador = 0;
  ruta: string;
  modoDebug = false; // TODO: usar para logs

  constructor() {
    this.ruta = process.env.SOLICITUDES_DB || './data/solicitudes.json';
    try {
      const raw = fs.readFileSync(this.ruta, 'utf8');
      const d = JSON.parse(raw);
      this.solicitudes = d.solicitudes;
      this.contador = d.contador;
    } catch (e) {}
  }

  guardar() {
    fs.mkdirSync(path.dirname(this.ruta), { recursive: true });
    fs.writeFileSync(
      this.ruta,
      JSON.stringify({ solicitudes: this.solicitudes, contador: this.contador }, null, 2),
    );
  }

  registrarSolicitud(datos: DatosNuevaSolicitud): string {
    this.validarDatosDeRegistro(datos);

    const reglas = this.reglasDelTipo(datos.tipo, datos.prioridad, datos.dias);

    if (this.existeSolicitudActiva(datos.legajo, datos.tipo)) {
      throw new SolicitudDuplicada(datos.legajo);
    }

    this.contador++;
    const id = 'SOL-' + String(this.contador).padStart(4, '0');
    const hoy = this.hoy();
    const s = {
      id: id,
      legajo: datos.legajo,
      nombre: datos.nombre,
      email: datos.email,
      tipo: datos.tipo,
      descripcion: datos.descripcion.trim(),
      prioridad: reglas.prioridad,
      estado: Estado.PENDIENTE,
      responsable: datos.responsable ? datos.responsable : reglas.area,
      fechaCreacion: hoy,
      fechaLimite: this.calcularFechaLimite(reglas.plazo),
      historial: [{ fecha: hoy, de: null, a: Estado.PENDIENTE }],
    };
    this.solicitudes.push(s);
    this.guardar();
    console.log(
      'Solicitud ' +
        id +
        ' registrada (prioridad ' +
        s.prioridad +
        ', vence ' +
        s.fechaLimite +
        ', responsable: ' +
        s.responsable +
        ')',
    );
    return id;
  }

  /** Lanza ErrorDeValidacion con el primer problema que encuentre en los datos. */
  validarDatosDeRegistro(datos: DatosNuevaSolicitud): void {
    const { legajo, nombre, email, tipo, descripcion, prioridad, dias } = datos;
    if (!legajo || legajo.trim() == '') throw new ErrorDeValidacion('el legajo es obligatorio');
    if (!nombre || nombre.trim() == '') throw new ErrorDeValidacion('el nombre es obligatorio');
    if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      throw new ErrorDeValidacion('email inválido');
    }
    if (!esTipo(tipo)) throw new ErrorDeValidacion('tipo de solicitud inválido: ' + tipo);
    if (!descripcion || descripcion.trim().length < LARGO_MINIMO_DESCRIPCION) {
      throw new ErrorDeValidacion(
        `la descripción debe tener al menos ${LARGO_MINIMO_DESCRIPCION} caracteres`,
      );
    }
    if (prioridad && !esPrioridad(prioridad)) {
      throw new ErrorDeValidacion('prioridad inválida: ' + prioridad);
    }
    if (
      dias !== undefined &&
      dias !== null &&
      (isNaN(dias) || dias < PLAZO_MINIMO_DIAS || dias > PLAZO_MAXIMO_DIAS)
    ) {
      throw new ErrorDeValidacion(
        `plazo inválido (${PLAZO_MINIMO_DIAS} a ${PLAZO_MAXIMO_DIAS} días)`,
      );
    }
  }

  /** Prioridad, plazo en días y área responsable según el tipo de solicitud. */
  reglasDelTipo(
    tipo: string,
    prioridad?: string,
    dias?: number,
  ): { prioridad: string; plazo: number; area: string } {
    const regla = REGLAS_POR_TIPO[tipo as TipoSolicitud];
    const prioridadFinal = prioridad || regla.prioridadPorDefecto;
    let plazo = regla.plazoDias;
    if (!dias) {
      if (prioridadFinal == Prioridad.ALTA) {
        plazo = Math.min(plazo, PLAZO_MAXIMO_PRIORIDAD_ALTA);
      }
    } else {
      plazo = dias;
    }
    return { prioridad: prioridadFinal, plazo: plazo, area: regla.areaResponsable };
  }

  /** Una solicitud está activa mientras esté PENDIENTE o EN_REVISION. */
  existeSolicitudActiva(legajo: string, tipo: string): boolean {
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (
        this.solicitudes[i].legajo == legajo &&
        this.solicitudes[i].tipo == tipo &&
        (this.solicitudes[i].estado == Estado.PENDIENTE ||
          this.solicitudes[i].estado == Estado.EN_REVISION)
      ) {
        return true;
      }
    }
    return false;
  }

  buscarPorId(id: string): any {
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (this.solicitudes[i].id == id) return this.solicitudes[i];
    }
    return null;
  }

  /** Fecha actual en formato AAAA-MM-DD. */
  hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  calcularFechaLimite(plazoEnDias: number): string {
    return new Date(new Date().getTime() + plazoEnDias * MS_POR_DIA).toISOString().slice(0, 10);
  }

  cambiarEstado(id: string, nuevo: string): void {
    const s = this.buscarPorId(id);
    if (s == null) throw new SolicitudInexistente(id);
    if (!esEstado(nuevo)) throw new ErrorDeValidacion('estado inválido: ' + nuevo);
    const anterior = s.estado;
    if (!puedeTransicionar(anterior, nuevo)) throw new TransicionNoPermitida(anterior, nuevo);
    s.estado = nuevo;
    s.historial.push({ fecha: this.hoy(), de: anterior, a: nuevo });
    this.guardar();
    console.log('Solicitud ' + id + ': ' + anterior + ' -> ' + nuevo);
  }

  asignarResponsable(id: string, resp: string): void {
    const s = this.buscarPorId(id);
    if (s == null) throw new SolicitudInexistente(id);
    if (!resp || resp.trim() == '') throw new ErrorDeValidacion('el responsable es obligatorio');
    if (s.estado != Estado.PENDIENTE && s.estado != Estado.EN_REVISION) {
      throw new ReasignacionNoPermitida(s.estado);
    }
    s.responsable = resp.trim();
    this.guardar();
    console.log('Solicitud ' + id + ' asignada a ' + s.responsable);
  }

  buscar(estado?: string, tipo?: string, prioridad?: string, legajo?: string): any[] {
    if (estado && !esEstado(estado)) throw new ErrorDeValidacion('estado inválido: ' + estado);
    if (tipo && !esTipo(tipo)) throw new ErrorDeValidacion('tipo de solicitud inválido: ' + tipo);
    if (prioridad && !esPrioridad(prioridad)) {
      throw new ErrorDeValidacion('prioridad inválida: ' + prioridad);
    }
    let r = this.solicitudes;
    if (estado) {
      const t = [];
      for (let i = 0; i < r.length; i++) {
        if (r[i].estado == estado) {
          t.push(r[i]);
        }
      }
      r = t;
    }
    if (tipo) {
      const t = [];
      for (let i = 0; i < r.length; i++) {
        if (r[i].tipo == tipo) {
          t.push(r[i]);
        }
      }
      r = t;
    }
    if (prioridad) {
      const t = [];
      for (let i = 0; i < r.length; i++) {
        if (r[i].prioridad == prioridad) {
          t.push(r[i]);
        }
      }
      r = t;
    }
    if (legajo) {
      const t = [];
      for (let i = 0; i < r.length; i++) {
        if (r[i].legajo == legajo) {
          t.push(r[i]);
        }
      }
      r = t;
    }
    for (let i = 0; i < r.length; i++) {
      const x = r[i];
      console.log(
        x.id +
          ' | ' +
          x.tipo +
          ' | ' +
          x.prioridad +
          ' | ' +
          x.estado +
          ' | ' +
          x.nombre +
          ' | ' +
          x.responsable,
      );
    }
    console.log('Total: ' + r.length);
    return r;
  }

  mostrar(id: string): void {
    const s = this.buscarPorId(id);
    if (s == null) throw new SolicitudInexistente(id);
    console.log(s.id + ' | ' + s.tipo + ' | ' + s.prioridad + ' | ' + s.estado);
    console.log('Estudiante: ' + s.nombre + ' (' + s.legajo + ') <' + s.email + '>');
    console.log('Descripción: ' + s.descripcion);
    console.log('Responsable: ' + s.responsable);
    console.log('Creada: ' + s.fechaCreacion + ' | Vence: ' + s.fechaLimite);
    console.log('Historial:');
    for (let i = 0; i < s.historial.length; i++) {
      const h = s.historial[i];
      console.log('  ' + h.fecha + ': ' + (h.de == null ? '(inicio)' : h.de) + ' -> ' + h.a);
    }
  }

  generarReporte() {
    const hoy = this.hoy();
    console.log('=== REPORTE DE SOLICITUDES (' + hoy + ') ===');
    console.log('Total: ' + this.solicitudes.length);

    const estados = ESTADOS;
    console.log('Por estado:');
    for (let i = 0; i < estados.length; i++) {
      let c = 0;
      for (let j = 0; j < this.solicitudes.length; j++) {
        if (this.solicitudes[j].estado == estados[i]) c++;
      }
      console.log('  ' + estados[i] + ': ' + c);
    }
    const tipos = TIPOS;
    console.log('Por tipo:');
    for (let i = 0; i < tipos.length; i++) {
      let c = 0;
      for (let j = 0; j < this.solicitudes.length; j++) {
        if (this.solicitudes[j].tipo == tipos[i]) c++;
      }
      console.log('  ' + tipos[i] + ': ' + c);
    }
    const prios = PRIORIDADES;
    console.log('Por prioridad:');
    for (let i = 0; i < prios.length; i++) {
      let c = 0;
      for (let j = 0; j < this.solicitudes.length; j++) {
        if (this.solicitudes[j].prioridad == prios[i]) c++;
      }
      console.log('  ' + prios[i] + ': ' + c);
    }

    // vencimientos de las solicitudes que siguen abiertas
    const venc: string[] = [];
    const prox: string[] = [];
    for (let i = 0; i < this.solicitudes.length; i++) {
      const s = this.solicitudes[i];
      if (s.estado == Estado.PENDIENTE || s.estado == Estado.EN_REVISION) {
        const dif = Math.round(
          (new Date(s.fechaLimite + 'T00:00:00Z').getTime() -
            new Date(hoy + 'T00:00:00Z').getTime()) /
            MS_POR_DIA,
        );
        if (dif < 0) {
          venc.push(
            '  ' + s.id + ' vencida hace ' + -dif + ' días (responsable: ' + s.responsable + ')',
          );
        } else if (dif <= DIAS_AVISO_VENCIMIENTO) {
          prox.push(
            '  ' + s.id + ' vence en ' + dif + ' días (responsable: ' + s.responsable + ')',
          );
        }
      }
    }
    console.log('Vencidas: ' + venc.length);
    for (let i = 0; i < venc.length; i++) console.log(venc[i]);
    console.log(`Próximas a vencer (${DIAS_AVISO_VENCIMIENTO} días o menos): ` + prox.length);
    for (let i = 0; i < prox.length; i++) console.log(prox[i]);
  }
}
