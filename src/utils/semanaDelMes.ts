import type { SemanaDelMes } from "../domain/reportes";

export function calcularSemanaDelMes(fecha: Date): SemanaDelMes {
  const dia = fecha.getDate();

  if (dia <= 7) return 1;
  if (dia <= 14) return 2;
  if (dia <= 21) return 3;

  return 4;
}