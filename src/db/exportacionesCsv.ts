import type { Categoria, Producto } from "../domain/productos";
import type { DetalleReposicion, Movimiento } from "../domain/movimientos";
import type { DetalleVenta, Venta } from "../domain/ventas";
import { crearCsv, crearNombreArchivoCsv } from "../domain/csv";
import { db } from "./schema";

export interface ArchivoCsvExportado {
  csv: string;
  fileName: string;
}

interface VentaCsvRow {
  venta: Venta;
  detalle: DetalleVenta | null;
  producto: Producto | null;
}

interface MovimientoCsvRow {
  movimiento: Movimiento;
  detalle: DetalleReposicion | null;
  producto: Producto | null;
}

function mapearCategoriasPorId(categorias: Categoria[]): Map<string, Categoria> {
  return new Map(categorias.map((categoria) => [categoria.id, categoria]));
}

function mapearProductosPorId(productos: Producto[]): Map<string, Producto> {
  return new Map(productos.map((producto) => [producto.id, producto]));
}

export async function exportarProductosCsv(fecha: Date = new Date()): Promise<ArchivoCsvExportado> {
  const [productos, categorias] = await Promise.all([
    db.productos.orderBy("nombre").toArray(),
    db.categorias.orderBy("nombre").toArray(),
  ]);
  const categoriasPorId = mapearCategoriasPorId(categorias);
  const csv = crearCsv(
    [
      { header: "id", value: (producto: Producto) => producto.id },
      { header: "nombre", value: (producto: Producto) => producto.nombre },
      {
        header: "categoria",
        value: (producto: Producto) => categoriasPorId.get(producto.categoriaId)?.nombre ?? "",
      },
      { header: "precio_venta", value: (producto: Producto) => producto.precioVenta },
      { header: "costo_compra", value: (producto: Producto) => producto.costoCompra },
      { header: "marca", value: (producto: Producto) => producto.marca },
      { header: "presentacion", value: (producto: Producto) => producto.presentacion },
      { header: "stock_actual", value: (producto: Producto) => producto.stockActual },
      { header: "stock_objetivo", value: (producto: Producto) => producto.stockObjetivo },
      { header: "estado", value: (producto: Producto) => producto.estado },
      { header: "observaciones", value: (producto: Producto) => producto.observaciones },
      { header: "creado", value: (producto: Producto) => producto.createdAt },
      { header: "actualizado", value: (producto: Producto) => producto.updatedAt },
    ],
    productos,
  );

  return {
    csv,
    fileName: crearNombreArchivoCsv("productos", fecha),
  };
}

export async function exportarVentasCsv(fecha: Date = new Date()): Promise<ArchivoCsvExportado> {
  const [ventas, detalles, productos] = await Promise.all([
    db.ventas.orderBy("fechaHoraReal").reverse().toArray(),
    db.detalleVentas.toArray(),
    db.productos.toArray(),
  ]);
  const productosPorId = mapearProductosPorId(productos);
  const detallesPorVenta = new Map<string, DetalleVenta[]>();

  for (const detalle of detalles) {
    const grupo = detallesPorVenta.get(detalle.ventaId) ?? [];
    grupo.push(detalle);
    detallesPorVenta.set(detalle.ventaId, grupo);
  }

  const filas: VentaCsvRow[] = ventas.flatMap<VentaCsvRow>((venta): VentaCsvRow[] => {
    const detallesVenta = detallesPorVenta.get(venta.id) ?? [];

    if (detallesVenta.length === 0) {
      return [{ venta, detalle: null, producto: null }];
    }

    return detallesVenta.map((detalle) => ({
      venta,
      detalle,
      producto: productosPorId.get(detalle.productoId) ?? null,
    }));
  });

  const csv = crearCsv(
    [
      { header: "venta_id", value: (fila: VentaCsvRow) => fila.venta.id },
      { header: "fecha_hora_real", value: (fila: VentaCsvRow) => fila.venta.fechaHoraReal },
      { header: "fecha_jornada", value: (fila: VentaCsvRow) => fila.venta.fechaJornada },
      { header: "estado", value: (fila: VentaCsvRow) => fila.venta.estado },
      { header: "medio_pago", value: (fila: VentaCsvRow) => fila.venta.medioPago },
      { header: "destino_transferencia", value: (fila: VentaCsvRow) => fila.venta.destinoTransferencia },
      { header: "total_venta", value: (fila: VentaCsvRow) => fila.venta.total },
      { header: "producto", value: (fila: VentaCsvRow) => fila.producto?.nombre },
      { header: "cantidad", value: (fila: VentaCsvRow) => fila.detalle?.cantidad },
      {
        header: "precio_unitario_aplicado",
        value: (fila: VentaCsvRow) => fila.detalle?.precioUnitarioAplicado,
      },
      {
        header: "costo_unitario_al_momento",
        value: (fila: VentaCsvRow) => fila.detalle?.costoUnitarioAlMomento,
      },
      { header: "subtotal_detalle", value: (fila: VentaCsvRow) => fila.detalle?.subtotal },
      { header: "observaciones_venta", value: (fila: VentaCsvRow) => fila.venta.observaciones },
      {
        header: "observaciones_detalle",
        value: (fila: VentaCsvRow) => fila.detalle?.observaciones,
      },
      { header: "motivo_anulacion", value: (fila: VentaCsvRow) => fila.venta.motivoAnulacion },
    ],
    filas,
  );

  return {
    csv,
    fileName: crearNombreArchivoCsv("ventas", fecha),
  };
}

