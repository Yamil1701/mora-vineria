import { describe, expect, it } from "vitest";

import type { ToastTone } from "../components/ui";
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
