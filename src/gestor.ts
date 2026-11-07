import * as fs from 'fs';
import * as path from 'path';

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

  registrarSolicitud(
    legajo: string,
    nombre: string,
    email: string,
    tipo: string,
    descripcion: string,
    prioridad: string,
    dias: number,
    responsable: string,
  ): any {
    const mensajeDeError = this.validarDatosDeRegistro(
      legajo,
      nombre,
      email,
      tipo,
      descripcion,
      prioridad,
      dias,
    );
    if (mensajeDeError) {
      console.log(mensajeDeError);
      return -1;
    }

    const reglas = this.reglasDelTipo(tipo, prioridad, dias);

    if (this.existeSolicitudActiva(legajo, tipo)) {
      console.log('ERROR: ya existe una solicitud activa de ese tipo para el legajo ' + legajo);
      return -1;
    }

    this.contador++;
    const id = 'SOL-' + String(this.contador).padStart(4, '0');
    const hoy = new Date().toISOString().slice(0, 10);
    const s = {
      id: id,
      legajo: legajo,
      nombre: nombre,
      email: email,
      tipo: tipo,
      descripcion: descripcion.trim(),
      prioridad: reglas.prioridad,
      estado: 'PENDIENTE',
      responsable: responsable ? responsable : reglas.area,
      fechaCreacion: hoy,
      fechaLimite: this.calcularFechaLimite(reglas.plazo),
      historial: [{ fecha: hoy, de: null, a: 'PENDIENTE' }],
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
  validarDatosDeRegistro(
    legajo: string,
    nombre: string,
    email: string,
    tipo: string,
    descripcion: string,
    prioridad: string,
    dias: number,
  ): string | null {
    if (!legajo || legajo.trim() == '') return 'ERROR: el legajo es obligatorio';
    if (!nombre || nombre.trim() == '') return 'ERROR: el nombre es obligatorio';
    if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) return 'ERROR: email inválido';
    if (
      tipo != 'CERTIFICADO' &&
      tipo != 'EQUIVALENCIA' &&
      tipo != 'CAMBIO_COMISION' &&
      tipo != 'REINCORPORACION' &&
      tipo != 'BAJA'
    ) {
      return 'ERROR: tipo de solicitud inválido: ' + tipo;
    }
    if (!descripcion || descripcion.trim().length < 10) {
      return 'ERROR: la descripción debe tener al menos 10 caracteres';
    }
    if (prioridad && prioridad != 'ALTA' && prioridad != 'MEDIA' && prioridad != 'BAJA') {
      return 'ERROR: prioridad inválida: ' + prioridad;
    }
    if (dias !== undefined && dias !== null && (isNaN(dias) || dias < 1 || dias > 60)) {
      return 'ERROR: plazo inválido (1 a 60 días)';
    }
    return null;
  }

  /** Prioridad, plazo en días y área responsable según el tipo de solicitud. */
  reglasDelTipo(
    tipo: string,
    prioridad: string,
    dias: number,
  ): { prioridad: string; plazo: number; area: string } {
    let p = prioridad;
    let plazo = 0;
    let area = '';
    if (tipo == 'CERTIFICADO') {
      if (!p) p = 'MEDIA';
      plazo = 5;
      area = 'Alumnado';
    } else if (tipo == 'EQUIVALENCIA') {
      if (!p) p = 'BAJA';
      plazo = 15;
      area = 'Secretaría Académica';
    } else if (tipo == 'CAMBIO_COMISION') {
      if (!p) p = 'MEDIA';
      plazo = 7;
      area = 'Alumnado';
    } else if (tipo == 'REINCORPORACION') {
      if (!p) p = 'ALTA';
      plazo = 10;
      area = 'Secretaría Académica';
    } else if (tipo == 'BAJA') {
      if (!p) p = 'ALTA';
      plazo = 3;
      area = 'Dirección de Carrera';
    }
    if (!dias) {
      if (p == 'ALTA' && plazo > 3) plazo = 3;
    } else {
      plazo = dias;
    }
    return { prioridad: p, plazo: plazo, area: area };
  }

  /** Una solicitud está activa mientras esté PENDIENTE o EN_REVISION. */
  existeSolicitudActiva(legajo: string, tipo: string): boolean {
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (
        this.solicitudes[i].legajo == legajo &&
        this.solicitudes[i].tipo == tipo &&
        (this.solicitudes[i].estado == 'PENDIENTE' || this.solicitudes[i].estado == 'EN_REVISION')
      ) {
        return true;
      }
    }
    return false;
  }

  calcularFechaLimite(plazoEnDias: number): string {
    return new Date(new Date().getTime() + plazoEnDias * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  cambiarEstado(id: string, nuevo: string): boolean {
    let s: any = null;
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (this.solicitudes[i].id == id) s = this.solicitudes[i];
    }
    if (s == null) {
      console.log('ERROR: no existe la solicitud ' + id);
      return false;
    }
    if (
      nuevo != 'PENDIENTE' &&
      nuevo != 'EN_REVISION' &&
      nuevo != 'APROBADA' &&
      nuevo != 'RECHAZADA' &&
      nuevo != 'CERRADA'
    ) {
      console.log('ERROR: estado inválido: ' + nuevo);
      return false;
    }
    const a = s.estado;
    let ok = false;
    if (a == 'PENDIENTE' && (nuevo == 'EN_REVISION' || nuevo == 'RECHAZADA')) ok = true;
    else if (
      a == 'EN_REVISION' &&
      (nuevo == 'APROBADA' || nuevo == 'RECHAZADA' || nuevo == 'PENDIENTE')
    )
      ok = true;
    else if (a == 'APROBADA' && nuevo == 'CERRADA') ok = true;
    else if (a == 'RECHAZADA' && nuevo == 'CERRADA') ok = true;
    if (!ok) {
      console.log('ERROR: transición no permitida: ' + a + ' -> ' + nuevo);
      return false;
    }
    s.estado = nuevo;
    s.historial.push({ fecha: new Date().toISOString().slice(0, 10), de: a, a: nuevo });
    this.guardar();
    console.log('Solicitud ' + id + ': ' + a + ' -> ' + nuevo);
    return true;
  }

  asignarResponsable(id: string, resp: string): boolean {
    let s: any = null;
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (this.solicitudes[i].id == id) s = this.solicitudes[i];
    }
    if (s == null) {
      console.log('ERROR: no existe la solicitud ' + id);
      return false;
    }
    if (!resp || resp.trim() == '') {
      console.log('ERROR: el responsable es obligatorio');
      return false;
    }
    if (s.estado == 'APROBADA' || s.estado == 'RECHAZADA' || s.estado == 'CERRADA') {
      console.log('ERROR: no se puede reasignar una solicitud en estado ' + s.estado);
      return false;
    }
    s.responsable = resp.trim();
    this.guardar();
    console.log('Solicitud ' + id + ' asignada a ' + s.responsable);
    return true;
  }

  buscar(estado?: string, tipo?: string, prioridad?: string, legajo?: string): any {
    if (
      estado &&
      estado != 'PENDIENTE' &&
      estado != 'EN_REVISION' &&
      estado != 'APROBADA' &&
      estado != 'RECHAZADA' &&
      estado != 'CERRADA'
    ) {
      console.log('ERROR: estado inválido: ' + estado);
      return -1;
    }
    if (
      tipo &&
      tipo != 'CERTIFICADO' &&
      tipo != 'EQUIVALENCIA' &&
      tipo != 'CAMBIO_COMISION' &&
      tipo != 'REINCORPORACION' &&
      tipo != 'BAJA'
    ) {
      console.log('ERROR: tipo de solicitud inválido: ' + tipo);
      return -1;
    }
    if (prioridad && prioridad != 'ALTA' && prioridad != 'MEDIA' && prioridad != 'BAJA') {
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
    let s: any = null;
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (this.solicitudes[i].id == id) s = this.solicitudes[i];
    }
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
    const hoy = new Date().toISOString().slice(0, 10);
    console.log('=== REPORTE DE SOLICITUDES (' + hoy + ') ===');
    console.log('Total: ' + this.solicitudes.length);

    const estados = ['PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CERRADA'];
    console.log('Por estado:');
    for (let i = 0; i < estados.length; i++) {
      let c = 0;
      for (let j = 0; j < this.solicitudes.length; j++) {
        if (this.solicitudes[j].estado == estados[i]) c++;
      }
      console.log('  ' + estados[i] + ': ' + c);
    }
    const tipos = ['CERTIFICADO', 'EQUIVALENCIA', 'CAMBIO_COMISION', 'REINCORPORACION', 'BAJA'];
    console.log('Por tipo:');
    for (let i = 0; i < tipos.length; i++) {
      let c = 0;
      for (let j = 0; j < this.solicitudes.length; j++) {
        if (this.solicitudes[j].tipo == tipos[i]) c++;
      }
      console.log('  ' + tipos[i] + ': ' + c);
    }
    const prios = ['ALTA', 'MEDIA', 'BAJA'];
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
      if (s.estado == 'PENDIENTE' || s.estado == 'EN_REVISION') {
        const dif = Math.round(
          (new Date(s.fechaLimite + 'T00:00:00Z').getTime() -
            new Date(hoy + 'T00:00:00Z').getTime()) /
            86400000,
        );
        if (dif < 0) {
          venc.push(
            '  ' + s.id + ' vencida hace ' + -dif + ' días (responsable: ' + s.responsable + ')',
          );
        } else if (dif <= 2) {
          prox.push(
            '  ' + s.id + ' vence en ' + dif + ' días (responsable: ' + s.responsable + ')',
          );
        }
      }
    }
    console.log('Vencidas: ' + venc.length);
    for (let i = 0; i < venc.length; i++) console.log(venc[i]);
    console.log('Próximas a vencer (2 días o menos): ' + prox.length);
    for (let i = 0; i < prox.length; i++) console.log(prox[i]);
  }
}
