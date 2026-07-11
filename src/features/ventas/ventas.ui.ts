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

export function obtenerMedioPagoLabel(value: string): string {
  if (value === "mercado_pago") return "Transferencia · Mercado Pago";
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

export function obtenerDestinoTransferenciaLabel(value?: string): string | undefined {
  return ({ mercado_pago: "Mercado Pago", brubank: "Brubank", naranja_x: "Naranja X", otro: "Otro" } as Record<string, string>)[value ?? ""];
}
