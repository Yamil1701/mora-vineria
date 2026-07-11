import { z } from "zod";

import {
  cantidadPositivaSchema,
  idSchema,
  montoPesosPositivoSchema,
  textoOpcionalSchema,
} from "./common.schema";

export const medioPagoSchema = z.enum([
  "efectivo",
  "transferencia",
  "tarjeta",
  "mercado_pago",
  "otro",
]);

export const detalleVentaFormSchema = z.object({
  productoId: idSchema,
  cantidad: cantidadPositivaSchema,
  precioUnitarioAplicado: montoPesosPositivoSchema,
  observaciones: textoOpcionalSchema,
});

export const destinoTransferenciaSchema = z.enum(["mercado_pago", "brubank", "naranja_x", "otro"]);

export const ventaFormSchema = z.object({
  medioPago: medioPagoSchema,
  destinoTransferencia: destinoTransferenciaSchema.optional(),
  detalles: z
    .array(detalleVentaFormSchema)
    .min(1, "Agregá al menos un producto a la venta."),
  observaciones: textoOpcionalSchema,
}).superRefine((venta, context) => {
  if (venta.medioPago === "transferencia" && !venta.destinoTransferencia) {
    context.addIssue({ code: "custom", path: ["destinoTransferencia"], message: "Elegí dónde recibiste la transferencia." });
  }
});

export const anulacionVentaSchema = z.object({
  motivoAnulacion: z
    .string()
    .trim()
    .min(1, "Indicá el motivo de anulación.")
    .max(300, "El motivo es demasiado largo."),
});

export type VentaFormValues = z.infer<typeof ventaFormSchema>;
export type DetalleVentaFormValues = z.infer<typeof detalleVentaFormSchema>;
export type AnulacionVentaValues = z.infer<typeof anulacionVentaSchema>;
