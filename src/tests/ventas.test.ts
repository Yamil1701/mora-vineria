import { describe, expect, it } from "vitest";

import {
  calcularStockLuegoDeAnularVenta,
  calcularSubtotalDetalleVenta,
  calcularTotalVenta,
} from "../domain/ventas";

describe("calcularSubtotalDetalleVenta", () => {
  it("multiplica cantidad por precio aplicado", () => {
    expect(calcularSubtotalDetalleVenta(3, 2500)).toBe(7500);
  });
});

describe("calcularTotalVenta", () => {
  it("suma los subtotales de todos los productos", () => {
    expect(
      calcularTotalVenta([
        { cantidad: 2, precioUnitarioAplicado: 5000 },
        { cantidad: 1, precioUnitarioAplicado: 3500 },
      ]),
    ).toBe(13500);
  });
});

describe("calcularStockLuegoDeAnularVenta", () => {
  it("suma al stock actual la cantidad que había sido vendida", () => {
    expect(calcularStockLuegoDeAnularVenta(4, 3)).toBe(7);
  });
});
