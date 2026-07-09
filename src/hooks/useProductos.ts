import { useCallback, useEffect, useState } from "react";

import { listarCategorias, listarProductos } from "../db";
import type { Categoria, Producto } from "../domain/productos";

export function useProductos(incluirInactivos = false) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasActivas, setCategoriasActivas] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
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
    } catch {
      setError("No se pudieron cargar los productos.");
    } finally {
      setCargando(false);
    }
  }, [incluirInactivos]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  return {
    productos,
    categorias,
    categoriasActivas,
    cargando,
    error,
    recargar: cargarDatos,
  };
}