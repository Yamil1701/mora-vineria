import { describe, expect, it } from "vitest";

import type { VentaConDetalles } from "../db";
import { filtrarVentasHistorial, obtenerSiguienteLimiteVentas } from "../features/ventas/historialVentas";

function crearVenta(id: string, overrides: Partial<VentaConDetalles> = {}): VentaConDetalles {
  return {
    id,
    fechaHoraReal: "2026-07-21T22:00:00.000Z",
    fechaJornada: "2026-07-21",
    condicionPago: "contado",
    medioPago: "efectivo",
    total: 5_000,
    estado: "activa",
    observaciones: "",
    createdAt: "2026-07-21T22:00:00.000Z",
    updatedAt: "2026-07-21T22:00:00.000Z",
    detalles: [{
      id: `detalle-${id}`,
      ventaId: id,
      productoId: `producto-${id}`,
      cantidad: 1,
      precioUnitarioAplicado: 5_000,
      costoUnitarioAlMomento: 3_000,
      subtotal: 5_000,
      producto: {
        id: `producto-${id}`,
        categoriaId: "categoria-1",
        nombre: "Malbec Reserva",
        marca: "Bodega Norte",
        presentacion: "750 ml",
        precioVenta: 5_000,
        costoCompra: 3_000,
        stockActual: 5,
        stockObjetivo: 10,
        estado: "activo",
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    }],
    cobros: [{
      id: `cobro-${id}`,
      ventaId: id,
      fechaHoraReal: "2026-07-21T22:00:00.000Z",
      fechaJornada: "2026-07-21",
      monto: 5_000,
      medioPago: "efectivo",
      estado: "activo",
      createdAt: "2026-07-21T22:00:00.000Z",
      updatedAt: "2026-07-21T22:00:00.000Z",
    }],
    totalCobrado: 5_000,
    saldo: 0,
    ...overrides,
  };
}

const filtrosBase = {
  busqueda: "",
  periodo: "todos" as const,
  medioPago: "todos" as const,
  mostrarAnuladas: false,
  desde: "",
  hasta: "",
};

describe("filtros del historial de ventas", () => {
  it("busca por nombre, marca o presentación sin distinguir tildes", () => {
    const ventas = [crearVenta("venta-1")];

    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, busqueda: "malbec" }, "2026-07-21")).toHaveLength(1);
    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, busqueda: "bodega norte" }, "2026-07-21")).toHaveLength(1);
    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, busqueda: "750 ml" }, "2026-07-21")).toHaveLength(1);
    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, busqueda: "cabernet" }, "2026-07-21")).toHaveLength(0);
  });

  it("filtra por la fecha de jornada", () => {
    const ventas = [
      crearVenta("hoy"),
      crearVenta("semana", { fechaJornada: "2026-07-20" }),
      crearVenta("mes", { fechaJornada: "2026-07-02" }),
      crearVenta("anterior", { fechaJornada: "2026-06-30" }),
    ];

    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, periodo: "hoy" }, "2026-07-21").map((venta) => venta.id)).toEqual(["hoy"]);
    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, periodo: "semana" }, "2026-07-21").map((venta) => venta.id)).toEqual(["hoy", "semana"]);
    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, periodo: "mes" }, "2026-07-21")).toHaveLength(3);
    expect(filtrarVentasHistorial(ventas, { ...filtrosBase, periodo: "personalizado", desde: "2026-07-02", hasta: "2026-07-20" }, "2026-07-21").map((venta) => venta.id)).toEqual(["semana", "mes"]);
  });

  it("filtra por cualquier cobro activo y trata Mercado Pago histórico como transferencia", () => {
    const efectivo = crearVenta("efectivo");
    const combinado = crearVenta("combinado", { cobros: [
      { ...efectivo.cobros[0], id: "cobro-combinado-1", ventaId: "combinado", monto: 2_500 },
      { ...efectivo.cobros[0], id: "cobro-combinado-2", ventaId: "combinado", monto: 2_500, medioPago: "tarjeta" },
    ] });
    const mercadoPago = crearVenta("mercado-pago", { medioPago: "mercado_pago", cobros: [] });

    expect(filtrarVentasHistorial([efectivo, combinado, mercadoPago], { ...filtrosBase, medioPago: "tarjeta" }, "2026-07-21").map((venta) => venta.id)).toEqual(["combinado"]);
    expect(filtrarVentasHistorial([efectivo, combinado, mercadoPago], { ...filtrosBase, medioPago: "transferencia" }, "2026-07-21").map((venta) => venta.id)).toEqual(["mercado-pago"]);
  });

  it("mantiene Anuladas como filtro exclusivo", () => {
    const activa = crearVenta("activa");
    const anulada = crearVenta("anulada", { estado: "anulada" });

    expect(filtrarVentasHistorial([activa, anulada], filtrosBase, "2026-07-21").map((venta) => venta.id)).toEqual(["activa"]);
    expect(filtrarVentasHistorial([activa, anulada], { ...filtrosBase, mostrarAnuladas: true }, "2026-07-21").map((venta) => venta.id)).toEqual(["anulada"]);
  });
});

describe("paginación del historial de ventas", () => {
  it("avanza de quince en quince sin superar el total", () => {
    expect(obtenerSiguienteLimiteVentas(15, 44)).toBe(30);
    expect(obtenerSiguienteLimiteVentas(30, 44)).toBe(44);
  });
});
