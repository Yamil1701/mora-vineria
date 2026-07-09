import type { MedioPago } from "./domain/ventas";

export const APP_NAME = "Mora Vinería";
export const SCHEMA_VERSION = 1;

export const CATEGORIAS_INICIALES = [
  "Vinos",
  "Espumantes",
  "Cervezas",
  "Bebidas blancas",
  "Aperitivos",
  "Gaseosas",
  "Snacks",
  "Otros",
] as const;

export const MEDIOS_DE_PAGO: Array<{ value: MedioPago; label: string }> = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "otro", label: "Otro" },
];

export const CONFIGURACION_STOCK_DEFAULT = {
  porcentajeStockBajo: 20,
  porcentajeStockCritico: 10,
} as const;