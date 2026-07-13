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

  it("conserva y permite vaciar el borrador temporal de venta", () => {
    usePreferenciasUi.getState().actualizarBorradorVenta({
      items: [
        {
          productoId: "producto-1",
          cantidad: 2,
          precioUnitarioAplicado: 4500,
        },
      ],
      condicionPago: "fiado",
      medioPago: "transferencia",
      montoCobradoInicial: 2000,
      clienteFiadoNombre: "Ana",
      clienteFiadoNota: "Cliente habitual",
      vencimientoFiado: "2026-07-20",
      observaciones: "Cliente habitual",
    });

    expect(usePreferenciasUi.getState().borradorVenta.items).toHaveLength(1);
    expect(usePreferenciasUi.getState().borradorVenta.actualizadoAt).not.toBeNull();

    usePreferenciasUi.getState().vaciarBorradorVenta();

    expect(usePreferenciasUi.getState().borradorVenta).toEqual({
      items: [],
      condicionPago: "contado",
      medioPago: "efectivo",
      montoCobradoInicial: 0,
      clienteFiadoNombre: "",
      clienteFiadoNota: "",
      vencimientoFiado: "",
      observaciones: "",
      actualizadoAt: null,
    });
  });
});
