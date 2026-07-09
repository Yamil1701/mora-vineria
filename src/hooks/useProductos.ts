import { useCallback, useEffect, useState } from "react";

import { listarCategoriasActivas, listarProductosActivos } from "../db";
import type { Categoria, Producto } from "../domain/productos";

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const [productosActivos, categoriasActivas] = await Promise.all([
        listarProductosActivos(),
        listarCategoriasActivas(),
      ]);

      setProductos(productosActivos);
      setCategorias(categoriasActivas);
    } catch {
      setError("No se pudieron cargar los productos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  return {
    productos,
    categorias,
    cargando,
    error,
    recargar: cargarDatos,
  };
}