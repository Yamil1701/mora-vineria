import { obtenerMensajeConexion } from "../domain/pwa";
import { useEstadoConexion } from "../hooks/useEstadoConexion";

export function EstadoConexionBanner() {
  const enLinea = useEstadoConexion();

  if (enLinea) return null;

  return (
    <div
      className="pdf-no-print fixed inset-x-3 top-3 z-50 mx-auto max-w-md rounded-2xl border border-mora-advertencia/40 bg-[#2b210d] px-4 py-3 text-sm font-medium text-yellow-100 shadow-xl"
      role="status"
      aria-live="polite"
    >
      {obtenerMensajeConexion(enLinea)}
    </div>
  );
}
