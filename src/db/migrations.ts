import {
  CATEGORIAS_INICIALES,
  CONFIGURACION_ID,
  CONFIGURACION_STOCK_DEFAULT,
  DEVICE_ID_STORAGE_KEY,
} from "../constants";
import type { Configuracion } from "../domain/backup";
import type { Categoria } from "../domain/productos";
import { crearId } from "../utils/ids";
import { db } from "./schema";

function obtenerDeviceId(): string {
  const existente = localStorage.getItem(DEVICE_ID_STORAGE_KEY);

  if (existente) {
    return existente;
  }

  const nuevoDeviceId = crearId("device");
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, nuevoDeviceId);

  return nuevoDeviceId;
}

function crearCategoriaInicial(nombre: string, ahora: string): Categoria {
  return {
    id: crearId("categoria"),
    nombre,
    activa: true,
    createdAt: ahora,
    updatedAt: ahora,
  };
}

function crearConfiguracionInicial(ahora: string): Configuracion {
  return {
    id: CONFIGURACION_ID,
    deviceId: obtenerDeviceId(),
    deviceRole: "principal",
    porcentajeStockBajo: CONFIGURACION_STOCK_DEFAULT.porcentajeStockBajo,
    porcentajeStockCritico: CONFIGURACION_STOCK_DEFAULT.porcentajeStockCritico,
    createdAt: ahora,
    updatedAt: ahora,
  };
}

export async function inicializarBaseLocal(): Promise<void> {
  const ahora = new Date().toISOString();

  await db.transaction("rw", db.categorias, db.configuracion, async () => {
    const configuracionExistente = await db.configuracion.get(CONFIGURACION_ID);

    if (!configuracionExistente) {
      await db.configuracion.add(crearConfiguracionInicial(ahora));
    }

    const cantidadCategorias = await db.categorias.count();

    if (cantidadCategorias === 0) {
      const categoriasIniciales = CATEGORIAS_INICIALES.map((nombre) =>
        crearCategoriaInicial(nombre, ahora),
      );

      await db.categorias.bulkAdd(categoriasIniciales);
    }
  });
}