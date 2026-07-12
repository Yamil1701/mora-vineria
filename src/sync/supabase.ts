import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export interface ConfiguracionSupabase {
  url: string;
  publishableKey: string;
}

type EntornoSupabase = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

export function leerConfiguracionSupabase(
  entorno: EntornoSupabase,
): ConfiguracionSupabase | null {
  const url = entorno.VITE_SUPABASE_URL?.trim();
  const publishableKey = entorno.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url && !publishableKey) return null;
  if (!url || !publishableKey) {
    throw new Error("La configuración de Supabase está incompleta.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("VITE_SUPABASE_URL no es una URL válida.");
  }

  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(".supabase.co")) {
    throw new Error("VITE_SUPABASE_URL debe ser la URL HTTPS del proyecto Supabase.");
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Usá la publishable key de Supabase, no una clave secreta.");
  }

  return { url: parsedUrl.origin, publishableKey };
}

let cliente: SupabaseClient<Database> | null | undefined;

export function obtenerClienteSupabase(): SupabaseClient<Database> | null {
  if (cliente !== undefined) return cliente;

  const configuracion = leerConfiguracionSupabase(import.meta.env);
  cliente = configuracion
    ? createClient<Database>(configuracion.url, configuracion.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

  return cliente;
}

export function exigirClienteSupabase(): SupabaseClient<Database> {
  const clienteSupabase = obtenerClienteSupabase();
  if (!clienteSupabase) {
    throw new Error("Supabase todavía no está configurado en este dispositivo.");
  }
  return clienteSupabase;
}
