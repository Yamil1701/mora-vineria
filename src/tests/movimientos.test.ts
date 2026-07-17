import { describe, expect, it } from "vitest";

import {
  calcularStockLuegoDeAnularReposicion,
  calcularStockLuegoDeReposicion,
  calcularReposicionPorBultos,
  calcularSubtotalReposicion,
  calcularTotalReposicion,
  puedeEliminarMovimientoAnulado,
} from "../domain/movimientos";

describe("calcularSubtotalReposicion", () => {
  it("multiplica cantidad por costo unitario", () => {
    expect(calcularSubtotalReposicion(4, 3200)).toBe(12800);
  });

  it("conserva el total exacto de un pack aunque el costo medio tenga decimales", () => {
    const detalle = calcularReposicionPorBultos(5, 6, 7000);

    expect(detalle).toEqual({
      cantidad: 30,
      costoUnitario: 35000 / 30,
      subtotal: 35000,
    });
    expect(calcularSubtotalReposicion(
      detalle.cantidad,
      detalle.costoUnitario,
      detalle.subtotal,
    )).toBe(35000);
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

  it("prioriza los subtotales exactos informados por pack", () => {
    expect(
      calcularTotalReposicion([
        { cantidad: 30, costoUnitario: 35000 / 30, subtotal: 35000 },
        { cantidad: 18, costoUnitario: 21000 / 18, subtotal: 21000 },
      ]),
    ).toBe(56000);
  });

  it("calcula en 111200 la reposición real informada por bultos", () => {
    const detalles = [
      calcularReposicionPorBultos(1, 10, 27000),
      calcularReposicionPorBultos(5, 6, 7000),
      calcularReposicionPorBultos(3, 6, 7000),
      calcularReposicionPorBultos(3, 6, 9400),
    ];

    expect(calcularTotalReposicion(detalles)).toBe(111200);
    expect(detalles.reduce((total, detalle) => total + detalle.cantidad, 0)).toBe(76);
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
