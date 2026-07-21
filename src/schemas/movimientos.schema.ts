import { z } from "zod";

import { calcularReposicionPorBultos } from "../domain/movimientos";
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

const detalleReposicionUnidadesFormSchema = z.object({
  modoCarga: z.literal("unidades"),
  productoId: idSchema,
  cantidad: cantidadPositivaSchema,
  costoUnitario: montoPesosPositivoSchema,
}).transform((detalle) => ({
  productoId: detalle.productoId,
  cantidad: detalle.cantidad,
  costoUnitario: detalle.costoUnitario,
  subtotal: detalle.cantidad * detalle.costoUnitario,
  cantidadBultos: undefined,
  unidadesPorBulto: undefined,
  costoPorBulto: undefined,
}));

const detalleReposicionBultosFormSchema = z.object({
  modoCarga: z.literal("bultos"),
  productoId: idSchema,
  cantidadBultos: cantidadPositivaSchema,
  unidadesPorBulto: cantidadPositivaSchema,
  costoPorBulto: montoPesosPositivoSchema,
}).transform((detalle) => ({
  productoId: detalle.productoId,
  ...calcularReposicionPorBultos(
    detalle.cantidadBultos,
    detalle.unidadesPorBulto,
    detalle.costoPorBulto,
  ),
  cantidadBultos: detalle.cantidadBultos,
  unidadesPorBulto: detalle.unidadesPorBulto,
  costoPorBulto: detalle.costoPorBulto,
}));

const detalleReposicionLegacyFormSchema = z.object({
  productoId: idSchema,
  cantidad: cantidadPositivaSchema,
  costoUnitario: montoPesosPositivoSchema,
}).transform((detalle) => ({
  ...detalle,
  subtotal: detalle.cantidad * detalle.costoUnitario,
  cantidadBultos: undefined,
  unidadesPorBulto: undefined,
  costoPorBulto: undefined,
}));

const detalleReposicionNormalizadoSchema = z.object({
  productoId: idSchema,
  cantidad: cantidadPositivaSchema,
  costoUnitario: z.coerce.number().finite().positive("El costo debe ser mayor a 0."),
  subtotal: montoPesosPositivoSchema,
  cantidadBultos: cantidadPositivaSchema.optional(),
  unidadesPorBulto: cantidadPositivaSchema.optional(),
  costoPorBulto: montoPesosPositivoSchema.optional(),
});

export const detalleReposicionFormSchema = z.union([
  detalleReposicionNormalizadoSchema,
  detalleReposicionBultosFormSchema,
  detalleReposicionUnidadesFormSchema,
  detalleReposicionLegacyFormSchema,
]);

const pagoReposicionFormSchema = z.object({
  cuentaTesoreriaId: idSchema,
  monto: montoPesosPositivoSchema,
});

export const reposicionFormSchema = z.object({
  tipo: z.literal("reposicion"),
  descripcion: textoObligatorioSchema.max(100, "La descripción es demasiado larga."),
  monto: montoPesosPositivoSchema,
  medioPago: medioPagoSchema.optional(),
  cuentaTesoreriaId: idSchema.optional(),
  distribucionPagos: z.array(pagoReposicionFormSchema).min(1).optional(),
  detalles: z
    .array(detalleReposicionFormSchema)
    .min(1, "Agregá al menos un producto a la reposición."),
  aporteExternoIncluido: montoPesosPositivoSchema.optional(),
  observaciones: textoOpcionalSchema,
}).superRefine((reposicion, contexto) => {
  if (!reposicion.distribucionPagos) return;
  const cuentas = new Set(reposicion.distribucionPagos.map((pago) => pago.cuentaTesoreriaId));
  if (cuentas.size !== reposicion.distribucionPagos.length) {
    contexto.addIssue({ code: "custom", path: ["distribucionPagos"], message: "No repitas una cuenta en la distribución." });
  }
  const totalPagos = reposicion.distribucionPagos.reduce((total, pago) => total + pago.monto, 0);
  if (Math.abs(totalPagos - reposicion.monto) > 0.01) {
    contexto.addIssue({ code: "custom", path: ["distribucionPagos"], message: "La distribución entre cuentas debe coincidir con el total." });
  }
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
