// Pruebas de CARACTERIZACIÓN del comportamiento externo.
//
// Se escribieron contra la versión inicial (tag `estado-inicial`) ANTES de refactorizar y se
// ejecutan sin modificaciones después de cada refactoring. Si alguna falla, el refactoring
// cambió el comportamiento visible y debe revertirse o corregirse.
//
// Patrón AAA (Arrange - Act - Assert) en cada caso.
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  argsRegistrar,
  avanzarDias,
  ejecutar,
  registrar,
  usarEntornoAislado,
} from './helpers/sistema';

const entorno = usarEntornoAislado();

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CERRADA'] as const;
type Estado = (typeof ESTADOS)[number];

/** Secuencia de cambios de estado que lleva una solicitud nueva (PENDIENTE) a cada estado. */
const CAMINO_A: Record<Estado, Estado[]> = {
  PENDIENTE: [],
  EN_REVISION: ['EN_REVISION'],
  APROBADA: ['EN_REVISION', 'APROBADA'],
  RECHAZADA: ['RECHAZADA'],
  CERRADA: ['RECHAZADA', 'CERRADA'],
};

function llevarAEstado(id: string, destino: Estado): void {
  for (const paso of CAMINO_A[destino]) {
    const r = ejecutar('estado', id, paso);
    if (r.codigo !== 0) throw new Error(`No se pudo preparar el estado ${paso}: ${r.texto}`);
  }
}

