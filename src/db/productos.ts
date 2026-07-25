import type { ProductoFormValues } from "../schemas";
import type { Categoria, Producto } from "../domain/productos";
import { crearId } from "../utils/ids";
import { db } from "./schema";
import {
  encolarCambioCatalogoLocal,
  notificarSincronizacionPendiente,
} from "./sincronizacion";
import type { MoraVineriaDatabase } from "./schema";

export interface EstadisticasCostosProducto {
  ultimoCosto: number | null;
  costoPromedioPonderado: number | null;
  unidadesRepuestas: number;
  reposicionesConfirmadas: number;
}

export interface EstadisticasProducto extends EstadisticasCostosProducto {
  unidadesVendidas: number;
}

export interface ItemValorInventario {
  productoId: string;
  nombre: string;
  categoriaId: string;
  categoriaNombre: string;
  stockActual: number;
  costoUnitarioAplicado: number;
  valorCompra: number;
  valorVenta: number;
}

export interface CategoriaValorInventario {
  categoriaId: string;
  nombre: string;
  unidades: number;
  valorCompra: number;
  valorVenta: number;
  productos: ItemValorInventario[];
}

export interface ResumenValorInventario {
  unidades: number;
  valorCompra: number;
  valorVenta: number;
  categorias: CategoriaValorInventario[];
}

const tablasSyncProducto = [
  db.categorias,
  db.productos,
  db.vinculoDispositivo,
  db.colaSincronizacion,
  db.versionesSincronizacion,
] as const;

export async function asegurarCategoriaDisponible(
  categoriaId: string,
  base: MoraVineriaDatabase = db,
): Promise<void> {
  const categoria = await base.categorias.get(categoriaId);
  if (!categoria) {
    throw new Error("La categoría elegida ya no existe. Elegí otra antes de guardar.");
  }
  if (!categoria.activa) {
    throw new Error("La categoría elegida está inactiva. Elegí una categoría activa.");
  }
}

export async function listarCategoriasActivas(): Promise<Categoria[]> {
  const categorias = await db.categorias.orderBy("nombre").toArray();

  return categorias.filter((categoria) => categoria.activa);
}

export async function listarProductos(options?: {
  incluirInactivos?: boolean;
}): Promise<Producto[]> {
  const productos = await db.productos.orderBy("nombre").toArray();

  if (options?.incluirInactivos) {
    return productos;
  }

  return productos.filter((producto) => producto.estado === "activo");
}

export async function listarUnidadesVendidasPorProducto(
  base: MoraVineriaDatabase = db,
): Promise<Record<string, number>> {
  const ventasActivas = await base.ventas.where("estado").equals("activa").toArray();
  if (!ventasActivas.length) return {};
  const detalles = await base.detalleVentas
    .where("ventaId")
    .anyOf(ventasActivas.map((venta) => venta.id))
    .toArray();
  return detalles.reduce<Record<string, number>>((totales, detalle) => {
    totales[detalle.productoId] = (totales[detalle.productoId] ?? 0) + detalle.cantidad;
    return totales;
  }, {});
}

export async function listarUnidadesRepuestasPorProducto(
  base: MoraVineriaDatabase = db,
): Promise<Record<string, number>> {
  const reposicionesConfirmadas = await base.movimientos
    .where("tipo")
    .equals("reposicion")
    .filter((movimiento) => movimiento.estado === "activo")
    .toArray();
  if (!reposicionesConfirmadas.length) return {};
  const detalles = await base.detalleReposiciones
    .where("movimientoId")
    .anyOf(reposicionesConfirmadas.map((movimiento) => movimiento.id))
    .toArray();
  return detalles.reduce<Record<string, number>>((totales, detalle) => {
    totales[detalle.productoId] = (totales[detalle.productoId] ?? 0) + detalle.cantidad;
    return totales;
  }, {});
}

