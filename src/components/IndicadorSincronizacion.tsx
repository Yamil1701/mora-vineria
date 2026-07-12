import { useEstadoSincronizacion } from "../hooks/useEstadoSincronizacion";

const presentacion = {
  sincronizado: { clase: "bg-emerald-400", texto: "Datos sincronizados" },
  pendiente: { clase: "bg-amber-400", texto: "Cambios pendientes" },
  sincronizando: { clase: "animate-pulse bg-sky-400", texto: "Sincronizando datos" },
  sin_conexion: { clase: "border border-white/30 bg-transparent", texto: "Sin conexión" },
  alerta: { clase: "bg-amber-400", texto: "Sincronización requiere atención" },
  error: { clase: "bg-red-500", texto: "Error de sincronización" },
  sin_configurar: { clase: "hidden", texto: "Sincronización no configurada" },
} as const;

export function IndicadorSincronizacion() {
  const estado = useEstadoSincronizacion();
  const vista = presentacion[estado.fase];
  return (
    <span
      role="status"
      aria-label={vista.texto}
      title={vista.texto}
      className={`absolute right-1 top-0 h-2.5 w-2.5 rounded-full shadow-[0_0_0_2px_#121014] ${vista.clase}`}
    />
  );
}
