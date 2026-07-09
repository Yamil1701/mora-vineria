import { format, subDays } from "date-fns";

export const HORA_INICIO_JORNADA = 8;

export function calcularFechaJornada(fecha: Date): string {
  const hora = fecha.getHours();
  const fechaBase = hora < HORA_INICIO_JORNADA ? subDays(fecha, 1) : fecha;

  return format(fechaBase, "yyyy-MM-dd");
}

export function crearFechaHoraReal(fecha: Date = new Date()): string {
  return fecha.toISOString();
}