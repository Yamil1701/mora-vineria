import { z } from "zod";

import {
  idSchema,
  montoPesosPositivoSchema,
  montoPesosSchema,
  textoObligatorioSchema,
  textoOpcionalSchema,
} from "./common.schema";

export const tipoCuentaTesoreriaSchema = z.enum(["efectivo", "digital"]);

export const cuentaTesoreriaFormSchema = z.object({
  id: idSchema.optional(),
  nombre: textoObligatorioSchema.max(60, "El nombre es demasiado largo."),
  tipo: tipoCuentaTesoreriaSchema,
  saldoInicial: montoPesosSchema,
  esPredeterminada: z.boolean().default(false),
  fondoCambioObjetivo: montoPesosSchema.optional(),
}).superRefine((cuenta, context) => {
  if (cuenta.tipo === "digital" && cuenta.fondoCambioObjetivo) {
    context.addIssue({
      code: "custom",
      path: ["fondoCambioObjetivo"],
      message: "El fondo de cambio se usa solamente en cuentas de efectivo.",
    });
  }
});

export const configuracionTesoreriaFormSchema = z.object({
  cuentas: z.array(cuentaTesoreriaFormSchema).min(1, "Agregá al menos una cuenta."),
}).superRefine((configuracion, context) => {
  const nombres = new Set<string>();
  for (const [indice, cuenta] of configuracion.cuentas.entries()) {
    const nombre = cuenta.nombre.trim().toLocaleLowerCase("es-AR");
    if (nombres.has(nombre)) {
      context.addIssue({
        code: "custom",
        path: ["cuentas", indice, "nombre"],
        message: "No repitas el nombre de una cuenta.",
      });
    }
    nombres.add(nombre);
  }
  for (const tipo of ["efectivo", "digital"] as const) {
    if (configuracion.cuentas.filter((cuenta) => cuenta.tipo === tipo && cuenta.esPredeterminada).length > 1) {
      context.addIssue({
        code: "custom",
        path: ["cuentas"],
        message: `Elegí una sola cuenta ${tipo === "efectivo" ? "de efectivo" : "digital"} como predeterminada.`,
      });
    }
  }
});

export const operacionTesoreriaFormSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("retiro"),
    cuentaId: idSchema,
    monto: montoPesosPositivoSchema,
    descripcion: textoObligatorioSchema.max(100),
    registradoPor: textoObligatorioSchema.max(80, "El nombre es demasiado largo."),
    destinatario: textoObligatorioSchema.max(100, "El destinatario es demasiado largo."),
    observaciones: textoOpcionalSchema,
  }),
  z.object({
    tipo: z.literal("transferencia"),
    cuentaOrigenId: idSchema,
    cuentaDestinoId: idSchema,
    monto: montoPesosPositivoSchema,
    descripcion: textoObligatorioSchema.max(100),
    registradoPor: textoOpcionalSchema,
    observaciones: textoOpcionalSchema,
  }).refine((operacion) => operacion.cuentaOrigenId !== operacion.cuentaDestinoId, {
    path: ["cuentaDestinoId"],
    message: "La cuenta de destino debe ser distinta.",
  }),
]);

export const conteoCajaFormSchema = z.object({
  cuentaId: idSchema,
  montoContado: montoPesosSchema,
  detalleDenominaciones: z.record(z.string(), z.number().int().nonnegative()).optional(),
  observaciones: textoOpcionalSchema,
});

export type CuentaTesoreriaFormValues = z.infer<typeof cuentaTesoreriaFormSchema>;
export type ConfiguracionTesoreriaFormValues = z.infer<typeof configuracionTesoreriaFormSchema>;
export type OperacionTesoreriaFormValues = z.infer<typeof operacionTesoreriaFormSchema>;
export type ConteoCajaFormValues = z.infer<typeof conteoCajaFormSchema>;
