import { afterEach, describe, expect, it, vi } from "vitest";

async function importarConfiguracion() {
  vi.resetModules();
  return import("../config/entorno");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("configuración de sincronización por entorno", () => {
  it("permite desactivar la sincronización de forma explícita", async () => {
    vi.stubEnv("VITE_SYNC_ENABLED", "false");

    const configuracion = await importarConfiguracion();

    expect(configuracion.sincronizacionHabilitada).toBe(false);
  });

  it("permite activarla explícitamente para pruebas integradas", async () => {
    vi.stubEnv("VITE_SYNC_ENABLED", "true");

    const configuracion = await importarConfiguracion();

    expect(configuracion.sincronizacionHabilitada).toBe(true);
  });
});
