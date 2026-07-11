/// <reference types="node" />

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const raiz = process.cwd();

describe("identidad de Mora Vinería", () => {
  it("conserva un SVG maestro con la paleta aprobada", () => {
    const logo = readFileSync(resolve(raiz, "public/brand/logo-app.svg"), "utf8");
    expect(logo).toContain("#D7268F");
    expect(logo).toContain("#F2C6D8");
    expect(logo).toContain('viewBox="0 0 512 512"');
  });

  it("incluye iconos raster normales, maskable y para Apple", () => {
    const archivos = [
      "public/icons/icon-192.png",
      "public/icons/icon-512.png",
      "public/icons/icon-maskable-512.png",
      "public/icons/apple-touch-icon.png",
    ];
    for (const archivo of archivos) {
      const ruta = resolve(raiz, archivo);
      expect(existsSync(ruta)).toBe(true);
      expect(statSync(ruta).size).toBeGreaterThan(1000);
    }
  });

  it("declara el icono maskable por separado en la PWA", () => {
    const configuracion = readFileSync(resolve(raiz, "vite.config.ts"), "utf8");
    expect(configuracion).toContain("icon-maskable-512.png");
    expect(configuracion).toContain('purpose: "maskable"');
  });
});
