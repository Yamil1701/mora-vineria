import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import type { OperacionSincronizacionLocal } from "../domain/sincronizacion";
import {
  crearContenidoQrEmparejamiento,
  leerCodigoEmparejamiento,
} from "../domain/sincronizacion";
import { MoraVineriaDatabase } from "../db/schema";
import { inicializarBaseLocal } from "../db/migrations";
import { asegurarCategoriaDisponible } from "../db/productos";
import {
  encolarCambioCatalogoLocal,
  encolarOperacionOperativaLocal,
} from "../db/sincronizacion";
import { leerConfiguracionSupabase } from "../sync/supabase";
import { leerSiteKeyTurnstile } from "../sync/turnstile";
import { loteCambiosRemotosSchema } from "../schemas/sincronizacion.schema";

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

describe("contrato remoto de sincronización", () => {
  it("normaliza campos opcionales nulos de productos después de una venta", () => {
    const resultado = loteCambiosRemotosSchema.parse({
      cursor: 12,
      hayMas: false,
      operaciones: [{
        operacionId: "operacion-venta-001",
        secuencia: 12,
        estado: "aplicada",
        cambios: [{
          tipoEntidad: "producto",
          entidadId: "producto-1",
          version: 2,
          eliminada: false,
          entidad: {
            id: "producto-1",
            nombre: "Malbec",
            categoriaId: "categoria-1",
            precioVenta: 5000,
            costoCompra: 3000,
            marca: null,
            presentacion: null,
            stockActual: 4,
            stockObjetivo: 6,
            estado: "activo",
            observaciones: null,
            createdAt: "2026-07-12T00:00:00.000Z",
            updatedAt: "2026-07-12T01:00:00.000Z",
            deletedAt: null,
          },
        }],
      }],
    });

    const cambio = resultado.operaciones[0]?.cambios[0];
    expect(cambio?.tipoEntidad).toBe("producto");
    if (cambio?.tipoEntidad !== "producto") return;
    expect(cambio.entidad).toMatchObject({
      id: "producto-1",
      stockActual: 4,
      marca: undefined,
      presentacion: undefined,
      observaciones: undefined,
    });
    expect(cambio.entidad).not.toHaveProperty("modoCompraHabitual");
  });

  it("conserva la compra habitual por pack recibida desde el catálogo remoto", () => {
    const resultado = loteCambiosRemotosSchema.parse({
      cursor: 13,
      hayMas: false,
      operaciones: [{
        operacionId: "operacion-producto-001",
        secuencia: 13,
        estado: "aplicada",
        cambios: [{
          tipoEntidad: "producto",
          entidadId: "producto-1",
          version: 3,
          eliminada: false,
          entidad: {
            id: "producto-1",
            nombre: "Quilmes",
            categoriaId: "categoria-1",
            precioVenta: 1500,
            costoCompra: 900,
            modoCompraHabitual: "pack",
            nombrePack: "cajón",
            unidadesPorPack: 10,
            stockActual: 30,
            stockObjetivo: 50,
            estado: "activo",
            createdAt: "2026-07-12T00:00:00.000Z",
            updatedAt: "2026-07-12T01:00:00.000Z",
          },
        }],
      }],
    });

    const cambio = resultado.operaciones[0]?.cambios[0];
    expect(cambio?.entidad).toMatchObject({
      modoCompraHabitual: "pack",
      nombrePack: "cajón",
      unidadesPorPack: 10,
    });
  });

  it("acepta cambios inmutables de tesorería", () => {
    const resultado = loteCambiosRemotosSchema.parse({
      cursor: 20,
      hayMas: false,
      operaciones: [{
        operacionId: "operacion-tesoreria-001",
        secuencia: 20,
        estado: "aplicada",
        cambios: [{
          tipoEntidad: "tesoreria",
          entidadId: "grupo-tesoreria-001",
          eliminada: false,
          entidad: {
            cuentas: [],
            movimientos: [{
              id: "movimiento-tesoreria-001",
              cuentaId: "cuenta-tesoreria-001",
              tipo: "cobro_venta",
              direccion: "entrada",
              monto: 5000,
            }],
            conteos: [],
          },
        }],
      }],
    });

    expect(resultado.operaciones[0]?.cambios[0]?.tipoEntidad).toBe("tesoreria");
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
      productos:
        "id, nombre, categoriaId, estado, stockActual, stockObjetivo, createdAt, updatedAt, deletedAt",
      configuracion: "id, deviceId, deviceRole, updatedAt",
    });
    await versionAnterior.table("categorias").add({
      id: "categoria-1",
      nombre: "Vinos",
      activa: true,
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    });
    await versionAnterior.table("productos").add({
      id: "producto-1",
      nombre: "Malbec",
      categoriaId: "categoria-1",
      precioVenta: 5000,
      costoCompra: 3000,
      stockActual: 4,
      stockObjetivo: 8,
      estado: "activo",
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    });
    await versionAnterior.table("configuracion").add({
      id: "app-config",
      deviceId: "device-1",
      deviceRole: "principal",
      porcentajeStockBajo: 20,
      porcentajeStockCritico: 10,
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    });
    versionAnterior.close();

    const migrada = new MoraVineriaDatabase(nombre);
    await migrada.open();

    expect(migrada.verno).toBe(6);
    expect(await migrada.categorias.get("categoria-1")).toMatchObject({ nombre: "Vinos" });
    expect(await migrada.productos.get("producto-1")).toMatchObject({
      nombre: "Malbec",
      modoCompraHabitual: "unidad",
    });
    expect(await migrada.configuracion.get("app-config")).toMatchObject({
      porcentajeStockBajo: 30,
      porcentajeStockCritico: 10,
    });
    expect(migrada.tables.map((tabla) => tabla.name)).toEqual(expect.arrayContaining([
      "vinculoDispositivo",
      "colaSincronizacion",
      "estadoSincronizacion",
      "conflictosSincronizacion",
      "versionesSincronizacion",
      "cobrosVentas",
      "diferenciasStock",
      "cuentasTesoreria",
      "movimientosTesoreria",
      "conteosCaja",
    ]));
    migrada.close();
  });

  it("no vuelve a sembrar categorías si la app ya había sido inicializada", async () => {
    const nombre = `mora-categorias-persistencia-${crypto.randomUUID()}`;
    basesCreadas.push(nombre);
    const base = new MoraVineriaDatabase(nombre);
    await base.open();
    await base.configuracion.put({
      id: "app-config",
      deviceId: "device-1",
      deviceRole: "principal",
      porcentajeStockBajo: 30,
      porcentajeStockCritico: 10,
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z",
    });

    await inicializarBaseLocal(base);

    expect(await base.categorias.count()).toBe(0);
    base.close();
  });

  it("rechaza una categoría inexistente o inactiva antes de guardar un producto", async () => {
    const nombre = `mora-categoria-producto-${crypto.randomUUID()}`;
    basesCreadas.push(nombre);
    const base = new MoraVineriaDatabase(nombre);
    await base.open();
    await base.categorias.bulkPut([
      {
        id: "categoria-activa",
        nombre: "Cervezas",
        activa: true,
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      },
      {
        id: "categoria-inactiva",
        nombre: "Anterior",
        activa: false,
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      },
    ]);

    await expect(asegurarCategoriaDisponible("categoria-inexistente", base))
      .rejects.toThrow("ya no existe");
    await expect(asegurarCategoriaDisponible("categoria-inactiva", base))
      .rejects.toThrow("está inactiva");
    await expect(asegurarCategoriaDisponible("categoria-activa", base))
      .resolves.toBeUndefined();
    base.close();
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

    await base.vinculoDispositivo.update("vinculo-actual", {
      modo: "operacion",
      estado: "revocado",
    });
    await expect(encolarOperacionOperativaLocal({
      id: "operacion-venta-003",
      tipoOperacion: "registrar",
      tipoEntidad: "venta",
      entidadId: "venta-003",
      payload: {},
      creadaAt: "2026-07-12T00:00:00.000Z",
    }, base)).rejects.toThrow("fue revocado");
    expect(await base.colaSincronizacion.get("operacion-venta-003")).toBeUndefined();
    base.close();
  });
});
