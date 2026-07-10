import { describe, expect, it } from "vitest";

import type { SemanaDelMes } from "../domain/reportes";
import {
  calcularSemanaDelMes,
  crearRangoSemanaDelMes,
  obtenerSemanasDisponibles,
} from "../utils/semanaDelMes";

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

describe("crearRangoSemanaDelMes", () => {
  it("crea los tres primeros bloques de siete días", () => {
    expect(crearRangoSemanaDelMes("2026-07", 1)).toEqual({
      desde: "2026-07-01",
      hasta: "2026-07-07",
    });
    expect(crearRangoSemanaDelMes("2026-07", 2)).toEqual({
      desde: "2026-07-08",
      hasta: "2026-07-14",
    });
    expect(crearRangoSemanaDelMes("2026-07", 3)).toEqual({
      desde: "2026-07-15",
      hasta: "2026-07-21",
    });
  });

  it("extiende la semana 4 hasta el final de cada mes", () => {
    expect(crearRangoSemanaDelMes("2026-07", 4)).toEqual({
      desde: "2026-07-22",
      hasta: "2026-07-31",
    });
    expect(crearRangoSemanaDelMes("2026-02", 4)).toEqual({
      desde: "2026-02-22",
      hasta: "2026-02-28",
    });
    expect(crearRangoSemanaDelMes("2028-02", 4)).toEqual({
      desde: "2028-02-22",
      hasta: "2028-02-29",
    });
  });

  it("rechaza meses inválidos", () => {
    expect(() => crearRangoSemanaDelMes("2026-13", 1)).toThrow("no es válido");
    expect(() => crearRangoSemanaDelMes("julio-2026", 1)).toThrow("formato válido");
  });

  it("rechaza semanas fuera de los cuatro bloques", () => {
    expect(() => crearRangoSemanaDelMes("2026-07", 5 as SemanaDelMes)).toThrow(
      "semana seleccionada no es válida",
    );
  });
});

describe("obtenerSemanasDisponibles", () => {
  it("habilita las cuatro semanas de meses anteriores", () => {
    expect(obtenerSemanasDisponibles("2026-06", "2026-07-10")).toEqual([1, 2, 3, 4]);
  });

  it("habilita solo las semanas que comenzaron en el mes actual", () => {
    expect(obtenerSemanasDisponibles("2026-07", "2026-07-10")).toEqual([1, 2]);
    expect(obtenerSemanasDisponibles("2026-07", "2026-07-22")).toEqual([1, 2, 3, 4]);
  });

  it("no habilita semanas de meses futuros", () => {
    expect(obtenerSemanasDisponibles("2026-08", "2026-07-10")).toEqual([]);
  });

  it("usa la fecha de jornada recibida como límite", () => {
    expect(obtenerSemanasDisponibles("2026-07", "2026-07-07")).toEqual([1]);
    expect(obtenerSemanasDisponibles("2026-07", "2026-07-08")).toEqual([1, 2]);
  });
});
