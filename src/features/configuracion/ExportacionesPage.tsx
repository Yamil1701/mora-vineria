import { useNavigate } from "react-router-dom";

import { Button, Notice, Panel, TaskHeader } from "../../components/ui";
import { useExportacionCsv } from "../../hooks/useExportacionCsv";

export function ExportacionesPage() {
  const navigate = useNavigate();
  const { estadoCsv, mensajeCsv, errorCsv, exportarProductosCsv, exportarVentasCsv, exportarMovimientosCsv } = useExportacionCsv();
  const procesando = estadoCsv === "procesando";
  return <section className="space-y-5"><TaskHeader title="Exportar CSV" description="Archivos auxiliares para revisar datos en una planilla." backLabel="Configuración" onBack={() => navigate("/configuracion")} /><Notice>El CSV no sirve para restaurar la app. El respaldo completo sigue siendo el archivo JSON.</Notice>{mensajeCsv && <Notice tone="success">{mensajeCsv}</Notice>}{errorCsv && <Notice tone="danger">{errorCsv}</Notice>}<Panel className="space-y-3"><Button variant="secondary" size="lg" fullWidth disabled={procesando} onClick={() => void exportarProductosCsv()}>Exportar productos</Button><Button variant="secondary" size="lg" fullWidth disabled={procesando} onClick={() => void exportarVentasCsv()}>Exportar ventas</Button><Button variant="secondary" size="lg" fullWidth disabled={procesando} onClick={() => void exportarMovimientosCsv()}>Exportar movimientos</Button></Panel></section>;
}
