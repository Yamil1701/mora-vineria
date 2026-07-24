import type { ProductoFormValues } from "../schemas";
import type { Categoria, Producto } from "../domain/productos";
import { crearId } from "../utils/ids";
import { db } from "./schema";
import {
  encolarCambioCatalogoLocal,
  notificarSincronizacionPendiente,
} from "./sincronizacion";
import type { MoraVineriaDatabase } from "./schema";

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
