import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { useEnvioUnico } from "../hooks/useEnvioUnico";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("confirmación y escritura única", () => {
  it("bloquea dos acciones simultáneas y permite reintentar tras cancelación o error", async () => {
    let ejecutar: ReturnType<typeof useEnvioUnico>;
    function Prueba() { ejecutar = useEnvioUnico(); return null; }
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => root.render(<Prueba />));
    try {
      let terminar!: () => void;
      const confirmar = vi.fn(() => new Promise<void>((resolve) => { terminar = resolve; }));
      const segunda = vi.fn(async () => {});
      const primera = ejecutar!(confirmar);
      await ejecutar!(segunda);
      expect(confirmar).toHaveBeenCalledTimes(1);
      expect(segunda).not.toHaveBeenCalled();
      terminar(); // Equivale a cerrar/cancelar la confirmación.
      await primera;
      await ejecutar!(segunda);
      expect(segunda).toHaveBeenCalledTimes(1);
      await expect(ejecutar!(async () => { throw new Error("Escritura fallida"); })).rejects.toThrow("Escritura fallida");
      await ejecutar!(segunda);
      expect(segunda).toHaveBeenCalledTimes(2);
    } finally { await act(async () => root.unmount()); }
  });
});
