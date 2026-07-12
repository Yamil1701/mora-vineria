import { CONFIGURACION_ACTUALIZADA_EVENT } from "../constants";
import { actualizarModoDispositivo } from "../db/configuracion";
import {
  guardarVinculoDispositivo,
  quitarVinculoDispositivo,
} from "../db/sincronizacion";
import type {
  DispositivoRemoto,
  ModoDispositivoRemoto,
  VinculoDispositivoLocal,
} from "../domain/sincronizacion";
import {
  activarNegocioInicial,
  asegurarSesionAnonima,
  emparejarDispositivo,
  obtenerAuthUserIdActual,
  obtenerDispositivoActualRemoto,
  recuperarDispositivoPrincipal,
} from "./dispositivos";
import { exigirClienteSupabase } from "./supabase";

function ahoraIso(): string {
  return new Date().toISOString();
}

async function persistirVinculo(input: {
  authUserId: string;
  negocioId: string;
  dispositivoId: string;
  nombreDispositivo: string;
  tipo: VinculoDispositivoLocal["tipo"];
  modo: ModoDispositivoRemoto;
}): Promise<VinculoDispositivoLocal> {
  const ahora = ahoraIso();
  const vinculo: VinculoDispositivoLocal = {
    id: "vinculo-actual",
    negocioId: input.negocioId,
    dispositivoRemotoId: input.dispositivoId,
    authUserId: input.authUserId,
    nombreDispositivo: input.nombreDispositivo.trim(),
    tipo: input.tipo,
    modo: input.modo,
    estado: "activo",
    vinculadoAt: ahora,
    updatedAt: ahora,
  };

  await guardarVinculoDispositivo(vinculo);
  await actualizarModoDispositivo(input.modo === "consulta" ? "consulta" : "principal");
  window.dispatchEvent(new Event(CONFIGURACION_ACTUALIZADA_EVENT));
  window.dispatchEvent(new Event("mora-vineria-vinculo-actualizado"));
  return vinculo;
}

export async function activarYVincularNegocio(input: {
  nombreNegocio: string;
  nombreDispositivo: string;
  codigoActivacion: string;
}) {
  const authUserId = await asegurarSesionAnonima();
  const resultado = await activarNegocioInicial(input);
  const vinculo = await persistirVinculo({
    authUserId,
    negocioId: resultado.negocioId,
    dispositivoId: resultado.dispositivoId,
    nombreDispositivo: input.nombreDispositivo,
    tipo: "principal",
    modo: "operacion",
  });
  return { vinculo, codigoRecuperacion: resultado.codigoRecuperacion };
}

export async function emparejarYVincularDispositivo(input: {
  codigo: string;
  nombreDispositivo: string;
}): Promise<VinculoDispositivoLocal> {
  const authUserId = await asegurarSesionAnonima();
  const resultado = await emparejarDispositivo(input);
  return persistirVinculo({
    authUserId,
    negocioId: resultado.negocioId,
    dispositivoId: resultado.dispositivoId,
    nombreDispositivo: input.nombreDispositivo,
    tipo: resultado.tipo,
    modo: resultado.modo,
  });
}

export async function recuperarYVincularPrincipal(input: {
  codigoRecuperacion: string;
  nombreDispositivo: string;
}) {
  const authUserId = await asegurarSesionAnonima();
  const resultado = await recuperarDispositivoPrincipal(input);
  const vinculo = await persistirVinculo({
    authUserId,
    negocioId: resultado.negocioId,
    dispositivoId: resultado.dispositivoId,
    nombreDispositivo: input.nombreDispositivo,
    tipo: "principal",
    modo: "operacion",
  });
  return { vinculo, codigoRecuperacion: resultado.codigoRecuperacion };
}

export async function verificarVinculoRemoto(): Promise<{
  authUserId: string | null;
  dispositivo: DispositivoRemoto | null;
}> {
  const authUserId = await obtenerAuthUserIdActual();
  if (!authUserId) return { authUserId: null, dispositivo: null };
  return { authUserId, dispositivo: await obtenerDispositivoActualRemoto() };
}

export async function prepararNuevaVinculacion(): Promise<void> {
  const supabase = exigirClienteSupabase();
  const { data, error: errorSesion } = await supabase.auth.getSession();
  if (errorSesion) throw errorSesion;
  if (data.session) {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
  }
  await quitarVinculoDispositivo();
  window.dispatchEvent(new Event("mora-vineria-vinculo-actualizado"));
}
