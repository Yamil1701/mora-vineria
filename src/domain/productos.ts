export type EstadoProducto = "activo" | "inactivo";

export type EstadoStock = "sin_stock" | "critico" | "bajo" | "disponible";

export interface Categoria {
  id: string;
  nombre: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoriaId: string;
  precioVenta: number;
  costoCompra: number;
  marca?: string;
  presentacion?: string;
  stockActual: number;
  stockObjetivo: number;
  estado: EstadoProducto;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ConfiguracionStock {
  porcentajeStockBajo: number;
  porcentajeStockCritico: number;
}

export function calcularEstadoStock(
  stockActual: number,
  stockObjetivo: number,
  configuracion: ConfiguracionStock = {
    porcentajeStockBajo: 20,
    porcentajeStockCritico: 10,
  },
): EstadoStock {
  if (stockActual <= 0) return "sin_stock";

  if (stockObjetivo <= 0) return "disponible";

  const porcentajeActual = (stockActual / stockObjetivo) * 100;

  if (porcentajeActual <= configuracion.porcentajeStockCritico) {
    return "critico";
  }

  if (porcentajeActual <= configuracion.porcentajeStockBajo) {
    return "bajo";
  }

  return "disponible";
}