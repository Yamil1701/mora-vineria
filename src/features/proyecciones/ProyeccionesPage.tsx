import { type FormEvent, useEffect, useState } from "react";

import { Button, DelayedFallback, ErrorState, Input, Notice, Page, PageHeader, Panel, Skeleton } from "../../components/ui";
import { obtenerMensajeMeta } from "../../domain/proyecciones";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProyeccionMensual } from "../../hooks/useProyeccionMensual";
import { formatearPesos } from "../../utils/dinero";

function Metrica({ label, valor, ayuda }: { label: string; valor: string; ayuda?: string }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-xs text-white/50">{label}</p><p className="mt-2 text-xl font-bold">{valor}</p>{ayuda && <p className="mt-1 text-xs leading-5 text-white/45">{ayuda}</p>}</article>;
}

export function ProyeccionesPage() {
  const { configuracion } = useConfiguracionLocal();
  const { proyeccionActual, cargando, guardandoMeta, error, guardarMeta, recargar } = useProyeccionMensual();
  const [metaVentas, setMetaVentas] = useState("");
  const [mensajeMeta, setMensajeMeta] = useState<string | null>(null);
  const soloConsulta = configuracion?.deviceRole === "consulta";

  useEffect(() => {
    if (!proyeccionActual) return;
    setMetaVentas(proyeccionActual.metaMensual?.metaVentas ? String(proyeccionActual.metaMensual.metaVentas) : "");
    setMensajeMeta(obtenerMensajeMeta(proyeccionActual.proyeccion));
  }, [proyeccionActual]);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!soloConsulta) await guardarMeta(Number(metaVentas || 0));
  }

  return <Page>
    <PageHeader title="Proyecciones" description="Una orientación del mes basada en lo cargado hasta ahora." />
    {cargando && <DelayedFallback><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div></DelayedFallback>}{error && <ErrorState message={error} onRetry={() => void recargar()} />}
    {proyeccionActual && <>
      <Notice>Usa datos desde {proyeccionActual.rangoAcumulado.desde} hasta {proyeccionActual.rangoAcumulado.hasta}. Puede variar por días fuertes, clima, feriados y ritmo comercial.</Notice>
      <section className="grid grid-cols-2 gap-3" aria-label="Proyección principal">
        <Metrica label="Vendido hasta ahora" valor={formatearPesos(proyeccionActual.proyeccion.ventasAcumuladas)} ayuda={`${proyeccionActual.proyeccion.diasTranscurridos} de ${proyeccionActual.proyeccion.diasDelMes} días`} />
        <Metrica label="Proyección de ventas" valor={formatearPesos(proyeccionActual.proyeccion.proyeccionVentasMes)} />
        <Metrica label="Ganancia neta proyectada" valor={formatearPesos(proyeccionActual.proyeccion.proyeccionGananciaNetaMes)} />
        <Metrica label="Gastos proyectados" valor={formatearPesos(proyeccionActual.proyeccion.proyeccionGastosPuntualesMes)} />
      </section>
      <details className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <summary className="min-h-12 cursor-pointer py-3 font-semibold text-mora-suave">Ver datos del cálculo</summary>
        <section className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          <Metrica label="Promedio diario" valor={formatearPesos(proyeccionActual.proyeccion.promedioDiarioVentas)} />
          <Metrica label="Gastos acumulados" valor={formatearPesos(proyeccionActual.proyeccion.gastosPuntualesAcumulados)} />
          <Metrica label="Reinversión" valor={formatearPesos(proyeccionActual.proyeccion.reinversionAcumulada)} />
          <Metrica label="Aportes externos" valor={formatearPesos(proyeccionActual.proyeccion.aportesExternosAcumulados)} />
        </section>
      </details>
      <Panel className="space-y-4">
        <div><h2 className="text-lg font-semibold">Meta mensual</h2><p className="mt-1 text-sm text-white/55">Es una referencia, no una calificación del negocio.</p></div>
        {soloConsulta && <Notice>Para cambiar la meta, usá el celular principal.</Notice>}
        <form className="space-y-3" onSubmit={(event) => void guardar(event)}><label className="block"><span className="text-sm text-white/70">Meta de ventas</span><Input type="number" min="0" step="1" value={metaVentas} onChange={(event) => setMetaVentas(event.target.value)} disabled={soloConsulta || guardandoMeta} placeholder="Ej: 1500000" /></label><Button type="submit" fullWidth disabled={soloConsulta || guardandoMeta}>{guardandoMeta ? "Guardando..." : "Guardar meta"}</Button></form>
        {mensajeMeta && <Notice>{mensajeMeta}</Notice>}
        {proyeccionActual.proyeccion.metaVentas && <div className="grid grid-cols-2 gap-3"><Metrica label="Meta cargada" valor={formatearPesos(proyeccionActual.proyeccion.metaVentas)} /><Metrica label="Contra la meta" valor={`${Math.round(proyeccionActual.proyeccion.porcentajeMetaProyectado ?? 0)}%`} ayuda={proyeccionActual.proyeccion.diferenciaMetaProyectada !== undefined ? formatearPesos(proyeccionActual.proyeccion.diferenciaMetaProyectada) : undefined} /></div>}
      </Panel>
    </>}
  </Page>;
}
