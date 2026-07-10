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

  return (
    <div
      className="pdf-no-print fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-3xl border border-white/10 bg-[#1d1820] p-4 text-sm text-white shadow-xl"
      role="status"
      aria-live="polite"
    >
      <p className="font-semibold">
        {needRefresh ? "Hay una versión nueva" : "Lista para usar sin conexión"}
      </p>
      <p className="mt-1 leading-5 text-white/65">
        {needRefresh
          ? "Actualizá para usar la última versión de Mora Vinería."
          : "La app quedó preparada para abrirse más rápido y funcionar offline luego de esta carga."}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {needRefresh ? (
          <button
            type="button"
            onClick={() => void updateServiceWorker(true)}
            className="rounded-2xl bg-mora-principal px-3 py-2 text-xs font-semibold text-white"
          >
            Actualizar
          </button>
        ) : null}
        <button
          type="button"
          onClick={cerrarAviso}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
