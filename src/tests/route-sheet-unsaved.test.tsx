import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmProvider, RouteSheet } from "../components/ui";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function FormularioModificado() {
  useUnsavedChanges(true);
  return <p>Formulario modificado</p>;
}

describe("RouteSheet con cambios sin guardar", () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (root) act(() => root?.unmount());
    container?.remove();
    root = null;
    container = null;
    vi.useRealTimers();
  });

  it("confirma una sola vez antes de salir", async () => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const router = createMemoryRouter([
      { path: "/lista", element: <p>Listado</p> },
      {
        path: "/editar",
        element: <ConfirmProvider><RouteSheet label="Editar"><FormularioModificado /></RouteSheet></ConfirmProvider>,
      },
    ], { initialEntries: ["/lista", "/editar"] });

    await act(async () => root?.render(<RouterProvider router={router} />));
    await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));

    const salir = [...document.querySelectorAll("button")].find((boton) => boton.textContent === "Salir igualmente");
    expect(salir).toBeTruthy();
    await act(async () => salir?.click());

    await act(async () => vi.advanceTimersByTime(400));

    expect(router.state.location.pathname).toBe("/lista");
    expect(document.body.textContent).not.toContain("Salir sin guardar");
  });
});
