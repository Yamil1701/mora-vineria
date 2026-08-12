import { Link } from "react-router-dom";

import { StatusDot } from "./ui";
import { useEstadoSincronizacion } from "../hooks/useEstadoSincronizacion";
import { modoDesarrolloSinSincronizacion } from "../config/entorno";

const presentacion = {
  sincronizado: { tone: "exito", pulse: false, texto: "Datos sincronizados", breve: null },
  pendiente: { tone: "advertencia", pulse: false, texto: "Cambios pendientes", breve: "Pendiente" },
  sincronizando: { tone: "info", pulse: true, texto: "Sincronizando datos", breve: null },
  sin_conexion: { tone: "neutral", pulse: false, texto: "Sin conexión", breve: "Sin conexión" },
  alerta: { tone: "advertencia", pulse: false, texto: "Sincronización requiere atención", breve: "Revisar" },
  error: { tone: "error", pulse: false, texto: "Error de sincronización", breve: "Error" },
  sin_configurar: { tone: "neutral", pulse: false, texto: "Sincronización no configurada", breve: "Sin configurar" },
} as const;

export function IndicadorSincronizacion({ conSidebar = false }: { conSidebar?: boolean }) {
  const estado = useEstadoSincronizacion();
  const clasePosicion = `mora-sync-indicator${conSidebar ? " mora-sync-indicator--sidebar" : ""}`;

  if (modoDesarrolloSinSincronizacion) {
    return (
      <div
        role="status"
        className={`pdf-no-print fixed z-[35] flex min-h-12 items-center gap-2 rounded-full border border-amber-300/25 bg-mora-fondo/95 px-3 text-[11px] font-semibold text-amber-100 shadow-lg backdrop-blur ${clasePosicion}`}
      >
        <StatusDot tone="advertencia" />
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
        `pdf-no-print fixed z-[35] flex min-h-12 items-center justify-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave ${clasePosicion}`,
        vista.breve
          ? "border border-white/10 bg-mora-fondo/95 px-3 shadow-lg backdrop-blur"
          : "w-12",
      ].join(" ")}
    >
      <StatusDot tone={vista.tone} pulse={vista.pulse} />
      {vista.breve && <span className="text-[11px] font-semibold text-white/75">{vista.breve}</span>}
      <span className="sr-only" aria-live="polite">{vista.texto}</span>
    </Link>
  );
}
