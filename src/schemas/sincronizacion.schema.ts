import { z } from "zod";

export const modoDispositivoRemotoSchema = z.enum(["operacion", "consulta"]);
export const tipoDispositivoRemotoSchema = z.enum(["principal", "vinculado"]);

export const resultadoActivacionNegocioSchema = z.object({
  negocio_id: z.string().uuid(),
  dispositivo_id: z.string().uuid(),
  codigo_recuperacion: z.string().min(24),
});

export const resultadoCodigoEmparejamientoSchema = z.object({
  codigo: z.string().min(24),
  vence_at: z.string().datetime({ offset: true }),
  modo: modoDispositivoRemotoSchema,
});

export const resultadoEmparejamientoSchema = z.object({
  negocio_id: z.string().uuid(),
  dispositivo_id: z.string().uuid(),
  tipo: tipoDispositivoRemotoSchema,
  modo: modoDispositivoRemotoSchema,
});

export const dispositivoRemotoSchema = z.object({
  id: z.string().uuid(),
  negocio_id: z.string().uuid(),
  nombre: z.string().min(1),
  tipo: tipoDispositivoRemotoSchema,
  modo: modoDispositivoRemotoSchema,
  estado: z.enum(["activo", "revocado"]),
  creado_at: z.string().datetime({ offset: true }),
  ultima_actividad_at: z.string().datetime({ offset: true }).nullable(),
});

const categoriaSincronizadaSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  activa: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

const textoOpcionalRemotoSchema = z.string().nullable().optional()
  .transform((valor) => valor ?? undefined);

const productoSincronizadoSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  categoriaId: z.string().min(1),
  precioVenta: z.coerce.number().nonnegative(),
  costoCompra: z.coerce.number().nonnegative(),
  marca: textoOpcionalRemotoSchema,
  presentacion: textoOpcionalRemotoSchema,
  stockActual: z.number().int().nonnegative(),
  stockObjetivo: z.number().int().nonnegative(),
  estado: z.enum(["activo", "inactivo"]),
  observaciones: textoOpcionalRemotoSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const cambioCatalogoRemotoSchema = z.discriminatedUnion("tipoEntidad", [
  z.object({
    tipoEntidad: z.literal("categoria"),
    entidadId: z.string().min(1),
    version: z.number().int().positive(),
    eliminada: z.boolean(),
    entidad: categoriaSincronizadaSchema.nullable(),
  }),
  z.object({
    tipoEntidad: z.literal("producto"),
    entidadId: z.string().min(1),
    version: z.number().int().positive(),
    eliminada: z.boolean(),
    entidad: productoSincronizadoSchema.nullable(),
  }),
]);

const cambioVentaRemotoSchema = z.object({
  tipoEntidad: z.literal("venta"),
  entidadId: z.string().min(1),
  eliminada: z.boolean(),
  entidad: z.object({
    venta: z.record(z.string(), z.unknown()),
    detalles: z.array(z.record(z.string(), z.unknown())),
    cobros: z.array(z.record(z.string(), z.unknown())),
  }).nullable(),
});

const cambioMovimientoRemotoSchema = z.object({
  tipoEntidad: z.literal("movimiento"),
  entidadId: z.string().min(1),
  eliminada: z.boolean(),
  entidad: z.object({
    movimiento: z.record(z.string(), z.unknown()),
    detalles: z.array(z.record(z.string(), z.unknown())),
  }).nullable(),
});

export const diferenciaStockSchema = z.object({
  id: z.string().uuid(),
  productoId: z.string().min(1),
  operacionId: z.string().min(1),
  origenTipo: z.string().min(1),
  origenId: z.string().min(1),
  unidadesFaltantes: z.number().int().positive(),
  detalle: z.unknown(),
  estado: z.enum(["pendiente", "resuelta"]),
  creadoAt: z.string().datetime({ offset: true }),
  resueltaAt: z.string().datetime({ offset: true }).nullable().optional(),
  stockContado: z.number().int().nonnegative().nullable().optional(),
  notaResolucion: z.string().nullable().optional(),
});

const cambioDiferenciaStockRemotoSchema = z.object({
  tipoEntidad: z.literal("diferencia_stock"),
  entidadId: z.string().min(1),
  eliminada: z.boolean(),
  entidad: diferenciaStockSchema.nullable(),
});

const cambioTesoreriaRemotoSchema = z.object({
  tipoEntidad: z.literal("tesoreria"),
  entidadId: z.string().min(1),
  eliminada: z.boolean(),
  entidad: z.object({
    cuentas: z.array(z.record(z.string(), z.unknown())),
    movimientos: z.array(z.record(z.string(), z.unknown())),
    conteos: z.array(z.record(z.string(), z.unknown())),
  }).nullable(),
});

export const snapshotTesoreriaRemotoSchema = z.object({
  cuentas: z.array(z.record(z.string(), z.unknown())),
  movimientos: z.array(z.record(z.string(), z.unknown())),
  conteos: z.array(z.record(z.string(), z.unknown())),
});

export const cambioSincronizacionRemotoSchema = z.discriminatedUnion("tipoEntidad", [
  ...cambioCatalogoRemotoSchema.options,
  cambioVentaRemotoSchema,
  cambioMovimientoRemotoSchema,
  cambioDiferenciaStockRemotoSchema,
  cambioTesoreriaRemotoSchema,
]);

export const resultadoOperacionRemotaSchema = z.object({
  operacionId: z.string().min(1),
  secuencia: z.number().int().nonnegative(),
  estado: z.enum(["aplicada", "conflicto", "error"]),
  cambios: z.array(cambioSincronizacionRemotoSchema),
  codigoError: z.string().nullable().optional(),
  detalleError: z.string().nullable().optional(),
  conflictoId: z.string().uuid().nullable().optional(),
  conflictoResueltoId: z.string().uuid().nullable().optional(),
  dispositivoId: z.string().uuid().nullable().optional(),
});

export const snapshotCatalogoRemotoSchema = z.object({
  inicializado: z.boolean(),
  cursor: z.number().int().nonnegative(),
  categorias: z.array(z.object({
    entidad: categoriaSincronizadaSchema,
    version: z.number().int().positive(),
    eliminada: z.boolean(),
  })),
  productos: z.array(z.object({
    entidad: productoSincronizadoSchema,
    version: z.number().int().positive(),
    eliminada: z.boolean(),
  })),
});

export const loteCambiosRemotosSchema = z.object({
  cursor: z.number().int().nonnegative(),
  hayMas: z.boolean(),
  operaciones: z.array(resultadoOperacionRemotaSchema),
});
