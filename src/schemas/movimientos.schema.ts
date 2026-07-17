import { z } from "zod";

import {
  cantidadPositivaSchema,
  idSchema,
  montoPesosPositivoSchema,
  textoObligatorioSchema,
  textoOpcionalSchema,
} from "./common.schema";
import { medioPagoSchema } from "./ventas.schema";

export const tipoMovimientoSchema = z.enum([
  "reposicion",
  "aporte_externo",
  "gasto_puntual",
]);

export const detalleReposicionFormSchema = z.object({
  productoId: idSchema,
  cantidad: cantidadPositivaSchema,
  costoUnitario: montoPesosPositivoSchema,
});

export const reposicionFormSchema = z.object({
  tipo: z.literal("reposicion"),
  descripcion: textoObligatorioSchema.max(100, "La descripción es demasiado larga."),
  monto: montoPesosPositivoSchema,
  medioPago: medioPagoSchema.optional(),
  cuentaTesoreriaId: idSchema.optional(),
  detalles: z
    .array(detalleReposicionFormSchema)
    .min(1, "Agregá al menos un producto a la reposición."),
  aporteExternoIncluido: montoPesosPositivoSchema.optional(),
  observaciones: textoOpcionalSchema,
});

export const aporteExternoFormSchema = z.object({
  tipo: z.literal("aporte_externo"),
  descripcion: textoObligatorioSchema.max(100, "La descripción es demasiado larga."),
  monto: montoPesosPositivoSchema,
  medioPago: medioPagoSchema.optional(),
  cuentaTesoreriaId: idSchema.optional(),
  observaciones: textoOpcionalSchema,
});

export const gastoPuntualFormSchema = z.object({
  tipo: z.literal("gasto_puntual"),
  descripcion: textoObligatorioSchema.max(100, "La descripción es demasiado larga."),
  monto: montoPesosPositivoSchema,
  medioPago: medioPagoSchema.optional(),
  cuentaTesoreriaId: idSchema.optional(),
  observaciones: textoOpcionalSchema,
});

export const movimientoFormSchema = z.discriminatedUnion("tipo", [
  reposicionFormSchema,
  aporteExternoFormSchema,
  gastoPuntualFormSchema,
]);

export const anulacionMovimientoSchema = z.object({
  motivoAnulacion: z
    .string()
    .trim()
    .min(1, "Indicá el motivo de anulación.")
    .max(300, "El motivo es demasiado largo."),
});

export type MovimientoFormValues = z.infer<typeof movimientoFormSchema>;
export type ReposicionFormValues = z.infer<typeof reposicionFormSchema>;
export type AporteExternoFormValues = z.infer<typeof aporteExternoFormSchema>;
export type GastoPuntualFormValues = z.infer<typeof gastoPuntualFormSchema>;
export type AnulacionMovimientoValues = z.infer<typeof anulacionMovimientoSchema>;
