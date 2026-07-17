import type { Producto } from "../domain/productos";
import {
  calcularStockLuegoDeAnularVenta,
  calcularSaldoVenta,
  calcularSubtotalDetalleVenta,
  calcularTotalVenta,
  type CobroVenta,
  type DetalleVenta,
  type Venta,
} from "../domain/ventas";
import {
  anulacionVentaSchema,
  anulacionCobroVentaSchema,
  cobroVentaFormSchema,
  type AnulacionCobroVentaValues,
  type AnulacionVentaValues,
  type CobroVentaFormValues,
  type VentaFormValues,
  ventaFormSchema,
} from "../schemas";
import { crearId } from "../utils/ids";
import { calcularFechaJornada } from "../utils/jornadaVenta";
import { db } from "./schema";
import {
  encolarOperacionOperativaLocal,
  notificarSincronizacionPendiente,
} from "./sincronizacion";
import {
  registrarMovimientoTesoreriaAutomatico,
  revertirMovimientosTesoreriaPorReferencia,
} from "./tesoreria";

export interface DetalleVentaConProducto extends DetalleVenta {
  producto?: Producto;
}

export interface VentaConDetalles extends Venta {
  detalles: DetalleVentaConProducto[];
  cobros: CobroVenta[];
  totalCobrado: number;
  saldo: number;
}

function obtenerVentaValidada(values: VentaFormValues): VentaFormValues {
  const resultado = ventaFormSchema.safeParse(values);

  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Revisá los datos de la venta.");
  }

  return resultado.data;
}

function obtenerAnulacionValidada(values: AnulacionVentaValues): AnulacionVentaValues {
  const resultado = anulacionVentaSchema.safeParse(values);

  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Indicá el motivo de anulación.");
  }

  return resultado.data;
}

function obtenerCobroValidado(values: CobroVentaFormValues): CobroVentaFormValues {
  const resultado = cobroVentaFormSchema.safeParse(values);
  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Revisá los datos del cobro.");
  }
  return resultado.data;
}

function obtenerAnulacionCobroValidada(
  values: AnulacionCobroVentaValues,
): AnulacionCobroVentaValues {
  const resultado = anulacionCobroVentaSchema.safeParse(values);
  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Indicá el motivo de anulación.");
  }
  return resultado.data;
}

function calcularCantidadesPorProducto(
  detalles: Array<Pick<DetalleVenta, "productoId" | "cantidad">>,
) {
  const cantidades = new Map<string, number>();

  for (const detalle of detalles) {
    cantidades.set(
      detalle.productoId,
      (cantidades.get(detalle.productoId) ?? 0) + detalle.cantidad,
    );
  }

  return cantidades;
}

