export type EstadoProducto = "activo" | "inactivo";

export type EstadoStock = "sin_stock" | "critico" | "bajo" | "disponible";

export type ModoCompraHabitual = "unidad" | "pack";
export type OrdenProductos = "mas_vendidos" | "stock_urgente" | "nombre";

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
  modoCompraHabitual?: ModoCompraHabitual;
  nombrePack?: string;
  unidadesPorPack?: number;
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

export function ordenarProductosPorUnidadesVendidas(
  productos: Producto[],
  unidadesVendidasPorProducto: Record<string, number>,
): Producto[] {
  return [...productos].sort((a, b) =>
    (unidadesVendidasPorProducto[b.id] ?? 0)
      - (unidadesVendidasPorProducto[a.id] ?? 0)
    || a.nombre.localeCompare(b.nombre, "es-AR"));
}

export function ordenarProductosPorUnidadesRepuestas(
  productos: Producto[],
  unidadesRepuestasPorProducto: Record<string, number>,
): Producto[] {
  return [...productos].sort((a, b) =>
    (unidadesRepuestasPorProducto[b.id] ?? 0)
      - (unidadesRepuestasPorProducto[a.id] ?? 0)
    || a.nombre.localeCompare(b.nombre, "es-AR"));
}

const prioridadStock: Record<EstadoStock, number> = {
  sin_stock: 0,
  critico: 1,
  bajo: 2,
  disponible: 3,
};

export function ordenarProductos(
  productos: Producto[],
  orden: OrdenProductos,
  unidadesVendidasPorProducto: Record<string, number>,
): Producto[] {
  if (orden === "mas_vendidos") {
    return ordenarProductosPorUnidadesVendidas(productos, unidadesVendidasPorProducto);
  }
  if (orden === "nombre") {
    return [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"));
  }
  return [...productos].sort((a, b) => {
    const estadoA = calcularEstadoStock(a.stockActual, a.stockObjetivo);
    const estadoB = calcularEstadoStock(b.stockActual, b.stockObjetivo);
    const porEstado = prioridadStock[estadoA] - prioridadStock[estadoB];
    if (porEstado !== 0) return porEstado;
    const proporcionA = a.stockObjetivo > 0 ? a.stockActual / a.stockObjetivo : 1;
    const proporcionB = b.stockObjetivo > 0 ? b.stockActual / b.stockObjetivo : 1;
    return proporcionA - proporcionB
      || a.stockActual - b.stockActual
      || a.nombre.localeCompare(b.nombre, "es-AR");
  });
}

export function calcularValorVentaStock(
  producto: Pick<Producto, "precioVenta" | "stockActual">,
): number {
  return producto.precioVenta * producto.stockActual;
}

export function obtenerModoCompraHabitual(
  producto: Pick<Producto, "modoCompraHabitual">,
): ModoCompraHabitual {
  return producto.modoCompraHabitual === "pack" ? "pack" : "unidad";
}

function pluralizarPresentacion(nombre: string): string {
  const normalizado = nombre.trim();
  if (!normalizado) return "packs";
  if (/ón$/i.test(normalizado)) return `${normalizado.slice(0, -2)}ones`;
  if (/[zZ]$/.test(normalizado)) return `${normalizado.slice(0, -1)}ces`;
  if (/[aeiouáéíóúAEIOUÁÉÍÓÚ]$/.test(normalizado)) return `${normalizado}s`;
  return `${normalizado}es`;
}

export function describirEquivalenciaEnPacks(
  producto: Pick<Producto, "stockActual" | "modoCompraHabitual" | "nombrePack" | "unidadesPorPack">,
): string | null {
  if (
    obtenerModoCompraHabitual(producto) !== "pack"
    || !producto.nombrePack?.trim()
    || !producto.unidadesPorPack
    || producto.unidadesPorPack <= 0
  ) {
    return null;
  }

  const completos = Math.floor(producto.stockActual / producto.unidadesPorPack);
  const sueltas = producto.stockActual % producto.unidadesPorPack;
  const nombre = producto.nombrePack.trim();
  const etiquetaCompletos = completos === 1 ? nombre : pluralizarPresentacion(nombre);

  if (completos === 0) return `Menos de 1 ${nombre}`;
  if (sueltas === 0) return `${completos} ${etiquetaCompletos}`;
  return `${completos} ${etiquetaCompletos} y ${sueltas} ${sueltas === 1 ? "unidad" : "unidades"}`;
}

export function calcularEstadoStock(
  stockActual: number,
  stockObjetivo: number,
  configuracion: ConfiguracionStock = {
    porcentajeStockBajo: 30,
    porcentajeStockCritico: 10,
  },
): EstadoStock {
  if (stockActual <= 0) return "sin_stock";

  if (stockObjetivo <= 0) return "disponible";

  const maximoCritico = Math.floor(
    stockObjetivo * configuracion.porcentajeStockCritico / 100,
  );
  const maximoBajo = Math.max(
    maximoCritico,
    Math.floor(stockObjetivo * configuracion.porcentajeStockBajo / 100),
  );

  if (stockActual <= maximoCritico) {
    return "critico";
  }

  if (stockActual <= maximoBajo) {
    return "bajo";
  }

  return "disponible";
}
