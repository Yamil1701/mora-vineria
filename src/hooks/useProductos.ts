import { useCallback, useEffect, useState } from "react";

import { listarCategoriasActivas, listarProductos } from "../db";
import type { Categoria, Producto } from "../domain/productos";

export function useProductos(incluirInactivos = false) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const [productosResultado, categoriasActivas] = await Promise.all([
        listarProductos({ incluirInactivos }),
        listarCategoriasActivas(),
      ]);

      setProductos(productosResultado);
      setCategorias(categoriasActivas);
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
    cargando,
    error,
    recargar: cargarDatos,
  };
}