describe('registrar solicitud', () => {
  describe('caso feliz y reglas por tipo', () => {
    it('registra una solicitud válida y muestra prioridad, vencimiento y responsable por defecto', () => {
      // Arrange + Act
      const r = ejecutar(...argsRegistrar());
      // Assert
      expect(r.codigo).toBe(0);
      expect(r.salida).toEqual([
        'Solicitud SOL-0001 registrada (prioridad MEDIA, vence 2026-11-12, responsable: Alumnado)',
      ]);
    });

    it.each([
      ['CERTIFICADO', 'MEDIA', '2026-11-12', 'Alumnado'],
      ['EQUIVALENCIA', 'BAJA', '2026-11-22', 'Secretaría Académica'],
      ['CAMBIO_COMISION', 'MEDIA', '2026-11-14', 'Alumnado'],
      ['REINCORPORACION', 'ALTA', '2026-11-10', 'Secretaría Académica'],
      ['BAJA', 'ALTA', '2026-11-10', 'Dirección de Carrera'],
    ])(
      'el tipo %s define prioridad %s, vencimiento %s y responsable %s',
      (tipo, prio, vence, area) => {
        const r = ejecutar(...argsRegistrar({ tipo }));
        expect(r.salida).toEqual([
          `Solicitud SOL-0001 registrada (prioridad ${prio}, vence ${vence}, responsable: ${area})`,
        ]);
      },
    );

    it('con prioridad ALTA explícita acota el plazo a 3 días aunque el tipo tenga más', () => {
      const r = ejecutar(...argsRegistrar({ tipo: 'EQUIVALENCIA', prioridad: 'ALTA' }));
      expect(r.texto).toContain('prioridad ALTA, vence 2026-11-10');
    });

    it('con una prioridad explícita menor conserva el plazo propio del tipo', () => {
      const r = ejecutar(...argsRegistrar({ tipo: 'REINCORPORACION', prioridad: 'MEDIA' }));
      expect(r.texto).toContain('prioridad MEDIA, vence 2026-11-17');
    });

    it('un plazo explícito (--dias) prevalece sobre las reglas del tipo y de la prioridad', () => {
      const r = ejecutar(...argsRegistrar({ tipo: 'BAJA', dias: '20' }));
      expect(r.texto).toContain('prioridad ALTA, vence 2026-11-27');
    });

    it('un responsable explícito reemplaza al área por defecto', () => {
      const r = ejecutar(...argsRegistrar({ responsable: 'Prof. Gómez' }));
      expect(r.texto).toContain('responsable: Prof. Gómez');
    });

    it('asigna identificadores correlativos SOL-0001, SOL-0002, ...', () => {
      const a = ejecutar(...argsRegistrar({ legajo: 'L1' }));
      const b = ejecutar(...argsRegistrar({ legajo: 'L2' }));
      expect(a.texto).toContain('SOL-0001');
      expect(b.texto).toContain('SOL-0002');
    });
  });

  describe('validaciones (mensaje, código de salida 1 y nada persistido)', () => {
    it.each([
      [{ legajo: '' }, 'ERROR: el legajo es obligatorio'],
      [{ legajo: '   ' }, 'ERROR: el legajo es obligatorio'],
      [{ legajo: undefined }, 'ERROR: el legajo es obligatorio'],
      [{ nombre: '' }, 'ERROR: el nombre es obligatorio'],
      [{ nombre: undefined }, 'ERROR: el nombre es obligatorio'],
      [{ email: 'sin-arroba' }, 'ERROR: email inválido'],
      [{ email: '@mail.com' }, 'ERROR: email inválido'],
      [{ email: 'ana@mail' }, 'ERROR: email inválido'],
      [{ email: undefined }, 'ERROR: email inválido'],
      [{ tipo: 'INVENTADO' }, 'ERROR: tipo de solicitud inválido: INVENTADO'],
      [{ descripcion: '123456789' }, 'ERROR: la descripción debe tener al menos 10 caracteres'],
      [{ descripcion: '   corta   ' }, 'ERROR: la descripción debe tener al menos 10 caracteres'],
      [{ descripcion: undefined }, 'ERROR: la descripción debe tener al menos 10 caracteres'],
      [{ prioridad: 'URGENTE' }, 'ERROR: prioridad inválida: URGENTE'],
      [{ dias: '0' }, 'ERROR: plazo inválido (1 a 60 días)'],
      [{ dias: '61' }, 'ERROR: plazo inválido (1 a 60 días)'],
      [{ dias: '-5' }, 'ERROR: plazo inválido (1 a 60 días)'],
      [{ dias: 'abc' }, 'ERROR: plazo inválido (1 a 60 días)'],
    ])('con %j informa "%s"', (datos, mensaje) => {
      const r = ejecutar(...argsRegistrar(datos));
      expect(r.salida).toEqual([mensaje]);
      expect(r.codigo).toBe(1);
      expect(ejecutar('buscar').texto).toBe('Total: 0');
    });

    it('acepta los valores límite: descripción de 10 caracteres y plazos de 1 y 60 días', () => {
      expect(ejecutar(...argsRegistrar({ descripcion: '1234567890', legajo: 'L1' })).codigo).toBe(
        0,
      );
      expect(ejecutar(...argsRegistrar({ dias: '1', legajo: 'L2' })).texto).toContain(
        'vence 2026-11-08',
      );
      expect(ejecutar(...argsRegistrar({ dias: '60', legajo: 'L3' })).texto).toContain(
        'vence 2027-01-06',
      );
    });

    it('acepta un email mínimo válido (a@b.c)', () => {
      expect(ejecutar(...argsRegistrar({ email: 'a@b.c' })).codigo).toBe(0);
    });

    it('informa primero el primer error en el orden: legajo, nombre, email, tipo, descripción, prioridad, plazo', () => {
      const r = ejecutar('registrar', '--tipo', 'X', '--prioridad', 'Y', '--dias', 'Z');
      expect(r.salida).toEqual(['ERROR: el legajo es obligatorio']);
    });
  });

  describe('solicitudes activas duplicadas', () => {
    it('rechaza una segunda solicitud activa del mismo tipo para el mismo legajo', () => {
      registrar();
      const r = ejecutar(...argsRegistrar());
      expect(r.salida).toEqual([
        'ERROR: ya existe una solicitud activa de ese tipo para el legajo L1001',
      ]);
      expect(r.codigo).toBe(1);
    });

    it('también la rechaza si la primera está EN_REVISION', () => {
      registrar();
      ejecutar('estado', 'SOL-0001', 'EN_REVISION');
      expect(ejecutar(...argsRegistrar()).codigo).toBe(1);
    });

    it.each(['APROBADA', 'RECHAZADA', 'CERRADA'] as const)(
      'permite una nueva solicitud del mismo tipo si la anterior está %s',
      (estado) => {
        registrar();
        llevarAEstado('SOL-0001', estado);
        const r = ejecutar(...argsRegistrar());
        expect(r.codigo).toBe(0);
        expect(r.texto).toContain('SOL-0002');
      },
    );

    it('permite solicitudes de distinto tipo para el mismo legajo', () => {
      registrar();
      expect(ejecutar(...argsRegistrar({ tipo: 'BAJA' })).codigo).toBe(0);
    });

    it('permite el mismo tipo para otro legajo', () => {
      registrar();
      expect(ejecutar(...argsRegistrar({ legajo: 'L1002' })).codigo).toBe(0);
    });
  });

  describe('persistencia', () => {
    it('guarda en el archivo el contador y la solicitud con su historial inicial', () => {
      registrar({ descripcion: '  Certificado de alumno regular  ' });
      const guardado = JSON.parse(readFileSync(entorno.rutaDb(), 'utf8'));
      expect(guardado).toEqual({
        contador: 1,
        solicitudes: [
          {
            id: 'SOL-0001',
            legajo: 'L1001',
            nombre: 'Ana Pérez',
            email: 'ana@mail.com',
            tipo: 'CERTIFICADO',
            descripcion: 'Certificado de alumno regular',
            prioridad: 'MEDIA',
            estado: 'PENDIENTE',
            responsable: 'Alumnado',
            fechaCreacion: '2026-11-07',
            fechaLimite: '2026-11-12',
            historial: [{ fecha: '2026-11-07', de: null, a: 'PENDIENTE' }],
          },
        ],
      });
    });

    it('conserva los datos entre ejecuciones distintas', () => {
      registrar();
      expect(ejecutar('ver', 'SOL-0001').codigo).toBe(0);
    });

    it('DEFECTO CONOCIDO (S8): un archivo de datos corrupto se ignora en silencio y se sobrescribe', () => {
      writeFileSync(entorno.rutaDb(), 'esto no es json {{{');
      const r = ejecutar(...argsRegistrar());
      expect(r.codigo).toBe(0);
      const guardado = JSON.parse(readFileSync(entorno.rutaDb(), 'utf8'));
      expect(guardado.solicitudes).toHaveLength(1);
    });
  });
});

