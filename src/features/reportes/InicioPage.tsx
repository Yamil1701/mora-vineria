import { Link } from "react-router-dom";

import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import { ActionCard, EmptyState, Notice, Page, PageHeader, SectionHeader, SummaryCard } from "../../components/ui";
import { calcularEstadoStock } from "../../domain/productos";
import { useProductos } from "../../hooks/useProductos";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";

export function InicioPage() {
  const { resumenes, cargando, error } = useResumenes();
  const { productos, cargando: cargandoProductos } = useProductos(false);
  const productosConAlerta = productos
    .filter((producto) => calcularEstadoStock(producto.stockActual, producto.stockObjetivo) !== "disponible")
    .sort((a, b) => a.stockActual - b.stockActual);

  return (
    <Page>
      <PageHeader
        eyebrow="Mora Vinería"
        title="Hoy"
        description="Lo importante de la jornada y las próximas acciones."
      />

      {cargando && <Notice>Cargando el resumen...</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      {resumenes && (
        <section className="grid grid-cols-2 gap-3" aria-label="Resumen de hoy">
          <SummaryCard compact label="Vendido" value={formatearPesos(resumenes.hoy.totalVendido)} detail={`${resumenes.hoy.cantidadVentas} venta${resumenes.hoy.cantidadVentas === 1 ? "" : "s"}`} />
          <SummaryCard compact label="Ganancia estimada" value={formatearPesos(resumenes.hoy.gananciaBrutaEstimada)} />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <SectionHeader title="Stock que necesita atención" description={`${productosConAlerta.length} producto${productosConAlerta.length === 1 ? "" : "s"}`} />
          <Link to="/productos" className="inline-flex min-h-12 items-center px-2 text-sm font-semibold text-mora-suave">Ver todos</Link>
        </div>
        {cargandoProductos && <Notice>Cargando stock...</Notice>}
        {!cargandoProductos && productosConAlerta.length === 0 && <EmptyState title="El stock está en orden." description="No hay productos bajos o sin stock." />}
        <div className="space-y-2">
          {productosConAlerta.slice(0, 4).map((producto) => (
            <Link key={producto.id} to={`/productos/${producto.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99]">
              <span><span className="block font-semibold">{producto.nombre}</span><span className="mt-1 block text-xs text-white/50">{producto.stockActual} de {producto.stockObjetivo} unidades objetivo</span></span>
              <EstadoStockBadge stockActual={producto.stockActual} stockObjetivo={producto.stockObjetivo} />
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Continuar" />
        <div className="grid grid-cols-2 gap-3">
          <ActionCard to="/ventas" title="Ver ventas" description="Historial y detalles." />
          <ActionCard to="/movimientos" title="Movimientos" description="Reposiciones, aportes y gastos." />
          <ActionCard to="/reportes" title="Reportes" description="Semana, mes y períodos." />
          <ActionCard to="/mas" title="Más opciones" description="Análisis y configuración." />
        </div>
      </section>
    </Page>
  );
}
