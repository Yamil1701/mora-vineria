export {
  activarCategoria,
  actualizarCategoria,
  categoriaTieneProductos,
  crearCategoria,
  desactivarCategoria,
  eliminarCategoria,
  listarCategorias,
} from "./categorias";
export {
  crearBackupJson,
  leerBackupJson,
  restaurarBackupJson,
} from "./backups";
export { obtenerConfiguracion, actualizarModoDispositivo } from "./configuracion";
export {
  exportarMovimientosCsv,
  exportarProductosCsv,
  exportarVentasCsv,
} from "./exportacionesCsv";
export type { ArchivoCsvExportado } from "./exportacionesCsv";
export { inicializarBaseLocal } from "./migrations";
export {
  activarProducto,
  actualizarProducto,
  crearProducto,
  desactivarProducto,
  eliminarProducto,
  listarCategoriasActivas,
  listarProductos,
  productoTieneHistorial,
} from "./productos";
export {
  anularMovimiento,
  eliminarMovimientoAnulado,
  listarMovimientosConDetalles,
  registrarMovimiento,
} from "./movimientos";
export type {
  DetalleReposicionConProducto,
  MovimientoConDetalles,
} from "./movimientos";
export { db } from "./schema";
export {
  guardarMetaMensual,
  obtenerMetaMensual,
  obtenerProyeccionMensualActual,
} from "./proyecciones";
export type { ProyeccionMensualActual } from "./proyecciones";
export { obtenerResumenPorRango, obtenerResumenesDashboard } from "./reportes";
export type { ResumenesDashboard } from "./reportes";
export { anularVenta, listarVentasConDetalles, registrarVenta } from "./ventas";
export type { VentaConDetalles, DetalleVentaConProducto } from "./ventas";
