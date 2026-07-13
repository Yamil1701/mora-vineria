import { useCallback, useEffect, useState } from "react";

import {
  guardarVinculoDispositivo,
  obtenerVinculoDispositivo,
} from "../db/sincronizacion";
import type { VinculoDispositivoLocal } from "../domain/sincronizacion";
import { obtenerClienteSupabase } from "../sync/supabase";
import { verificarVinculoRemoto } from "../sync/vinculacion";

export type EstadoVinculoDispositivo =
  | "cargando"
  | "sin_configuracion"
  | "sin_vinculo"
  | "vinculado"
  | "sesion_perdida"
  | "revocado"
  | "error";

export function useVinculoDispositivo() {
  const [estado, setEstado] = useState<EstadoVinculoDispositivo>("cargando");
  const [vinculo, setVinculo] = useState<VinculoDispositivoLocal | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setMensajeError(null);

    try {
      const cliente = obtenerClienteSupabase();
      if (!cliente) {
        setVinculo(await obtenerVinculoDispositivo() ?? null);
        setEstado("sin_configuracion");
        return;
      }

      const local = await obtenerVinculoDispositivo();
      if (!navigator.onLine) {
        setVinculo(local ?? null);
        setEstado(!local ? "sin_vinculo" : local.estado === "revocado" ? "revocado" : "vinculado");
        return;
      }

      const remoto = await verificarVinculoRemoto();
      if (!remoto.authUserId) {
        setVinculo(local ?? null);
        setEstado(local ? "sesion_perdida" : "sin_vinculo");
        return;
      }
      if (!remoto.dispositivo) {
        const revocado = local ? {
          ...local,
          estado: "revocado" as const,
          updatedAt: new Date().toISOString(),
        } : null;
        if (revocado) await guardarVinculoDispositivo(revocado);
        setVinculo(revocado);
        setEstado(local ? "revocado" : "sin_vinculo");
        return;
      }

      const ahora = new Date().toISOString();
      const actualizado: VinculoDispositivoLocal = {
        id: "vinculo-actual",
        negocioId: remoto.dispositivo.negocioId,
        dispositivoRemotoId: remoto.dispositivo.id,
        authUserId: remoto.authUserId,
        nombreDispositivo: remoto.dispositivo.nombre,
        tipo: remoto.dispositivo.tipo,
        modo: remoto.dispositivo.modo,
        estado: remoto.dispositivo.estado,
        vinculadoAt: local?.vinculadoAt ?? remoto.dispositivo.creadoAt,
        updatedAt: ahora,
      };
      await guardarVinculoDispositivo(actualizado);
      setVinculo(actualizado);
      setEstado("vinculado");
    } catch (error) {
      const local = await obtenerVinculoDispositivo() ?? null;
      setVinculo(local);
      setMensajeError(error instanceof Error ? error.message : "No se pudo revisar el dispositivo.");
      setEstado(local?.estado === "revocado" ? "revocado" : "error");
    }
  }, []);

  useEffect(() => {
    void cargar();
    const actualizar = () => void cargar();
    const alVolver = () => {
      if (document.visibilityState === "visible") actualizar();
    };
    const intervalo = window.setInterval(actualizar, 45_000);
    window.addEventListener("online", actualizar);
    window.addEventListener("focus", actualizar);
    window.addEventListener("visibilitychange", alVolver);
    window.addEventListener("mora-vineria-vinculo-actualizado", actualizar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("online", actualizar);
      window.removeEventListener("focus", actualizar);
      window.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("mora-vineria-vinculo-actualizado", actualizar);
    };
  }, [cargar]);

  return { estado, vinculo, mensajeError, refrescar: cargar };
}
