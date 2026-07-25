import type { Producto } from "../domain/productos";
import {
  calcularStockLuegoDeAnularReposicion,
  calcularStockLuegoDeReposicion,
  calcularSubtotalReposicion,
  calcularTotalReposicion,
  puedeEliminarMovimientoAnulado,
  type DetalleReposicion,
  type Movimiento,
  type PagoReposicion,
} from "../domain/movimientos";
import {
  anulacionMovimientoSchema,
  type AnulacionMovimientoValues,
  type MovimientoFormValues,
  movimientoFormSchema,
  type ReposicionFormValues,
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

function obtenerReposicionValidada(values: ReposicionFormValues): ReposicionFormValues {
  const movimiento = obtenerMovimientoValidado(values);
  if (movimiento.tipo !== "reposicion") {
    throw new Error("Los datos no corresponden a una reposición.");
  }
  return movimiento;
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

function calcularCantidadesPorProducto(
  detalles: Array<Pick<DetalleReposicion, "productoId" | "cantidad">>,
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

function crearDetallesReposicion(
  movimientoId: string,
  reposicion: ReposicionFormValues,
): DetalleReposicion[] {
  return reposicion.detalles.map((detalle) => ({
    id: crearId("detalle-reposicion"),
    movimientoId,
    productoId: detalle.productoId,
    cantidad: detalle.cantidad,
    costoUnitario: detalle.costoUnitario,
    subtotal: calcularSubtotalReposicion(
      detalle.cantidad,
      detalle.costoUnitario,
      detalle.subtotal,
    ),
    cantidadBultos: detalle.cantidadBultos,
    unidadesPorBulto: detalle.unidadesPorBulto,
    costoPorBulto: detalle.costoPorBulto,
  }));
}

function validarImportesReposicion(reposicion: ReposicionFormValues): void {
  const totalReposicion = calcularTotalReposicion(reposicion.detalles);

  if (Math.abs(totalReposicion - reposicion.monto) > 0.01) {
    throw new Error("El total de la reposición no coincide con los productos cargados.");
  }

  if (
    reposicion.aporteExternoIncluido !== undefined
    && reposicion.aporteExternoIncluido > reposicion.monto
  ) {
    throw new Error("El aporte externo no puede ser mayor al total de la reposición.");
  }
}

async function validarProductosDisponibles(
  detalles: Array<Pick<DetalleReposicion, "productoId" | "cantidad">>,
): Promise<{
  cantidadesPorProducto: Map<string, number>;
  productosPorId: Map<string, Producto>;
}> {
  const cantidadesPorProducto = calcularCantidadesPorProducto(detalles);
  const productoIds = Array.from(cantidadesPorProducto.keys());
  const productosPorId = await obtenerProductosPorId(productoIds);

  for (const productoId of productoIds) {
    const producto = productosPorId.get(productoId);

    if (!producto || producto.estado !== "activo") {
      throw new Error("Uno de los productos ya no está disponible para reponer.");
    }
  }

  return { cantidadesPorProducto, productosPorId };
}

async function validarCuentasPrevistas(
  distribucionPagos: PagoReposicion[] | undefined,
  cuentaTesoreriaId: string | undefined,
): Promise<void> {
  const ids = distribucionPagos?.length
    ? distribucionPagos.map((pago) => pago.cuentaTesoreriaId)
    : cuentaTesoreriaId
      ? [cuentaTesoreriaId]
      : [];
  if (!ids.length) return;
  const cuentas = await db.cuentasTesoreria.bulkGet(ids);
  if (cuentas.some((cuenta) => !cuenta || cuenta.estado !== "activa")) {
    throw new Error("Una de las cuentas elegidas ya no está disponible.");
  }
}

async function aplicarPagoReposicion(
  movimiento: Movimiento,
  fecha: Date,
): Promise<string | undefined> {
  const distribucion = movimiento.distribucionPagos ?? [];
  const hayTesoreria = await db.cuentasTesoreria.count() > 0;

  if (distribucion.length) {
    const cuentasPago = await db.cuentasTesoreria.bulkGet(
      distribucion.map((pago) => pago.cuentaTesoreriaId),
    );
    if (cuentasPago.some((cuenta) => !cuenta || cuenta.estado !== "activa")) {
      throw new Error("Una de las cuentas elegidas ya no está disponible.");
    }
    if (movimiento.aporteExternoIncluido) {
      const primeraCuenta = cuentasPago[0]!;
      await registrarMovimientoTesoreriaAutomatico({
        cuentaId: primeraCuenta.id,
        medioPago: primeraCuenta.tipo === "efectivo" ? "efectivo" : "transferencia",
        tipo: "aporte_externo",
        direccion: "entrada",
        monto: movimiento.aporteExternoIncluido,
        descripcion: `Aporte incluido en ${movimiento.descripcion}`,
        referenciaTipo: "movimiento",
        referenciaId: movimiento.id,
        fecha,
      }, db);
    }
    for (const [indice, pago] of distribucion.entries()) {
      const cuenta = cuentasPago[indice]!;
      await registrarMovimientoTesoreriaAutomatico({
        cuentaId: cuenta.id,
        medioPago: cuenta.tipo === "efectivo" ? "efectivo" : "transferencia",
        tipo: "reposicion",
        direccion: "salida",
        monto: pago.monto,
        descripcion: movimiento.descripcion,
        referenciaTipo: "movimiento",
        referenciaId: movimiento.id,
        fecha,
      }, db);
    }
    return distribucion.length === 1 ? distribucion[0]?.cuentaTesoreriaId : undefined;
  }

  if (movimiento.medioPago) {
    if (movimiento.aporteExternoIncluido) {
      await registrarMovimientoTesoreriaAutomatico({
        cuentaId: movimiento.cuentaTesoreriaId,
        medioPago: movimiento.medioPago,
        tipo: "aporte_externo",
        direccion: "entrada",
        monto: movimiento.aporteExternoIncluido,
        descripcion: `Aporte incluido en ${movimiento.descripcion}`,
        referenciaTipo: "movimiento",
        referenciaId: movimiento.id,
        fecha,
      }, db);
    }
    const movimientoTesoreria = await registrarMovimientoTesoreriaAutomatico({
      cuentaId: movimiento.cuentaTesoreriaId,
      medioPago: movimiento.medioPago,
      tipo: "reposicion",
      direccion: "salida",
      monto: movimiento.monto,
      descripcion: movimiento.descripcion,
      referenciaTipo: "movimiento",
      referenciaId: movimiento.id,
      fecha,
    }, db);
    return movimientoTesoreria?.cuentaId;
  }

  if (hayTesoreria) {
    throw new Error("Elegí desde qué cuenta se pagará la reposición.");
  }

  return movimiento.cuentaTesoreriaId;
}

export async function registrarMovimiento(
  values: MovimientoFormValues,
  fecha: Date = new Date(),
): Promise<string> {
  const movimientoValidado = obtenerMovimientoValidado(values);
  const ahora = fecha.toISOString();
  const movimientoId = crearId("movimiento");
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.movimientos,
    db.detalleReposiciones,
    db.productos,
    db.cuentasTesoreria,
    db.movimientosTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const movimientoBase: Movimiento = {
      id: movimientoId,
      fechaHoraReal: ahora,
      fechaJornada: calcularFechaJornada(fecha),
      tipo: movimientoValidado.tipo,
      descripcion: movimientoValidado.descripcion,
      monto: movimientoValidado.monto,
      medioPago: movimientoValidado.medioPago,
      cuentaTesoreriaId: movimientoValidado.cuentaTesoreriaId,
      estado: movimientoValidado.tipo === "reposicion" ? "pendiente" : "activo",
      observaciones: movimientoValidado.observaciones,
      aporteExternoIncluido:
        movimientoValidado.tipo === "reposicion"
          ? movimientoValidado.aporteExternoIncluido
          : undefined,
      distribucionPagos:
        movimientoValidado.tipo === "reposicion"
          ? movimientoValidado.distribucionPagos
          : undefined,
      createdAt: ahora,
      updatedAt: ahora,
      confirmadoAt: movimientoValidado.tipo === "reposicion" ? null : undefined,
      anuladoAt: null,
      motivoAnulacion: null,
    };

    if (movimientoValidado.tipo !== "reposicion") {
      if (movimientoValidado.medioPago) {
        const movimientoTesoreria = await registrarMovimientoTesoreriaAutomatico({
          cuentaId: movimientoValidado.cuentaTesoreriaId,
          medioPago: movimientoValidado.medioPago,
          tipo: movimientoValidado.tipo,
          direccion: movimientoValidado.tipo === "aporte_externo" ? "entrada" : "salida",
          monto: movimientoValidado.monto,
          descripcion: movimientoValidado.descripcion,
          referenciaTipo: "movimiento",
          referenciaId: movimientoId,
          fecha,
        }, db);
        movimientoBase.cuentaTesoreriaId = movimientoTesoreria?.cuentaId;
      }
      await db.movimientos.add(movimientoBase);
      sincronizacionEncolada = await encolarOperacionOperativaLocal({
        id: operacionId,
        tipoOperacion: "registrar",
        tipoEntidad: "movimiento",
        entidadId: movimientoId,
        payload: { movimiento: movimientoBase, detalles: [] },
        creadaAt: ahora,
      }, db);
      return;
    }

    validarImportesReposicion(movimientoValidado);
    const detalles = crearDetallesReposicion(movimientoId, movimientoValidado);
    await validarProductosDisponibles(detalles);
    await validarCuentasPrevistas(
      movimientoValidado.distribucionPagos,
      movimientoValidado.cuentaTesoreriaId,
    );

    await db.movimientos.add(movimientoBase);
    await db.detalleReposiciones.bulkAdd(detalles);
    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "registrar",
      tipoEntidad: "movimiento",
      entidadId: movimientoId,
      payload: { movimiento: movimientoBase, detalles },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();

  return movimientoId;
}

export async function actualizarReposicionPendiente(
  movimientoId: string,
  values: ReposicionFormValues,
  fecha: Date = new Date(),
): Promise<void> {
  const reposicion = obtenerReposicionValidada(values);
  validarImportesReposicion(reposicion);
  const ahora = fecha.toISOString();
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.movimientos,
    db.detalleReposiciones,
    db.productos,
    db.cuentasTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const movimiento = await db.movimientos.get(movimientoId);
    if (!movimiento || movimiento.tipo !== "reposicion") {
      throw new Error("No se encontró la reposición que querés editar.");
    }
    if (movimiento.estado !== "pendiente") {
      throw new Error("Solo se pueden editar reposiciones pendientes.");
    }

    const detalles = crearDetallesReposicion(movimientoId, reposicion);
    await validarProductosDisponibles(detalles);
    await validarCuentasPrevistas(
      reposicion.distribucionPagos,
      reposicion.cuentaTesoreriaId,
    );
    const actualizada: Movimiento = {
      ...movimiento,
      descripcion: reposicion.descripcion,
      monto: reposicion.monto,
      medioPago: reposicion.medioPago,
      cuentaTesoreriaId: reposicion.cuentaTesoreriaId,
      distribucionPagos: reposicion.distribucionPagos,
      aporteExternoIncluido: reposicion.aporteExternoIncluido,
      observaciones: reposicion.observaciones,
      updatedAt: ahora,
    };

    await db.movimientos.put(actualizada);
    await db.detalleReposiciones.where("movimientoId").equals(movimientoId).delete();
    await db.detalleReposiciones.bulkAdd(detalles);
    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "actualizar",
      tipoEntidad: "movimiento",
      entidadId: movimientoId,
      payload: { movimiento: actualizada, detalles },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();
}

export async function confirmarReposicion(
  movimientoId: string,
  fecha: Date = new Date(),
): Promise<void> {
  const ahora = fecha.toISOString();
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.movimientos,
    db.detalleReposiciones,
    db.productos,
    db.cuentasTesoreria,
    db.movimientosTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const movimiento = await db.movimientos.get(movimientoId);
    if (!movimiento || movimiento.tipo !== "reposicion") {
      throw new Error("No se encontró la reposición que querés confirmar.");
    }
    if (movimiento.estado !== "pendiente") {
      throw new Error("Esta reposición ya no está pendiente.");
    }

    const detalles = await db.detalleReposiciones
      .where("movimientoId")
      .equals(movimientoId)
      .toArray();
    if (!detalles.length) {
      throw new Error("No se encontraron los productos de esta reposición.");
    }
    if (Math.abs(calcularTotalReposicion(detalles) - movimiento.monto) > 0.01) {
      throw new Error("El total pendiente ya no coincide con sus productos.");
    }

    const { cantidadesPorProducto, productosPorId } =
      await validarProductosDisponibles(detalles);
    const cuentaTesoreriaId = await aplicarPagoReposicion(movimiento, fecha);
    const confirmada: Movimiento = {
      ...movimiento,
      fechaHoraReal: ahora,
      fechaJornada: calcularFechaJornada(fecha),
      cuentaTesoreriaId,
      estado: "activo",
      confirmadoAt: ahora,
      updatedAt: ahora,
    };

    await db.movimientos.put(confirmada);
    for (const [productoId, cantidadRepuesta] of cantidadesPorProducto) {
      const producto = productosPorId.get(productoId);
      if (!producto) continue;
      await db.productos.update(productoId, {
        stockActual: calcularStockLuegoDeReposicion(producto.stockActual, cantidadRepuesta),
        updatedAt: ahora,
      });
    }
    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "confirmar",
      tipoEntidad: "movimiento",
      entidadId: movimientoId,
      payload: { movimiento: confirmada, detalles },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();
}

export async function anularMovimiento(
  movimientoId: string,
  values: AnulacionMovimientoValues,
  fecha: Date = new Date(),
): Promise<void> {
  const anulacionValidada = obtenerAnulacionValidada(values);
  const ahora = fecha.toISOString();
  const operacionId = crearId("operacion");
  let sincronizacionEncolada = false;

  await db.transaction("rw", [
    db.movimientos,
    db.detalleReposiciones,
    db.productos,
    db.cuentasTesoreria,
    db.movimientosTesoreria,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const movimiento = await db.movimientos.get(movimientoId);

    if (!movimiento) {
      throw new Error("No se encontró el movimiento que querés anular.");
    }

    if (movimiento.estado === "anulado") {
      throw new Error("Este movimiento ya está anulado.");
    }

    const detalles = movimiento.tipo === "reposicion"
      ? await db.detalleReposiciones
        .where("movimientoId")
        .equals(movimientoId)
        .toArray()
      : [];

    if (movimiento.tipo === "reposicion" && movimiento.estado === "activo") {
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

    const movimientoAnulado: Movimiento = {
      ...movimiento,
      estado: "anulado",
      motivoAnulacion: anulacionValidada.motivoAnulacion,
      anuladoAt: ahora,
      updatedAt: ahora,
    };
    await revertirMovimientosTesoreriaPorReferencia({
      referenciaTipo: "movimiento",
      referenciaId: movimientoId,
      motivo: anulacionValidada.motivoAnulacion,
      fecha,
    }, db);
    await db.movimientos.put(movimientoAnulado);
    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "anular",
      tipoEntidad: "movimiento",
      entidadId: movimientoId,
      payload: { movimiento: movimientoAnulado, detalles },
      creadaAt: ahora,
    }, db);
  });

  if (sincronizacionEncolada) notificarSincronizacionPendiente();
}

export async function eliminarMovimientoAnulado(movimientoId: string): Promise<void> {
  const operacionId = crearId("operacion");
  const ahora = new Date().toISOString();
  let sincronizacionEncolada = false;
  await db.transaction("rw", [
    db.movimientos,
    db.detalleReposiciones,
    db.vinculoDispositivo,
    db.colaSincronizacion,
  ], async () => {
    const movimiento = await db.movimientos.get(movimientoId);

    if (!movimiento) {
      throw new Error("No se encontró el movimiento que querés eliminar.");
    }

    if (!puedeEliminarMovimientoAnulado(movimiento)) {
      throw new Error("Solo se pueden eliminar movimientos anulados correctamente.");
    }

    await db.detalleReposiciones.where("movimientoId").equals(movimientoId).delete();
    await db.movimientos.delete(movimientoId);
    sincronizacionEncolada = await encolarOperacionOperativaLocal({
      id: operacionId,
      tipoOperacion: "eliminar",
      tipoEntidad: "movimiento",
      entidadId: movimientoId,
      payload: { movimiento },
      creadaAt: ahora,
    }, db);
  });
  if (sincronizacionEncolada) notificarSincronizacionPendiente();
}

export async function listarMovimientosConDetalles(options?: {
  limite?: number;
}): Promise<MovimientoConDetalles[]> {
  const consulta = db.movimientos.orderBy("fechaHoraReal").reverse();
  const movimientos = options?.limite
    ? await consulta.limit(options.limite).toArray()
    : await consulta.toArray();

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

export async function obtenerMovimientoConDetalles(
  movimientoId: string,
): Promise<MovimientoConDetalles | undefined> {
  const movimiento = await db.movimientos.get(movimientoId);

  if (!movimiento) return undefined;

  const detalles = await db.detalleReposiciones
    .where("movimientoId")
    .equals(movimientoId)
    .toArray();
  const productoIds = Array.from(new Set(detalles.map((detalle) => detalle.productoId)));
  const productosPorId = await obtenerProductosPorId(productoIds);

  return {
    ...movimiento,
    detallesReposicion: detalles.map((detalle) => ({
      ...detalle,
      producto: productosPorId.get(detalle.productoId),
    })),
  };
}
