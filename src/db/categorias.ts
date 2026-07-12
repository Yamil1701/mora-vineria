import type { CategoriaFormValues } from "../schemas";
import type { Categoria } from "../domain/productos";
import { crearId } from "../utils/ids";
import { db } from "./schema";
import {
  encolarCambioCatalogoLocal,
  notificarSincronizacionPendiente,
} from "./sincronizacion";

const tablasSyncCategoria = [
  db.categorias,
  db.vinculoDispositivo,
  db.colaSincronizacion,
  db.versionesSincronizacion,
] as const;

export async function listarCategorias(options?: {
  incluirInactivas?: boolean;
}): Promise<Categoria[]> {
  const categorias = await db.categorias.orderBy("nombre").toArray();

  if (options?.incluirInactivas) {
    return categorias;
  }

  return categorias.filter((categoria) => categoria.activa);
}

async function existeCategoriaConNombre(
  nombre: string,
  categoriaIdActual?: string,
): Promise<boolean> {
  const nombreNormalizado = nombre.trim().toLocaleLowerCase("es-AR");
  const categorias = await db.categorias.toArray();

  return categorias.some((categoria) => {
    const esLaMismaCategoria = categoria.id === categoriaIdActual;
    const mismoNombre =
      categoria.nombre.trim().toLocaleLowerCase("es-AR") === nombreNormalizado;

    return !esLaMismaCategoria && mismoNombre;
  });
}

export async function crearCategoria(values: CategoriaFormValues): Promise<string> {
  const nombre = values.nombre.trim();

  if (await existeCategoriaConNombre(nombre)) {
    throw new Error("Ya existe una categoría con ese nombre.");
  }

  const ahora = new Date().toISOString();
  const id = crearId("categoria");

  const categoria: Categoria = {
    id,
    nombre,
    activa: true,
    createdAt: ahora,
    updatedAt: ahora,
  };

  let encolada = false;
  await db.transaction("rw", [...tablasSyncCategoria], async () => {
    await db.categorias.add(categoria);
    encolada = await encolarCambioCatalogoLocal({
      tipoEntidad: "categoria",
      entidadId: id,
      tipoOperacion: "upsert",
      entidad: categoria,
    });
  });
  if (encolada) notificarSincronizacionPendiente();

  return id;
}

export async function actualizarCategoria(
  categoriaId: string,
  values: CategoriaFormValues,
): Promise<void> {
  const nombre = values.nombre.trim();

  if (await existeCategoriaConNombre(nombre, categoriaId)) {
    throw new Error("Ya existe una categoría con ese nombre.");
  }

  const categoria = await db.categorias.get(categoriaId);
  if (!categoria) throw new Error("No encontramos esa categoría.");
  const actualizada: Categoria = {
    ...categoria,
    nombre,
    updatedAt: new Date().toISOString(),
  };

  let encolada = false;
  await db.transaction("rw", [...tablasSyncCategoria], async () => {
    await db.categorias.put(actualizada);
    encolada = await encolarCambioCatalogoLocal({
      tipoEntidad: "categoria",
      entidadId: categoriaId,
      tipoOperacion: "upsert",
      entidad: actualizada,
    });
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function categoriaTieneProductos(categoriaId: string): Promise<boolean> {
  const cantidadProductos = await db.productos
    .where("categoriaId")
    .equals(categoriaId)
    .count();

  return cantidadProductos > 0;
}

export async function desactivarCategoria(categoriaId: string): Promise<void> {
  const categoria = await db.categorias.get(categoriaId);
  if (!categoria) return;
  const actualizada: Categoria = {
    ...categoria,
    activa: false,
    updatedAt: new Date().toISOString(),
  };
  let encolada = false;
  await db.transaction("rw", [...tablasSyncCategoria], async () => {
    await db.categorias.put(actualizada);
    encolada = await encolarCambioCatalogoLocal({ tipoEntidad: "categoria", entidadId: categoriaId, tipoOperacion: "upsert", entidad: actualizada });
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function activarCategoria(categoriaId: string): Promise<void> {
  const categoria = await db.categorias.get(categoriaId);
  if (!categoria) return;
  const actualizada: Categoria = {
    ...categoria,
    activa: true,
    updatedAt: new Date().toISOString(),
  };
  let encolada = false;
  await db.transaction("rw", [...tablasSyncCategoria], async () => {
    await db.categorias.put(actualizada);
    encolada = await encolarCambioCatalogoLocal({ tipoEntidad: "categoria", entidadId: categoriaId, tipoOperacion: "upsert", entidad: actualizada });
  });
  if (encolada) notificarSincronizacionPendiente();
}

export async function eliminarCategoria(categoriaId: string): Promise<{
  eliminada: boolean;
  desactivada: boolean;
}> {
  const tieneProductos = await categoriaTieneProductos(categoriaId);

  if (tieneProductos) {
    await desactivarCategoria(categoriaId);

    return {
      eliminada: false,
      desactivada: true,
    };
  }

  let encolada = false;
  await db.transaction("rw", [...tablasSyncCategoria], async () => {
    await db.categorias.delete(categoriaId);
    encolada = await encolarCambioCatalogoLocal({
      tipoEntidad: "categoria",
      entidadId: categoriaId,
      tipoOperacion: "eliminar",
      entidad: null,
    });
  });
  if (encolada) notificarSincronizacionPendiente();

  return {
    eliminada: true,
    desactivada: false,
  };
}
