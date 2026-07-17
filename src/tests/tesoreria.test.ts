import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import {
  configurarTesoreria,
  listarCuentasTesoreria,
  obtenerResumenTesoreria,
  registrarConteoCaja,
  registrarMovimientoTesoreriaAutomatico,
  registrarOperacionTesoreria,
  revertirMovimientosTesoreriaPorReferencia,
} from "../db/tesoreria";
import {
  anularMovimiento,
  anularVenta,
  registrarMovimiento,
  registrarVenta,
} from "../db";
import { db, MoraVineriaDatabase } from "../db/schema";

const basesCreadas: string[] = [];
const fechaBase = new Date("2026-07-16T20:00:00.000Z");

async function crearBase(): Promise<MoraVineriaDatabase> {
  const nombre = `mora-tesoreria-${crypto.randomUUID()}`;
  basesCreadas.push(nombre);
  const base = new MoraVineriaDatabase(nombre);
  await base.open();
  return base;
}

async function configurarCasoReal(base: MoraVineriaDatabase) {
  await configurarTesoreria({
    cuentas: [
      {
        nombre: "Caja",
        tipo: "efectivo",
        saldoInicial: 156_600,
        fondoCambioObjetivo: 52_400,
        esPredeterminada: true,
      },
      {
        nombre: "Brubank",
        tipo: "digital",
        saldoInicial: 87_900,
        esPredeterminada: true,
      },
    ],
  }, fechaBase, base);
  return listarCuentasTesoreria(false, base);
}

afterEach(async () => {
  await Promise.all(basesCreadas.splice(0).map((nombre) => Dexie.delete(nombre)));
});

describe("tesorería inicial", () => {
  it("registra los saldos existentes sin convertirlos en ventas", async () => {
    const base = await crearBase();
    const cuentas = await configurarCasoReal(base);

    expect(cuentas.find((cuenta) => cuenta.nombre === "Caja")?.saldo).toBe(156_600);
    expect(cuentas.find((cuenta) => cuenta.nombre === "Brubank")?.saldo).toBe(87_900);
    expect((await obtenerResumenTesoreria(fechaBase, base)).totalDisponible).toBe(244_500);
    expect(await base.ventas.count()).toBe(0);
    expect(await base.movimientosTesoreria.where("tipo").equals("saldo_inicial").count()).toBe(2);
    base.close();
  });

  it("descuenta la reposición inicial de Caja y conserva el fondo de cambio", async () => {
    const base = await crearBase();
    const cuentas = await configurarCasoReal(base);
    const caja = cuentas.find((cuenta) => cuenta.nombre === "Caja");

    await registrarMovimientoTesoreriaAutomatico({
      cuentaId: caja?.id,
      medioPago: "efectivo",
      tipo: "reposicion",
      direccion: "salida",
      monto: 104_200,
      descripcion: "Reposición inicial",
      referenciaTipo: "movimiento",
      referenciaId: "movimiento-reposicion-inicial",
      fecha: fechaBase,
    }, base);

    const cajaActualizada = (await listarCuentasTesoreria(false, base))
      .find((cuenta) => cuenta.nombre === "Caja");
    expect(cajaActualizada?.saldo).toBe(52_400);
    expect(cajaActualizada?.fondoCambioObjetivo).toBe(52_400);
    base.close();
  });
});

