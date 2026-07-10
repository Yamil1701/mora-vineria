import type { Producto } from "../domain/productos";
import {
  calcularStockLuegoDeAnularReposicion,
  calcularStockLuegoDeReposicion,
  calcularSubtotalReposicion,
  calcularTotalReposicion,
  puedeEliminarMovimientoAnulado,
  type DetalleReposicion,
  type Movimiento,
} from "../domain/movimientos";
import {
  anulacionMovimientoSchema,
  type AnulacionMovimientoValues,
  type MovimientoFormValues,
  movimientoFormSchema,
} from "../schemas";
import { crearId } from "../utils/ids";
import { calcularFechaJornada } from "../utils/jornadaVenta";
import { db } from "./schema";

export interface DetalleReposicionConProducto extends DetalleReposicion {
  producto?: Producto;
}

export interface MovimientoConDetalles extends Movimiento {
  detallesReposicion: DetalleReposicionConProducto[];
}

function obtenerMovimientoValidado(values: MovimientoFormValues): MovimientoFormValues {
  const resultado = movimientoFormSchema.safeParse(values);

  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Revisá los datos del movimiento.");
  }

  return resultado.data;
}

function obtenerAnulacionValidada(
  values: AnulacionMovimientoValues,
): AnulacionMovimientoValues {
  const resultado = anulacionMovimientoSchema.safeParse(values);

  if (!resultado.success) {
    throw new Error(resultado.error.issues[0]?.message ?? "Indicá el motivo de anulación.");
  }

  return resultado.data;
}

function calcularCantidadesPorProducto(detalles: Array<Pick<DetalleReposicion, "productoId" | "cantidad">>) {
  const cantidades = new Map<string, number>();

  for (const detalle of detalles) {
    cantidades.set(
      detalle.productoId,
      (cantidades.get(detalle.productoId) ?? 0) + detalle.cantidad,
    );
  }

  return cantidades;
}

async function obtenerProductosPorId(productoIds: string[]): Promise<Map<string, Producto>> {
  const productosResultado = await db.productos.bulkGet(productoIds);
  const productosPorId = new Map<string, Producto>();

  for (const producto of productosResultado) {
    if (producto) {
      productosPorId.set(producto.id, producto);
    }
  }

  return productosPorId;
}

export async function registrarMovimiento(
  values: MovimientoFormValues,
  fecha: Date = new Date(),
): Promise<string> {
  const movimientoValidado = obtenerMovimientoValidado(values);
  const ahora = fecha.toISOString();
  const movimientoId = crearId("movimiento");

  await db.transaction("rw", db.movimientos, db.detalleReposiciones, db.productos, async () => {
    const movimientoBase: Movimiento = {
      id: movimientoId,
      fechaHoraReal: ahora,
      fechaJornada: calcularFechaJornada(fecha),
      tipo: movimientoValidado.tipo,
      descripcion: movimientoValidado.descripcion,
      monto: movimientoValidado.monto,
      medioPago: movimientoValidado.medioPago,
      estado: "activo",
      observaciones: movimientoValidado.observaciones,
      aporteExternoIncluido:
        movimientoValidado.tipo === "reposicion"
          ? movimientoValidado.aporteExternoIncluido
          : undefined,
      createdAt: ahora,
      updatedAt: ahora,
      anuladoAt: null,
      motivoAnulacion: null,
    };

    if (movimientoValidado.tipo !== "reposicion") {
      await db.movimientos.add(movimientoBase);
      return;
    }

    const totalReposicion = calcularTotalReposicion(movimientoValidado.detalles);

    if (totalReposicion !== movimientoValidado.monto) {
      throw new Error("El total de la reposición no coincide con los productos cargados.");
    }

    if (
      movimientoValidado.aporteExternoIncluido !== undefined &&
      movimientoValidado.aporteExternoIncluido > movimientoValidado.monto
    ) {
      throw new Error("El aporte externo no puede ser mayor al total de la reposición.");
    }

    const cantidadesPorProducto = calcularCantidadesPorProducto(movimientoValidado.detalles);
    const productoIds = Array.from(cantidadesPorProducto.keys());
    const productosPorId = await obtenerProductosPorId(productoIds);

    for (const productoId of productoIds) {
      const producto = productosPorId.get(productoId);

      if (!producto || producto.estado !== "activo") {
        throw new Error("Uno de los productos ya no está disponible para reponer.");
      }
    }

    const detalles: DetalleReposicion[] = movimientoValidado.detalles.map((detalle) => ({
      id: crearId("detalle-reposicion"),
      movimientoId,
      productoId: detalle.productoId,
      cantidad: detalle.cantidad,
      costoUnitario: detalle.costoUnitario,
      subtotal: calcularSubtotalReposicion(detalle.cantidad, detalle.costoUnitario),
    }));

    await db.movimientos.add(movimientoBase);
    await db.detalleReposiciones.bulkAdd(detalles);

    for (const [productoId, cantidadRepuesta] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId);

      if (!producto) continue;

      await db.productos.update(productoId, {
        stockActual: calcularStockLuegoDeReposicion(producto.stockActual, cantidadRepuesta),
        updatedAt: ahora,
      });
    }
  });

  return movimientoId;
}

