import { describe, expect, it } from "vitest";

import {
  calcularStockLuegoDeAnularVenta,
  calcularSubtotalDetalleVenta,
  calcularTotalVenta,
  calcularVuelto,
} from "../domain/ventas";
import { aplicarDescuentoTotal, calcularTotalLista } from "../features/ventas/ventas.ui";

describe("calcularSubtotalDetalleVenta", () => {
  it("multiplica cantidad por precio aplicado", () => {
    expect(calcularSubtotalDetalleVenta(3, 2500)).toBe(7500);
  });
});

describe("calcularVuelto", () => {
  it("devuelve la diferencia cuando el efectivo alcanza", () => expect(calcularVuelto(7200, 10000)).toBe(2800));
  it("no devuelve vuelto cuando el efectivo es insuficiente", () => expect(calcularVuelto(7200, 5000)).toBeNull());
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

describe("descuento global de una venta", () => {
  const precios = new Map([["vino", 5_000], ["cerveza", 2_000]]);
  const items = [
    { productoId: "vino", cantidad: 2, precioUnitarioAplicado: 5_000 },
    { productoId: "cerveza", cantidad: 1, precioUnitarioAplicado: 2_000 },
  ];

  it("aplica el descuento en la etapa de cobro conservando las proporciones", () => {
    const descontados = aplicarDescuentoTotal(items, precios, 1_200);
    const total = descontados.reduce((suma, item) => suma + item.cantidad * item.precioUnitarioAplicado, 0);

    expect(calcularTotalLista(items, precios)).toBe(12_000);
    expect(total).toBeCloseTo(10_800, 2);
    expect(descontados.every((item) => Number.isInteger(item.precioUnitarioAplicado))).toBe(true);
  });

  it("restaura los precios de lista al quitar el descuento", () => {
    const descontados = aplicarDescuentoTotal(items, precios, 1_200);
    expect(aplicarDescuentoTotal(descontados, precios, 0)).toEqual(items);
  });
});