export async function obtenerEstadisticasCostosProductos(
  productoIds: string[],
  base: MoraVineriaDatabase = db,
): Promise<Map<string, EstadisticasCostosProducto>> {
  const ids = Array.from(new Set(productoIds));
  const resultado = new Map<string, EstadisticasCostosProducto>();
  for (const id of ids) {
    resultado.set(id, {
      ultimoCosto: null,
      costoPromedioPonderado: null,
      unidadesRepuestas: 0,
      reposicionesConfirmadas: 0,
    });
  }
  if (!ids.length) return resultado;

  const reposiciones = await base.movimientos
    .where("tipo")
    .equals("reposicion")
    .filter((movimiento) => movimiento.estado === "activo")
    .toArray();
  if (!reposiciones.length) return resultado;

  const detalles = await base.detalleReposiciones
    .where("movimientoId")
    .anyOf(reposiciones.map((movimiento) => movimiento.id))
    .filter((detalle) => ids.includes(detalle.productoId))
    .toArray();
  const fechaPorMovimiento = new Map(reposiciones.map((movimiento) => [
    movimiento.id,
    movimiento.confirmadoAt ?? movimiento.fechaHoraReal,
  ]));
  const movimientosPorProducto = new Map<string, Map<string, {
    unidades: number;
    total: number;
    fecha: string;
  }>>();

  for (const detalle of detalles) {
    const movimientos = movimientosPorProducto.get(detalle.productoId) ?? new Map();
    const actual = movimientos.get(detalle.movimientoId) ?? {
      unidades: 0,
      total: 0,
      fecha: fechaPorMovimiento.get(detalle.movimientoId) ?? "",
    };
    actual.unidades += detalle.cantidad;
    actual.total += detalle.subtotal;
    movimientos.set(detalle.movimientoId, actual);
    movimientosPorProducto.set(detalle.productoId, movimientos);
  }

  for (const productoId of ids) {
    const compras = Array.from(movimientosPorProducto.get(productoId)?.values() ?? []);
    const unidadesRepuestas = compras.reduce((total, compra) => total + compra.unidades, 0);
    const totalComprado = compras.reduce((total, compra) => total + compra.total, 0);
    const ultima = compras.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    resultado.set(productoId, {
      ultimoCosto: ultima && ultima.unidades > 0 ? ultima.total / ultima.unidades : null,
      costoPromedioPonderado: unidadesRepuestas > 0 ? totalComprado / unidadesRepuestas : null,
      unidadesRepuestas,
      reposicionesConfirmadas: compras.length,
    });
  }

  return resultado;
}

export async function obtenerEstadisticasProducto(
  productoId: string,
  base: MoraVineriaDatabase = db,
): Promise<EstadisticasProducto> {
  const [costos, ventas] = await Promise.all([
    obtenerEstadisticasCostosProductos([productoId], base),
    listarUnidadesVendidasPorProducto(base),
  ]);
  return {
    ...(costos.get(productoId) ?? {
      ultimoCosto: null,
      costoPromedioPonderado: null,
      unidadesRepuestas: 0,
      reposicionesConfirmadas: 0,
    }),
    unidadesVendidas: ventas[productoId] ?? 0,
  };
}

export async function obtenerResumenValorInventario(
  base: MoraVineriaDatabase = db,
): Promise<ResumenValorInventario> {
  const [productos, categorias] = await Promise.all([
    base.productos.filter((producto) => producto.stockActual > 0).toArray(),
    base.categorias.toArray(),
  ]);
  const costos = await obtenerEstadisticasCostosProductos(
    productos.map((producto) => producto.id),
    base,
  );
  const categoriasPorId = new Map(categorias.map((categoria) => [categoria.id, categoria.nombre]));
  const items = productos.map<ItemValorInventario>((producto) => {
    const costoUnitarioAplicado = costos.get(producto.id)?.costoPromedioPonderado
      ?? producto.costoCompra;
    return {
      productoId: producto.id,
      nombre: producto.nombre,
      categoriaId: producto.categoriaId,
      categoriaNombre: categoriasPorId.get(producto.categoriaId) ?? "Sin categoría",
      stockActual: producto.stockActual,
      costoUnitarioAplicado,
      valorCompra: producto.stockActual * costoUnitarioAplicado,
      valorVenta: producto.stockActual * producto.precioVenta,
    };
  });
  const categoriasAgrupadas = new Map<string, CategoriaValorInventario>();
  for (const item of items) {
    const existente = categoriasAgrupadas.get(item.categoriaId) ?? {
      categoriaId: item.categoriaId,
      nombre: item.categoriaNombre,
      unidades: 0,
      valorCompra: 0,
      valorVenta: 0,
      productos: [],
    };
    existente.unidades += item.stockActual;
    existente.valorCompra += item.valorCompra;
    existente.valorVenta += item.valorVenta;
    existente.productos.push(item);
    categoriasAgrupadas.set(item.categoriaId, existente);
  }
  const categoriasResultado = Array.from(categoriasAgrupadas.values())
    .map((categoria) => ({
      ...categoria,
      productos: categoria.productos.sort((a, b) =>
        b.valorVenta - a.valorVenta || a.nombre.localeCompare(b.nombre, "es-AR")),
    }))
    .sort((a, b) => b.valorVenta - a.valorVenta || a.nombre.localeCompare(b.nombre, "es-AR"));
  return {
    unidades: items.reduce((total, item) => total + item.stockActual, 0),
    valorCompra: items.reduce((total, item) => total + item.valorCompra, 0),
    valorVenta: items.reduce((total, item) => total + item.valorVenta, 0),
    categorias: categoriasResultado,
  };
}

export async function obtenerProducto(productoId: string): Promise<Producto | undefined> {
  return db.productos.get(productoId);
}

