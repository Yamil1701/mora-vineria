import { useCallback, useEffect, useState } from "react";

import { listarCategorias, listarProductos } from "../db";
import type { Categoria, Producto } from "../domain/productos";
import { actualizarDatosIniciales, leerDatosIniciales } from "../data/datosIniciales";
import { DATOS_CATALOGO_ACTUALIZADOS_EVENT } from "../constants";

export function useProductos(incluirInactivos = false) {
  const datosPrecargados = incluirInactivos ? null : leerDatosIniciales();
  const tienePrecargaInicial = Boolean(datosPrecargados);
  const [productos, setProductos] = useState<Producto[]>(() => datosPrecargados?.productos ?? []);
  const [categorias, setCategorias] = useState<Categoria[]>(() => datosPrecargados?.categorias ?? []);
  const [categoriasActivas, setCategoriasActivas] = useState<Categoria[]>(() => datosPrecargados?.categorias.filter((categoria) => categoria.activa) ?? []);
  const [cargando, setCargando] = useState(() => !datosPrecargados);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      setError(null);

      const [productosResultado, categoriasResultado] = await Promise.all([
        listarProductos({ incluirInactivos }),
        listarCategorias({ incluirInactivas: true }),
      ]);

      setProductos(productosResultado);
      setCategorias(categoriasResultado);
      setCategoriasActivas(
        categoriasResultado.filter((categoria) => categoria.activa),
      );
      if (!incluirInactivos) actualizarDatosIniciales({ productos: productosResultado, categorias: categoriasResultado });
    } catch {
      setError("No se pudieron cargar los productos.");
    } finally {
      setCargando(false);
    }
  }, [incluirInactivos]);

  useEffect(() => {
    if (!tienePrecargaInicial) void cargarDatos();
    const actualizar = () => void cargarDatos(true);
    window.addEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
    return () => window.removeEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
  }, [cargarDatos, tienePrecargaInicial]);

  return {
    productos,
    categorias,
    categoriasActivas,
    cargando,
    error,
    recargar: cargarDatos,
  };
}
