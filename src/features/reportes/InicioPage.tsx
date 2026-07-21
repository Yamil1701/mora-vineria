import { Link } from "react-router-dom";

import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import { BrandEyebrow } from "../../components/Brand";
import { ActionCard, ButtonLink, DelayedFallback, EmptyState, ErrorState, ListSkeleton, Notice, Page, PageHeader, SectionHeader, Skeleton, SummaryCard } from "../../components/ui";
import { calcularEstadoStock } from "../../domain/productos";
import { useProductos } from "../../hooks/useProductos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";
import { usePreferenciasUi } from "../../stores/preferenciasUi";

function obtenerMesAnterior(fechaJornada: string) {
  const [anio, mes, dia] = fechaJornada.split("-").map(Number);
  if (!anio || !mes || !dia) return null;
  const fecha = new Date(anio, mes - 2, 1);
  return {
    id: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`,
    label: new Intl.DateTimeFormat("es-AR", { month: "long" }).format(fecha),
  };
}

export function InicioPage() {
  const { resumenes, cargando, error, recargar } = useResumenes();
  const { configuracion } = useConfiguracionLocal();
  const { productos, cargando: cargandoProductos, error: errorProductos, recargar: recargarProductos } = useProductos(false);
  const productosConAlerta = productos
    .filter((producto) => calcularEstadoStock(producto.stockActual, producto.stockObjetivo) !== "disponible")
    .sort((a, b) => a.stockActual - b.stockActual);
  const ultimoPdfMensualAtendido = usePreferenciasUi((estado) => estado.ultimoPdfMensualAtendido);
  const marcarPdfMensualAtendido = usePreferenciasUi((estado) => estado.marcarPdfMensualAtendido);
  const mesParaPdf = resumenes ? obtenerMesAnterior(resumenes.fechaJornadaActual) : null;
  const mostrarAvisoPdf = Boolean(mesParaPdf && mesParaPdf.id !== ultimoPdfMensualAtendido);

  return (
    <Page>
      <PageHeader
        eyebrow={<BrandEyebrow />}
        title="Hoy"
        description="Lo importante de la jornada y las próximas acciones."
      />

      {cargando && <DelayedFallback><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div></DelayedFallback>}
      {error && <ErrorState message={error} onRetry={() => void recargar()} />}
      {!cargando && !cargandoProductos && configuracion?.deviceRole === "consulta" && productos.length === 0 && resumenes?.hoy.cantidadVentas === 0 && <Notice><div className="space-y-3"><p>Este celular todavía no tiene una copia para consultar.</p><ButtonLink size="sm" variant="secondary" to="/configuracion/respaldos">Importar respaldo</ButtonLink></div></Notice>}
      {resumenes && (
        <section className="grid grid-cols-2 gap-3" aria-label="Resumen de hoy">
          <SummaryCard compact label="Vendido" value={formatearPesos(resumenes.hoy.totalVendido)} detail={`${resumenes.hoy.cantidadVentas} venta${resumenes.hoy.cantidadVentas === 1 ? "" : "s"}`} />
          <SummaryCard compact label="Ganancia estimada" value={formatearPesos(resumenes.hoy.gananciaBrutaEstimada)} />
        </section>
      )}

      {configuracion?.deviceRole === "principal" && (
        <ButtonLink to="/ventas/nueva" size="lg" fullWidth>
          Nueva venta
        </ButtonLink>
      )}

      {mostrarAvisoPdf && mesParaPdf && <Notice><div className="space-y-3"><div><p className="font-semibold">El informe de {mesParaPdf.label} ya está listo</p><p className="mt-1 text-sm text-white/60">Podés prepararlo desde Reportes cuando tengas un momento.</p></div><div className="grid grid-cols-[1fr_1.5fr] gap-2"><button type="button" onClick={() => marcarPdfMensualAtendido(mesParaPdf.id)} className="min-h-12 rounded-2xl px-3 text-xs font-semibold text-white/65">Descartar</button><Link to="/reportes#pdf-mensual" onClick={() => marcarPdfMensualAtendido(mesParaPdf.id)} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-mora-principal px-3 text-xs font-semibold text-white">Ir a Reportes</Link></div></div></Notice>}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <SectionHeader title="Stock que necesita atención" description={`${productosConAlerta.length} producto${productosConAlerta.length === 1 ? "" : "s"}`} />
          <Link to="/productos" className="inline-flex min-h-12 items-center px-2 text-sm font-semibold text-mora-suave">Ver todos</Link>
        </div>
        {cargandoProductos && <DelayedFallback><ListSkeleton rows={2} /></DelayedFallback>}
        {errorProductos && <ErrorState message={errorProductos} onRetry={() => void recargarProductos()} />}
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
