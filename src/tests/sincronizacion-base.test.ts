import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import type { OperacionSincronizacionLocal } from "../domain/sincronizacion";
import {
  crearContenidoQrEmparejamiento,
  leerCodigoEmparejamiento,
} from "../domain/sincronizacion";
import { MoraVineriaDatabase } from "../db/schema";
import { leerConfiguracionSupabase } from "../sync/supabase";
import { leerSiteKeyTurnstile } from "../sync/turnstile";

const basesCreadas: string[] = [];

afterEach(async () => {
  await Promise.all(basesCreadas.splice(0).map((nombre) => Dexie.delete(nombre)));
});

describe("configuración pública de Supabase", () => {
  it("permite que la app siga funcionando cuando no hay variables", () => {
    expect(leerConfiguracionSupabase({})).toBeNull();
  });

  it("acepta únicamente URL de proyecto y publishable key", () => {
    expect(leerConfiguracionSupabase({
      VITE_SUPABASE_URL: "https://proyecto.supabase.co/",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_prueba",
    })).toEqual({
      url: "https://proyecto.supabase.co",
      publishableKey: "sb_publishable_prueba",
    });

    expect(() => leerConfiguracionSupabase({
      VITE_SUPABASE_URL: "https://proyecto.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_no_debe_entrar",
    })).toThrow("publishable key");
  });

  it("rechaza una configuración parcial", () => {
    expect(() => leerConfiguracionSupabase({
      VITE_SUPABASE_URL: "https://proyecto.supabase.co",
    })).toThrow("incompleta");
  });
});

describe("configuración pública de Turnstile", () => {
  it("acepta una site key y permite detectar una configuración ausente", () => {
    expect(leerSiteKeyTurnstile({})).toBeNull();
    expect(leerSiteKeyTurnstile({ VITE_TURNSTILE_SITE_KEY: "  site-key-publica  " }))
      .toBe("site-key-publica");
  });
});

describe("QR de emparejamiento", () => {
  const codigo = "0123456789abcdef0123456789abcdef0123";

  it("transporta únicamente un código válido y admite el ingreso manual", () => {
    const contenido = crearContenidoQrEmparejamiento(codigo);
    expect(contenido).toBe(`mora-vineria:emparejar:${codigo}`);
    expect(leerCodigoEmparejamiento(contenido)).toBe(codigo);
    expect(leerCodigoEmparejamiento(codigo.toUpperCase())).toBe(codigo);
  });

  it("rechaza códigos ajenos, incompletos o con contenido adicional", () => {
    expect(leerCodigoEmparejamiento("https://ejemplo.com")).toBeNull();
    expect(leerCodigoEmparejamiento("0123")).toBeNull();
    expect(() => crearContenidoQrEmparejamiento("no-es-un-codigo")).toThrow("no es válido");
  });
});

describe("migración Dexie v2", () => {
  it("conserva datos v1 y agrega las tablas locales de sincronización", async () => {
    const nombre = `mora-sync-test-${crypto.randomUUID()}`;
    basesCreadas.push(nombre);

    const versionAnterior = new Dexie(nombre);
    versionAnterior.version(1).stores({
      categorias: "id, nombre, activa, createdAt, updatedAt",
    });
    await versionAnterior.table("categorias").add({
      id: "categoria-1",
      nombre: "Vinos",
      activa: true,
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    });
    versionAnterior.close();

    const migrada = new MoraVineriaDatabase(nombre);
    await migrada.open();

    expect(migrada.verno).toBe(2);
    expect(await migrada.categorias.get("categoria-1")).toMatchObject({ nombre: "Vinos" });
    expect(migrada.tables.map((tabla) => tabla.name)).toEqual(expect.arrayContaining([
      "vinculoDispositivo",
      "colaSincronizacion",
      "estadoSincronizacion",
      "conflictosSincronizacion",
    ]));
    migrada.close();
  });

  it("impide encolar dos veces el mismo identificador idempotente", async () => {
    const nombre = `mora-sync-test-${crypto.randomUUID()}`;
    basesCreadas.push(nombre);
    const base = new MoraVineriaDatabase(nombre);
    await base.open();

    const operacion: OperacionSincronizacionLocal = {
      id: "operacion-device-1-001",
      negocioId: "negocio-1",
      dispositivoId: "device-1",
      tipoOperacion: "crear",
      tipoEntidad: "producto",
      entidadId: "producto-1",
      payload: { nombre: "Malbec" },
      estado: "pendiente",
      intentos: 0,
      creadaAt: "2026-07-12T00:00:00.000Z",
      actualizadaAt: "2026-07-12T00:00:00.000Z",
    };

    await base.colaSincronizacion.add(operacion);
    await expect(base.colaSincronizacion.add(operacion)).rejects.toBeDefined();
    expect(await base.colaSincronizacion.count()).toBe(1);
    base.close();
  });
});
