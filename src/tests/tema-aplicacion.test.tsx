import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { TemaAplicacion } from "../components/TemaAplicacion";
import { ConfiguracionPage } from "../features/configuracion/ConfiguracionPage";
import { usePreferenciasUi } from "../stores/preferenciasUi";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function luminancia([r, g, b]: number[]) {
  const canales = [r, g, b].map((valor) => {
    const normalizado = valor / 255;
    return normalizado <= 0.03928
      ? normalizado / 12.92
      : ((normalizado + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * canales[0]) + (0.7152 * canales[1]) + (0.0722 * canales[2]);
}

function contraste(a: number[], b: number[]) {
  const luminanciaA = luminancia(a);
  const luminanciaB = luminancia(b);
  return (Math.max(luminanciaA, luminanciaB) + 0.05) / (Math.min(luminanciaA, luminanciaB) + 0.05);
}

describe("tema de la aplicación", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (root) act(() => root?.unmount());
    container?.remove();
    document.querySelector('meta[name="theme-color"]')?.remove();
    usePreferenciasUi.setState({ tema: "oscuro" });
    root = null;
    container = null;
  });

  it("aplica el tema claro también a la barra del sistema", async () => {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    usePreferenciasUi.setState({ tema: "claro" });
    await act(async () => root?.render(<TemaAplicacion />));

    expect(document.documentElement.dataset.theme).toBe("claro");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(meta.content).toBe("#fff9fc");
  });

  it("mantiene contraste AA en los dos acentos de texto del tema claro", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/index.css"), "utf8");
    const bloqueClaro = css.match(/html\[data-theme="claro"\] \{([\s\S]*?)\n\}/)?.[1] ?? "";
    const color = (nombre: string) => {
      const valores = bloqueClaro.match(new RegExp(`--${nombre}: (\\d+) (\\d+) (\\d+);`));
      if (!valores) throw new Error(`No se encontró ${nombre}`);
      return valores.slice(1).map(Number);
    };

    const fondo = color("mora-fondo");
    expect(contraste(color("mora-principal"), fondo)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(color("mora-suave"), fondo)).toBeGreaterThanOrEqual(4.5);
  });

  it("presenta la apariencia como una única lista de selección", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => root?.render(<MemoryRouter><ConfiguracionPage /></MemoryRouter>));
    const selector = container.querySelector<HTMLSelectElement>("#tema-aplicacion");

    expect(selector).toBeTruthy();
    expect([...selector!.options].map((opcion) => opcion.text)).toEqual(["Oscuro", "Claro"]);
    await act(async () => {
      selector!.value = "claro";
      selector!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(usePreferenciasUi.getState().tema).toBe("claro");
  });
});
