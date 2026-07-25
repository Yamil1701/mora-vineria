import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  actualizarReposicionPendiente,
  anularMovimiento,
  confirmarReposicion,
  obtenerEstadisticasCostosProductos,
  registrarMovimiento,
  registrarVenta,
} from "../db";
import { db } from "../db/schema";

const fecha = new Date("2026-07-25T12:00:00.000Z");
const productoId = "producto-reposicion-pendiente";

beforeEach(async () => {
  await db.delete();
  await db.open();
  await db.productos.add({
    id: productoId,
    nombre: "Malbec",
    categoriaId: "categoria-vinos",
    precioVenta: 8_000,
    costoCompra: 4_000,
    stockActual: 5,
    stockObjetivo: 20,
    estado: "activo",
    createdAt: fecha.toISOString(),
    updatedAt: fecha.toISOString(),
  });
});

afterEach(async () => {
  await db.delete();
});

describe("reposiciones pendientes", () => {
  it("permite corregir lo recibido y recién impacta al confirmar", async () => {
    const movimientoId = await registrarMovimiento({
      tipo: "reposicion",
      descripcion: "Pedido al proveedor",
      monto: 12_000,
      detalles: [{
        productoId,
        cantidad: 3,
        costoUnitario: 4_000,
        subtotal: 12_000,
      }],
    }, fecha);

    expect((await db.movimientos.get(movimientoId))?.estado).toBe("pendiente");
    expect((await db.productos.get(productoId))?.stockActual).toBe(5);

    await actualizarReposicionPendiente(movimientoId, {
      tipo: "reposicion",
      descripcion: "Pedido recibido parcialmente",
      monto: 10_000,
      detalles: [{
        productoId,
        cantidad: 2,
        costoUnitario: 5_000,
        subtotal: 10_000,
      }],
    }, new Date("2026-07-25T12:30:00.000Z"));
    expect((await db.productos.get(productoId))?.stockActual).toBe(5);

    await confirmarReposicion(movimientoId, new Date("2026-07-25T13:00:00.000Z"));
    expect((await db.movimientos.get(movimientoId))).toMatchObject({
      estado: "activo",
      confirmadoAt: "2026-07-25T13:00:00.000Z",
    });
    expect((await db.productos.get(productoId))?.stockActual).toBe(7);
  });

  it("anula una pendiente sin alterar stock ni crear un costo histórico", async () => {
    const movimientoId = await registrarMovimiento({
      tipo: "reposicion",
      descripcion: "Pedido cancelado",
      monto: 8_000,
      detalles: [{
        productoId,
        cantidad: 2,
        costoUnitario: 4_000,
        subtotal: 8_000,
      }],
    }, fecha);

    await anularMovimiento(
      movimientoId,
      { motivoAnulacion: "El proveedor no entregó" },
      new Date("2026-07-25T12:20:00.000Z"),
    );

    expect((await db.productos.get(productoId))?.stockActual).toBe(5);
    expect((await obtenerEstadisticasCostosProductos([productoId])).get(productoId))
      .toMatchObject({
        ultimoCosto: null,
        costoPromedioPonderado: null,
        unidadesRepuestas: 0,
        reposicionesConfirmadas: 0,
      });
  });

  it("calcula último costo, promedio ponderado y lo congela en ventas futuras", async () => {
    const primera = await registrarMovimiento({
      tipo: "reposicion",
      descripcion: "Primera compra",
      monto: 12_000,
      detalles: [{
        productoId,
        cantidad: 3,
        costoUnitario: 4_000,
        subtotal: 12_000,
      }],
    }, fecha);
    await confirmarReposicion(primera, new Date("2026-07-25T13:00:00.000Z"));

    const segunda = await registrarMovimiento({
      tipo: "reposicion",
      descripcion: "Segunda compra",
      monto: 12_000,
      detalles: [{
        productoId,
        cantidad: 2,
        costoUnitario: 6_000,
        subtotal: 12_000,
      }],
    }, new Date("2026-07-25T14:00:00.000Z"));
    await confirmarReposicion(segunda, new Date("2026-07-25T15:00:00.000Z"));

    const estadisticas = (await obtenerEstadisticasCostosProductos([productoId]))
      .get(productoId);
    expect(estadisticas).toMatchObject({
      ultimoCosto: 6_000,
      costoPromedioPonderado: 4_800,
      unidadesRepuestas: 5,
      reposicionesConfirmadas: 2,
    });

    const ventaId = await registrarVenta({
      condicionPago: "fiado",
      clienteFiadoNombre: "Cliente de prueba",
      detalles: [{
        productoId,
        cantidad: 1,
        precioUnitarioAplicado: 8_000,
      }],
    }, new Date("2026-07-25T16:00:00.000Z"));
    expect((await db.detalleVentas.where("ventaId").equals(ventaId).first())
      ?.costoUnitarioAlMomento).toBe(4_800);
  });
});
