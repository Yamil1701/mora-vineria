import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { ConfiguracionPage } from "../features/configuracion/ConfiguracionPage";
import { InicioPage } from "../features/reportes/InicioPage";
import { MovimientosPage } from "../features/movimientos/MovimientosPage";
import { ProductosPage } from "../features/productos/ProductosPage";
import { ProyeccionesPage } from "../features/proyecciones/ProyeccionesPage";
import { PdfMensualPage } from "../features/reportes/PdfMensualPage";
import { ReportesPage } from "../features/reportes/ReportesPage";
import { VentasPage } from "../features/ventas/VentasPage";
import { NuevaVentaPage } from "../features/ventas/NuevaVentaPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<InicioPage />} />
        <Route path="ventas" element={<VentasPage />} />
        <Route path="ventas/nueva" element={<NuevaVentaPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="movimientos" element={<MovimientosPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="reportes/pdf-mensual" element={<PdfMensualPage />} />
        <Route path="proyecciones" element={<ProyeccionesPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}