import * as Dialog from "@radix-ui/react-dialog";
import { useRegisterSW } from "virtual:pwa-register/react";

export function ActualizacionPwa() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError(error) {
      console.error("No se pudo registrar la PWA", error);
    },
  });

  if (!offlineReady && !needRefresh) return null;

  function cerrarAviso() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  if (needRefresh) {
    return (
      <Dialog.Root open onOpenChange={(abierto) => { if (!abierto) cerrarAviso(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="mora-dialog-overlay pdf-no-print fixed inset-0 z-[80] bg-black/85 backdrop-blur-md" />
          <Dialog.Content className="mora-dialog-content pdf-no-print fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-sm -translate-y-1/2 rounded-[20px] border border-mora-principal/25 bg-mora-fondo p-6 text-center text-white shadow-xl focus:outline-none">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mora-principal/15 text-3xl" aria-hidden="true">↑</span>
            <Dialog.Title className="mt-4 text-2xl font-bold">Hay una versión nueva</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-white/60">
              Actualizá Mora Vinería para continuar con la última versión disponible.
            </Dialog.Description>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => void updateServiceWorker(true)}
                className="min-h-14 rounded-2xl bg-mora-principal px-4 py-3 font-semibold text-white"
              >
                Actualizar ahora
              </button>
              <button
                type="button"
                onClick={cerrarAviso}
                className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/70"
              >
                Más tarde
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <div
      className="pdf-no-print fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-white/10 bg-mora-superficieElevada p-4 text-sm text-white shadow-xl"
      role="status"
      aria-live="polite"
    >
      <p className="font-semibold">
        Lista para usar sin conexión
      </p>
      <p className="mt-1 leading-5 text-white/65">
        La app quedó preparada para abrirse más rápido y funcionar offline luego de esta carga.
      </p>

      <div className="mt-3">
        <button
          type="button"
          onClick={cerrarAviso}
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
