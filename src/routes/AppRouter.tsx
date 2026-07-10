import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Notice } from "../components/ui";
import { AppLayout } from "../layouts/AppLayout";

const InicioPage = lazy(() => import("../features/reportes/InicioPage").then((m) => ({ default: m.InicioPage })));
const VentasPage = lazy(() => import("../features/ventas/VentasPage").then((m) => ({ default: m.VentasPage })));
const NuevaVentaPage = lazy(() => import("../features/ventas/NuevaVentaPage").then((m) => ({ default: m.NuevaVentaPage })));
const VentaDetallePage = lazy(() => import("../features/ventas/VentaDetallePage").then((m) => ({ default: m.VentaDetallePage })));
const ProductosPage = lazy(() => import("../features/productos/ProductosPage").then((m) => ({ default: m.ProductosPage })));
const ProductoFormPage = lazy(() => import("../features/productos/ProductoFormPage").then((m) => ({ default: m.ProductoFormPage })));
const ProductoDetallePage = lazy(() => import("../features/productos/ProductoDetallePage").then((m) => ({ default: m.ProductoDetallePage })));
const CategoriasPage = lazy(() => import("../features/productos/CategoriasPage").then((m) => ({ default: m.CategoriasPage })));
const MovimientosPage = lazy(() => import("../features/movimientos/MovimientosPage").then((m) => ({ default: m.MovimientosPage })));
const NuevoMovimientoPage = lazy(() => import("../features/movimientos/NuevoMovimientoPage").then((m) => ({ default: m.NuevoMovimientoPage })));
const MovimientoDetallePage = lazy(() => import("../features/movimientos/MovimientoDetallePage").then((m) => ({ default: m.MovimientoDetallePage })));
const MasPage = lazy(() => import("../features/mas/MasPage").then((m) => ({ default: m.MasPage })));
const ReportesPage = lazy(() => import("../features/reportes/ReportesPage").then((m) => ({ default: m.ReportesPage })));
const PdfMensualPage = lazy(() => import("../features/reportes/PdfMensualPage").then((m) => ({ default: m.PdfMensualPage })));
const ProyeccionesPage = lazy(() => import("../features/proyecciones/ProyeccionesPage").then((m) => ({ default: m.ProyeccionesPage })));
const ConfiguracionPage = lazy(() => import("../features/configuracion/ConfiguracionPage").then((m) => ({ default: m.ConfiguracionPage })));
const ModoConfiguracionPage = lazy(() => import("../features/configuracion/ModoConfiguracionPage").then((m) => ({ default: m.ModoConfiguracionPage })));
const RespaldosPage = lazy(() => import("../features/configuracion/RespaldosPage").then((m) => ({ default: m.RespaldosPage })));
const ExportacionesPage = lazy(() => import("../features/configuracion/ExportacionesPage").then((m) => ({ default: m.ExportacionesPage })));

function CargandoRuta() {
  return <Notice>Cargando pantalla...</Notice>;
}

export function AppRouter() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-md px-4 pt-5"><CargandoRuta /></div>}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="ventas/nueva" element={<NuevaVentaPage />} />
          <Route path="ventas/:ventaId" element={<VentaDetallePage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="productos/nuevo" element={<ProductoFormPage />} />
          <Route path="productos/categorias" element={<CategoriasPage />} />
          <Route path="productos/:productoId" element={<ProductoDetallePage />} />
          <Route path="productos/:productoId/editar" element={<ProductoFormPage />} />
          <Route path="movimientos" element={<MovimientosPage />} />
          <Route path="movimientos/nuevo" element={<NuevoMovimientoPage />} />
          <Route path="movimientos/:movimientoId" element={<MovimientoDetallePage />} />
          <Route path="mas" element={<MasPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="reportes/pdf-mensual" element={<PdfMensualPage />} />
          <Route path="proyecciones" element={<ProyeccionesPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="configuracion/modo" element={<ModoConfiguracionPage />} />
          <Route path="configuracion/respaldos" element={<RespaldosPage />} />
          <Route path="configuracion/exportaciones" element={<ExportacionesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
