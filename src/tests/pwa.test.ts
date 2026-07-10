import { describe, expect, it } from "vitest";

import { normalizarRutaGitHubPages, obtenerMensajeConexion } from "../domain/pwa";

describe("obtenerMensajeConexion", () => {
  it("explica que la app puede seguir usando datos locales sin conexion", () => {
    expect(obtenerMensajeConexion(false)).toContain("datos guardados");
  });
});

describe("normalizarRutaGitHubPages", () => {
  it("restaura una ruta interna usando el base path", () => {
    expect(normalizarRutaGitHubPages("reportes/pdf-mensual?mes=2026-07")).toBe(
      "/mora-vineria/reportes/pdf-mensual?mes=2026-07",
    );
  });

  it("devuelve null cuando no hay redireccion pendiente", () => {
    expect(normalizarRutaGitHubPages(null)).toBeNull();
  });
});
