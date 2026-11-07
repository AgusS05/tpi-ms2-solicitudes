import * as fs from 'fs';
import * as path from 'path';
import { DatosNuevaSolicitud } from './dominio/datos-nueva-solicitud';
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

  registrarSolicitud(datos: DatosNuevaSolicitud): any {
    const mensajeDeError = this.validarDatosDeRegistro(datos);
    if (mensajeDeError) {
      console.log(mensajeDeError);
      return -1;
    }

    const reglas = this.reglasDelTipo(datos.tipo, datos.prioridad, datos.dias);

    if (this.existeSolicitudActiva(datos.legajo, datos.tipo)) {
      console.log(
        'ERROR: ya existe una solicitud activa de ese tipo para el legajo ' + datos.legajo,
      );
      return -1;
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

  /** Devuelve el mensaje del primer error de validación, o null si los datos son válidos. */
  validarDatosDeRegistro(datos: DatosNuevaSolicitud): string | null {
    const { legajo, nombre, email, tipo, descripcion, prioridad, dias } = datos;
    if (!legajo || legajo.trim() == '') return 'ERROR: el legajo es obligatorio';
    if (!nombre || nombre.trim() == '') return 'ERROR: el nombre es obligatorio';
    if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return 'ERROR: email inválido';
    if (!esTipo(tipo)) {
      return 'ERROR: tipo de solicitud inválido: ' + tipo;
    }
    if (!descripcion || descripcion.trim().length < LARGO_MINIMO_DESCRIPCION) {
      return `ERROR: la descripción debe tener al menos ${LARGO_MINIMO_DESCRIPCION} caracteres`;
    }
    if (prioridad && !esPrioridad(prioridad)) {
      return 'ERROR: prioridad inválida: ' + prioridad;
    }
    if (
      dias !== undefined &&
      dias !== null &&
      (isNaN(dias) || dias < PLAZO_MINIMO_DIAS || dias > PLAZO_MAXIMO_DIAS)
    ) {
      return `ERROR: plazo inválido (${PLAZO_MINIMO_DIAS} a ${PLAZO_MAXIMO_DIAS} días)`;
    }
    return null;
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

  cambiarEstado(id: string, nuevo: string): boolean {
    const s = this.buscarPorId(id);
    if (s == null) {
      console.log('ERROR: no existe la solicitud ' + id);
      return false;
    }
    if (!esEstado(nuevo)) {
      console.log('ERROR: estado inválido: ' + nuevo);
      return false;
    }
    const a = s.estado;
    const ok = puedeTransicionar(a, nuevo);
    if (!ok) {
      console.log('ERROR: transición no permitida: ' + a + ' -> ' + nuevo);
      return false;
    }
    s.estado = nuevo;
    s.historial.push({ fecha: this.hoy(), de: a, a: nuevo });
    this.guardar();
    console.log('Solicitud ' + id + ': ' + a + ' -> ' + nuevo);
    return true;
  }

  asignarResponsable(id: string, resp: string): boolean {
    const s = this.buscarPorId(id);
    if (s == null) {
      console.log('ERROR: no existe la solicitud ' + id);
      return false;
    }
    if (!resp || resp.trim() == '') {
      console.log('ERROR: el responsable es obligatorio');
      return false;
    }
    if (s.estado == Estado.APROBADA || s.estado == Estado.RECHAZADA || s.estado == Estado.CERRADA) {
      console.log('ERROR: no se puede reasignar una solicitud en estado ' + s.estado);
      return false;
    }
    s.responsable = resp.trim();
    this.guardar();
    console.log('Solicitud ' + id + ' asignada a ' + s.responsable);
    return true;
  }

  buscar(estado?: string, tipo?: string, prioridad?: string, legajo?: string): any {
    if (estado && !esEstado(estado)) {
      console.log('ERROR: estado inválido: ' + estado);
      return -1;
    }
    if (tipo && !esTipo(tipo)) {
      console.log('ERROR: tipo de solicitud inválido: ' + tipo);
      return -1;
    }
    if (prioridad && !esPrioridad(prioridad)) {
      console.log('ERROR: prioridad inválida: ' + prioridad);
      return -1;
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

  mostrar(id: string): boolean {
    const s = this.buscarPorId(id);
    if (s == null) {
      console.log('ERROR: no existe la solicitud ' + id);
      return false;
    }
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
    return true;
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
