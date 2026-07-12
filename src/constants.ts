import type { MedioPago } from "./domain/ventas";

export const APP_NAME = "Mora Vinería";
export const SCHEMA_VERSION = 1;

export const CONFIGURACION_ID = "app-config";
export const DEVICE_ID_STORAGE_KEY = "mora-vineria-device-id";
export const CONFIGURACION_ACTUALIZADA_EVENT = "mora-vineria-configuracion-actualizada";
export const SINCRONIZACION_PENDIENTE_EVENT = "mora-vineria-sincronizacion-pendiente";
export const ESTADO_SINCRONIZACION_EVENT = "mora-vineria-estado-sincronizacion";
export const DATOS_CATALOGO_ACTUALIZADOS_EVENT = "mora-vineria-catalogo-actualizado";

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
  { value: "otro", label: "Otro" },
];

export const DESTINOS_TRANSFERENCIA = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "brubank", label: "Brubank" },
  { value: "naranja_x", label: "Naranja X" },
  { value: "otro", label: "Otro" },
] as const;

export const CONFIGURACION_STOCK_DEFAULT = {
  porcentajeStockBajo: 20,
  porcentajeStockCritico: 10,
} as const;
