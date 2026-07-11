import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Badge, Button, ButtonLink, DelayedFallback, EmptyState, ListSkeleton, Notice, Page, PageHeader } from "../../components/ui";
import type { TipoMovimiento } from "../../domain/movimientos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useMovimientos } from "../../hooks/useMovimientos";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { formatearFechaVenta, formatearPesos } from "../ventas/ventas.ui";

const labels: Record<TipoMovimiento, string> = { reposicion: "Reposición", aporte_externo: "Aporte externo", gasto_puntual: "Gasto puntual" };

export function MovimientosPage() {
  const location = useLocation();
  useRestaurarScroll("movimientos");
  const { movimientos, cargando, error } = useMovimientos(80);
  const { configuracion } = useConfiguracionLocal();
  const [tipo, setTipo] = useState<TipoMovimiento | "todos">("todos");
  const [verAnulados, setVerAnulados] = useState(false);
  const esConsulta = configuracion?.deviceRole === "consulta";
  const visibles = useMemo(
    () => movimientos.filter((movimiento) => (tipo === "todos" || movimiento.tipo === tipo) && (verAnulados || movimiento.estado === "activo")),
    [movimientos, tipo, verAnulados],
  );

  return (
    <Page>
      <PageHeader
        title="Movimientos"
        description="Reposiciones, aportes y gastos. Abrí un registro para ver su trazabilidad."
        action={!esConsulta ? <ButtonLink to="/movimientos/nuevo" size="lg" fullWidth>Registrar movimiento</ButtonLink> : undefined}
      />

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.045] p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant={tipo === "todos" ? "primary" : "secondary"} aria-pressed={tipo === "todos"} onClick={() => setTipo("todos")}>Todos</Button>
          <Button size="sm" variant={tipo === "reposicion" ? "primary" : "secondary"} aria-pressed={tipo === "reposicion"} onClick={() => setTipo("reposicion")}>Reposiciones</Button>
          <Button size="sm" variant={tipo === "aporte_externo" ? "primary" : "secondary"} aria-pressed={tipo === "aporte_externo"} onClick={() => setTipo("aporte_externo")}>Aportes</Button>
          <Button size="sm" variant={tipo === "gasto_puntual" ? "primary" : "secondary"} aria-pressed={tipo === "gasto_puntual"} onClick={() => setTipo("gasto_puntual")}>Gastos</Button>
        </div>
        <Button size="sm" variant={verAnulados ? "primary" : "secondary"} aria-pressed={verAnulados} onClick={() => setVerAnulados((actual) => !actual)}>Anulados</Button>
      </section>

      {cargando && <DelayedFallback><ListSkeleton rows={4} /></DelayedFallback>}
      {error && <Notice tone="danger">{error}</Notice>}
      {!cargando && visibles.length === 0 && <EmptyState title="No hay movimientos con esos filtros." description="Los nuevos registros aparecerán acá." />}

      <section className="space-y-2" aria-label="Historial de movimientos">
        {visibles.map((movimiento) => (
          <Link key={movimiento.id} to={`/movimientos/${movimiento.id}`} state={{ backgroundLocation: location }} className="block min-h-20 rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99]">
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
    </Page>
  );
}
