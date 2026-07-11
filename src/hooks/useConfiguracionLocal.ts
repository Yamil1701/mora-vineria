import { useEffect, useState } from "react";

import { actualizarModoDispositivo, obtenerConfiguracion } from "../db";
import type { Configuracion, ModoDispositivo } from "../domain/backup";
import { actualizarDatosIniciales, leerDatosIniciales } from "../data/datosIniciales";

type EstadoConfiguracion = "cargando" | "lista" | "error";
const CONFIGURACION_ACTUALIZADA_EVENT = "mora-vineria-configuracion-actualizada";

export function useConfiguracionLocal() {
  const datosPrecargados = leerDatosIniciales(true);
  const tienePrecargaInicial = Boolean(datosPrecargados);
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(() => datosPrecargados?.configuracion ?? null);
  const [estado, setEstado] = useState<EstadoConfiguracion>(() => datosPrecargados ? "lista" : "cargando");

  async function cargarConfiguracion(mostrarCarga = true) {
    try {
      if (mostrarCarga) setEstado("cargando");
      const resultado = await obtenerConfiguracion();
      setConfiguracion(resultado ?? null);
      actualizarDatosIniciales({ configuracion: resultado ?? null });
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
    if (!tienePrecargaInicial) void cargarConfiguracion();
    const actualizar = () => void cargarConfiguracion();
    window.addEventListener(CONFIGURACION_ACTUALIZADA_EVENT, actualizar);
    return () => window.removeEventListener(CONFIGURACION_ACTUALIZADA_EVENT, actualizar);
  }, [tienePrecargaInicial]);

  return {
    configuracion,
    estado,
    cambiarModoDispositivo,
  };
}
