import { useEffect, useState } from "react";

import { inicializarBaseLocal } from "../db";
import { precargarDatosIniciales } from "../data/datosIniciales";

export type EstadoInicializacion =
  | "marca"
  | "marca_saliendo"
  | "cargando"
  | "cargando_saliendo"
  | "lista"
  | "error";

let inicializacionEnCurso: Promise<void> | null = null;

function prepararAplicacion(): Promise<void> {
  if (inicializacionEnCurso) return inicializacionEnCurso;
  const preparacion = inicializarBaseLocal()
    .then(() => precargarDatosIniciales())
    .then(() => undefined);
  inicializacionEnCurso = preparacion;
  return preparacion;
}

export function useInicializarBaseLocal() {
  const [estado, setEstado] = useState<EstadoInicializacion>("marca");

  useEffect(() => {
    let activo = true;
    let marcaLista = false;
    let datosListos = false;
    let errorInicializacion = false;
    let estadoVisual: "marca" | "cargando" = "marca";
    let salidaId: number | undefined;
    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function continuar() {
      if (!activo || !marcaLista) return;

      if (errorInicializacion) {
        setEstado("error");
        return;
      }

      if (!datosListos) {
        estadoVisual = "cargando";
        setEstado("cargando");
        return;
      }

      setEstado(estadoVisual === "marca" ? "marca_saliendo" : "cargando_saliendo");
      salidaId = window.setTimeout(() => {
        if (activo) setEstado("lista");
      }, reducirMovimiento ? 0 : 300);
    }

    prepararAplicacion()
      .then(() => {
        datosListos = true;
        continuar();
      })
      .catch((error) => {
        console.error("No se pudo inicializar la base local", error);
        errorInicializacion = true;
        continuar();
      });

    const marcaId = window.setTimeout(() => {
      marcaLista = true;
      continuar();
    }, reducirMovimiento ? 0 : 850);

    return () => {
      activo = false;
      window.clearTimeout(marcaId);
      if (salidaId !== undefined) window.clearTimeout(salidaId);
    };
  }, []);

  return estado;
}
