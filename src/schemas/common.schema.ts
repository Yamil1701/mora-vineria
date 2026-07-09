import { z } from "zod";

export const textoObligatorioSchema = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.");

export const textoOpcionalSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    return value;
  },
  z.string().trim().max(500, "El texto es demasiado largo.").optional(),
);

export const idSchema = z.string().trim().min(1, "Falta un identificador válido.");

export const montoPesosSchema = z.coerce
  .number()
  .int("Usá importes sin centavos.")
  .min(0, "El monto no puede ser negativo.");

export const montoPesosPositivoSchema = montoPesosSchema.min(
  1,
  "El monto debe ser mayor a 0.",
);

export const cantidadSchema = z.coerce
  .number()
  .int("La cantidad debe ser un número entero.")
  .min(0, "La cantidad no puede ser negativa.");

export const cantidadPositivaSchema = cantidadSchema.min(
  1,
  "La cantidad debe ser mayor a 0.",
);