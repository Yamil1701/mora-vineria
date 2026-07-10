import { describe, expect, it } from "vitest";

import {
  calcularStockLuegoDeAnularReposicion,
  calcularStockLuegoDeReposicion,
  calcularSubtotalReposicion,
  calcularTotalReposicion,
  puedeEliminarMovimientoAnulado,
} from "../domain/movimientos";

describe("calcularSubtotalReposicion", () => {
  it("multiplica cantidad por costo unitario", () => {
    expect(calcularSubtotalReposicion(4, 3200)).toBe(12800);
  });
});

describe("calcularTotalReposicion", () => {
  it("suma los subtotales de todos los productos repuestos", () => {
    expect(
      calcularTotalReposicion([
        { cantidad: 3, costoUnitario: 2000 },
        { cantidad: 2, costoUnitario: 4500 },
      ]),
    ).toBe(15000);
  });
});

describe("calcularStockLuegoDeReposicion", () => {
  it("suma al stock actual la cantidad repuesta", () => {
    expect(calcularStockLuegoDeReposicion(5, 7)).toBe(12);
  });
});

describe("calcularStockLuegoDeAnularReposicion", () => {
  it("resta del stock actual la cantidad que había sido repuesta", () => {
    expect(calcularStockLuegoDeAnularReposicion(12, 7)).toBe(5);
  });
});

describe("puedeEliminarMovimientoAnulado", () => {
  it("solo permite eliminar cuando la anulación terminó", () => {
    expect(
      puedeEliminarMovimientoAnulado({
        estado: "anulado",
        anuladoAt: "2026-07-10T17:00:00.000Z",
      }),
    ).toBe(true);
    expect(puedeEliminarMovimientoAnulado({ estado: "activo", anuladoAt: null })).toBe(false);
    expect(puedeEliminarMovimientoAnulado({ estado: "anulado", anuladoAt: null })).toBe(false);
  });
});
