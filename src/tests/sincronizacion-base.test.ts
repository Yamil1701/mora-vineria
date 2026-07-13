import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import type { OperacionSincronizacionLocal } from "../domain/sincronizacion";
import {
  crearContenidoQrEmparejamiento,
  leerCodigoEmparejamiento,
} from "../domain/sincronizacion";
import { MoraVineriaDatabase } from "../db/schema";
import {
  encolarCambioCatalogoLocal,
  encolarOperacionOperativaLocal,
} from "../db/sincronizacion";
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

describe("migraciones Dexie de sincronización", () => {
  it("conserva datos v1 y agrega la metadata de sincronización del catálogo", async () => {
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

    expect(migrada.verno).toBe(4);
    expect(await migrada.categorias.get("categoria-1")).toMatchObject({ nombre: "Vinos" });
    expect(migrada.tables.map((tabla) => tabla.name)).toEqual(expect.arrayContaining([
      "vinculoDispositivo",
      "colaSincronizacion",
      "estadoSincronizacion",
      "conflictosSincronizacion",
      "versionesSincronizacion",
      "cobrosVentas",
      "diferenciasStock",
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

  it("compacta ediciones locales consecutivas antes del primer push", async () => {
    const nombre = `mora-sync-compact-${crypto.randomUUID()}`;
    basesCreadas.push(nombre);
    const base = new MoraVineriaDatabase(nombre);
    await base.open();
    await base.vinculoDispositivo.put({
      id: "vinculo-actual",
      negocioId: "negocio-1",
      dispositivoRemotoId: "dispositivo-1",
      authUserId: "auth-1",
      nombreDispositivo: "Celular",
      tipo: "principal",
      modo: "operacion",
      estado: "activo",
      vinculadoAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    });

    await base.transaction("rw", [base.colaSincronizacion, base.vinculoDispositivo, base.versionesSincronizacion], async () => {
      await encolarCambioCatalogoLocal({
        tipoEntidad: "categoria",
        entidadId: "categoria-1",
        tipoOperacion: "upsert",
        entidad: { id: "categoria-1", nombre: "Vinos" },
      }, base);
      await encolarCambioCatalogoLocal({
        tipoEntidad: "categoria",
        entidadId: "categoria-1",
        tipoOperacion: "upsert",
        entidad: { id: "categoria-1", nombre: "Vinos tintos" },
      }, base);
    });

    const operaciones = await base.colaSincronizacion.toArray();
    expect(operaciones).toHaveLength(1);
    expect(operaciones[0]?.payload).toEqual({
      baseVersion: 0,
      entidad: { id: "categoria-1", nombre: "Vinos tintos" },
    });
    base.close();
  });

  it("encola una operación real solo en un dispositivo autorizado para operar", async () => {
    const nombre = `mora-sync-operativa-${crypto.randomUUID()}`;
    basesCreadas.push(nombre);
    const base = new MoraVineriaDatabase(nombre);
    await base.open();
    await base.vinculoDispositivo.put({
      id: "vinculo-actual",
      negocioId: "negocio-1",
      dispositivoRemotoId: "dispositivo-1",
      authUserId: "auth-1",
      nombreDispositivo: "Caja",
      tipo: "principal",
      modo: "operacion",
      estado: "activo",
      vinculadoAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    });

    await base.transaction("rw", [base.vinculoDispositivo, base.colaSincronizacion], async () => {
      expect(await encolarOperacionOperativaLocal({
        id: "operacion-venta-001",
        tipoOperacion: "registrar",
        tipoEntidad: "venta",
        entidadId: "venta-001",
        payload: { venta: { id: "venta-001" }, detalles: [] },
        creadaAt: "2026-07-12T00:00:00.000Z",
      }, base)).toBe(true);
    });

    expect(await base.colaSincronizacion.get("operacion-venta-001")).toMatchObject({
      negocioId: "negocio-1",
      tipoEntidad: "venta",
      estado: "pendiente",
    });
    await base.vinculoDispositivo.update("vinculo-actual", { modo: "consulta" });
    expect(await encolarOperacionOperativaLocal({
      id: "operacion-venta-002",
      tipoOperacion: "registrar",
      tipoEntidad: "venta",
      entidadId: "venta-002",
      payload: {},
      creadaAt: "2026-07-12T00:00:00.000Z",
    }, base)).toBe(false);
    base.close();
  });
});
