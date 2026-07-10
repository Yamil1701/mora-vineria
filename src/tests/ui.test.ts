import { describe, expect, it } from "vitest";

import { unirClases } from "../utils/clases";

describe("utilidades UI", () => {
  it("une clases ignorando valores vacíos", () => {
    expect(unirClases("base", false, undefined, null, "activo")).toBe("base activo");
  });
});
