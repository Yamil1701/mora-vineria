import { MEDIOS_DE_PAGO } from "../../constants";

export function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString("es-AR")}`;
}

export function formatearFechaVenta(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaIso));
}

export function obtenerMedioPagoLabel(value?: string): string {
  if (!value) return "Sin cobro inicial";
  if (value === "mercado_pago") return "Transferencia · Mercado Pago";
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

export function formatearFechaSimple(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${fecha}T12:00:00`));
}

export function obtenerDestinoTransferenciaLabel(value?: string): string | undefined {
  return ({ mercado_pago: "Mercado Pago", brubank: "Brubank", naranja_x: "Naranja X", otro: "Otro" } as Record<string, string>)[value ?? ""];
}
