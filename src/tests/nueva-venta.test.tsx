import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmProvider, ToastProvider } from "../components/ui";
import { NuevaVentaPage } from "../features/ventas/NuevaVentaPage";
import { usePreferenciasUi } from "../stores/preferenciasUi";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
    }],
    categorias: [{ id: "categoria-1", nombre: "Vinos", activa: true }],
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
});