describe('cambiar estado', () => {
  it('cambia el estado e informa la transición', () => {
    registrar();
    const r = ejecutar('estado', 'SOL-0001', 'EN_REVISION');
    expect(r.salida).toEqual(['Solicitud SOL-0001: PENDIENTE -> EN_REVISION']);
    expect(r.codigo).toBe(0);
  });

  it('informa error si la solicitud no existe', () => {
    const r = ejecutar('estado', 'SOL-9999', 'EN_REVISION');
    expect(r.salida).toEqual(['ERROR: no existe la solicitud SOL-9999']);
    expect(r.codigo).toBe(1);
  });

  it('informa error si el nombre del estado no existe', () => {
    registrar();
    const r = ejecutar('estado', 'SOL-0001', 'FINALIZADA');
    expect(r.salida).toEqual(['ERROR: estado inválido: FINALIZADA']);
    expect(r.codigo).toBe(1);
  });

  it('verifica primero que la solicitud exista y después que el estado sea válido', () => {
    const r = ejecutar('estado', 'SOL-9999', 'FINALIZADA');
    expect(r.salida).toEqual(['ERROR: no existe la solicitud SOL-9999']);
  });

  const VALIDAS: Array<[Estado, Estado]> = [
    ['PENDIENTE', 'EN_REVISION'],
    ['PENDIENTE', 'RECHAZADA'],
    ['EN_REVISION', 'APROBADA'],
    ['EN_REVISION', 'RECHAZADA'],
    ['EN_REVISION', 'PENDIENTE'],
    ['APROBADA', 'CERRADA'],
    ['RECHAZADA', 'CERRADA'],
  ];
  const esValida = (de: Estado, a: Estado) => VALIDAS.some(([x, y]) => x === de && y === a);
  const INVALIDAS = ESTADOS.flatMap((de) => ESTADOS.map((a) => [de, a] as [Estado, Estado])).filter(
    ([de, a]) => !esValida(de, a),
  );

  it.each(VALIDAS)('permite la transición %s -> %s', (de, a) => {
    registrar();
    llevarAEstado('SOL-0001', de);
    const r = ejecutar('estado', 'SOL-0001', a);
    expect(r.salida).toEqual([`Solicitud SOL-0001: ${de} -> ${a}`]);
    expect(r.codigo).toBe(0);
  });

  it.each(INVALIDAS)('rechaza la transición %s -> %s y deja el estado sin cambios', (de, a) => {
    registrar();
    llevarAEstado('SOL-0001', de);
    const r = ejecutar('estado', 'SOL-0001', a);
    expect(r.salida).toEqual([`ERROR: transición no permitida: ${de} -> ${a}`]);
    expect(r.codigo).toBe(1);
    expect(ejecutar('ver', 'SOL-0001').salida[0]).toContain(` | ${de}`);
  });

  it('cubre las 25 combinaciones posibles de estado actual y nuevo estado', () => {
    expect(VALIDAS.length + INVALIDAS.length).toBe(25);
  });
});

