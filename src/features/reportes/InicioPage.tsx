import { Link, useLocation } from "react-router-dom";

import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import { ActionCard, ButtonLink, DelayedFallback, EmptyState, ErrorState, Icon, ListSkeleton, Notice, Page, PageHeader, SectionHeader, Skeleton } from "../../components/ui";
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
  const location = useLocation();
  const { resumenes, cargando, error, recargar } = useResumenes();
  const { configuracion } = useConfiguracionLocal();
  const { productos, cargando: cargandoProductos, error: errorProductos, recargar: recargarProductos } = useProductos(false);
  const productosConAlerta = productos
    .filter((producto) => calcularEstadoStock(producto.stockActual, producto.stockObjetivo) !== "disponible")
    .sort((a, b) => a.stockActual / Math.max(1, a.stockObjetivo) - b.stockActual / Math.max(1, b.stockObjetivo));
  const ultimoPdfMensualAtendido = usePreferenciasUi((estado) => estado.ultimoPdfMensualAtendido);
  const marcarPdfMensualAtendido = usePreferenciasUi((estado) => estado.marcarPdfMensualAtendido);
  const mesParaPdf = resumenes ? obtenerMesAnterior(resumenes.fechaJornadaActual) : null;
  const mostrarAvisoPdf = Boolean(mesParaPdf && mesParaPdf.id !== ultimoPdfMensualAtendido);

  return (
    <Page>
      <PageHeader
        title="Resumen de hoy"
        description={resumenes ? new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${resumenes.fechaJornadaActual}T12:00:00`)) : undefined}
      />

      {cargando && <DelayedFallback><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div></DelayedFallback>}
      {error && <ErrorState message={error} onRetry={() => void recargar()} />}
      {!cargando && !cargandoProductos && configuracion?.deviceRole === "consulta" && productos.length === 0 && resumenes?.hoy.cantidadVentas === 0 && <Notice><div className="space-y-3"><p>Este celular todavía no tiene una copia para consultar.</p><ButtonLink size="sm" variant="secondary" to="/configuracion/respaldos">Importar respaldo</ButtonLink></div></Notice>}
      {resumenes && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-mora-superficie" aria-label="Resumen de hoy">
          <div className="p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-medium text-white/70">Vendido hoy</h2><Link to="/ventas" className="inline-flex min-h-12 items-center gap-1 text-sm font-medium text-mora-suave">{resumenes.hoy.cantidadVentas} {resumenes.hoy.cantidadVentas === 1 ? "venta" : "ventas"}<Icon name="siguiente" className="h-4 w-4" /></Link></div>
            <p className="mora-money mora-hero-value font-bold text-mora-suave">{formatearPesos(resumenes.hoy.totalVendido)}</p>
          </div>
          <dl className="grid grid-cols-2 border-t border-white/10">
            <div className="min-w-0 border-r border-white/10 p-4"><dt className="text-sm text-white/70">Cobrado hoy</dt><dd className="mora-money mt-1 text-xl font-semibold">{formatearPesos(resumenes.hoy.totalCobrado)}<p className="mt-1 text-xs font-normal tracking-normal text-white/65">Dinero recibido, incluso de fiados anteriores.</p></dd></div>
            <div className="min-w-0 p-4"><dt className="text-sm text-white/70">Vendido fiado hoy</dt><dd className="mora-money mt-1 text-xl font-semibold">{formatearPesos(resumenes.hoy.vendidoFiado)}<p className="mt-1 text-xs font-normal tracking-normal text-white/65">Ventas con pago pendiente o parcial.</p></dd></div>
          </dl>
        </section>
      )}

      {configuracion?.deviceRole === "principal" && (
        <ButtonLink to="/ventas/nueva" size="lg" fullWidth leftIcon={<Icon name="agregar" />}>
          Nueva venta
        </ButtonLink>
      )}

      {mostrarAvisoPdf && mesParaPdf && <Notice><div className="space-y-2"><div><p className="font-semibold">El informe de {mesParaPdf.label} ya está listo</p><p className="mt-1 text-sm text-white/60">Podés prepararlo desde Reportes cuando tengas un momento.</p></div><div className="grid grid-cols-[1fr_1.5fr] gap-2"><button type="button" onClick={() => marcarPdfMensualAtendido(mesParaPdf.id)} className="min-h-12 rounded-2xl px-3 text-xs font-semibold text-white/65 transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave">Descartar</button><Link to="/reportes#pdf-mensual" onClick={() => marcarPdfMensualAtendido(mesParaPdf.id)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-mora-suave">Ir a Reportes</Link></div></div></Notice>}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <SectionHeader title="Stock para revisar" description={`${productosConAlerta.length} producto${productosConAlerta.length === 1 ? "" : "s"}`} />
          <Link to="/productos?stock=bajo" className="inline-flex min-h-12 items-center rounded-2xl px-2 text-sm font-semibold text-mora-suave transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave">Ver todos</Link>
        </div>
        {cargandoProductos && <DelayedFallback><ListSkeleton rows={2} /></DelayedFallback>}
        {errorProductos && <ErrorState message={errorProductos} onRetry={() => void recargarProductos()} />}
        {!cargandoProductos && productosConAlerta.length === 0 && <EmptyState title={productos.length ? "El stock está en orden." : "Tu catálogo empieza acá."} description={productos.length ? "No hay productos bajos o sin stock." : "Agregá productos para ver acá cuáles necesitan reposición."} action={!productos.length && configuracion?.deviceRole === "principal" ? <ButtonLink to="/productos/nuevo" variant="secondary">Agregar productos</ButtonLink> : undefined} />}
        <div className="space-y-2">
          {productosConAlerta.slice(0, 4).map((producto) => (
            <Link key={producto.id} to={`/productos/${producto.id}`} state={{ backgroundLocation: location }} className="mora-list-row flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99]">
              <span className="min-w-0"><span className="block break-words font-semibold">{producto.nombre}</span><span className="mt-1 block text-xs text-white/65">{producto.stockActual} de {producto.stockObjetivo} unidades objetivo</span></span>
              <EstadoStockBadge stockActual={producto.stockActual} stockObjetivo={producto.stockObjetivo} />
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Dinero y mercadería" />
        <div>
          <ActionCard to="/tesoreria" title="Tesorería" description="Cuánto hay y en qué cuentas." icon={<Icon name="tesoreria" />} />
          <ActionCard to="/movimientos" title="Movimientos" description="Reposiciones, aportes y gastos." icon={<Icon name="movimientos" />} />
        </div>
      </section>
    </Page>
  );
}
