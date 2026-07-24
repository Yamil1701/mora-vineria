import { z } from "zod";

import {
  cantidadSchema,
  cantidadPositivaSchema,
  montoPesosPositivoSchema,
  montoPesosSchema,
  textoObligatorioSchema,
  textoOpcionalSchema,
} from "./common.schema";

const unidadesPorPackSchema = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  cantidadPositivaSchema.optional(),
);

export const productoFormSchema = z.object({
  nombre: textoObligatorioSchema.max(80, "El nombre es demasiado largo."),
  categoriaId: z.string().trim().min(1, "Elegí una categoría."),
  precioVenta: montoPesosPositivoSchema,
  costoCompra: montoPesosSchema,
  marca: textoOpcionalSchema,
  presentacion: textoOpcionalSchema,
  modoCompraHabitual: z.enum(["unidad", "pack"]).default("unidad"),
  nombrePack: textoOpcionalSchema,
  unidadesPorPack: unidadesPorPackSchema,
  stockActual: cantidadSchema,
  stockObjetivo: cantidadSchema.min(1, "El stock objetivo debe ser mayor a 0."),
  observaciones: textoOpcionalSchema,
}).superRefine((producto, contexto) => {
  if (producto.modoCompraHabitual !== "pack") return;
  if (!producto.nombrePack) {
    contexto.addIssue({
      code: "custom",
      path: ["nombrePack"],
      message: "Indicá cómo se llama el pack o bulto.",
    });
  }
  if (!producto.unidadesPorPack) {
    contexto.addIssue({
      code: "custom",
      path: ["unidadesPorPack"],
      message: "Indicá cuántas unidades trae.",
    });
  }
});

export const categoriaFormSchema = z.object({
  nombre: textoObligatorioSchema.max(50, "El nombre es demasiado largo."),
});

export type ProductoFormValues = z.infer<typeof productoFormSchema>;
export type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;
