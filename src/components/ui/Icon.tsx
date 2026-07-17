import type { ReactNode } from "react";

export type IconName = "home" | "ventas" | "productos" | "mas" | "agregar" | "movimientos" | "tesoreria" | "reportes" | "proyecciones" | "configuracion" | "sincronizar" | "dispositivo" | "respaldo" | "exportar" | "actualizar" | "carrito" | "eliminar" | "cerrar";

const paths: Record<IconName, ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />,
  ventas: <><path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  productos: <><path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" /><path d="M4 8.5V16l8 4 8-4V8.5M12 13v7" /></>,
  mas: <><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  agregar: <path d="M12 5v14M5 12h14" />,
  movimientos: <><path d="M7 7h11M14 3l4 4-4 4M17 17H6M10 13l-4 4 4 4" /></>,
  tesoreria: <><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3M16.5 14.5h.01" /></>,
  reportes: <><path d="M5 20V10M12 20V4M19 20v-7" /><path d="M3 20h18" /></>,
  proyecciones: <><path d="m4 17 5-5 4 3 7-9" /><path d="M15 6h5v5" /></>,
  configuracion: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  sincronizar: <><path d="M20 7h-5V2" /><path d="M20 7a8 8 0 0 0-13.7-2.8L4 6.5M4 17h5v5" /><path d="M4 17a8 8 0 0 0 13.7 2.8l2.3-2.3" /></>,
  dispositivo: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10 18h4" /></>,
  respaldo: <><path d="M12 3 4.5 6v5.5c0 4.7 3.1 7.6 7.5 9.5 4.4-1.9 7.5-4.8 7.5-9.5V6L12 3Z" /><path d="M8.5 12.5 11 15l4.8-5" /></>,
  exportar: <><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" /><path d="M5 14v6h14v-6" /></>,
  actualizar: <><path d="M20 7h-5V2" /><path d="M20 7a8 8 0 1 0 1 8" /><path d="M12 8v5l3 2" /></>,
  carrito: <><path d="M3 4h2l2 11h10l2-7H7" /><circle cx="9" cy="19" r="1.2" /><circle cx="17" cy="19" r="1.2" /></>,
  eliminar: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
  cerrar: <path d="m6 6 12 12M18 6 6 18" />,
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
