import type { RealtimeChannel } from "@supabase/supabase-js";

import type {
  ConflictoCatalogoRemoto,
  LoteCambiosRemotos,
  OperacionSincronizacionLocal,
  ResultadoOperacionRemota,
  SnapshotCatalogoRemoto,
} from "../domain/sincronizacion";
import {
  loteCambiosRemotosSchema,
  resultadoOperacionRemotaSchema,
  snapshotCatalogoRemotoSchema,
} from "../schemas/sincronizacion.schema";
import type { Json } from "./database.types";
import { exigirClienteSupabase } from "./supabase";

function comoJson(valor: unknown): Json {
  return JSON.parse(JSON.stringify(valor)) as Json;
}

export async function obtenerSnapshotCatalogoRemoto(): Promise<SnapshotCatalogoRemoto> {
  const { data, error } = await exigirClienteSupabase().rpc("obtener_snapshot_catalogo");
  if (error) throw new Error(error.message);
  return snapshotCatalogoRemotoSchema.parse(data);
}

export async function inicializarCatalogoRemoto(input: {
  operacionId: string;
  categorias: unknown[];
  productos: unknown[];
}): Promise<SnapshotCatalogoRemoto> {
  const { data, error } = await exigirClienteSupabase().rpc("inicializar_catalogo", {
    p_operacion_id: input.operacionId,
    p_categorias: comoJson(input.categorias),
    p_productos: comoJson(input.productos),
  });
  if (error) throw new Error(error.message);
  return snapshotCatalogoRemotoSchema.parse(data);
}

export async function enviarOperacionesCatalogo(
  operaciones: OperacionSincronizacionLocal[],
): Promise<ResultadoOperacionRemota[]> {
  const lote = operaciones.map((operacion) => ({
    id: operacion.id,
    tipoOperacion: operacion.tipoOperacion,
    tipoEntidad: operacion.tipoEntidad,
    entidadId: operacion.entidadId,
    payload: operacion.payload,
    creadaAt: operacion.creadaAt,
  }));
  const { data, error } = await exigirClienteSupabase().rpc(
    "aplicar_operaciones_catalogo",
    { p_operaciones: comoJson(lote) },
  );
  if (error) throw new Error(error.message);
  return resultadoOperacionRemotaSchema.array().parse(data);
}

export async function obtenerCambiosCatalogo(
  cursor: number,
  limite = 100,
): Promise<LoteCambiosRemotos> {
  const { data, error } = await exigirClienteSupabase().rpc("obtener_cambios_catalogo", {
    p_cursor: cursor,
    p_limite: limite,
  });
  if (error) throw new Error(error.message);
  return loteCambiosRemotosSchema.parse(data);
}

export function suscribirAvisosCatalogo(
  negocioId: string,
  alCambiar: () => void,
): RealtimeChannel {
  return exigirClienteSupabase()
    .channel(`catalogo-${negocioId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "operaciones_sincronizacion",
        filter: `negocio_id=eq.${negocioId}`,
      },
      alCambiar,
    )
    .subscribe();
}

export async function quitarSuscripcionCatalogo(canal: RealtimeChannel): Promise<void> {
  await exigirClienteSupabase().removeChannel(canal);
}

export async function listarConflictosCatalogoRemotos(): Promise<ConflictoCatalogoRemoto[]> {
  const { data, error } = await exigirClienteSupabase()
    .from("conflictos_sincronizacion")
    .select("id, tipo, tipo_entidad, entidad_id, detalle, creado_at")
    .eq("estado", "pendiente")
    .in("tipo_entidad", ["categoria", "producto"])
    .order("creado_at");
  if (error) throw new Error(error.message);
  return data.map((conflicto) => ({
    id: conflicto.id,
    tipo: conflicto.tipo,
    tipoEntidad: conflicto.tipo_entidad,
    entidadId: conflicto.entidad_id,
    detalle: conflicto.detalle,
    creadoAt: conflicto.creado_at,
  }));
}

export async function resolverConflictoCatalogo(
  conflictoId: string,
  resolucion: "local" | "remoto",
): Promise<void> {
  const { data, error } = await exigirClienteSupabase().rpc("resolver_conflicto_catalogo", {
    p_conflicto_id: conflictoId,
    p_resolucion: resolucion,
  });
  if (error) throw new Error(error.message);
  const estado = (data as { estado?: unknown } | null)?.estado;
  if (estado !== "resuelto") {
    throw new Error("El conflicto todavía no pudo resolverse.");
  }
}
