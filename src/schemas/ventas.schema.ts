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

export const cobroInicialVentaSchema = z.object({
  monto: montoPesosPositivoSchema,
  medioPago: medioPagoSchema,
  destinoTransferencia: destinoTransferenciaSchema.optional(),
  cuentaTesoreriaId: idSchema.optional(),
}).superRefine((cobro, context) => {
  if (cobro.medioPago === "transferencia" && !cobro.destinoTransferencia) {
    context.addIssue({ code: "custom", path: ["destinoTransferencia"], message: "Elegí dónde recibiste la transferencia." });
  }
});

export const ventaFormSchema = z.object({
  condicionPago: condicionPagoSchema.default("contado"),
  medioPago: medioPagoSchema.optional(),
  destinoTransferencia: destinoTransferenciaSchema.optional(),
  cuentaTesoreriaId: idSchema.optional(),
  montoCobradoInicial: montoPesosSchema.optional(),
  cobrosIniciales: z.array(cobroInicialVentaSchema).min(1).max(2).optional(),
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
  const montoCobrado = venta.cobrosIniciales
    ? venta.cobrosIniciales.reduce((suma, cobro) => suma + cobro.monto, 0)
    : venta.condicionPago === "contado"
      ? total
      : (venta.montoCobradoInicial ?? 0);

  if (venta.condicionPago === "fiado" && !venta.clienteFiadoNombre?.trim()) {
    context.addIssue({ code: "custom", path: ["clienteFiadoNombre"], message: "Ingresá el nombre del cliente." });
  }
  if (venta.condicionPago === "fiado" && montoCobrado >= total) {
    context.addIssue({ code: "custom", path: ["montoCobradoInicial"], message: "Para cobrar el total elegí Cobrar todo." });
  }
  if (montoCobrado > total) {
    context.addIssue({ code: "custom", path: venta.cobrosIniciales ? ["cobrosIniciales"] : ["montoCobradoInicial"], message: "El cobro inicial no puede superar el total." });
  }
  if (venta.condicionPago === "contado" && montoCobrado !== total) {
    context.addIssue({ code: "custom", path: ["cobrosIniciales"], message: "Los pagos deben completar el total de la venta." });
  }
  if (venta.cobrosIniciales && new Set(venta.cobrosIniciales.map((cobro) => cobro.medioPago)).size !== venta.cobrosIniciales.length) {
    context.addIssue({ code: "custom", path: ["cobrosIniciales"], message: "Elegí dos medios de pago distintos." });
  }
  if (montoCobrado > 0 && !venta.cobrosIniciales && !venta.medioPago) {
    context.addIssue({ code: "custom", path: ["medioPago"], message: "Elegí cómo recibiste el dinero." });
  }
  if (montoCobrado > 0 && !venta.cobrosIniciales && venta.medioPago === "transferencia" && !venta.destinoTransferencia) {
    context.addIssue({ code: "custom", path: ["destinoTransferencia"], message: "Elegí dónde recibiste la transferencia." });
  }
});

export const cobroVentaFormSchema = z.object({
  monto: montoPesosPositivoSchema,
  medioPago: medioPagoSchema,
  destinoTransferencia: destinoTransferenciaSchema.optional(),
  cuentaTesoreriaId: idSchema.optional(),
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
export type CobroInicialVentaFormValues = z.infer<typeof cobroInicialVentaSchema>;
export type AnulacionCobroVentaValues = z.infer<typeof anulacionCobroVentaSchema>;
