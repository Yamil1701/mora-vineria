import { describe, expect, it } from "vitest";

import { calcularFechaJornada } from "../utils/jornadaVenta";

describe("calcularFechaJornada", () => {
  it("usa el mismo día desde las 08:00", () => {
    const fecha = new Date(2026, 7, 1, 8, 0);

    expect(calcularFechaJornada(fecha)).toBe("2026-08-01");
  });

  it("usa el mismo día durante la noche", () => {
    const fecha = new Date(2026, 7, 1, 22, 30);

    expect(calcularFechaJornada(fecha)).toBe("2026-08-01");
  });

  it("usa el día anterior antes de las 08:00", () => {
    const fecha = new Date(2026, 7, 2, 2, 15);

    expect(calcularFechaJornada(fecha)).toBe("2026-08-01");
  });

  it("usa el día anterior a las 07:59", () => {
    const fecha = new Date(2026, 7, 2, 7, 59);

    expect(calcularFechaJornada(fecha)).toBe("2026-08-01");
  });
});