export async function anularMovimiento(
  movimientoId: string,
  values: AnulacionMovimientoValues,
  fecha: Date = new Date(),
): Promise<void> {
  const anulacionValidada = obtenerAnulacionValidada(values);
  const ahora = fecha.toISOString();

  await db.transaction("rw", db.movimientos, db.detalleReposiciones, db.productos, async () => {
    const movimiento = await db.movimientos.get(movimientoId);

    if (!movimiento) {
      throw new Error("No se encontró el movimiento que querés anular.");
    }

    if (movimiento.estado === "anulado") {
      throw new Error("Este movimiento ya está anulado.");
    }

    if (movimiento.tipo === "reposicion") {
      const detalles = await db.detalleReposiciones
        .where("movimientoId")
        .equals(movimientoId)
        .toArray();

      if (detalles.length === 0) {
        throw new Error("No se encontraron los productos de esta reposición.");
      }

      const cantidadesPorProducto = calcularCantidadesPorProducto(detalles);
      const productoIds = Array.from(cantidadesPorProducto.keys());
      const productosPorId = await obtenerProductosPorId(productoIds);

      for (const [productoId, cantidadRepuesta] of cantidadesPorProducto) {
        const producto = productosPorId.get(productoId);

        if (!producto) {
          throw new Error("No se pudo revertir el stock de uno de los productos.");
        }

        const stockLuegoDeAnular = calcularStockLuegoDeAnularReposicion(
          producto.stockActual,
          cantidadRepuesta,
        );

        if (stockLuegoDeAnular < 0) {
          throw new Error(
            "No se puede anular esta reposición porque el stock actual no alcanza para revertirla.",
          );
        }
      }

      for (const [productoId, cantidadRepuesta] of cantidadesPorProducto) {
        const producto = productosPorId.get(productoId);

        if (!producto) continue;

        await db.productos.update(productoId, {
          stockActual: calcularStockLuegoDeAnularReposicion(
            producto.stockActual,
            cantidadRepuesta,
          ),
          updatedAt: ahora,
        });
      }
    }

    await db.movimientos.update(movimientoId, {
      estado: "anulado",
      motivoAnulacion: anulacionValidada.motivoAnulacion,
      anuladoAt: ahora,
      updatedAt: ahora,
    });
  });
}

export async function eliminarMovimientoAnulado(movimientoId: string): Promise<void> {
  await db.transaction("rw", db.movimientos, db.detalleReposiciones, async () => {
    const movimiento = await db.movimientos.get(movimientoId);

    if (!movimiento) {
      throw new Error("No se encontró el movimiento que querés eliminar.");
    }

    if (!puedeEliminarMovimientoAnulado(movimiento)) {
      throw new Error("Solo se pueden eliminar movimientos anulados correctamente.");
    }

    await db.detalleReposiciones.where("movimientoId").equals(movimientoId).delete();
    await db.movimientos.delete(movimientoId);
  });
}

export async function listarMovimientosConDetalles(options?: {
  limite?: number;
}): Promise<MovimientoConDetalles[]> {
  const movimientos = await db.movimientos
    .orderBy("fechaHoraReal")
    .reverse()
    .limit(options?.limite ?? 40)
    .toArray();

  if (movimientos.length === 0) {
    return [];
  }

  const movimientoIds = movimientos.map((movimiento) => movimiento.id);
  const detalles = await db.detalleReposiciones
    .where("movimientoId")
    .anyOf(movimientoIds)
    .toArray();
  const productoIds = Array.from(new Set(detalles.map((detalle) => detalle.productoId)));
  const productosPorId = await obtenerProductosPorId(productoIds);
  const detallesPorMovimiento = new Map<string, DetalleReposicionConProducto[]>();

  for (const detalle of detalles) {
    const detalleConProducto: DetalleReposicionConProducto = {
      ...detalle,
      producto: productosPorId.get(detalle.productoId),
    };
    const grupo = detallesPorMovimiento.get(detalle.movimientoId) ?? [];
    grupo.push(detalleConProducto);
    detallesPorMovimiento.set(detalle.movimientoId, grupo);
  }

  return movimientos.map((movimiento) => ({
    ...movimiento,
    detallesReposicion: detallesPorMovimiento.get(movimiento.id) ?? [],
  }));
}
