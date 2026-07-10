import { AvisoDatosLocales } from "../../components/AvisoDatosLocales";
import { ActionCard, ButtonLink, EmptyState, Notice, Page, PageHeader, SectionHeader, SummaryCard } from "../../components/ui";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";

export function InicioPage() {
  const { resumenes, cargando, error } = useResumenes();
  const productoMasVendido = resumenes?.mes.productosMasVendidos[0];

  return (
    <Page>
      <PageHeader
        eyebrow="Mora Vinería"
        title="Resumen de hoy"
        description="Este resumen toma las ventas desde las 08:00 hasta las 07:59 del día siguiente."
        action={(
          <ButtonLink to="/ventas/nueva" size="lg" fullWidth>
            Nueva venta
          </ButtonLink>
        )}
      />

      {cargando && <Notice>Cargando resumen...</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      {resumenes && (
        <>
          <section className="grid gap-3">
            <SummaryCard
              label="Ventas de hoy"
              value={formatearPesos(resumenes.hoy.totalVendido)}
              detail={`${resumenes.hoy.cantidadVentas} venta${resumenes.hoy.cantidadVentas === 1 ? "" : "s"}`}
            />

            <SummaryCard
              label="Ganancia estimada de hoy"
              value={formatearPesos(resumenes.hoy.gananciaBrutaEstimada)}
              detail="Según el costo cargado en cada producto."
            />

            <SummaryCard
              label="Movimientos de hoy"
              value={formatearPesos(
                resumenes.hoy.reinversion +
                  resumenes.hoy.aportesExternos +
                  resumenes.hoy.gastosPuntuales,
              )}
              detail={`${resumenes.hoy.cantidadMovimientos} movimiento${resumenes.hoy.cantidadMovimientos === 1 ? "" : "s"}`}
            />
          </section>

          <section className="grid grid-cols-2 gap-3">
            <SummaryCard
              compact
              label="Ventas de la semana"
              value={formatearPesos(resumenes.semana.totalVendido)}
            />
            <SummaryCard
              compact
              label="Ganancia semanal"
              value={formatearPesos(resumenes.semana.gananciaBrutaEstimada)}
            />
            <SummaryCard
              compact
              label="Ventas del mes"
              value={formatearPesos(resumenes.mes.totalVendido)}
            />
            <SummaryCard
              compact
              label="Ganancia del mes"
              value={formatearPesos(resumenes.mes.gananciaNetaEstimada)}
              detail="Descuenta gastos puntuales."
            />
          </section>

          <SummaryCard
            label="Movimientos del mes"
            value={formatearPesos(
              resumenes.mes.reinversion +
                resumenes.mes.aportesExternos +
                resumenes.mes.gastosPuntuales,
            )}
            detail={`${resumenes.mes.cantidadMovimientos} movimiento${resumenes.mes.cantidadMovimientos === 1 ? "" : "s"} · Reinversión, aportes y gastos por separado en Reportes.`}
          />

          {productoMasVendido ? (
            <SummaryCard
              label="Producto más vendido del mes"
              value={productoMasVendido.nombre}
              detail={`${productoMasVendido.cantidad} unidad${productoMasVendido.cantidad === 1 ? "" : "es"} · ${formatearPesos(productoMasVendido.totalVendido)}`}
            />
          ) : (
            <EmptyState
              title="Todavía no hay ventas este mes."
              description="Cuando cargues ventas, acá va a aparecer el producto más vendido."
            />
          )}
        </>
      )}

      <section className="space-y-3">
        <SectionHeader
          title="Accesos rápidos"
          description="Entradas útiles sin cambiar la barra principal."
        />

        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            to="/movimientos"
            title="Movimientos"
            description="Reposición, aportes y gastos puntuales."
          />
          <ActionCard
            to="/productos"
            title="Productos"
            description="Precios, stock y categorías."
          />
          <ActionCard
            to="/proyecciones"
            title="Proyecciones"
            description="Guía orientativa del mes."
          />
          <ActionCard
            to="/configuracion"
            title="Datos"
            description="Respaldos, CSV y modo del celular."
          />
        </div>
      </section>

      <AvisoDatosLocales />
    </Page>
  );
}
