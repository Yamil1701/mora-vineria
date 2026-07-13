import { z } from "zod";

import {
  cantidadPositivaSchema,
  idSchema,
  montoPesosSchema,
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
export const condicionPagoSchema = z.enum(["contado", "fiado"]);

export const ventaFormSchema = z.object({
  condicionPago: condicionPagoSchema.default("contado"),
  medioPago: medioPagoSchema.optional(),
  destinoTransferencia: destinoTransferenciaSchema.optional(),
  montoCobradoInicial: montoPesosSchema.optional(),
  clienteFiadoNombre: z.string().trim().max(80, "El nombre es demasiado largo.").optional(),
  clienteFiadoNota: textoOpcionalSchema,
  vencimientoFiado: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Revisá la fecha de vencimiento.").optional().or(z.literal("")),
  detalles: z
    .array(detalleVentaFormSchema)
    .min(1, "Agregá al menos un producto a la venta."),
  observaciones: textoOpcionalSchema,
}).superRefine((venta, context) => {
  const total = venta.detalles.reduce(
    (suma, detalle) => suma + detalle.cantidad * detalle.precioUnitarioAplicado,
    0,
  );
  const montoCobrado = venta.condicionPago === "contado"
    ? total
    : (venta.montoCobradoInicial ?? 0);

  if (venta.condicionPago === "fiado" && !venta.clienteFiadoNombre?.trim()) {
    context.addIssue({ code: "custom", path: ["clienteFiadoNombre"], message: "Ingresá el nombre del cliente." });
  }
  if (venta.condicionPago === "fiado" && montoCobrado >= total) {
    context.addIssue({ code: "custom", path: ["montoCobradoInicial"], message: "Para cobrar el total elegí Cobrar todo." });
  }
  if (montoCobrado > total) {
    context.addIssue({ code: "custom", path: ["montoCobradoInicial"], message: "El cobro inicial no puede superar el total." });
  }
  if (montoCobrado > 0 && !venta.medioPago) {
    context.addIssue({ code: "custom", path: ["medioPago"], message: "Elegí cómo recibiste el dinero." });
  }
  if (montoCobrado > 0 && venta.medioPago === "transferencia" && !venta.destinoTransferencia) {
    context.addIssue({ code: "custom", path: ["destinoTransferencia"], message: "Elegí dónde recibiste la transferencia." });
  }
});

export const cobroVentaFormSchema = z.object({
  monto: montoPesosPositivoSchema,
  medioPago: medioPagoSchema,
  destinoTransferencia: destinoTransferenciaSchema.optional(),
}).superRefine((cobro, context) => {
  if (cobro.medioPago === "transferencia" && !cobro.destinoTransferencia) {
    context.addIssue({ code: "custom", path: ["destinoTransferencia"], message: "Elegí dónde recibiste la transferencia." });
  }
});

export const anulacionCobroVentaSchema = z.object({
  motivoAnulacion: z.string().trim().min(1, "Indicá el motivo de anulación.").max(300, "El motivo es demasiado largo."),
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
export type CobroVentaFormValues = z.infer<typeof cobroVentaFormSchema>;
export type AnulacionCobroVentaValues = z.infer<typeof anulacionCobroVentaSchema>;
