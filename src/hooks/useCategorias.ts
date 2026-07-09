import { useCallback, useEffect, useState } from "react";

import { listarCategorias } from "../db";
import type { Categoria } from "../domain/productos";

export function useCategorias(incluirInactivas = false) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarCategorias = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const resultado = await listarCategorias({ incluirInactivas });
      setCategorias(resultado);
    } catch {
      setError("No se pudieron cargar las categorías.");
    } finally {
      setCargando(false);
    }
  }, [incluirInactivas]);

  useEffect(() => {
    void cargarCategorias();
  }, [cargarCategorias]);

  return {
    categorias,
    cargando,
    error,
    recargar: cargarCategorias,
  };
}
