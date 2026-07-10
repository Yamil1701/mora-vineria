import { describe, expect, it } from "vitest";

import type { ToastTone } from "../components/ui";
import { usePreferenciasUi } from "../stores/preferenciasUi";
import { unirClases } from "../utils/clases";

describe("utilidades UI", () => {
  it("une clases ignorando valores vacíos", () => {
    expect(unirClases("base", false, undefined, null, "activo")).toBe("base activo");
  });

  it("define los tonos de aviso que usará la interfaz", () => {
    const tonos: ToastTone[] = ["success", "error", "warning", "info"];

    expect(tonos).toEqual(["success", "error", "warning", "info"]);
  });
});

describe("preferencias de interfaz", () => {
  it("conserva la vista de productos elegida durante la sesión", () => {
    usePreferenciasUi.setState({ vistaProductos: "cards" });
    usePreferenciasUi.getState().cambiarVistaProductos("compacta");

    expect(usePreferenciasUi.getState().vistaProductos).toBe("compacta");

    usePreferenciasUi.setState({ vistaProductos: "cards" });
  });
});
