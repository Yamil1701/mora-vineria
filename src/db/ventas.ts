import type { Producto } from "../domain/productos";
import {
  calcularSubtotalDetalleVenta,
  calcularTotalVenta,
  type DetalleVenta,
  type Venta,
} from "../domain/ventas";
import { type VentaFormValues, ventaFormSchema } from "../schemas";
import { crearId } from "../utils/ids";
import { calcularFechaJornada } from "../utils/jornadaVenta";
import { db } from "./schema";

export interface DetalleVentaConProducto extends DetalleVenta {
  producto?: Producto;
}

export interface VentaConDetalles extends Venta {
  detalles: DetalleVentaConProducto[];
}

function obtenerMensajeSchema(values: VentaFormValues): VentaFormValues {
  const resultado = ventaFormSchema.safeParse(values);

  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Revisá los datos de la venta.");
  }

  return resultado.data;
}

function calcularCantidadesPorProducto(detalles: VentaFormValues["detalles"]) {
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
  const ventaValidada = obtenerMensajeSchema(values);
  const cantidadesPorProducto = calcularCantidadesPorProducto(ventaValidada.detalles);
  const productoIds = Array.from(cantidadesPorProducto.keys());
  const ahora = fecha.toISOString();
  const ventaId = crearId("venta");

  await db.transaction("rw", db.ventas, db.detalleVentas, db.productos, async () => {
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

    const venta: Venta = {
      id: ventaId,
      fechaHoraReal: ahora,
      fechaJornada: calcularFechaJornada(fecha),
      medioPago: ventaValidada.medioPago,
      total: calcularTotalVenta(detalles),
      estado: "activa",
      observaciones: ventaValidada.observaciones,
      createdAt: ahora,
      updatedAt: ahora,
      anuladaAt: null,
      motivoAnulacion: null,
    };

    await db.ventas.add(venta);
    await db.detalleVentas.bulkAdd(detalles);

    for (const [productoId, cantidadVendida] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId);

      if (!producto) continue;

      await db.productos.update(productoId, {
        stockActual: producto.stockActual - cantidadVendida,
        updatedAt: ahora,
      });
    }
  });

  return ventaId;
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
  const detalles = await db.detalleVentas.where("ventaId").anyOf(ventaIds).toArray();
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

  return ventas.map((venta) => ({
    ...venta,
    detalles: detallesPorVenta.get(venta.id) ?? [],
  }));
}
