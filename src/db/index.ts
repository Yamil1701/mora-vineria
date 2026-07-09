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
export { db } from "./schema";
export { listarVentasConDetalles, registrarVenta } from "./ventas";
export type { VentaConDetalles, DetalleVentaConProducto } from "./ventas";