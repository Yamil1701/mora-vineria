import { useEffect, useState } from "react";

import { actualizarModoDispositivo, obtenerConfiguracion } from "../db";
import type { Configuracion, ModoDispositivo } from "../domain/backup";

type EstadoConfiguracion = "cargando" | "lista" | "error";
const CONFIGURACION_ACTUALIZADA_EVENT = "mora-vineria-configuracion-actualizada";

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
    window.dispatchEvent(new Event(CONFIGURACION_ACTUALIZADA_EVENT));
  }

  useEffect(() => {
    void cargarConfiguracion();
    const actualizar = () => void cargarConfiguracion();
    window.addEventListener(CONFIGURACION_ACTUALIZADA_EVENT, actualizar);
    return () => window.removeEventListener(CONFIGURACION_ACTUALIZADA_EVENT, actualizar);
  }, []);

  return {
    configuracion,
    estado,
    cambiarModoDispositivo,
  };
}
