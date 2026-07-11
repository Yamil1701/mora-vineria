import { describe, expect, it } from "vitest";

import { obtenerEstadoRespaldo } from "../domain/backup";

describe("estado del respaldo", () => {
  const ahora = new Date("2026-07-11T12:00:00.000Z");

  it("distingue cuando todavía no existe un respaldo", () => {
    expect(obtenerEstadoRespaldo(null, ahora)).toBe("sin_respaldo");
  });

  it("mantiene vigente un respaldo de exactamente siete días", () => {
    expect(obtenerEstadoRespaldo("2026-07-04T12:00:00.000Z", ahora)).toBe("vigente");
  });

  it("marca como atrasado un respaldo de más de siete días", () => {
    expect(obtenerEstadoRespaldo("2026-07-04T11:59:59.999Z", ahora)).toBe("atrasado");
  });
});
