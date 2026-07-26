/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const leer = (ruta: string) => readFileSync(resolve(process.cwd(), ruta), "utf8");

describe("layout responsive general", () => {
  it("conserva la navegación móvil y activa el sidebar desde escritorio", () => {
    const layout = leer("src/layouts/AppLayout.tsx");

    expect(layout).toContain("lg:hidden");
    expect(layout).toContain("lg:flex");
    expect(layout).toContain("lg:pl-64");
    expect(layout).toContain("Nueva venta");
  });

  it("convierte los sheets compartidos en paneles laterales", () => {
    const css = leer("src/styles/index.css");
    const bottomSheet = leer("src/components/ui/BottomSheet.tsx");
    const routeSheet = leer("src/components/ui/RouteSheet.tsx");

    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain(".mora-desktop-panel");
    expect(css).toContain("mora-panel-out");
    expect(bottomSheet).toContain("mora-desktop-panel");
    expect(routeSheet).toContain("mora-desktop-panel");
  });

  it("mantiene anchos distintos para pantallas principales y tareas enfocadas", () => {
    const layout = leer("src/layouts/AppLayout.tsx");

    expect(layout).toContain("lg:max-w-4xl");
    expect(layout).toContain("lg:max-w-2xl");
  });
});
