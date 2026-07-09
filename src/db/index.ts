export {
  activarCategoria,
  actualizarCategoria,
  categoriaTieneProductos,
  crearCategoria,
  desactivarCategoria,
  eliminarCategoria,
  listarCategorias,
} from "./categorias";
export { obtenerConfiguracion, actualizarRolDispositivo } from "./configuracion";
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
  listarMovimientosConDetalles,
  registrarMovimiento,
} from "./movimientos";
export type {
  DetalleReposicionConProducto,
  MovimientoConDetalles,
} from "./movimientos";
export { db } from "./schema";
export { anularVenta, listarVentasConDetalles, registrarVenta } from "./ventas";
export type { VentaConDetalles, DetalleVentaConProducto } from "./ventas";