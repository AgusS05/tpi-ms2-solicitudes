// Defectos deliberados a introducir, por versión del código.
export const MUTACIONES = {
  v1: [
    {
      descripcion: 'Plazo de CERTIFICADO 5 -> 6 días',
      archivo: 'src/gestor.ts',
      buscar: 'plazo = 5;',
      reemplazar: 'plazo = 6;',
    },
    {
      descripcion: 'Prioridad por defecto de BAJA (tipo) deja de ser ALTA',
      archivo: 'src/gestor.ts',
      buscar: "if (!p) p = 'ALTA';\n      plazo = 3;",
      reemplazar: "if (!p) p = 'MEDIA';\n      plazo = 3;",
    },
    {
      descripcion: 'Tope del plazo de prioridad ALTA 3 -> 4 días',
      archivo: 'src/gestor.ts',
      buscar: "if (p == 'ALTA' && plazo > 3) plazo = 3;",
      reemplazar: "if (p == 'ALTA' && plazo > 4) plazo = 4;",
    },
    {
      descripcion: 'Largo mínimo de descripción 10 -> 9',
      archivo: 'src/gestor.ts',
      buscar: 'descripcion.trim().length < 10',
      reemplazar: 'descripcion.trim().length < 9',
    },
    {
      descripcion: 'Plazo máximo permitido 60 -> 61 días',
      archivo: 'src/gestor.ts',
      buscar: 'dias > 60',
      reemplazar: 'dias > 61',
    },
    {
      descripcion: 'Se elimina el control de solicitudes activas duplicadas',
      archivo: 'src/gestor.ts',
      buscar: 'this.solicitudes[i].legajo == legajo &&',
      reemplazar: 'false &&',
    },
    {
      descripcion: 'EN_REVISION ya no puede volver a PENDIENTE',
      archivo: 'src/gestor.ts',
      buscar: " || nuevo == 'PENDIENTE')",
      reemplazar: ')',
    },
    {
      descripcion: 'Se permite reasignar una solicitud CERRADA',
      archivo: 'src/gestor.ts',
      buscar: " || s.estado == 'CERRADA') {\n      console.log('ERROR: no se puede reasignar",
      reemplazar: ") {\n      console.log('ERROR: no se puede reasignar",
    },
    {
      descripcion: 'El filtro por legajo de la búsqueda se ignora',
      archivo: 'src/gestor.ts',
      buscar: 'if (legajo) {',
      reemplazar: 'if (false) {',
    },
    {
      descripcion: 'El historial inicial guarda "" en lugar de null',
      archivo: 'src/gestor.ts',
      buscar: 'de: null,',
      reemplazar: "de: '',",
    },
    {
      descripcion: 'Ventana de "próximas a vencer" 2 -> 3 días',
      archivo: 'src/gestor.ts',
      buscar: '} else if (dif <= 2) {',
      reemplazar: '} else if (dif <= 3) {',
    },
    {
      descripcion: 'El día del vencimiento pasa a contarse como vencida',
      archivo: 'src/gestor.ts',
      buscar: 'if (dif < 0) {',
      reemplazar: 'if (dif <= 0) {',
    },
    {
      descripcion: 'El reporte cuenta también las solicitudes ya aprobadas como abiertas',
      archivo: 'src/gestor.ts',
      buscar: "if (s.estado == 'PENDIENTE' || s.estado == 'EN_REVISION') {\n        const dif",
      reemplazar: "if (s.estado != 'CERRADA') {\n        const dif",
    },
    {
      descripcion: 'El identificador pierde el relleno de ceros (SOL-1)',
      archivo: 'src/gestor.ts',
      buscar: "String(this.contador).padStart(4, '0')",
      reemplazar: 'String(this.contador)',
    },
    {
      descripcion: 'El código de salida ante un error de estado es 0',
      archivo: 'src/cli.ts',
      buscar: 'if (!g.cambiarEstado(args[1], args[2])) process.exitCode = 1;',
      reemplazar: 'g.cambiarEstado(args[1], args[2]);',
    },
  ],
};
