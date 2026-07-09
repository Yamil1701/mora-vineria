import { describe, expect, it } from "vitest";

import { calcularSemanaDelMes } from "../utils/semanaDelMes";

describe("calcularSemanaDelMes", () => {
  it("calcula semana 1 del día 1 al 7", () => {
    expect(calcularSemanaDelMes(new Date(2026, 6, 1))).toBe(1);
    expect(calcularSemanaDelMes(new Date(2026, 6, 7))).toBe(1);
  });

  it("calcula semana 2 del día 8 al 14", () => {
    expect(calcularSemanaDelMes(new Date(2026, 6, 8))).toBe(2);
    expect(calcularSemanaDelMes(new Date(2026, 6, 14))).toBe(2);
  });

  it("calcula semana 3 del día 15 al 21", () => {
    expect(calcularSemanaDelMes(new Date(2026, 6, 15))).toBe(3);
    expect(calcularSemanaDelMes(new Date(2026, 6, 21))).toBe(3);
  });

  it("calcula semana 4 del día 22 al último día del mes", () => {
    expect(calcularSemanaDelMes(new Date(2026, 6, 22))).toBe(4);
    expect(calcularSemanaDelMes(new Date(2026, 6, 31))).toBe(4);
  });
});