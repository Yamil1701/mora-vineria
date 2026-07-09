import { useEffect, useState } from "react";

import { inicializarBaseLocal } from "../db";

type EstadoInicializacion = "cargando" | "lista" | "error";

export function useInicializarBaseLocal() {
  const [estado, setEstado] = useState<EstadoInicializacion>("cargando");

  useEffect(() => {
    let activo = true;

    inicializarBaseLocal()
      .then(() => {
        if (activo) setEstado("lista");
      })
      .catch((error) => {
        console.error("No se pudo inicializar la base local", error);
        if (activo) setEstado("error");
      });

    return () => {
      activo = false;
    };
  }, []);

  return estado;
}