export async function registrarVenta(
  values: VentaFormValues,
  fecha: Date = new Date(),
): Promise<string> {
  const ventaValidada = obtenerVentaValidada(values);
  const cantidadesPorProducto = calcularCantidadesPorProducto(ventaValidada.detalles);
  const productoIds = Array.from(cantidadesPorProducto.keys());
  const ahora = fecha.toISOString();
  const ventaId = crearId("venta");
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.ventas,
    db.detalleVentas,
    db.cobrosVentas,
    db.productos,
    db.cuentasTesoreria,
    db.movimientosTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const productosResultado = await db.productos.bulkGet(productoIds);
    const productosPorId = new Map<string, Producto>();

    for (const producto of productosResultado) {
      if (producto) {
        productosPorId.set(producto.id, producto);
      }
    }

    for (const [productoId, cantidadSolicitada] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId);

      if (!producto || producto.estado !== "activo") {
        throw new Error("Uno de los productos ya no está disponible para vender.");
      }

      if (producto.stockActual < cantidadSolicitada) {
        throw new Error(`No hay stock suficiente para vender ${producto.nombre}.`);
      }
    }

    const detalles: DetalleVenta[] = ventaValidada.detalles.map((detalle) => {
      const producto = productosPorId.get(detalle.productoId);

      if (!producto) {
        throw new Error("Uno de los productos ya no está disponible para vender.");
      }

      return {
        id: crearId("detalle-venta"),
        ventaId,
        productoId: producto.id,
        cantidad: detalle.cantidad,
        precioUnitarioAplicado: detalle.precioUnitarioAplicado,
        costoUnitarioAlMomento: producto.costoCompra,
        subtotal: calcularSubtotalDetalleVenta(
          detalle.cantidad,
          detalle.precioUnitarioAplicado,
        ),
        observaciones: detalle.observaciones,
      };
    });

    const total = calcularTotalVenta(detalles);
    const montoCobradoInicial = ventaValidada.condicionPago === "contado"
      ? total
      : (ventaValidada.montoCobradoInicial ?? 0);
    const venta: Venta = {
      id: ventaId,
      fechaHoraReal: ahora,
      fechaJornada: calcularFechaJornada(fecha),
      medioPago: ventaValidada.medioPago,
      destinoTransferencia: ventaValidada.destinoTransferencia,
      condicionPago: ventaValidada.condicionPago,
      clienteFiadoNombre: ventaValidada.condicionPago === "fiado" ? ventaValidada.clienteFiadoNombre?.trim() : undefined,
      clienteFiadoNota: ventaValidada.condicionPago === "fiado" ? ventaValidada.clienteFiadoNota : undefined,
      vencimientoFiado: ventaValidada.condicionPago === "fiado" ? (ventaValidada.vencimientoFiado || undefined) : undefined,
      total,
      estado: "activa",
      observaciones: ventaValidada.observaciones,
      createdAt: ahora,
      updatedAt: ahora,
      anuladaAt: null,
      motivoAnulacion: null,
    };

    await db.ventas.add(venta);
    await db.detalleVentas.bulkAdd(detalles);

    const cobrosIniciales: CobroVenta[] = [];
    if (montoCobradoInicial > 0 && ventaValidada.medioPago) {
      const cobroId = crearId("cobro-venta");
      const movimientoTesoreria = await registrarMovimientoTesoreriaAutomatico({
        cuentaId: ventaValidada.cuentaTesoreriaId,
        medioPago: ventaValidada.medioPago,
        tipo: "cobro_venta",
        direccion: "entrada",
        monto: montoCobradoInicial,
        descripcion: `Cobro de venta ${ventaId}`,
        referenciaTipo: "cobro_venta",
        referenciaId: cobroId,
        fecha,
      }, db);
      const cobroInicial: CobroVenta = {
        id: cobroId,
        ventaId,
        fechaHoraReal: ahora,
        fechaJornada: calcularFechaJornada(fecha),
        monto: montoCobradoInicial,
        medioPago: ventaValidada.medioPago,
        destinoTransferencia: ventaValidada.destinoTransferencia,
        cuentaTesoreriaId: movimientoTesoreria?.cuentaId,
        estado: "activo",
        createdAt: ahora,
        updatedAt: ahora,
        anuladoAt: null,
        motivoAnulacion: null,
      };
      cobrosIniciales.push(cobroInicial);
      await db.cobrosVentas.add(cobroInicial);
    }

    for (const [productoId, cantidadVendida] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId);

      if (!producto) continue;

      await db.productos.update(productoId, {
        stockActual: producto.stockActual - cantidadVendida,
        updatedAt: ahora,
      });
    }

    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "registrar",
      tipoEntidad: "venta",
      entidadId: ventaId,
      payload: { venta, detalles, cobros: cobrosIniciales },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();

  return ventaId;
}

