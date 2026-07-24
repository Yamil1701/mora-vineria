import {
  CATEGORIAS_INICIALES,
  CONFIGURACION_ID,
  CONFIGURACION_STOCK_DEFAULT,
  DEVICE_ID_STORAGE_KEY,
} from "../constants";
import type { Configuracion } from "../domain/backup";
import type { Categoria } from "../domain/productos";
import { crearId } from "../utils/ids";
import { db, type MoraVineriaDatabase } from "./schema";

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

export async function inicializarBaseLocal(
  base: MoraVineriaDatabase = db,
): Promise<void> {
  const ahora = new Date().toISOString();

  await base.transaction("rw", base.categorias, base.configuracion, async () => {
    const configuracionExistente = await base.configuracion.get(CONFIGURACION_ID);
    const esPrimeraInicializacion = !configuracionExistente;

    if (!configuracionExistente) {
      await base.configuracion.add(crearConfiguracionInicial(ahora));
    }

    const cantidadCategorias = await base.categorias.count();

    if (esPrimeraInicializacion && cantidadCategorias === 0) {
      const categoriasIniciales = CATEGORIAS_INICIALES.map((nombre) =>
        crearCategoriaInicial(nombre, ahora),
      );

      await base.categorias.bulkAdd(categoriasIniciales);
    }
  });
}
