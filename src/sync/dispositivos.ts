import type { ZodType } from "zod";

import type {
  DispositivoRemoto,
  ModoDispositivoRemoto,
  ResultadoActivacionNegocio,
  ResultadoCodigoEmparejamiento,
  ResultadoEmparejamiento,
} from "../domain/sincronizacion";
import {
  dispositivoRemotoSchema,
  resultadoActivacionNegocioSchema,
  resultadoCodigoEmparejamientoSchema,
  resultadoEmparejamientoSchema,
} from "../schemas";
import type { Database } from "./database.types";
import { exigirClienteSupabase } from "./supabase";

type NombreRpcDispositivos = keyof Database["public"]["Functions"];

async function asegurarSesionAnonima(): Promise<string> {
  const supabase = exigirClienteSupabase();
  const { data: sesionActual, error: errorSesion } = await supabase.auth.getSession();
  if (errorSesion) throw errorSesion;
  if (sesionActual.session?.user.id) return sesionActual.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user?.id) throw new Error("Supabase no devolvió una identidad para el dispositivo.");
  return data.user.id;
}

async function ejecutarRpc<T>(
  nombre: NombreRpcDispositivos,
  parametros: Record<string, unknown>,
  schema: ZodType<T>,
): Promise<T> {
  const supabase = exigirClienteSupabase();
  const { data, error } = await supabase.rpc(nombre, parametros);
  if (error) throw new Error(error.message);
  return schema.parse(data);
}

export async function activarNegocioInicial(input: {
  nombreNegocio: string;
  nombreDispositivo: string;
  codigoActivacion: string;
}): Promise<ResultadoActivacionNegocio> {
  await asegurarSesionAnonima();
  const resultado = await ejecutarRpc(
    "activar_negocio_inicial",
    {
      p_nombre_negocio: input.nombreNegocio,
      p_nombre_dispositivo: input.nombreDispositivo,
      p_codigo_activacion: input.codigoActivacion,
    },
    resultadoActivacionNegocioSchema,
  );

  return {
    negocioId: resultado.negocio_id,
    dispositivoId: resultado.dispositivo_id,
    codigoRecuperacion: resultado.codigo_recuperacion,
  };
}

export async function generarCodigoEmparejamiento(
  modo: ModoDispositivoRemoto,
): Promise<ResultadoCodigoEmparejamiento> {
  const resultado = await ejecutarRpc(
    "generar_codigo_emparejamiento",
    { p_modo: modo },
    resultadoCodigoEmparejamientoSchema,
  );
  return { codigo: resultado.codigo, venceAt: resultado.vence_at, modo: resultado.modo };
}

export async function emparejarDispositivo(input: {
  codigo: string;
  nombreDispositivo: string;
}): Promise<ResultadoEmparejamiento> {
  await asegurarSesionAnonima();
  const resultado = await ejecutarRpc(
    "emparejar_dispositivo",
    { p_codigo: input.codigo, p_nombre_dispositivo: input.nombreDispositivo },
    resultadoEmparejamientoSchema,
  );
  return {
    negocioId: resultado.negocio_id,
    dispositivoId: resultado.dispositivo_id,
    tipo: resultado.tipo,
    modo: resultado.modo,
  };
}

export async function recuperarDispositivoPrincipal(input: {
  codigoRecuperacion: string;
  nombreDispositivo: string;
}): Promise<ResultadoActivacionNegocio> {
  await asegurarSesionAnonima();
  const resultado = await ejecutarRpc(
    "recuperar_dispositivo_principal",
    {
      p_codigo_recuperacion: input.codigoRecuperacion,
      p_nombre_dispositivo: input.nombreDispositivo,
    },
    resultadoActivacionNegocioSchema,
  );
  return {
    negocioId: resultado.negocio_id,
    dispositivoId: resultado.dispositivo_id,
    codigoRecuperacion: resultado.codigo_recuperacion,
  };
}

export async function listarDispositivosRemotos(): Promise<DispositivoRemoto[]> {
  const supabase = exigirClienteSupabase();
  const { data, error } = await supabase
    .from("dispositivos")
    .select("id, negocio_id, nombre, tipo, modo, estado, creado_at, ultima_actividad_at")
    .order("creado_at");
  if (error) throw new Error(error.message);

  return dispositivoRemotoSchema.array().parse(data).map((dispositivo) => ({
    id: dispositivo.id,
    negocioId: dispositivo.negocio_id,
    nombre: dispositivo.nombre,
    tipo: dispositivo.tipo,
    modo: dispositivo.modo,
    estado: dispositivo.estado,
    creadoAt: dispositivo.creado_at,
    ultimaActividadAt: dispositivo.ultima_actividad_at,
  }));
}

export async function revocarDispositivo(dispositivoId: string): Promise<void> {
  await ejecutarRpc("revocar_dispositivo", { p_dispositivo_id: dispositivoId }, dispositivoRemotoSchema.nullable());
}

export async function transferirDispositivoPrincipal(dispositivoId: string): Promise<void> {
  await ejecutarRpc("transferir_dispositivo_principal", { p_dispositivo_id: dispositivoId }, dispositivoRemotoSchema.nullable());
}
