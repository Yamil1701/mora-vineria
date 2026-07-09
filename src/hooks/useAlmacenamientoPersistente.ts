import { useEffect, useState } from "react";

import {
  consultarAlmacenamientoPersistente,
  solicitarAlmacenamientoPersistente,
  type EstadoAlmacenamientoPersistente,
} from "../utils/almacenamientoPersistente";

export function useAlmacenamientoPersistente() {
  const [estado, setEstado] =
    useState<EstadoAlmacenamientoPersistente>("pendiente");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    consultarAlmacenamientoPersistente()
      .then((resultado) => {
        if (activo) setEstado(resultado);
      })
      .catch(() => {
        if (activo) setEstado("error");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  async function solicitar() {
    setCargando(true);

    const resultado = await solicitarAlmacenamientoPersistente();

    setEstado(resultado);
    setCargando(false);
  }

  return {
    estado,
    cargando,
    solicitar,
  };
}