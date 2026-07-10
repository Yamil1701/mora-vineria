import { useEffect, useState } from "react";

import { actualizarModoDispositivo, obtenerConfiguracion } from "../db";
import type { Configuracion, ModoDispositivo } from "../domain/backup";

type EstadoConfiguracion = "cargando" | "lista" | "error";

export function useConfiguracionLocal() {
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [estado, setEstado] = useState<EstadoConfiguracion>("cargando");

  async function cargarConfiguracion() {
    try {
      setEstado("cargando");
      const resultado = await obtenerConfiguracion();
      setConfiguracion(resultado ?? null);
      setEstado("lista");
    } catch {
      setEstado("error");
    }
  }

  async function cambiarModoDispositivo(deviceRole: ModoDispositivo) {
    await actualizarModoDispositivo(deviceRole);
    await cargarConfiguracion();
  }

  useEffect(() => {
    void cargarConfiguracion();
  }, []);

  return {
    configuracion,
    estado,
    cambiarModoDispositivo,
  };
}