export async function anularVenta(
  ventaId: string,
  values: AnulacionVentaValues,
  fecha: Date = new Date(),
): Promise<void> {
  const anulacionValidada = obtenerAnulacionValidada(values);
  const ahora = fecha.toISOString();
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.ventas,
    db.detalleVentas,
    db.cobrosVentas,
    db.productos,
    db.cuentasTesoreria,
    db.movimientosTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const venta = await db.ventas.get(ventaId);

    if (!venta) {
      throw new Error("No se encontró la venta que querés anular.");
    }

    if (venta.estado === "anulada") {
      throw new Error("Esta venta ya está anulada.");
    }

    const detalles = await db.detalleVentas.where("ventaId").equals(ventaId).toArray();

    if (detalles.length === 0) {
      throw new Error("No se encontraron los productos de esta venta.");
    }

    const cantidadesPorProducto = calcularCantidadesPorProducto(detalles);
    const productoIds = Array.from(cantidadesPorProducto.keys());
    const productosResultado = await db.productos.bulkGet(productoIds);
    const productosPorId = new Map<string, Producto>();

    for (const producto of productosResultado) {
      if (producto) {
        productosPorId.set(producto.id, producto);
      }
    }

    for (const [productoId, cantidadVendida] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId);

      if (!producto) {
        throw new Error("No se pudo revertir el stock de uno de los productos.");
      }

      await db.productos.update(producto.id, {
        stockActual: calcularStockLuegoDeAnularVenta(producto.stockActual, cantidadVendida),
        updatedAt: ahora,
      });
    }

    const ventaAnulada: Venta = {
      ...venta,
      estado: "anulada",
      motivoAnulacion: anulacionValidada.motivoAnulacion,
      anuladaAt: ahora,
      updatedAt: ahora,
    };
    await db.ventas.put(ventaAnulada);

    const cobrosActivos = await db.cobrosVentas
      .where("ventaId")
      .equals(ventaId)
      .filter((cobro) => cobro.estado === "activo")
      .toArray();
    for (const cobro of cobrosActivos) {
      await revertirMovimientosTesoreriaPorReferencia({
        referenciaTipo: "cobro_venta",
        referenciaId: cobro.id,
        motivo: `Venta anulada: ${anulacionValidada.motivoAnulacion}`,
        fecha,
      }, db);
    }
    await db.cobrosVentas.bulkPut(cobrosActivos.map((cobro) => ({
      ...cobro,
      estado: "anulado" as const,
      anuladoAt: ahora,
      motivoAnulacion: `Venta anulada: ${anulacionValidada.motivoAnulacion}`,
      updatedAt: ahora,
    })));

    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "anular",
      tipoEntidad: "venta",
      entidadId: ventaId,
      payload: { venta: ventaAnulada, detalles },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();
}

export async function registrarCobroVenta(
  ventaId: string,
  values: CobroVentaFormValues,
  fecha: Date = new Date(),
): Promise<string> {
  const cobroValidado = obtenerCobroValidado(values);
  const ahora = fecha.toISOString();
  const cobroId = crearId("cobro-venta");
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.ventas,
    db.cobrosVentas,
    db.cuentasTesoreria,
    db.movimientosTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const venta = await db.ventas.get(ventaId);
    if (!venta) throw new Error("No se encontró la venta.");
    if (venta.estado !== "activa") throw new Error("No se puede cobrar una venta anulada.");
    if ((venta.condicionPago ?? "contado") !== "fiado") {
      throw new Error("Esta venta no tiene un saldo fiado.");
    }

    const cobros = await db.cobrosVentas.where("ventaId").equals(ventaId).toArray();
    const saldo = calcularSaldoVenta(venta.total, cobros);
    if (saldo <= 0) throw new Error("Esta venta ya no tiene saldo pendiente.");
    if (cobroValidado.monto > saldo) {
      throw new Error(`El cobro no puede superar el saldo pendiente de $${saldo.toLocaleString("es-AR")}.`);
    }

    const movimientoTesoreria = await registrarMovimientoTesoreriaAutomatico({
      cuentaId: cobroValidado.cuentaTesoreriaId,
      medioPago: cobroValidado.medioPago,
      tipo: "cobro_venta",
      direccion: "entrada",
      monto: cobroValidado.monto,
      descripcion: `Cobro de venta ${ventaId}`,
      referenciaTipo: "cobro_venta",
      referenciaId: cobroId,
      fecha,
    }, db);
    const cobro: CobroVenta = {
      id: cobroId,
      ventaId,
      fechaHoraReal: ahora,
      fechaJornada: calcularFechaJornada(fecha),
      monto: cobroValidado.monto,
      medioPago: cobroValidado.medioPago,
      destinoTransferencia: cobroValidado.destinoTransferencia,
      cuentaTesoreriaId: movimientoTesoreria?.cuentaId,
      estado: "activo",
      createdAt: ahora,
      updatedAt: ahora,
      anuladoAt: null,
      motivoAnulacion: null,
    };
    await db.cobrosVentas.add(cobro);
    await db.ventas.update(ventaId, { updatedAt: ahora });
    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "registrar",
      tipoEntidad: "cobro_venta",
      entidadId: cobroId,
      payload: { cobro },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();

  return cobroId;
}

