import { z } from "zod";

import {
  cantidadSchema,
  idSchema,
  montoPesosPositivoSchema,
  montoPesosSchema,
  textoObligatorioSchema,
  textoOpcionalSchema,
} from "./common.schema";

export const productoFormSchema = z.object({
  nombre: textoObligatorioSchema.max(80, "El nombre es demasiado largo."),
  categoriaId: idSchema,
  precioVenta: montoPesosPositivoSchema,
  costoCompra: montoPesosSchema,
  marca: textoOpcionalSchema,
  presentacion: textoOpcionalSchema,
  stockActual: cantidadSchema,
  stockObjetivo: cantidadSchema.min(1, "El stock objetivo debe ser mayor a 0."),
  observaciones: textoOpcionalSchema,
});

export const categoriaFormSchema = z.object({
  nombre: textoObligatorioSchema.max(50, "El nombre es demasiado largo."),
});

export type ProductoFormValues = z.infer<typeof productoFormSchema>;
export type CategoriaFormValues = z.infer<typeof categoriaFormSchema>;