describe('asignar responsable', () => {
  it('asigna el responsable e informa', () => {
    registrar();
    const r = ejecutar('asignar', 'SOL-0001', 'María López');
    expect(r.salida).toEqual(['Solicitud SOL-0001 asignada a María López']);
    expect(r.codigo).toBe(0);
    expect(ejecutar('ver', 'SOL-0001').texto).toContain('Responsable: María López');
  });

  it('elimina los espacios sobrantes del nombre', () => {
    registrar();
    expect(ejecutar('asignar', 'SOL-0001', '  María López  ').texto).toBe(
      'Solicitud SOL-0001 asignada a María López',
    );
  });

  it('informa error si la solicitud no existe', () => {
    const r = ejecutar('asignar', 'SOL-9999', 'María');
    expect(r.salida).toEqual(['ERROR: no existe la solicitud SOL-9999']);
    expect(r.codigo).toBe(1);
  });

  it.each([[''], ['   ']])('informa error si el responsable es vacío (%j)', (resp) => {
    registrar();
    const r = ejecutar('asignar', 'SOL-0001', resp);
    expect(r.salida).toEqual(['ERROR: el responsable es obligatorio']);
    expect(r.codigo).toBe(1);
  });

  it('informa error si falta el responsable', () => {
    registrar();
    expect(ejecutar('asignar', 'SOL-0001').salida).toEqual([
      'ERROR: el responsable es obligatorio',
    ]);
  });

  it('verifica primero que la solicitud exista y después el responsable', () => {
    expect(ejecutar('asignar', 'SOL-9999', '').salida).toEqual([
      'ERROR: no existe la solicitud SOL-9999',
    ]);
  });

  it.each(['PENDIENTE', 'EN_REVISION'] as const)('permite reasignar una solicitud %s', (estado) => {
    registrar();
    llevarAEstado('SOL-0001', estado);
    expect(ejecutar('asignar', 'SOL-0001', 'Otra Persona').codigo).toBe(0);
  });

  it.each(['APROBADA', 'RECHAZADA', 'CERRADA'] as const)(
    'no permite reasignar una solicitud %s',
    (estado) => {
      registrar();
      llevarAEstado('SOL-0001', estado);
      const r = ejecutar('asignar', 'SOL-0001', 'Otra Persona');
      expect(r.salida).toEqual([`ERROR: no se puede reasignar una solicitud en estado ${estado}`]);
      expect(r.codigo).toBe(1);
    },
  );
});

