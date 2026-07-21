import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { Badge, BottomSheet, Button, ButtonLink, DelayedFallback, EmptyState, ErrorState, ListSkeleton, Page, PageHeader, Select } from "../../components/ui";
import type { TipoMovimiento } from "../../domain/movimientos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useMovimientos } from "../../hooks/useMovimientos";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { formatearFechaVenta, formatearPesos } from "../ventas/ventas.ui";

const labels: Record<TipoMovimiento, string> = { reposicion: "Reposición", aporte_externo: "Aporte externo", gasto_puntual: "Gasto puntual" };

export function MovimientosPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  useRestaurarScroll("movimientos");
  const { movimientos, cargando, error, recargar } = useMovimientos(80);
  const { configuracion } = useConfiguracionLocal();
  const [tipo, setTipo] = useState<TipoMovimiento | "todos">("todos");
  const [verAnulados, setVerAnulados] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const movimientoDestacadoId = searchParams.get("destacada");
  const [animarDestacado, setAnimarDestacado] = useState(Boolean(movimientoDestacadoId));
  const esConsulta = configuracion?.deviceRole === "consulta";
  const visibles = useMemo(
    () => movimientos.filter((movimiento) => (tipo === "todos" || movimiento.tipo === tipo) && (verAnulados || movimiento.estado === "activo")),
    [movimientos, tipo, verAnulados],
  );

  useEffect(() => {
    if (!movimientoDestacadoId) return;
    const finAnimacion = window.setTimeout(() => setAnimarDestacado(false), 1500);
    const limpiarUrl = window.setTimeout(() => setSearchParams({}, { replace: true }), 2200);
    return () => {
      window.clearTimeout(finAnimacion);
      window.clearTimeout(limpiarUrl);
    };
  }, [movimientoDestacadoId, setSearchParams]);

  return (
    <Page>
      <PageHeader
        title="Movimientos"
        description="Reposiciones, aportes y gastos. Abrí un registro para ver su trazabilidad."
        action={!esConsulta ? <div className="grid grid-cols-[1.5fr_1fr] gap-3"><ButtonLink to="/movimientos/nuevo?tipo=reposicion" size="lg" fullWidth>Registrar reposición</ButtonLink><ButtonLink to="/movimientos/nuevo?tipo=otro" size="lg" variant="secondary" fullWidth>Otro movimiento</ButtonLink></div> : undefined}
      />

      <section className="grid grid-cols-3 gap-2">
          <Button size="sm" variant={tipo === "todos" ? "primary" : "secondary"} aria-pressed={tipo === "todos"} onClick={() => setTipo("todos")}>Todos</Button>
          <Button size="sm" variant={tipo === "reposicion" ? "primary" : "secondary"} aria-pressed={tipo === "reposicion"} onClick={() => setTipo("reposicion")}>Reposiciones</Button>
          <Button size="sm" variant={tipo === "aporte_externo" || tipo === "gasto_puntual" || verAnulados ? "primary" : "secondary"} onClick={() => setFiltrosAbiertos(true)}>Filtros</Button>
      </section>

      {cargando && <DelayedFallback><ListSkeleton rows={4} /></DelayedFallback>}
      {error && <ErrorState message={error} onRetry={() => void recargar()} />}
      {!cargando && visibles.length === 0 && <EmptyState title="No hay movimientos con esos filtros." description="Los nuevos registros aparecerán acá." />}

      <section className="space-y-2" aria-label="Historial de movimientos">
        {visibles.map((movimiento) => (
          <Link key={movimiento.id} to={`/movimientos/${movimiento.id}`} state={{ backgroundLocation: location }} className={`block min-h-20 rounded-2xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99] ${movimiento.id === movimientoDestacadoId ? `${animarDestacado ? "animate-mora-highlight bg-mora-exito/10" : ""} border-mora-exito/60` : "border-white/10 bg-white/[0.045]"}`}>
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-xs font-medium text-mora-suave">{labels[movimiento.tipo]}</span>
                <span className="mt-1 block truncate font-semibold text-white">{movimiento.descripcion}</span>
                <span className="mt-1 block text-xs text-white/50">{formatearFechaVenta(movimiento.fechaHoraReal)}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-bold text-white">{formatearPesos(movimiento.monto)}</span>
                {movimiento.estado === "anulado" && <Badge tone="danger">Anulado</Badge>}
              </span>
            </span>
          </Link>
        ))}
      </section>
      <BottomSheet open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos} title="Filtrar movimientos" description="Aportes, gastos y anulados quedan fuera del acceso rápido.">
        <div className="space-y-4">
          <label className="block"><span className="text-sm text-white/70">Tipo</span><Select value={tipo} onChange={(event) => setTipo(event.target.value as TipoMovimiento | "todos")}><option value="todos">Todos</option><option value="reposicion">Reposiciones</option><option value="aporte_externo">Aportes</option><option value="gasto_puntual">Gastos</option></Select></label>
          <button type="button" onClick={() => setVerAnulados((actual) => !actual)} className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left"><span><span className="block text-sm font-semibold">Incluir anulados</span><span className="mt-1 block text-xs text-white/45">Conservan la trazabilidad de lo ocurrido.</span></span><span aria-hidden="true" className={`h-6 w-11 rounded-full p-1 transition ${verAnulados ? "bg-mora-principal" : "bg-white/15"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${verAnulados ? "translate-x-5" : ""}`} /></span></button>
          <Button fullWidth onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</Button>
        </div>
      </BottomSheet>
    </Page>
  );
}