export async function anularCobroVenta(
  cobroId: string,
  values: AnulacionCobroVentaValues,
  fecha: Date = new Date(),
): Promise<void> {
  const anulacion = obtenerAnulacionCobroValidada(values);
  const ahora = fecha.toISOString();
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.ventas,
    db.cobrosVentas,
    db.cuentasTesoreria,
    db.movimientosTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const cobro = await db.cobrosVentas.get(cobroId);
    if (!cobro) throw new Error("No se encontró el cobro.");
    if (cobro.estado === "anulado") throw new Error("Este cobro ya está anulado.");
    const venta = await db.ventas.get(cobro.ventaId);
    if (!venta || venta.estado === "anulada") {
      throw new Error("No se puede modificar el cobro de una venta anulada.");
    }
    const cobroAnulado: CobroVenta = {
      ...cobro,
      estado: "anulado",
      anuladoAt: ahora,
      motivoAnulacion: anulacion.motivoAnulacion,
      updatedAt: ahora,
    };
    await revertirMovimientosTesoreriaPorReferencia({
      referenciaTipo: "cobro_venta",
      referenciaId: cobro.id,
      motivo: anulacion.motivoAnulacion,
      fecha,
    }, db);
    await db.cobrosVentas.put(cobroAnulado);
    await db.ventas.update(cobro.ventaId, { updatedAt: ahora });
    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "anular",
      tipoEntidad: "cobro_venta",
      entidadId: cobroId,
      payload: { cobro: cobroAnulado },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();
}

export async function listarVentasConDetalles(options?: {
  limite?: number;
}): Promise<VentaConDetalles[]> {
  const ventas = await db.ventas
    .orderBy("fechaHoraReal")
    .reverse()
    .limit(options?.limite ?? 30)
    .toArray();

  if (ventas.length === 0) {
    return [];
  }

  const ventaIds = ventas.map((venta) => venta.id);
  const [detalles, cobros] = await Promise.all([
    db.detalleVentas.where("ventaId").anyOf(ventaIds).toArray(),
    db.cobrosVentas.where("ventaId").anyOf(ventaIds).toArray(),
  ]);
  const productoIds = Array.from(new Set(detalles.map((detalle) => detalle.productoId)));
  const productosResultado = await db.productos.bulkGet(productoIds);
  const productosPorId = new Map<string, Producto>();

  for (const producto of productosResultado) {
    if (producto) {
      productosPorId.set(producto.id, producto);
    }
  }

  const detallesPorVenta = new Map<string, DetalleVentaConProducto[]>();

  for (const detalle of detalles) {
    const detalleConProducto: DetalleVentaConProducto = {
      ...detalle,
      producto: productosPorId.get(detalle.productoId),
    };

    const grupo = detallesPorVenta.get(detalle.ventaId) ?? [];
    grupo.push(detalleConProducto);
    detallesPorVenta.set(detalle.ventaId, grupo);
  }

  return ventas.map((venta) => {
    const cobrosVenta = cobros.filter((cobro) => cobro.ventaId === venta.id);
    const saldo = calcularSaldoVenta(venta.total, cobrosVenta);
    return {
      ...venta,
      condicionPago: venta.condicionPago ?? "contado",
      detalles: detallesPorVenta.get(venta.id) ?? [],
      cobros: cobrosVenta.sort((a, b) => b.fechaHoraReal.localeCompare(a.fechaHoraReal)),
      totalCobrado: venta.total - saldo,
      saldo,
    };
  });
}

export async function obtenerVentaConDetalles(
  ventaId: string,
): Promise<VentaConDetalles | undefined> {
  const venta = await db.ventas.get(ventaId);

  if (!venta) return undefined;

  const [detalles, cobros] = await Promise.all([
    db.detalleVentas.where("ventaId").equals(ventaId).toArray(),
    db.cobrosVentas.where("ventaId").equals(ventaId).toArray(),
  ]);
  const productoIds = Array.from(new Set(detalles.map((detalle) => detalle.productoId)));
  const productosResultado = await db.productos.bulkGet(productoIds);
  const productosPorId = new Map<string, Producto>();

  for (const producto of productosResultado) {
    if (producto) productosPorId.set(producto.id, producto);
  }

  return {
    ...venta,
    condicionPago: venta.condicionPago ?? "contado",
    detalles: detalles.map((detalle) => ({
      ...detalle,
      producto: productosPorId.get(detalle.productoId),
    })),
    cobros: cobros.sort((a, b) => b.fechaHoraReal.localeCompare(a.fechaHoraReal)),
    totalCobrado: venta.total - calcularSaldoVenta(venta.total, cobros),
    saldo: calcularSaldoVenta(venta.total, cobros),
  };
}
