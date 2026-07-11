import { lazy, Suspense, type ComponentType } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  type Location,
} from "react-router-dom";

import { Notice, RouteSheet } from "../components/ui";
import { AppLayout } from "../layouts/AppLayout";

function cargarPantalla<T>(
  importar: () => Promise<T>,
  nombre: keyof T,
) {
  return lazy(() =>
    importar().then((modulo) => ({
      default: modulo[nombre] as ComponentType,
    })),
  );
}

const InicioPage = cargarPantalla(
  () => import("../features/reportes/InicioPage"),
  "InicioPage",
);
const VentasPage = cargarPantalla(
  () => import("../features/ventas/VentasPage"),
  "VentasPage",
);
const NuevaVentaPage = cargarPantalla(
  () => import("../features/ventas/NuevaVentaPage"),
  "NuevaVentaPage",
);
const VentaDetallePage = cargarPantalla(
  () => import("../features/ventas/VentaDetallePage"),
  "VentaDetallePage",
);
const ProductosPage = cargarPantalla(
  () => import("../features/productos/ProductosPage"),
  "ProductosPage",
);
const ProductoFormPage = cargarPantalla(
  () => import("../features/productos/ProductoFormPage"),
  "ProductoFormPage",
);
const ProductoDetallePage = cargarPantalla(
  () => import("../features/productos/ProductoDetallePage"),
  "ProductoDetallePage",
);
const CategoriasPage = cargarPantalla(
  () => import("../features/productos/CategoriasPage"),
  "CategoriasPage",
);
const MovimientosPage = cargarPantalla(
  () => import("../features/movimientos/MovimientosPage"),
  "MovimientosPage",
);
const NuevoMovimientoPage = cargarPantalla(
  () => import("../features/movimientos/NuevoMovimientoPage"),
  "NuevoMovimientoPage",
);
const MovimientoDetallePage = cargarPantalla(
  () => import("../features/movimientos/MovimientoDetallePage"),
  "MovimientoDetallePage",
);
const MasPage = cargarPantalla(
  () => import("../features/mas/MasPage"),
  "MasPage",
);
const ReportesPage = cargarPantalla(
  () => import("../features/reportes/ReportesPage"),
  "ReportesPage",
);
const PdfMensualPage = cargarPantalla(
  () => import("../features/reportes/PdfMensualPage"),
  "PdfMensualPage",
);
const ProyeccionesPage = cargarPantalla(
  () => import("../features/proyecciones/ProyeccionesPage"),
  "ProyeccionesPage",
);
const ConfiguracionPage = cargarPantalla(
  () => import("../features/configuracion/ConfiguracionPage"),
  "ConfiguracionPage",
);
const ModoConfiguracionPage = cargarPantalla(
  () => import("../features/configuracion/ModoConfiguracionPage"),
  "ModoConfiguracionPage",
);
const RespaldosPage = cargarPantalla(
  () => import("../features/configuracion/RespaldosPage"),
  "RespaldosPage",
);
const ExportacionesPage = cargarPantalla(
  () => import("../features/configuracion/ExportacionesPage"),
  "ExportacionesPage",
);

function CargandoRuta() {
  return <Notice>Cargando pantalla...</Notice>;
}

export function AppRouter() {
  const location = useLocation();
  const backgroundLocation = (
    location.state as { backgroundLocation?: Location } | null
  )?.backgroundLocation;

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md px-4 pt-5">
          <CargandoRuta />
        </div>
      }
    >
      <Routes location={backgroundLocation ?? location}>
        <Route element={<AppLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="ventas/nueva" element={<NuevaVentaPage />} />
          <Route path="ventas/:ventaId" element={<VentaDetallePage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="productos/nuevo" element={<ProductoFormPage />} />
          <Route path="productos/categorias" element={<CategoriasPage />} />
          <Route path="productos/:productoId" element={<ProductoDetallePage />} />
          <Route
            path="productos/:productoId/editar"
            element={<ProductoFormPage />}
          />
          <Route path="movimientos" element={<MovimientosPage />} />
          <Route path="movimientos/nuevo" element={<NuevoMovimientoPage />} />
          <Route
            path="movimientos/:movimientoId"
            element={<MovimientoDetallePage />}
          />
          <Route path="mas" element={<MasPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="reportes/pdf-mensual" element={<PdfMensualPage />} />
          <Route path="proyecciones" element={<ProyeccionesPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route
            path="configuracion/modo"
            element={<ModoConfiguracionPage />}
          />
          <Route
            path="configuracion/respaldos"
            element={<RespaldosPage />}
          />
          <Route
            path="configuracion/exportaciones"
            element={<ExportacionesPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route
            path="ventas/:ventaId"
            element={
              <RouteSheet label="Detalle de venta">
                <VentaDetallePage />
              </RouteSheet>
            }
          />
          <Route
            path="productos/:productoId"
            element={
              <RouteSheet label="Detalle del producto">
                <ProductoDetallePage />
              </RouteSheet>
            }
          />
          <Route
            path="movimientos/:movimientoId"
            element={
              <RouteSheet label="Detalle del movimiento">
                <MovimientoDetallePage />
              </RouteSheet>
            }
          />
        </Routes>
      )}
    </Suspense>
  );
}