import { useEffect, useState } from "react";

import { inicializarBaseLocal } from "../db";
import { precargarDatosIniciales } from "../data/datosIniciales";

type EstadoInicializacion = "cargando" | "saliendo" | "lista" | "error";

let inicializacionEnCurso: Promise<void> | null = null;

function prepararAplicacion(): Promise<void> {
  if (inicializacionEnCurso) return inicializacionEnCurso;
  const duracionMinima = new Promise<void>((resolve) => window.setTimeout(resolve, 1800));
  inicializacionEnCurso = Promise.all([
    inicializarBaseLocal().then(() => precargarDatosIniciales()),
    duracionMinima,
  ]).then(() => undefined);
  return inicializacionEnCurso;
}

export function useInicializarBaseLocal() {
  const [estado, setEstado] = useState<EstadoInicializacion>("cargando");

  useEffect(() => {
    let activo = true;

    prepararAplicacion()
      .then(() => {
        if (!activo) return;
        const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setEstado("saliendo");
        window.setTimeout(() => {
          if (activo) setEstado("lista");
        }, reducirMovimiento ? 0 : 350);
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
