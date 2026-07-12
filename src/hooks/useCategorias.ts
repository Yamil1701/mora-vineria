import { useCallback, useEffect, useState } from "react";

import { listarCategorias } from "../db";
import type { Categoria } from "../domain/productos";
import { DATOS_CATALOGO_ACTUALIZADOS_EVENT } from "../constants";

export function useCategorias(incluirInactivas = false) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarCategorias = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
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
    const actualizar = () => void cargarCategorias(true);
    window.addEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
    return () => window.removeEventListener(DATOS_CATALOGO_ACTUALIZADOS_EVENT, actualizar);
  }, [cargarCategorias]);

  return {
    categorias,
    cargando,
    error,
    recargar: cargarCategorias,
  };
}