describe("operaciones de tesorería", () => {
  it("mueve dinero entre cuentas sin alterar el total disponible", async () => {
    const base = await crearBase();
    const cuentas = await configurarCasoReal(base);
    const caja = cuentas.find((cuenta) => cuenta.nombre === "Caja")!;
    const brubank = cuentas.find((cuenta) => cuenta.nombre === "Brubank")!;

    await registrarOperacionTesoreria({
      tipo: "transferencia",
      cuentaOrigenId: caja.id,
      cuentaDestinoId: brubank.id,
      monto: 20_000,
      descripcion: "Depósito de caja",
      registradoPor: "Yamil",
    }, fechaBase, base);

    const resumen = await obtenerResumenTesoreria(fechaBase, base);
    expect(resumen.totalDisponible).toBe(244_500);
    expect(resumen.cuentas.find((cuenta) => cuenta.id === caja.id)?.saldo).toBe(136_600);
    expect(resumen.cuentas.find((cuenta) => cuenta.id === brubank.id)?.saldo).toBe(107_900);
    expect(await base.movimientosTesoreria.where("tipo").equals("transferencia").count()).toBe(2);
    base.close();
  });

  it("exige trazabilidad y saldo suficiente para un retiro", async () => {
    const base = await crearBase();
    const caja = (await configurarCasoReal(base)).find((cuenta) => cuenta.nombre === "Caja")!;

    await expect(registrarOperacionTesoreria({
      tipo: "retiro",
      cuentaId: caja.id,
      monto: 200_000,
      descripcion: "Retiro",
      registradoPor: "Dueña",
      destinatario: "Uso personal",
    }, fechaBase, base)).rejects.toThrow("no alcanza");

    await registrarOperacionTesoreria({
      tipo: "retiro",
      cuentaId: caja.id,
      monto: 10_000,
      descripcion: "Retiro de ganancias",
      registradoPor: "Dueña",
      destinatario: "Gastos personales",
    }, fechaBase, base);
    expect(await base.movimientosTesoreria.where("tipo").equals("retiro").first())
      .toMatchObject({ registradoPor: "Dueña", destinatario: "Gastos personales" });
    base.close();
  });

  it("ajusta el saldo al dinero contado y conserva la diferencia", async () => {
    const base = await crearBase();
    const caja = (await configurarCasoReal(base)).find((cuenta) => cuenta.nombre === "Caja")!;

    const conteo = await registrarConteoCaja({
      cuentaId: caja.id,
      montoContado: 156_100,
      detalleDenominaciones: { "1000": 100, "100": 1 },
      observaciones: "Faltante al cierre",
    }, fechaBase, base);

    expect(conteo).toMatchObject({ montoEsperado: 156_600, diferencia: -500 });
    expect((await listarCuentasTesoreria(false, base))
      .find((cuenta) => cuenta.id === caja.id)?.saldo).toBe(156_100);
    expect(await base.movimientosTesoreria.get(conteo.movimientoAjusteId!))
      .toMatchObject({ tipo: "ajuste_conteo", direccion: "salida", monto: 500 });
    base.close();
  });
});

describe("automatización e historial", () => {
  it("no duplica un cobro reintentado y lo corrige mediante una reversión", async () => {
    const base = await crearBase();
    const cuentas = await configurarCasoReal(base);
    const brubank = cuentas.find((cuenta) => cuenta.nombre === "Brubank")!;
    const input = {
      cuentaId: brubank.id,
      medioPago: "transferencia" as const,
      tipo: "cobro_venta" as const,
      direccion: "entrada" as const,
      monto: 8_000,
      descripcion: "Cobro de venta",
      referenciaTipo: "cobro_venta" as const,
      referenciaId: "cobro-venta-idempotente",
      fecha: fechaBase,
    };

    const primero = await registrarMovimientoTesoreriaAutomatico(input, base);
    const segundo = await registrarMovimientoTesoreriaAutomatico(input, base);
    expect(segundo?.id).toBe(primero?.id);
    expect(await base.movimientosTesoreria.where("referenciaId").equals(input.referenciaId).count()).toBe(1);

    await revertirMovimientosTesoreriaPorReferencia({
      referenciaTipo: "cobro_venta",
      referenciaId: input.referenciaId,
      motivo: "Cobro anulado",
      fecha: new Date("2026-07-16T21:00:00.000Z"),
    }, base);
    await revertirMovimientosTesoreriaPorReferencia({
      referenciaTipo: "cobro_venta",
      referenciaId: input.referenciaId,
      motivo: "Segundo intento",
      fecha: new Date("2026-07-16T21:01:00.000Z"),
    }, base);

    expect(await base.movimientosTesoreria.where("tipo").equals("reversion").count()).toBe(1);
    expect((await listarCuentasTesoreria(false, base))
      .find((cuenta) => cuenta.id === brubank.id)?.saldo).toBe(87_900);
    base.close();
  });

  it("no omite el dinero si falta una cuenta compatible", async () => {
    const base = await crearBase();
    await configurarTesoreria({
      cuentas: [{
        nombre: "Caja",
        tipo: "efectivo",
        saldoInicial: 10_000,
        esPredeterminada: true,
      }],
    }, fechaBase, base);

    await expect(registrarMovimientoTesoreriaAutomatico({
      medioPago: "transferencia",
      tipo: "cobro_venta",
      direccion: "entrada",
      monto: 2_000,
      descripcion: "Cobro",
      referenciaTipo: "cobro_venta",
      referenciaId: "cobro-sin-cuenta-digital",
      fecha: fechaBase,
    }, base)).rejects.toThrow("cuenta digital");
    base.close();
  });
});

