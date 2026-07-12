import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmProvider, ToastProvider } from "../components/ui";
import { ProductoFormPage } from "../features/productos/ProductoFormPage";

const mocks = vi.hoisted(() => ({ crearProducto: vi.fn() }));

vi.mock("../db", () => ({
  actualizarProducto: vi.fn(),
  crearProducto: mocks.crearProducto,
  obtenerProducto: vi.fn(),
}));

vi.mock("../hooks/useConfiguracionLocal", () => ({
  useConfiguracionLocal: () => ({ configuracion: { deviceRole: "principal" } }),
}));

vi.mock("../hooks/useProductos", () => ({
  useProductos: () => ({
    categoriasActivas: [{ id: "categoria-1", nombre: "Vinos", activa: true, createdAt: "2026-07-12T00:00:00.000Z", updatedAt: "2026-07-12T00:00:00.000Z" }],
    cargando: false,
  }),
}));

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(async () => {
  mocks.crearProducto.mockReset();
  if (root) await act(async () => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

function cambiarInput(nombre: string, valor: string) {
  const input = container?.querySelector<HTMLInputElement>(`[name="${nombre}"]`);
  if (!input) throw new Error(`No se encontró el campo ${nombre}.`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, valor);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("formulario de productos", () => {
  it("registra una sola vez ante dos envíos consecutivos y navega sin pedir descartar cambios", async () => {
    let resolverCreacion: ((id: string) => void) | undefined;
    mocks.crearProducto.mockImplementation(() => new Promise<string>((resolve) => { resolverCreacion = resolve; }));

    const router = createMemoryRouter([
      {
        path: "/productos/nuevo",
        element: <ToastProvider><ConfirmProvider><ProductoFormPage /></ConfirmProvider></ToastProvider>,
      },
      { path: "/productos/:productoId", element: <p>Detalle del producto</p> },
    ], { initialEntries: ["/productos/nuevo"] });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root?.render(<RouterProvider router={router} />));

    await act(async () => {
      cambiarInput("nombre", "Malbec de prueba");
      cambiarInput("precioVenta", "5000");
      cambiarInput("costoCompra", "3000");
      cambiarInput("stockActual", "6");
      cambiarInput("stockObjetivo", "12");
    });

    const form = container.querySelector("form");
    if (!form) throw new Error("No se encontró el formulario.");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(mocks.crearProducto).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolverCreacion?.("producto-nuevo");
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Detalle del producto");
    expect(document.body.textContent).not.toContain("Salir sin guardar");
  });
});
