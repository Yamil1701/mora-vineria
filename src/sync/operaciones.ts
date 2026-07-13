import type {
  ConflictoCatalogoRemoto,
  DiferenciaStockLocal,
  OperacionSincronizacionLocal,
  ResultadoOperacionRemota,
} from "../domain/sincronizacion";
import {
  diferenciaStockSchema,
  resultadoOperacionRemotaSchema,
} from "../schemas/sincronizacion.schema";
import type { Json } from "./database.types";
import { exigirClienteSupabase } from "./supabase";

function comoJson(valor: unknown): Json {
  return JSON.parse(JSON.stringify(valor)) as Json;
}

export async function enviarOperacionesOperativas(
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
  const { data, error } = await exigirClienteSupabase().rpc("aplicar_operaciones_operativas", {
    p_operaciones: comoJson(lote),
  });
  if (error) throw new Error(error.message);
  return resultadoOperacionRemotaSchema.array().parse(data);
}

export async function listarDiferenciasStockRemotas(): Promise<DiferenciaStockLocal[]> {
  const { data, error } = await exigirClienteSupabase().rpc("listar_diferencias_stock");
  if (error) throw new Error(error.message);
  return diferenciaStockSchema.array().parse(data);
}

export async function resolverDiferenciaStockRemota(input: {
  diferenciaId: string;
  stockContado: number;
  nota?: string;
}): Promise<ResultadoOperacionRemota> {
  const { data, error } = await exigirClienteSupabase().rpc("resolver_diferencia_stock", {
    p_diferencia_id: input.diferenciaId,
    p_stock_contado: input.stockContado,
    p_nota: input.nota,
  });
  if (error) throw new Error(error.message);
  return resultadoOperacionRemotaSchema.parse(data);
}

export async function listarConflictosOperativosRemotos(): Promise<ConflictoCatalogoRemoto[]> {
  const { data, error } = await exigirClienteSupabase()
    .from("conflictos_sincronizacion")
    .select("id, tipo, tipo_entidad, entidad_id, detalle, creado_at")
    .eq("estado", "pendiente")
    .not("tipo_entidad", "in", '("categoria","producto")')
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

export async function resolverConflictoOperativoRemoto(
  conflictoId: string,
): Promise<ResultadoOperacionRemota> {
  const { data, error } = await exigirClienteSupabase().rpc("resolver_conflicto_operativo", {
    p_conflicto_id: conflictoId,
  });
  if (error) throw new Error(error.message);
  return resultadoOperacionRemotaSchema.parse(data);
}