describe("integración con ventas y movimientos", () => {
  it("actualiza dinero y stock en la misma operación y revierte sin borrar historial", async () => {
    await db.delete();
    await db.open();
    try {
      await configurarTesoreria({
        cuentas: [{
          nombre: "Caja",
          tipo: "efectivo",
          saldoInicial: 156_600,
          fondoCambioObjetivo: 52_400,
          esPredeterminada: true,
        }],
      }, fechaBase);
      const caja = (await listarCuentasTesoreria()).find((cuenta) => cuenta.nombre === "Caja")!;
      await db.productos.add({
        id: "producto-tesoreria-1",
        nombre: "Malbec",
        categoriaId: "categoria-1",
        precioVenta: 5_000,
        costoCompra: 3_000,
        stockActual: 10,
        stockObjetivo: 20,
        estado: "activo",
        createdAt: fechaBase.toISOString(),
        updatedAt: fechaBase.toISOString(),
      });

      const ventaId = await registrarVenta({
        condicionPago: "contado",
        medioPago: "efectivo",
        cuentaTesoreriaId: caja.id,
        detalles: [{
          productoId: "producto-tesoreria-1",
          cantidad: 1,
          precioUnitarioAplicado: 5_000,
        }],
      }, fechaBase);
      expect((await listarCuentasTesoreria())[0]?.saldo).toBe(161_600);
      expect((await db.productos.get("producto-tesoreria-1"))?.stockActual).toBe(9);
      expect((await db.cobrosVentas.where("ventaId").equals(ventaId).first())?.cuentaTesoreriaId)
        .toBe(caja.id);

      const movimientoId = await registrarMovimiento({
        tipo: "reposicion",
        descripcion: "Reposición de prueba",
        monto: 5_000,
        medioPago: "efectivo",
        cuentaTesoreriaId: caja.id,
        detalles: [{ productoId: "producto-tesoreria-1", cantidad: 1, costoUnitario: 5_000 }],
      }, new Date("2026-07-16T20:10:00.000Z"));
      expect((await listarCuentasTesoreria())[0]?.saldo).toBe(156_600);
      expect((await db.productos.get("producto-tesoreria-1"))?.stockActual).toBe(10);

      await anularVenta(ventaId, { motivoAnulacion: "Prueba de reversión" }, new Date("2026-07-16T20:20:00.000Z"));
      await anularMovimiento(movimientoId, { motivoAnulacion: "Prueba de reversión" }, new Date("2026-07-16T20:30:00.000Z"));
      expect((await listarCuentasTesoreria())[0]?.saldo).toBe(156_600);
      expect((await db.productos.get("producto-tesoreria-1"))?.stockActual).toBe(10);
      expect(await db.movimientosTesoreria.where("tipo").equals("reversion").count()).toBe(2);
    } finally {
      await db.delete();
    }
  });
});
