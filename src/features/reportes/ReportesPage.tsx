import { useEffect, useState, type FormEvent } from "react";

import { Button, ButtonLink, CardList, EmptyState, Input, Notice, Page, PageHeader, Panel, SectionHeader, SummaryCard } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { obtenerResumenPorRango } from "../../db";
import type { RangoFechas, ResumenConRanking } from "../../domain/reportes";
import type { MedioPago } from "../../domain/ventas";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";

function obtenerMedioPagoLabel(value: MedioPago): string {
  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

function RangoTexto({ desde, hasta }: RangoFechas) {
  return <span className="text-xs text-white/45">{desde === hasta ? desde : `${desde} al ${hasta}`}</span>;
}

function ResumenMetricas({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard compact label="Total vendido" value={formatearPesos(resumen.totalVendido)} />
      <SummaryCard compact label="Costo estimado" value={formatearPesos(resumen.costoEstimadoVendido)} />
      <SummaryCard compact label="Ganancia bruta" value={formatearPesos(resumen.gananciaBrutaEstimada)} />
      <SummaryCard compact label="Ganancia neta" value={formatearPesos(resumen.gananciaNetaEstimada)} />
      <SummaryCard compact label="Reinversión" value={formatearPesos(resumen.reinversion)} />
      <SummaryCard compact label="Gastos puntuales" value={formatearPesos(resumen.gastosPuntuales)} />
      <SummaryCard compact label="Aportes externos" value={formatearPesos(resumen.aportesExternos)} />
      <SummaryCard compact label="Ventas" value={String(resumen.cantidadVentas)} />
    </div>
  );
}

function RankingProductos({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <Panel className="space-y-3">
      <SectionHeader title="Productos más vendidos" />
      {resumen.productosMasVendidos.length === 0 ? (
        <EmptyState title="Todavía no hay productos vendidos en este período." />
      ) : (
        <CardList>
          {resumen.productosMasVendidos.slice(0, 5).map((producto) => (
            <div
              key={producto.productoId}
              className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"
            >
              <span className="text-white/75">{producto.nombre}</span>
              <span className="font-semibold text-white">
                {producto.cantidad} u. · {formatearPesos(producto.totalVendido)}
              </span>
            </div>
          ))}
        </CardList>
      )}
    </Panel>
  );
}

function RankingMediosPago({ resumen }: { resumen: ResumenConRanking }) {
  return (
    <Panel className="space-y-3">
      <SectionHeader title="Medios de pago" />
      {resumen.mediosPagoMasUsados.length === 0 ? (
        <EmptyState title="Todavía no hay medios de pago para mostrar." />
      ) : (
        <CardList>
          {resumen.mediosPagoMasUsados.map((medio) => (
            <div
              key={medio.medioPago}
              className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"
            >
              <span className="text-white/75">{obtenerMedioPagoLabel(medio.medioPago)}</span>
              <span className="font-semibold text-white">
                {medio.cantidadVentas} venta{medio.cantidadVentas === 1 ? "" : "s"} · {formatearPesos(medio.totalVendido)}
              </span>
            </div>
          ))}
        </CardList>
      )}
    </Panel>
  );
}

function ReportePersonalizado({ rangoInicial }: { rangoInicial: RangoFechas }) {
  const [desde, setDesde] = useState(rangoInicial.desde);
  const [hasta, setHasta] = useState(rangoInicial.hasta);
  const [resultado, setResultado] = useState<ResumenConRanking | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDesde(rangoInicial.desde);
    setHasta(rangoInicial.hasta);
  }, [rangoInicial.desde, rangoInicial.hasta]);

  async function consultarRango(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCargando(true);
      setError(null);
      const resumen = await obtenerResumenPorRango({ desde, hasta });
      setResultado(resumen);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo consultar ese rango.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <Panel className="space-y-3">
      <SectionHeader
        title="Rango personalizado"
        description="Elegí fechas para revisar ventas, movimientos y ganancia estimada."
      />

      <form className="space-y-3" onSubmit={(event) => void consultarRango(event)}>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm text-white/70">
            <span>Desde</span>
            <Input
              type="date"
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
              required
            />
          </label>
          <label className="space-y-1 text-sm text-white/70">
            <span>Hasta</span>
            <Input
              type="date"
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
              required
            />
          </label>
        </div>

        <Button type="submit" disabled={cargando} fullWidth>
          {cargando ? "Consultando..." : "Consultar rango"}
        </Button>
      </form>

      {error && <Notice tone="danger">{error}</Notice>}

      {resultado && (
        <div className="space-y-3 pt-2">
          <ResumenMetricas resumen={resultado} />
          <RankingProductos resumen={resultado} />
          <RankingMediosPago resumen={resultado} />
        </div>
      )}
    </Panel>
  );
}

export function ReportesPage() {
  const { resumenes, cargando, error } = useResumenes();

  return (
    <Page>
      <PageHeader
        title="Reportes"
        description="Resumen simple de ventas, movimientos y ganancia estimada."
        action={(
          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink variant="secondary" to="/reportes/pdf-mensual">
              Preparar PDF mensual
            </ButtonLink>
            <ButtonLink variant="secondary" to="/proyecciones">
              Ver proyecciones
            </ButtonLink>
          </div>
        )}
      />

      {cargando && <Notice>Cargando reportes...</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      {resumenes && (
        <>
          <section className="space-y-3">
            <SectionHeader
              title="Resumen de hoy"
              description={<RangoTexto desde={resumenes.rangoHoy.desde} hasta={resumenes.rangoHoy.hasta} />}
            />
            <ResumenMetricas resumen={resumenes.hoy} />
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Semana del mes"
              description={<RangoTexto desde={resumenes.rangoSemana.desde} hasta={resumenes.rangoSemana.hasta} />}
            />
            <ResumenMetricas resumen={resumenes.semana} />
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Mes actual"
              description={<RangoTexto desde={resumenes.rangoMes.desde} hasta={resumenes.rangoMes.hasta} />}
            />
            <ResumenMetricas resumen={resumenes.mes} />
          </section>

          <RankingProductos resumen={resumenes.mes} />
          <RankingMediosPago resumen={resumenes.mes} />
          <ReportePersonalizado rangoInicial={resumenes.rangoMes} />

          <Notice>
            La ganancia es estimada. Depende del costo de compra cargado en cada producto y de que las ventas y movimientos estén al día.
          </Notice>
        </>
      )}
    </Page>
  );
}