export async function crearProducto(values: ProductoFormValues): Promise<string> {
  const ahora = new Date().toISOString();
  const id = crearId("producto");

  const producto: Producto = {
    id,
    nombre: values.nombre,
    categoriaId: values.categoriaId,
    precioVenta: values.precioVenta,
    costoCompra: values.costoCompra,
    marca: values.marca,
    presentacion: values.presentacion,
    modoCompraHabitual: values.modoCompraHabitual,
    nombrePack: values.modoCompraHabitual === "pack" ? values.nombrePack : undefined,
    unidadesPorPack: values.modoCompraHabitual === "pack"
      ? values.unidadesPorPack
      : undefined,
    stockActual: values.stockActual,
    stockObjetivo: values.stockObjetivo,
    estado: "activo",
    observaciones: values.observaciones,
    createdAt: ahora,
    updatedAt: ahora,
    deletedAt: null,
  };

  let encolada = false;
  await db.transaction("rw", [...tablasSyncProducto], async () => {
    await asegurarCategoriaDisponible(values.categoriaId);
    await db.productos.add(producto);
    encolada = await encolarCambioCatalogoLocal({
      tipoEntidad: "producto",
      entidadId: id,
      tipoOperacion: "upsert",
      entidad: producto,
    });
  });
  if (encolada) notificarSincronizacionPendiente();

  return id;
}

export async function actualizarProducto(
  productoId: string,
  values: ProductoFormValues,
): Promise<void> {
  const producto = await db.productos.get(productoId);
  if (!producto) throw new Error("No encontramos ese producto.");
  const actualizado: Producto = {
    ...producto,
    nombre: values.nombre,
    categoriaId: values.categoriaId,
    precioVenta: values.precioVenta,
    costoCompra: values.costoCompra,
    marca: values.marca,
    presentacion: values.presentacion,
    modoCompraHabitual: values.modoCompraHabitual,
    nombrePack: values.modoCompraHabitual === "pack" ? values.nombrePack : undefined,
    unidadesPorPack: values.modoCompraHabitual === "pack"
      ? values.unidadesPorPack
      : undefined,
    stockActual: values.stockActual,
    stockObjetivo: values.stockObjetivo,
    observaciones: values.observaciones,
    updatedAt: new Date().toISOString(),
  };
  let encolada = false;
  await db.transaction("rw", [...tablasSyncProducto], async () => {
    await asegurarCategoriaDisponible(values.categoriaId);
    await db.productos.put(actualizado);
    encolada = await encolarCambioCatalogoLocal({ tipoEntidad: "producto", entidadId: productoId, tipoOperacion: "upsert", entidad: actualizado });
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function productoTieneHistorial(productoId: string): Promise<boolean> {
  const [ventas, reposiciones] = await Promise.all([
    db.detalleVentas.where("productoId").equals(productoId).count(),
    db.detalleReposiciones.where("productoId").equals(productoId).count(),
  ]);

  return ventas > 0 || reposiciones > 0;
}

export async function desactivarProducto(productoId: string): Promise<void> {
  const producto = await db.productos.get(productoId);
  if (!producto) return;
  const actualizado: Producto = {
    ...producto,
    estado: "inactivo",
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  let encolada = false;
  await db.transaction("rw", [...tablasSyncProducto], async () => {
    await db.productos.put(actualizado);
    encolada = await encolarCambioCatalogoLocal({ tipoEntidad: "producto", entidadId: productoId, tipoOperacion: "upsert", entidad: actualizado });
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function activarProducto(productoId: string): Promise<void> {
  const producto = await db.productos.get(productoId);
  if (!producto) return;
  const actualizado: Producto = {
    ...producto,
    estado: "activo",
    deletedAt: null,
    updatedAt: new Date().toISOString(),
  };
  let encolada = false;
  await db.transaction("rw", [...tablasSyncProducto], async () => {
    await db.productos.put(actualizado);
    encolada = await encolarCambioCatalogoLocal({ tipoEntidad: "producto", entidadId: productoId, tipoOperacion: "upsert", entidad: actualizado });
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function eliminarProducto(productoId: string): Promise<{
  eliminado: boolean;
  desactivado: boolean;
}> {
  const tieneHistorial = await productoTieneHistorial(productoId);

  if (tieneHistorial) {
    await desactivarProducto(productoId);

    return {
      eliminado: false,
      desactivado: true,
    };
  }

  let encolada = false;
  await db.transaction("rw", [...tablasSyncProducto], async () => {
    await db.productos.delete(productoId);
    encolada = await encolarCambioCatalogoLocal({ tipoEntidad: "producto", entidadId: productoId, tipoOperacion: "eliminar", entidad: null });
  });
  if (encolada) notificarSincronizacionPendiente();

  return {
    eliminado: true,
    desactivado: false,
  };
}
