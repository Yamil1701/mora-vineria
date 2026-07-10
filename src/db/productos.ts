import type { ProductoFormValues } from "../schemas";
import type { Categoria, Producto } from "../domain/productos";
import { crearId } from "../utils/ids";
import { db } from "./schema";

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
    stockActual: values.stockActual,
    stockObjetivo: values.stockObjetivo,
    estado: "activo",
    observaciones: values.observaciones,
    createdAt: ahora,
    updatedAt: ahora,
    deletedAt: null,
  };

  await db.productos.add(producto);

  return id;
}

export async function actualizarProducto(
  productoId: string,
  values: ProductoFormValues,
): Promise<void> {
  await db.productos.update(productoId, {
    nombre: values.nombre,
    categoriaId: values.categoriaId,
    precioVenta: values.precioVenta,
    costoCompra: values.costoCompra,
    marca: values.marca,
    presentacion: values.presentacion,
    stockActual: values.stockActual,
    stockObjetivo: values.stockObjetivo,
    observaciones: values.observaciones,
    updatedAt: new Date().toISOString(),
  });
}

export async function productoTieneHistorial(productoId: string): Promise<boolean> {
  const [ventas, reposiciones] = await Promise.all([
    db.detalleVentas.where("productoId").equals(productoId).count(),
    db.detalleReposiciones.where("productoId").equals(productoId).count(),
  ]);

  return ventas > 0 || reposiciones > 0;
}

export async function desactivarProducto(productoId: string): Promise<void> {
  await db.productos.update(productoId, {
    estado: "inactivo",
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function activarProducto(productoId: string): Promise<void> {
  await db.productos.update(productoId, {
    estado: "activo",
    deletedAt: null,
    updatedAt: new Date().toISOString(),
  });
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

  await db.productos.delete(productoId);

  return {
    eliminado: true,
    desactivado: false,
  };
}
