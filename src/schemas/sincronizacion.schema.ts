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

const productoSincronizadoSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  categoriaId: z.string().min(1),
  precioVenta: z.coerce.number().nonnegative(),
  costoCompra: z.coerce.number().nonnegative(),
  marca: z.string().optional(),
  presentacion: z.string().optional(),
  stockActual: z.number().int().nonnegative(),
  stockObjetivo: z.number().int().nonnegative(),
  estado: z.enum(["activo", "inactivo"]),
  observaciones: z.string().optional(),
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

export const resultadoOperacionRemotaSchema = z.object({
  operacionId: z.string().min(1),
  secuencia: z.number().int().nonnegative(),
  estado: z.enum(["aplicada", "conflicto", "error"]),
  cambios: z.array(cambioCatalogoRemotoSchema),
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
