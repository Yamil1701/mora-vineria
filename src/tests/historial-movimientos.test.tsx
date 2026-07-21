import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Movimiento } from "../domain/movimientos";
import { MovimientosPage } from "../features/movimientos/MovimientosPage";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const movimientos: Movimiento[] = [
  ...Array.from({ length: 16 }, (_, indice): Movimiento => ({
    id: `activo-${indice + 1}`,
    fechaHoraReal: `2026-07-21T${String(20 - Math.floor(indice / 4)).padStart(2, "0")}:00:00.000Z`,
    fechaJornada: "2026-07-21",
    tipo: "reposicion",
    descripcion: `Movimiento activo ${indice + 1}`,
    monto: 1_000 + indice,
    estado: "activo",
    createdAt: "2026-07-21T20:00:00.000Z",
    updatedAt: "2026-07-21T20:00:00.000Z",
  })),
  {
    id: "anulado-1",
    fechaHoraReal: "2026-07-20T20:00:00.000Z",
    fechaJornada: "2026-07-20",
    tipo: "gasto_puntual",
    descripcion: "Movimiento anulado",
    monto: 500,
    estado: "anulado",
    createdAt: "2026-07-20T20:00:00.000Z",
    updatedAt: "2026-07-20T21:00:00.000Z",
    anuladoAt: "2026-07-20T21:00:00.000Z",
  },
];

vi.mock("../hooks/useMovimientos", () => ({
  useMovimientos: () => ({ movimientos, cargando: false, error: null, recargar: vi.fn() }),
}));
vi.mock("../hooks/useConfiguracionLocal", () => ({
  useConfiguracionLocal: () => ({ configuracion: { deviceRole: "principal" } }),
}));
vi.mock("../hooks/useRestaurarScroll", () => ({ useRestaurarScroll: vi.fn() }));

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function renderizar() {
  const router = createMemoryRouter([{ path: "/movimientos", element: <MovimientosPage /> }], {
    initialEntries: ["/movimientos"],
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root?.render(<RouterProvider router={router} />));
}

async function tocar(texto: string) {
  const boton = [...document.querySelectorAll<HTMLButtonElement>("button")]
    .find((elemento) => elemento.textContent?.includes(texto));
  if (!boton) throw new Error(`No se encontró el botón ${texto}.`);
  await act(async () => boton.click());
}

function tarjetasDelHistorial() {
  return document.querySelector('[aria-label="Historial de movimientos"]')
    ?.querySelectorAll('a[href^="/movimientos/"]') ?? [];
}

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  container?.remove();
  document.body.querySelectorAll("[data-radix-portal]").forEach((elemento) => elemento.remove());
  root = null;
  container = null;
});

describe("historial de movimientos", () => {
  it("revela los movimientos activos manualmente de quince en quince", async () => {
    await renderizar();

    expect(tarjetasDelHistorial()).toHaveLength(15);
    expect(document.body.textContent).toContain("Ver más movimientos");
    expect(document.body.textContent).not.toContain("Movimiento activo 16");
    expect(document.body.textContent).not.toContain("Movimiento anulado");

    await tocar("Ver más movimientos");

    expect(tarjetasDelHistorial()).toHaveLength(16);
    expect(document.body.textContent).toContain("Movimiento activo 16");
    expect(document.body.textContent).not.toContain("Ver más movimientos");
  });

  it("muestra los anulados de forma exclusiva", async () => {
    await renderizar();

    await tocar("Filtros");
    await tocar("Anulados");

    expect(document.body.textContent).toContain("Movimiento anulado");
    expect(document.body.textContent).not.toContain("Movimiento activo 1");
    expect(tarjetasDelHistorial()).toHaveLength(1);
  });
});
