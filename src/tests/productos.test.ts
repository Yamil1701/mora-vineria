import { describe, expect, it } from "vitest";

import {
  calcularEstadoStock,
  calcularValorVentaStock,
  describirEquivalenciaEnPacks,
} from "../domain/productos";
import { productoFormSchema } from "../schemas";

describe("calcularEstadoStock", () => {
  it("devuelve sin_stock cuando stockActual es 0", () => {
    expect(calcularEstadoStock(0, 50)).toBe("sin_stock");
  });

  it("devuelve critico cuando el stock está en 10% o menos del objetivo", () => {
    expect(calcularEstadoStock(5, 50)).toBe("critico");
  });

  it("devuelve bajo cuando el stock está en 30% o menos del objetivo", () => {
    expect(calcularEstadoStock(15, 50)).toBe("bajo");
  });

  it("devuelve disponible cuando supera el porcentaje de bajo stock", () => {
    expect(calcularEstadoStock(16, 50)).toBe("disponible");

    expect(calcularEstadoStock(2, 8)).toBe("bajo");
    expect(calcularEstadoStock(8, 30)).toBe("bajo");
  });

  it("no redondea el umbral crítico hacia arriba en objetivos pequeños", () => {
    expect(calcularEstadoStock(1, 8)).toBe("bajo");
    expect(calcularEstadoStock(1, 1)).toBe("disponible");
  });

  it("no marca bajo stock si no hay stockObjetivo configurado", () => {
    expect(calcularEstadoStock(3, 0)).toBe("disponible");
  });
});

describe("información operativa del producto", () => {
  it("calcula el valor de venta del stock disponible", () => {
    expect(calcularValorVentaStock({ precioVenta: 1500, stockActual: 30 })).toBe(45_000);
  });

  it("describe packs completos y unidades sueltas", () => {
    expect(describirEquivalenciaEnPacks({
      stockActual: 30,
      modoCompraHabitual: "pack",
      nombrePack: "cajón",
      unidadesPorPack: 10,
    })).toBe("3 cajones");
    expect(describirEquivalenciaEnPacks({
      stockActual: 15,
      modoCompraHabitual: "pack",
      nombrePack: "cajón",
      unidadesPorPack: 10,
    })).toBe("1 cajón y 5 unidades");
    expect(describirEquivalenciaEnPacks({
      stockActual: 5,
      modoCompraHabitual: "pack",
      nombrePack: "pack",
      unidadesPorPack: 6,
    })).toBe("Menos de 1 pack");
  });

  it("exige nombre y unidades cuando la compra habitual es por pack", () => {
    const resultado = productoFormSchema.safeParse({
      nombre: "Quilmes",
      categoriaId: "categoria-1",
      precioVenta: 1500,
      costoCompra: 900,
      modoCompraHabitual: "pack",
      nombrePack: "",
      unidadesPorPack: "",
      stockActual: 10,
      stockObjetivo: 30,
    });

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(resultado.error.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(["nombrePack", "unidadesPorPack"]),
    );
  });
});