describe('buscar / filtrar', () => {
  function cargarEscenario(): void {
    registrar({ legajo: 'L1', nombre: 'Ana Pérez', tipo: 'CERTIFICADO' }); // SOL-0001 MEDIA
    registrar({ legajo: 'L2', nombre: 'Bruno Díaz', tipo: 'EQUIVALENCIA' }); // SOL-0002 BAJA
    registrar({ legajo: 'L3', nombre: 'Carla Ruiz', tipo: 'BAJA' }); // SOL-0003 ALTA
    registrar({ legajo: 'L1', nombre: 'Ana Pérez', tipo: 'CAMBIO_COMISION' }); // SOL-0004 MEDIA
    ejecutar('estado', 'SOL-0001', 'EN_REVISION');
  }

  it('sin filtros lista todas las solicitudes en orden de registro con su total', () => {
    cargarEscenario();
    const r = ejecutar('buscar');
    expect(r.salida).toEqual([
      'SOL-0001 | CERTIFICADO | MEDIA | EN_REVISION | Ana Pérez | Alumnado',
      'SOL-0002 | EQUIVALENCIA | BAJA | PENDIENTE | Bruno Díaz | Secretaría Académica',
      'SOL-0003 | BAJA | ALTA | PENDIENTE | Carla Ruiz | Dirección de Carrera',
      'SOL-0004 | CAMBIO_COMISION | MEDIA | PENDIENTE | Ana Pérez | Alumnado',
      'Total: 4',
    ]);
    expect(r.codigo).toBe(0);
  });

  it('con la base vacía informa Total: 0', () => {
    expect(ejecutar('buscar').salida).toEqual(['Total: 0']);
  });

  it.each([
    [
      ['--estado', 'PENDIENTE'],
      ['SOL-0002', 'SOL-0003', 'SOL-0004'],
    ],
    [['--estado', 'EN_REVISION'], ['SOL-0001']],
    [['--estado', 'CERRADA'], []],
    [['--tipo', 'CERTIFICADO'], ['SOL-0001']],
    [
      ['--prioridad', 'MEDIA'],
      ['SOL-0001', 'SOL-0004'],
    ],
    [['--prioridad', 'ALTA'], ['SOL-0003']],
    [
      ['--legajo', 'L1'],
      ['SOL-0001', 'SOL-0004'],
    ],
    [['--legajo', 'L999'], []],
  ])('filtra por %j', (filtros, esperados) => {
    cargarEscenario();
    const r = ejecutar('buscar', ...filtros);
    const ids = r.salida.filter((l) => l.startsWith('SOL-')).map((l) => l.slice(0, 8));
    expect(ids).toEqual(esperados);
    expect(r.salida.at(-1)).toBe(`Total: ${esperados.length}`);
  });

  it('combina varios filtros con AND', () => {
    cargarEscenario();
    const r = ejecutar('buscar', '--legajo', 'L1', '--prioridad', 'MEDIA', '--estado', 'PENDIENTE');
    expect(r.salida).toEqual([
      'SOL-0004 | CAMBIO_COMISION | MEDIA | PENDIENTE | Ana Pérez | Alumnado',
      'Total: 1',
    ]);
  });

  it.each([
    [['--estado', 'FINALIZADA'], 'ERROR: estado inválido: FINALIZADA'],
    [['--tipo', 'INVENTADO'], 'ERROR: tipo de solicitud inválido: INVENTADO'],
    [['--prioridad', 'URGENTE'], 'ERROR: prioridad inválida: URGENTE'],
  ])('informa error con filtros inválidos %j', (filtros, mensaje) => {
    cargarEscenario();
    const r = ejecutar('buscar', ...filtros);
    expect(r.salida).toEqual([mensaje]);
    expect(r.codigo).toBe(1);
  });

  it('refleja los cambios de responsable en el listado', () => {
    cargarEscenario();
    ejecutar('asignar', 'SOL-0002', 'María López');
    expect(ejecutar('buscar', '--tipo', 'EQUIVALENCIA').salida[0]).toBe(
      'SOL-0002 | EQUIVALENCIA | BAJA | PENDIENTE | Bruno Díaz | María López',
    );
  });
});

describe('ver detalle', () => {
  it('muestra los datos, el vencimiento y el historial inicial', () => {
    registrar();
    const r = ejecutar('ver', 'SOL-0001');
    expect(r.salida).toEqual([
      'SOL-0001 | CERTIFICADO | MEDIA | PENDIENTE',
      'Estudiante: Ana Pérez (L1001) <ana@mail.com>',
      'Descripción: Certificado de alumno regular',
      'Responsable: Alumnado',
      'Creada: 2026-11-07 | Vence: 2026-11-12',
      'Historial:',
      '  2026-11-07: (inicio) -> PENDIENTE',
    ]);
    expect(r.codigo).toBe(0);
  });

  it('registra en el historial cada cambio de estado con su fecha', () => {
    registrar();
    ejecutar('estado', 'SOL-0001', 'EN_REVISION');
    avanzarDias(2);
    ejecutar('estado', 'SOL-0001', 'APROBADA');
    const r = ejecutar('ver', 'SOL-0001');
    expect(r.salida.slice(-3)).toEqual([
      '  2026-11-07: (inicio) -> PENDIENTE',
      '  2026-11-07: PENDIENTE -> EN_REVISION',
      '  2026-11-09: EN_REVISION -> APROBADA',
    ]);
  });

  it('informa error si la solicitud no existe', () => {
    const r = ejecutar('ver', 'SOL-0042');
    expect(r.salida).toEqual(['ERROR: no existe la solicitud SOL-0042']);
    expect(r.codigo).toBe(1);
  });
});

