import type { ProductoFormValues } from "../schemas";
import type { Categoria, Producto } from "../domain/productos";
import { crearId } from "../utils/ids";
import { db } from "./schema";

export async function listarCategoriasActivas(): Promise<Categoria[]> {
  const categorias = await db.categorias.orderBy("nombre").toArray();

  return categorias.filter((categoria) => categoria.activa);
}

export async function listarProductosActivos(): Promise<Producto[]> {
  return db.productos.where("estado").equals("activo").sortBy("nombre");
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