export async function exportarMovimientosCsv(
  fecha: Date = new Date(),
): Promise<ArchivoCsvExportado> {
  const [movimientos, detalles, productos] = await Promise.all([
    db.movimientos.orderBy("fechaHoraReal").reverse().toArray(),
    db.detalleReposiciones.toArray(),
    db.productos.toArray(),
  ]);
  const productosPorId = mapearProductosPorId(productos);
  const detallesPorMovimiento = new Map<string, DetalleReposicion[]>();

  for (const detalle of detalles) {
    const grupo = detallesPorMovimiento.get(detalle.movimientoId) ?? [];
    grupo.push(detalle);
    detallesPorMovimiento.set(detalle.movimientoId, grupo);
  }

  const filas: MovimientoCsvRow[] = movimientos.flatMap<MovimientoCsvRow>((movimiento): MovimientoCsvRow[] => {
    const detallesMovimiento = detallesPorMovimiento.get(movimiento.id) ?? [];

    if (detallesMovimiento.length === 0) {
      return [{ movimiento, detalle: null, producto: null }];
    }

    return detallesMovimiento.map((detalle) => ({
      movimiento,
      detalle,
      producto: productosPorId.get(detalle.productoId) ?? null,
    }));
  });

  const csv = crearCsv(
    [
      { header: "movimiento_id", value: (fila: MovimientoCsvRow) => fila.movimiento.id },
      {
        header: "fecha_hora_real",
        value: (fila: MovimientoCsvRow) => fila.movimiento.fechaHoraReal,
      },
      { header: "fecha_jornada", value: (fila: MovimientoCsvRow) => fila.movimiento.fechaJornada },
      { header: "tipo", value: (fila: MovimientoCsvRow) => fila.movimiento.tipo },
      { header: "estado", value: (fila: MovimientoCsvRow) => fila.movimiento.estado },
      { header: "descripcion", value: (fila: MovimientoCsvRow) => fila.movimiento.descripcion },
      { header: "monto", value: (fila: MovimientoCsvRow) => fila.movimiento.monto },
      { header: "medio_pago", value: (fila: MovimientoCsvRow) => fila.movimiento.medioPago },
      { header: "producto", value: (fila: MovimientoCsvRow) => fila.producto?.nombre },
      { header: "cantidad", value: (fila: MovimientoCsvRow) => fila.detalle?.cantidad },
      { header: "costo_unitario", value: (fila: MovimientoCsvRow) => fila.detalle?.costoUnitario },
      { header: "subtotal_detalle", value: (fila: MovimientoCsvRow) => fila.detalle?.subtotal },
      {
        header: "aporte_externo_incluido",
        value: (fila: MovimientoCsvRow) => fila.movimiento.aporteExternoIncluido,
      },
      { header: "observaciones", value: (fila: MovimientoCsvRow) => fila.movimiento.observaciones },
      {
        header: "motivo_anulacion",
        value: (fila: MovimientoCsvRow) => fila.movimiento.motivoAnulacion,
      },
    ],
    filas,
  );

  return {
    csv,
    fileName: crearNombreArchivoCsv("movimientos", fecha),
  };
}
