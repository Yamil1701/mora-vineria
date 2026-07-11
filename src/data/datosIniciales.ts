import {
  listarCategorias,
  listarProductos,
  obtenerConfiguracion,
  obtenerResumenesDashboard,
  type ResumenesDashboard,
} from "../db";
import type { Configuracion } from "../domain/backup";
import type { Categoria, Producto } from "../domain/productos";

export interface DatosIniciales {
  configuracion: Configuracion | null;
  resumenes: ResumenesDashboard;
  productos: Producto[];
  categorias: Categoria[];
}

let datosIniciales: DatosIniciales | null = null;
let cargaEnCurso: Promise<DatosIniciales> | null = null;
let precargadosAt = 0;
const VIGENCIA_PRECARGA_MS = 2500;

export function leerDatosIniciales(permitirVencidos = false): DatosIniciales | null {
  if (!permitirVencidos && Date.now() - precargadosAt > VIGENCIA_PRECARGA_MS) return null;
  return datosIniciales;
}

export function actualizarDatosIniciales(cambios: Partial<DatosIniciales>): void {
  if (!datosIniciales) return;
  datosIniciales = { ...datosIniciales, ...cambios };
}

export function precargarDatosIniciales(): Promise<DatosIniciales> {
  if (datosIniciales) return Promise.resolve(datosIniciales);
  if (cargaEnCurso) return cargaEnCurso;

  cargaEnCurso = Promise.all([
    obtenerConfiguracion(),
    obtenerResumenesDashboard(),
    listarProductos(),
    listarCategorias({ incluirInactivas: true }),
  ]).then(([configuracion, resumenes, productos, categorias]) => {
    datosIniciales = {
      configuracion: configuracion ?? null,
      resumenes,
      productos,
      categorias,
    };
    precargadosAt = Date.now();
    return datosIniciales;
  }).finally(() => {
    cargaEnCurso = null;
  });

  return cargaEnCurso;
}