describe('reporte', () => {
  it('con la base vacía informa todo en cero', () => {
    const r = ejecutar('reporte');
    expect(r.salida).toEqual([
      '=== REPORTE DE SOLICITUDES (2026-11-07) ===',
      'Total: 0',
      'Por estado:',
      '  PENDIENTE: 0',
      '  EN_REVISION: 0',
      '  APROBADA: 0',
      '  RECHAZADA: 0',
      '  CERRADA: 0',
      'Por tipo:',
      '  CERTIFICADO: 0',
      '  EQUIVALENCIA: 0',
      '  CAMBIO_COMISION: 0',
      '  REINCORPORACION: 0',
      '  BAJA: 0',
      'Por prioridad:',
      '  ALTA: 0',
      '  MEDIA: 0',
      '  BAJA: 0',
      'Vencidas: 0',
      'Próximas a vencer (2 días o menos): 0',
    ]);
    expect(r.codigo).toBe(0);
  });

  /** SOL-0001 certificado (vence 11-12), SOL-0002 baja (11-10, luego aprobada), SOL-0003 equivalencia (11-22), SOL-0004 cambio de comisión (11-14). */
  function cargarEscenarioDeVencimientos(): void {
    registrar({ legajo: 'L1', tipo: 'CERTIFICADO' });
    registrar({ legajo: 'L2', tipo: 'BAJA' });
    registrar({ legajo: 'L3', tipo: 'EQUIVALENCIA' });
    registrar({ legajo: 'L4', tipo: 'CAMBIO_COMISION' });
    ejecutar('estado', 'SOL-0002', 'EN_REVISION');
    ejecutar('estado', 'SOL-0002', 'APROBADA');
  }

  it('totaliza por estado, tipo y prioridad y detalla vencidas y próximas a vencer', () => {
    cargarEscenarioDeVencimientos();
    avanzarDias(6); // hoy = 2026-11-13
    const r = ejecutar('reporte');
    expect(r.salida).toEqual([
      '=== REPORTE DE SOLICITUDES (2026-11-13) ===',
      'Total: 4',
      'Por estado:',
      '  PENDIENTE: 3',
      '  EN_REVISION: 0',
      '  APROBADA: 1',
      '  RECHAZADA: 0',
      '  CERRADA: 0',
      'Por tipo:',
      '  CERTIFICADO: 1',
      '  EQUIVALENCIA: 1',
      '  CAMBIO_COMISION: 1',
      '  REINCORPORACION: 0',
      '  BAJA: 1',
      'Por prioridad:',
      '  ALTA: 1',
      '  MEDIA: 2',
      '  BAJA: 1',
      'Vencidas: 1',
      '  SOL-0001 vencida hace 1 días (responsable: Alumnado)',
      'Próximas a vencer (2 días o menos): 1',
      '  SOL-0004 vence en 1 días (responsable: Alumnado)',
    ]);
  });

  it('no considera vencidas ni próximas las solicitudes que ya no están abiertas', () => {
    cargarEscenarioDeVencimientos();
    avanzarDias(6); // SOL-0002 (aprobada) venció el 11-10 pero no debe figurar
    expect(ejecutar('reporte').texto).not.toContain('SOL-0002 vencida');
  });

  it('el día del vencimiento figura como "vence en 0 días" y no como vencida', () => {
    registrar();
    avanzarDias(5); // 2026-11-12 = fecha límite
    const r = ejecutar('reporte');
    expect(r.salida.slice(-3)).toEqual([
      'Vencidas: 0',
      'Próximas a vencer (2 días o menos): 1',
      '  SOL-0001 vence en 0 días (responsable: Alumnado)',
    ]);
  });

  it('el límite de "próximas a vencer" es de 2 días inclusive', () => {
    registrar(); // vence 11-12
    avanzarDias(2); // faltan 3 días
    expect(ejecutar('reporte').texto).toContain('Próximas a vencer (2 días o menos): 0');
    avanzarDias(1); // faltan 2 días
    expect(ejecutar('reporte').texto).toContain('Próximas a vencer (2 días o menos): 1');
  });
});

describe('uso del programa', () => {
  const USO = [
    'Uso: pnpm start <comando> [opciones]',
    '  registrar --legajo L --nombre N --email E --tipo T --descripcion D [--prioridad P] [--dias N] [--responsable R]',
    '  estado <id> <nuevoEstado>',
    '  asignar <id> <responsable>',
    '  buscar [--estado E] [--tipo T] [--prioridad P] [--legajo L]',
    '  ver <id>',
    '  reporte',
  ];

  it('sin comando muestra la ayuda y termina con código 1', () => {
    const r = ejecutar();
    expect(r.salida).toEqual(USO);
    expect(r.codigo).toBe(1);
  });

  it('con un comando desconocido muestra la ayuda y termina con código 1', () => {
    const r = ejecutar('borrar');
    expect(r.salida).toEqual(USO);
    expect(r.codigo).toBe(1);
  });
});
