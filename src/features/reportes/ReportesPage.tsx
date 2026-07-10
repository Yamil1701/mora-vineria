import { useEffect, useState, type FormEvent } from "react";

import { Button, ButtonLink, CardList, EmptyState, Input, Notice, Page, PageHeader, Panel, SectionHeader, Select, SummaryCard } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { obtenerResumenPorRango } from "../../db";
import type { RangoFechas, ResumenConRanking, SemanaDelMes } from "../../domain/reportes";
import type { MedioPago } from "../../domain/ventas";
import { useResumenes } from "../../hooks/useResumenes";
import { formatearPesos } from "../../utils/dinero";
import {
  calcularSemanaDelMes,
  crearRangoSemanaDelMes,
  obtenerSemanasDisponibles,
} from "../../utils/semanaDelMes";

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

function crearFechaDesdeJornada(fechaJornada: string): Date {
  const [anio = "0", mes = "1", dia = "1"] = fechaJornada.split("-");

  return new Date(Number(anio), Number(mes) - 1, Number(dia));
}

function ReporteSemanaDelMes({
  fechaJornadaActual,
  resumenInicial,
}: {
  fechaJornadaActual: string;
  resumenInicial: ResumenConRanking;
}) {
  const mesInicial = fechaJornadaActual.slice(0, 7);
  const semanaInicial = calcularSemanaDelMes(crearFechaDesdeJornada(fechaJornadaActual));
  const mesActual = fechaJornadaActual.slice(0, 7);
  const semanaActual = calcularSemanaDelMes(crearFechaDesdeJornada(fechaJornadaActual));
  const [mes, setMes] = useState(mesInicial);
  const [semana, setSemana] = useState<SemanaDelMes>(semanaInicial);
  const [resultado, setResultado] = useState<ResumenConRanking | null>(resumenInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const semanasDisponibles = /^\d{4}-\d{2}$/.test(mes)
    ? obtenerSemanasDisponibles(mes, fechaJornadaActual)
    : [];
  const rangoSeleccionado = semanasDisponibles.includes(semana)
    ? crearRangoSemanaDelMes(mes, semana)
    : null;
  const semanaEnCurso = mes === mesActual && semana === semanaActual;

  function cambiarMes(nuevoMes: string) {
    setMes(nuevoMes);
    setResultado(null);
    setError(null);

    if (!/^\d{4}-\d{2}$/.test(nuevoMes)) return;

    const disponibles = obtenerSemanasDisponibles(nuevoMes, fechaJornadaActual);

    if (!disponibles.includes(semana)) {
      setSemana(disponibles.at(-1) ?? 1);
    }
  }

  function cambiarSemana(nuevaSemana: SemanaDelMes) {
    setSemana(nuevaSemana);
    setResultado(null);
    setError(null);
  }

  async function consultarSemana(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!rangoSeleccionado) return;

    try {
      setCargando(true);
      setError(null);
      const resumen = await obtenerResumenPorRango(rangoSeleccionado);
      setResultado(resumen);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo consultar esa semana.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <Panel className="space-y-4">
      <SectionHeader
        title="Semana del mes"
        description="Elegí un mes y uno de sus cuatro bloques para comparar períodos anteriores."
      />

      <form className="space-y-3" onSubmit={(event) => void consultarSemana(event)}>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm text-white/70">
            <span>Mes</span>
            <Input
              type="month"
              value={mes}
              max={mesActual}
              onChange={(event) => cambiarMes(event.target.value)}
              required
            />
          </label>

          <label className="space-y-1 text-sm text-white/70">
            <span>Semana</span>
            <Select
              value={semana}
              onChange={(event) => cambiarSemana(Number(event.target.value) as SemanaDelMes)}
            >
              {[1, 2, 3, 4].map((numeroSemana) => {
                const value = numeroSemana as SemanaDelMes;
                const disponible = semanasDisponibles.includes(value);
                const enCurso = mes === mesActual && value === semanaActual;

                return (
                  <option key={value} value={value} disabled={!disponible}>
                    Semana {value}
                    {enCurso ? " (en curso)" : disponible ? "" : " (todavía no empezó)"}
                  </option>
                );
              })}
            </Select>
          </label>
        </div>

        {rangoSeleccionado && (
          <p className="rounded-2xl bg-black/15 px-3 py-2 text-sm text-white/60">
            Período: <RangoTexto {...rangoSeleccionado} />
            {semanaEnCurso && <span className="ml-1 text-mora-suave">· En curso</span>}
          </p>
        )}

        {!rangoSeleccionado && mes && (
          <Notice tone="warning">Ese período todavía no comenzó.</Notice>
        )}

        <Button type="submit" disabled={cargando || !rangoSeleccionado} fullWidth>
          {cargando ? "Consultando..." : "Consultar semana"}
        </Button>
      </form>

      {error && <Notice tone="danger">{error}</Notice>}

      {resultado && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <ResumenMetricas resumen={resultado} />
          <RankingProductos resumen={resultado} />
          <RankingMediosPago resumen={resultado} />
        </div>
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

          <ReporteSemanaDelMes
            fechaJornadaActual={resumenes.fechaJornadaActual}
            resumenInicial={resumenes.semana}
          />

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
