import { describe, expect, it } from "vitest";

import { calcularEstadoStock } from "../domain/productos";

describe("calcularEstadoStock", () => {
  it("devuelve sin_stock cuando stockActual es 0", () => {
    expect(calcularEstadoStock(0, 50)).toBe("sin_stock");
  });

  it("devuelve critico cuando el stock está en 10% o menos del objetivo", () => {
    expect(calcularEstadoStock(5, 50)).toBe("critico");
  });

  it("devuelve bajo cuando el stock está en 20% o menos del objetivo", () => {
    expect(calcularEstadoStock(10, 50)).toBe("bajo");
  });

  it("devuelve disponible cuando supera el porcentaje de bajo stock", () => {
    expect(calcularEstadoStock(11, 50)).toBe("disponible");
  });

  it("no marca bajo stock si no hay stockObjetivo configurado", () => {
    expect(calcularEstadoStock(3, 0)).toBe("disponible");
  });
});