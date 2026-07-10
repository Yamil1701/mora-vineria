import { z } from "zod";

export const modoDispositivoSchema = z.enum(["principal", "consulta"]);

const entidadConIdSchema = z
  .object({
    id: z.string().min(1),
  })
  .passthrough();

export const backupMoraVineriaSchema = z.object({
  app: z.literal("Mora Vinería"),
  schemaVersion: z.number().int().min(1),
  backupId: z.string().min(1),
  deviceId: z.string().min(1),
  deviceRole: modoDispositivoSchema,
  exportedAt: z.string().datetime(),
  lastDataChangeAt: z.string().datetime(),
  data: z.object({
    categorias: z.array(entidadConIdSchema),
    productos: z.array(entidadConIdSchema),
    ventas: z.array(entidadConIdSchema),
    detalleVentas: z.array(entidadConIdSchema),
    movimientos: z.array(entidadConIdSchema),
    detalleReposiciones: z.array(entidadConIdSchema),
    configuracion: z.unknown().nullable(),
    metasMensuales: z.array(entidadConIdSchema),
    backupMetadata: z.array(entidadConIdSchema),
  }),
});

export type BackupMoraVineriaValidado = z.infer<typeof backupMoraVineriaSchema>;
