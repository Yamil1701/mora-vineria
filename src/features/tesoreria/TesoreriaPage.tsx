import { useMemo } from "react";

import {
  Badge,
  ButtonLink,
  DelayedFallback,
  EmptyState,
  ErrorState,
  Icon,
  ListSkeleton,
  Notice,
  Page,
  PageHeader,
  Panel,
  SectionHeader,
  SummaryCard,
} from "../../components/ui";
import type { TipoMovimientoTesoreria } from "../../domain/tesoreria";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useTesoreria } from "../../hooks/useTesoreria";
import { formatearFechaVenta, formatearPesos } from "../ventas/ventas.ui";

const etiquetas: Record<TipoMovimientoTesoreria, string> = {
  saldo_inicial: "Saldo inicial",
  cobro_venta: "Cobro de venta",
  reposicion: "Reposición",
  gasto_puntual: "Gasto puntual",
  aporte_externo: "Aporte",
  retiro: "Retiro",
  transferencia: "Transferencia interna",
  ajuste_conteo: "Ajuste de caja",
  reversion: "Reversión",
};

export function TesoreriaPage() {
  const { resumen, cargando, error, recargar } = useTesoreria();
  const { configuracion } = useConfiguracionLocal();
  const esConsulta = configuracion?.deviceRole === "consulta";
  const cuentasPorId = useMemo(
    () => new Map(resumen?.cuentas.map((cuenta) => [cuenta.id, cuenta.nombre]) ?? []),
    [resumen],
  );

  return (
    <Page>
      <PageHeader
        title="Tesorería"
        description="Dinero disponible, cuentas y movimientos reales del negocio. No reemplaza una contabilidad formal."
        action={resumen?.configurada && !esConsulta ? (
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink to="/tesoreria/operacion" fullWidth>Registrar</ButtonLink>
            <ButtonLink to="/tesoreria/conteo" variant="secondary" fullWidth>Contar caja</ButtonLink>
          </div>
        ) : undefined}
      />

      {cargando && <DelayedFallback><ListSkeleton rows={3} /></DelayedFallback>}
      {error && <ErrorState message={error} onRetry={() => void recargar()} />}
      {resumen && !resumen.configurada && (
        <EmptyState
          title="Prepará el dinero inicial"
          description="Creá Caja, Brubank y las demás cuentas, indicando cuánto dinero real hay hoy en cada una."
          action={!esConsulta ? <ButtonLink to="/tesoreria/configurar">Configurar tesorería</ButtonLink> : undefined}
        />
      )}

      {resumen?.configurada && (
        <>
          <section className="grid grid-cols-3 gap-2" aria-label="Resumen de tesorería">
            <SummaryCard compact label="Disponible" value={formatearPesos(resumen.totalDisponible)} />
            <SummaryCard compact label="Entró hoy" value={formatearPesos(resumen.entradasPeriodo)} />
            <SummaryCard compact label="Salió hoy" value={formatearPesos(resumen.salidasPeriodo)} />
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <SectionHeader title="Cuentas" description="El saldo se calcula desde el historial inalterable." />
              {!esConsulta && <ButtonLink to="/tesoreria/cuentas/nueva" size="sm" variant="ghost">Agregar</ButtonLink>}
            </div>
            <div className="space-y-2">
              {resumen.cuentas.map((cuenta) => {
                const bajoObjetivo = cuenta.tipo === "efectivo"
                  && cuenta.fondoCambioObjetivo !== undefined
                  && cuenta.saldo < cuenta.fondoCambioObjetivo;
                return (
                  <Panel key={cuenta.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mora-principal/10 text-mora-suave"><Icon name="tesoreria" /></span>
                      <span><span className="block font-semibold">{cuenta.nombre}</span><span className="mt-1 block text-xs text-white/45">{cuenta.tipo === "efectivo" ? "Efectivo" : "Cuenta digital"}{cuenta.esPredeterminada ? " · Predeterminada" : ""}</span></span>
                    </div>
                    <div className="text-right"><p className="font-bold">{formatearPesos(cuenta.saldo)}</p>{bajoObjetivo && <Badge tone="warning">Bajo fondo</Badge>}</div>
                  </Panel>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader title="Actividad reciente" />
            {resumen.ultimosMovimientos.length === 0 && <Notice>Todavía no hay movimientos de dinero.</Notice>}
            <div className="space-y-2">
              {resumen.ultimosMovimientos.map((movimiento) => (
                <Panel key={movimiento.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-xs font-medium text-mora-suave">{etiquetas[movimiento.tipo]}</p><p className="mt-1 truncate font-semibold">{movimiento.descripcion}</p><p className="mt-1 text-xs text-white/45">{cuentasPorId.get(movimiento.cuentaId) ?? "Cuenta archivada"} · {formatearFechaVenta(movimiento.fechaHoraReal)}</p>{movimiento.registradoPor && <p className="mt-1 text-xs text-white/45">Registró: {movimiento.registradoPor}</p>}{movimiento.destinatario && <p className="mt-1 text-xs text-white/45">Destino: {movimiento.destinatario}</p>}</div>
                  <p className={`shrink-0 font-bold ${movimiento.direccion === "entrada" ? "text-green-200" : "text-red-100"}`}>{movimiento.direccion === "entrada" ? "+" : "−"}{formatearPesos(movimiento.monto)}</p>
                </Panel>
              ))}
            </div>
          </section>
        </>
      )}
    </Page>
  );
}
