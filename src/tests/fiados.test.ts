import { describe, expect, it } from "vitest";

import { calcularSaldoVenta, calcularTotalCobrado, obtenerEstadoFiado } from "../domain/ventas";

const cobros = [
  { monto: 3000, estado: "activo" as const },
  { monto: 1000, estado: "anulado" as const },
];

describe("ventas fiadas", () => {
  it("calcula el saldo usando solamente cobros activos", () => {
    expect(calcularTotalCobrado(cobros)).toBe(3000);
    expect(calcularSaldoVenta(8000, cobros)).toBe(5000);
  });

  it("distingue deuda pendiente, vencida, pagada y excedida", () => {
    const venta = { estado: "activa" as const, total: 8000, vencimientoFiado: "2026-07-10" };
    expect(obtenerEstadoFiado(venta, cobros, "2026-07-09")).toBe("pendiente");
    expect(obtenerEstadoFiado(venta, cobros, "2026-07-11")).toBe("vencida");
    expect(obtenerEstadoFiado(venta, [{ monto: 8000, estado: "activo" }], "2026-07-11")).toBe("pagada");
    expect(obtenerEstadoFiado(venta, [{ monto: 9000, estado: "activo" }], "2026-07-11")).toBe("excedida");
  });
});
