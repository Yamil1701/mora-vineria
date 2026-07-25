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
  obtenerUltimoRespaldo,
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
  listarUnidadesVendidasPorProducto,
  obtenerEstadisticasCostosProductos,
  obtenerEstadisticasProducto,
  obtenerProducto,
  productoTieneHistorial,
} from "./productos";
export type {
  EstadisticasCostosProducto,
  EstadisticasProducto,
} from "./productos";
export {
  anularMovimiento,
  actualizarReposicionPendiente,
  confirmarReposicion,
  eliminarMovimientoAnulado,
  listarMovimientosConDetalles,
  obtenerMovimientoConDetalles,
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
export {
  anularCobroVenta,
  anularVenta,
  listarVentasConDetalles,
  obtenerVentaConDetalles,
  registrarCobroVenta,
  registrarVenta,
} from "./ventas";
export type { VentaConDetalles, DetalleVentaConProducto } from "./ventas";
export {
  agregarCuentaTesoreria,
  configurarTesoreria,
  listarCuentasTesoreria,
  obtenerResumenTesoreria,
  registrarConteoCaja,
  registrarMovimientoTesoreriaAutomatico,
  registrarOperacionTesoreria,
  resolverCuentaTesoreriaParaPago,
  revertirMovimientosTesoreriaPorReferencia,
} from "./tesoreria";
export {
  encolarOperacionSincronizacion,
  encolarCambioCatalogoLocal,
  encolarOperacionOperativaLocal,
  notificarSincronizacionPendiente,
  aplicarCambiosCatalogoRemotos,
  aplicarCambiosOperativosRemotos,
  calcularStockLocalConPendientes,
  actualizarBaseDeOperacionesPendientes,
  contarOperacionesPendientes,
  guardarVersionEntidad,
  marcarOperacionConError,
  marcarOperacionEnviando,
  marcarOperacionSincronizada,
  marcarOperacionConConflicto,
  obtenerVersionEntidad,
  reemplazarCatalogoDesdeSnapshot,
  guardarConflictoSincronizacion,
  guardarEstadoSincronizacion,
  guardarVinculoDispositivo,
  listarConflictosPendientes,
  marcarConflictoLocalResuelto,
  listarOperacionesPendientes,
  obtenerEstadoSincronizacion,
  obtenerVinculoDispositivo,
  quitarVinculoDispositivo,
} from "./sincronizacion";
