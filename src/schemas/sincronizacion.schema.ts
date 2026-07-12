import { z } from "zod";

export const modoDispositivoRemotoSchema = z.enum(["operacion", "consulta"]);
export const tipoDispositivoRemotoSchema = z.enum(["principal", "vinculado"]);

export const resultadoActivacionNegocioSchema = z.object({
  negocio_id: z.string().uuid(),
  dispositivo_id: z.string().uuid(),
  codigo_recuperacion: z.string().min(24),
});

export const resultadoCodigoEmparejamientoSchema = z.object({
  codigo: z.string().min(24),
  vence_at: z.string().datetime({ offset: true }),
  modo: modoDispositivoRemotoSchema,
});

export const resultadoEmparejamientoSchema = z.object({
  negocio_id: z.string().uuid(),
  dispositivo_id: z.string().uuid(),
  tipo: tipoDispositivoRemotoSchema,
  modo: modoDispositivoRemotoSchema,
});

export const dispositivoRemotoSchema = z.object({
  id: z.string().uuid(),
  negocio_id: z.string().uuid(),
  nombre: z.string().min(1),
  tipo: tipoDispositivoRemotoSchema,
  modo: modoDispositivoRemotoSchema,
  estado: z.enum(["activo", "revocado"]),
  creado_at: z.string().datetime({ offset: true }),
  ultima_actividad_at: z.string().datetime({ offset: true }).nullable(),
});
