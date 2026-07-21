import { Link } from "react-router-dom";

import { useEstadoSincronizacion } from "../hooks/useEstadoSincronizacion";
import { modoDesarrolloSinSincronizacion } from "../config/entorno";

const presentacion = {
  sincronizado: { clase: "bg-emerald-400", texto: "Datos sincronizados", breve: null },
  pendiente: { clase: "bg-amber-400", texto: "Cambios pendientes", breve: "Pendiente" },
  sincronizando: { clase: "animate-pulse bg-sky-400", texto: "Sincronizando datos", breve: null },
  sin_conexion: { clase: "border border-white/30 bg-transparent", texto: "Sin conexión", breve: "Sin conexión" },
  alerta: { clase: "bg-amber-400", texto: "Sincronización requiere atención", breve: "Revisar" },
  error: { clase: "bg-red-500", texto: "Error de sincronización", breve: "Error" },
  sin_configurar: { clase: "border border-white/30 bg-transparent", texto: "Sincronización no configurada", breve: "Sin configurar" },
} as const;

export function IndicadorSincronizacion() {
  const estado = useEstadoSincronizacion();

  if (modoDesarrolloSinSincronizacion) {
    return (
      <div
        role="status"
        className="pdf-no-print fixed z-[35] flex min-h-11 items-center gap-2 rounded-full border border-amber-300/25 bg-mora-fondo/95 px-3 text-[11px] font-semibold text-amber-100 shadow-lg backdrop-blur"
        style={{
          top: "calc(env(safe-area-inset-top) + 0.75rem)",
          right: "max(0.75rem, calc((100vw - 28rem) / 2 + 0.75rem))",
        }}
      >
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        Desarrollo · Sin sincronización
      </div>
    );
  }

  const vista = presentacion[estado.fase];
  return (
    <Link
      to="/configuracion/sincronizacion"
      aria-label={vista.texto}
      title={vista.texto}
      className={[
        "pdf-no-print fixed z-[35] flex min-h-11 items-center justify-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave",
        vista.breve
          ? "border border-white/10 bg-mora-fondo/95 px-3 shadow-lg backdrop-blur"
          : "w-11",
      ].join(" ")}
      style={{
        top: "calc(env(safe-area-inset-top) + 0.75rem)",
        right: "max(0.75rem, calc((100vw - 28rem) / 2 + 0.75rem))",
      }}
    >
      <span
        aria-hidden="true"
        className={`mora-sync-dot h-2.5 w-2.5 shrink-0 rounded-full ${vista.clase}`}
      />
      {vista.breve && <span className="text-[11px] font-semibold text-white/75">{vista.breve}</span>}
      <span className="sr-only" aria-live="polite">{vista.texto}</span>
    </Link>
  );
}
