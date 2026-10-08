import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmProvider, ToastProvider } from "../components/ui";
import { registrarVenta } from "../db";
import { NuevaVentaPage } from "../features/ventas/NuevaVentaPage";
import { usePreferenciasUi } from "../stores/preferenciasUi";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const catalogo = vi.hoisted(() => ({ extras: [] as Array<Record<string, unknown>> }));
vi.mock("../db", () => ({ registrarVenta: vi.fn() }));
vi.mock("../hooks/useConfiguracionLocal", () => ({
  useConfiguracionLocal: () => ({ configuracion: { deviceRole: "principal" } }),
}));
vi.mock("../hooks/useProductos", () => ({
  useProductos: () => ({
    productos: [{
      id: "producto-1",
      nombre: "Malbec",
      categoriaId: "categoria-1",
      precioVenta: 5_000,
      costoCompra: 3_000,
      stockActual: 8,
      stockObjetivo: 12,
      estado: "activo",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    }, ...catalogo.extras],
    categorias: [{ id: "categoria-1", nombre: "Vinos", activa: true }],
    unidadesVendidasPorProducto: {},
    cargando: false,
    error: null,
    recargar: vi.fn(),
  }),
}));
vi.mock("../hooks/useTesoreria", () => ({
  useTesoreria: () => ({ resumen: { configurada: false, cuentas: [] } }),
}));

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function boton(texto: string): HTMLButtonElement {
  const encontrado = [...document.querySelectorAll<HTMLButtonElement>("button")]
    .find((item) => item.textContent?.includes(texto));
  if (!encontrado) throw new Error(`No se encontró el botón ${texto}.`);
  return encontrado;
}

async function tocar(texto: string) {
  await act(async () => {
    boton(texto).click();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  catalogo.extras = [];
  usePreferenciasUi.getState().vaciarBorradorVenta();
});

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  container?.remove();
  document.body.querySelectorAll("[data-radix-portal]").forEach((elemento) => elemento.remove());
  root = null;
  container = null;
});

describe("jerarquía de nueva venta", () => {
  it("deja efectivo y transferencia visibles y agrupa fiado y pago combinado", async () => {
    const router = createMemoryRouter([{
      path: "/ventas/nueva",
      element: <ToastProvider><ConfirmProvider><NuevaVentaPage /></ConfirmProvider></ToastProvider>,
    }], { initialEntries: ["/ventas/nueva"] });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root?.render(<RouterProvider router={router} />));

    await tocar("Malbec");
    await tocar("Carrito · 1");
    expect(document.body.textContent).not.toContain("Precio y observación");
    expect(document.body.textContent).toContain("Ajustar precios");

    await tocar("Revisar y cobrar");
    expect(document.body.textContent).not.toContain("Aplicar descuento");
    expect(document.body.textContent).toContain("Efectivo");
    expect(document.body.textContent).toContain("Transferencia");
    expect(document.body.textContent).not.toContain("Fiar parte o total");
    expect(document.body.textContent).not.toContain("Cobrar todo");
    expect(document.body.textContent).not.toContain("La mitad");
    expect(document.body.textContent).not.toContain("Faltan $1.000");
    expect(document.body.textContent).not.toContain("Fiado");

    await tocar("Otras formas de cobro");
    expect(document.body.textContent).toContain("Pago combinado");
    expect(document.body.textContent).toContain("Fiado");
    expect([...document.querySelectorAll("button")].some((item) => item.textContent === "Tarjeta")).toBe(false);
    expect([...document.querySelectorAll("button")].some((item) => item.textContent === "Otro")).toBe(false);

    await tocar("Pago combinado");
    expect(document.body.textContent).toContain("Primer pago");
    expect(document.body.textContent).toContain("Segundo pago");

    await tocar("Fiado");
    expect(document.querySelector('input[placeholder="Nombre obligatorio"]')).not.toBeNull();
    expect(document.body.textContent).toContain("Agregar nota o vencimiento");
  });

  it("ajusta un precio individual y permite restaurarlo", async () => {
    const router = createMemoryRouter([{
      path: "/ventas/nueva",
      element: <ToastProvider><ConfirmProvider><NuevaVentaPage /></ConfirmProvider></ToastProvider>,
    }], { initialEntries: ["/ventas/nueva"] });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root?.render(<RouterProvider router={router} />));

    await tocar("Malbec");
    await tocar("Carrito · 1");
    await tocar("Ajustar precios");

    const precio = document.querySelector<HTMLInputElement>('input[aria-label="Precio unitario de Malbec"]');
    expect(precio).not.toBeNull();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(precio, "4500");
      precio?.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("Restaurar original");

    await tocar("Restaurar original");
    expect(precio?.value).toBe("5000");
  });
  it("hace accesible el catálogo completo y busca fuera del primer bloque", async () => {
    catalogo.extras = Array.from({ length: 30 }, (_, index) => ({
      id: `extra-${index}`, nombre: `Vino ${String(index).padStart(2, "0")}`,
      categoriaId: "categoria-1", precioVenta: 3000, costoCompra: 2000,
      stockActual: 10, stockObjetivo: 12, estado: "activo",
    }));
    const router = createMemoryRouter([{ path: "*", element: <ToastProvider><ConfirmProvider><NuevaVentaPage /></ConfirmProvider></ToastProvider> }], { initialEntries: ["/ventas/nueva"] });
    container = document.createElement("div"); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root?.render(<RouterProvider router={router} />));
    expect(document.body.textContent).toContain("31 productos disponibles");
    expect(document.body.textContent).not.toContain("Vino 29");
    await tocar("Ver más productos");
    expect(document.body.textContent).toContain("Vino 29");
    const buscar = document.querySelector<HTMLInputElement>("#buscar-producto");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(buscar, "Vino 29");
      buscar?.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("1 producto disponible");
    await tocar("Vino 29");
    expect(usePreferenciasUi.getState().borradorVenta.items[0]?.productoId).toBe("extra-29");
  });

  it("confirma una sola vez ante dos toques y puede reintentar un error de escritura", async () => {
    vi.mocked(registrarVenta).mockRejectedValueOnce(new Error("Escritura interrumpida"));
    const router = createMemoryRouter([{ path: "*", element: <ToastProvider><ConfirmProvider><NuevaVentaPage /></ConfirmProvider></ToastProvider> }], { initialEntries: ["/ventas/nueva"] });
    container = document.createElement("div"); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root?.render(<RouterProvider router={router} />));
    await tocar("Malbec"); await tocar("Carrito · 1"); await tocar("Revisar y cobrar");
    await act(async () => { const confirmar = boton("Confirmar venta"); confirmar.click(); confirmar.click(); });
    expect(document.querySelectorAll('[role="alertdialog"]')).toHaveLength(1);
    await tocar("Guardar venta");
    expect(registrarVenta).toHaveBeenCalledTimes(1);
    expect(usePreferenciasUi.getState().borradorVenta.items).toHaveLength(1);
    expect(document.body.textContent).toContain("No se pudo guardar la venta");
    // Cancelar una nueva confirmación devuelve el control sin perder el borrador.
    await tocar("Confirmar venta"); await tocar("Cancelar");
    expect(boton("Confirmar venta").disabled).toBe(false);
    expect(registrarVenta).toHaveBeenCalledTimes(1);
  });

});
