import * as fs from 'fs';
import * as path from 'path';
import { DatosNuevaSolicitud, validarDatosNuevaSolicitud } from './dominio/datos-nueva-solicitud';
import { ErrorDeValidacion, SolicitudDuplicada, SolicitudInexistente } from './dominio/errores';
import { ESTADOS, Estado, esEstado } from './dominio/estado';
import { aFechaISO, sumarDias } from './dominio/fecha';
import { PRIORIDADES, esPrioridad } from './dominio/prioridad';
import { DIAS_AVISO_VENCIMIENTO } from './dominio/reglas-de-negocio';
import { resolverCondiciones } from './dominio/reglas-por-tipo';
import { RegistroDeSolicitud, Solicitud } from './dominio/solicitud';
import { TIPOS, TipoSolicitud, esTipo } from './dominio/tipo-solicitud';

// Gestor de solicitudes academicas.
// Se encarga de todo: valida, calcula, guarda en archivo e imprime por consola.
// OJO: funciona, no tocar mucho (version prototipo del primer cuatrimestre)
export class GestorSolicitudes {
  solicitudes: Solicitud[] = [];
  contador = 0;
  ruta: string;
  modoDebug = false; // TODO: usar para logs

  constructor() {
    this.ruta = process.env.SOLICITUDES_DB || './data/solicitudes.json';
    try {
      const raw = fs.readFileSync(this.ruta, 'utf8');
      const d = JSON.parse(raw);
      this.solicitudes = d.solicitudes.map((r: RegistroDeSolicitud) => Solicitud.desdeRegistro(r));
      this.contador = d.contador;
    } catch (e) {}
  }

  guardar() {
    fs.mkdirSync(path.dirname(this.ruta), { recursive: true });
    fs.writeFileSync(
      this.ruta,
      JSON.stringify(
        { solicitudes: this.solicitudes.map((s) => s.aRegistro()), contador: this.contador },
        null,
        2,
      ),
    );
  }

  registrarSolicitud(datos: DatosNuevaSolicitud): string {
    const nueva = validarDatosNuevaSolicitud(datos);

    const reglas = resolverCondiciones(nueva.tipo, nueva.prioridad, nueva.plazoDias);

    if (this.existeSolicitudActiva(nueva.estudiante.legajo, nueva.tipo)) {
      throw new SolicitudDuplicada(nueva.estudiante.legajo);
    }

    this.contador++;
    const id = 'SOL-' + String(this.contador).padStart(4, '0');
    const hoy = this.hoy();
    const s = new Solicitud({
      id: id,
      estudiante: nueva.estudiante,
      tipo: nueva.tipo,
      descripcion: nueva.descripcion,
      prioridad: reglas.prioridad,
      estado: Estado.PENDIENTE,
      responsable: nueva.responsable ? nueva.responsable : reglas.area,
      fechaCreacion: hoy,
      fechaLimite: this.calcularFechaLimite(reglas.plazoDias),
      historial: [{ fecha: hoy, de: null, a: Estado.PENDIENTE }],
    });
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

  /** Una solicitud está activa mientras esté PENDIENTE o EN_REVISION. */
  existeSolicitudActiva(legajo: string, tipo: TipoSolicitud): boolean {
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (
        this.solicitudes[i].estudiante.legajo == legajo &&
        this.solicitudes[i].tipo == tipo &&
        this.solicitudes[i].estaAbierta()
      ) {
        return true;
      }
    }
    return false;
  }

  buscarPorId(id: string): Solicitud | null {
    for (let i = 0; i < this.solicitudes.length; i++) {
      if (this.solicitudes[i].id == id) return this.solicitudes[i];
    }
    return null;
  }

  /** Fecha actual en formato AAAA-MM-DD. */
  hoy(): string {
    return aFechaISO(new Date());
  }

  calcularFechaLimite(plazoEnDias: number): string {
    return aFechaISO(sumarDias(new Date(), plazoEnDias));
  }

  cambiarEstado(id: string, nuevo: string): void {
    const s = this.buscarPorId(id);
    if (s == null) throw new SolicitudInexistente(id);
    if (!esEstado(nuevo)) throw new ErrorDeValidacion('estado inválido: ' + nuevo);
    const cambio = s.cambiarEstado(nuevo, this.hoy());
    this.guardar();
    console.log('Solicitud ' + id + ': ' + cambio.de + ' -> ' + cambio.a);
  }

  asignarResponsable(id: string, resp: string): void {
    const s = this.buscarPorId(id);
    if (s == null) throw new SolicitudInexistente(id);
    s.reasignar(resp);
    this.guardar();
    console.log('Solicitud ' + id + ' asignada a ' + s.responsable);
  }

  buscar(estado?: string, tipo?: string, prioridad?: string, legajo?: string): Solicitud[] {
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
        if (r[i].estudiante.legajo == legajo) {
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
          x.estudiante.nombre +
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
    console.log(
      'Estudiante: ' +
        s.estudiante.nombre +
        ' (' +
        s.estudiante.legajo +
        ') <' +
        s.estudiante.email.valor +
        '>',
    );
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
      if (s.estaVencida(hoy)) {
        venc.push(
          '  ' +
            s.id +
            ' vencida hace ' +
            -s.diasParaVencer(hoy) +
            ' días (responsable: ' +
            s.responsable +
            ')',
        );
      } else if (s.estaPorVencer(hoy)) {
        prox.push(
          '  ' +
            s.id +
            ' vence en ' +
            s.diasParaVencer(hoy) +
            ' días (responsable: ' +
            s.responsable +
            ')',
        );
      }
    }
    console.log('Vencidas: ' + venc.length);
    for (let i = 0; i < venc.length; i++) console.log(venc[i]);
    console.log(`Próximas a vencer (${DIAS_AVISO_VENCIMIENTO} días o menos): ` + prox.length);
    for (let i = 0; i < prox.length; i++) console.log(prox[i]);
  }
}
