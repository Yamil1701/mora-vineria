import { useEffect, useState, type FormEvent } from "react";

import { obtenerMensajeMeta } from "../../domain/proyecciones";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProyeccionMensual } from "../../hooks/useProyeccionMensual";
import { formatearPesos } from "../../utils/dinero";

function Metrica({ label, valor, ayuda }: { label: string; valor: string; ayuda?: string }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{valor}</p>
      {ayuda && <p className="mt-1 text-xs leading-5 text-white/45">{ayuda}</p>}
    </article>
  );
}

export function ProyeccionesPage() {
  const { configuracion } = useConfiguracionLocal();
  const { proyeccionActual, cargando, guardandoMeta, error, guardarMeta } = useProyeccionMensual();
  const [metaVentas, setMetaVentas] = useState("");
  const [mensajeMeta, setMensajeMeta] = useState<string | null>(null);
  const soloConsulta = configuracion?.deviceRole === "consulta";

  useEffect(() => {
    if (!proyeccionActual) return;

    setMetaVentas(
      proyeccionActual.metaMensual?.metaVentas
        ? String(proyeccionActual.metaMensual.metaVentas)
        : "",
    );
    setMensajeMeta(obtenerMensajeMeta(proyeccionActual.proyeccion));
  }, [proyeccionActual]);

  async function guardarMetaDesdeFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (soloConsulta) return;

    const valor = Number(metaVentas || 0);
    await guardarMeta(valor);
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Proyecciones</h1>
        <p className="mt-1 text-sm text-white/65">
          Una guía orientativa de cómo podría cerrar el mes.
        </p>
      </header>

      {cargando && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
          Cargando proyección...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-mora-error/40 bg-white/[0.04] p-4 text-sm text-white/65">
          {error}
        </div>
      )}

      {proyeccionActual && (
        <>
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Mes {proyeccionActual.mes}</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Esta proyección usa las ventas cargadas desde {proyeccionActual.rangoAcumulado.desde} hasta {proyeccionActual.rangoAcumulado.hasta}. Puede cambiar por días fuertes, clima, feriados o por cómo se mueva la venta cerca de fin de mes.
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Metrica
              label="Vendido hasta ahora"
              valor={formatearPesos(proyeccionActual.proyeccion.ventasAcumuladas)}
              ayuda={`${proyeccionActual.proyeccion.diasTranscurridos} de ${proyeccionActual.proyeccion.diasDelMes} días`}
            />
            <Metrica
              label="Promedio diario"
              valor={formatearPesos(proyeccionActual.proyeccion.promedioDiarioVentas)}
              ayuda="Ventas acumuladas dividido los días transcurridos."
            />
            <Metrica
              label="Proyección de ventas"
              valor={formatearPesos(proyeccionActual.proyeccion.proyeccionVentasMes)}
              ayuda="Estimación simple al cierre del mes."
            />
            <Metrica
              label="Ganancia neta proyectada"
              valor={formatearPesos(proyeccionActual.proyeccion.proyeccionGananciaNetaMes)}
              ayuda="También es estimada."
            />
          </section>

          <section className="grid grid-cols-2 gap-3">
            <Metrica
              label="Gastos puntuales"
              valor={formatearPesos(proyeccionActual.proyeccion.gastosPuntualesAcumulados)}
              ayuda="Acumulados del mes."
            />
            <Metrica
              label="Gastos proyectados"
              valor={formatearPesos(proyeccionActual.proyeccion.proyeccionGastosPuntualesMes)}
              ayuda="No incluye reposición."
            />
            <Metrica
              label="Reinversión"
              valor={formatearPesos(proyeccionActual.proyeccion.reinversionAcumulada)}
              ayuda="Reposición acumulada."
            />
            <Metrica
              label="Aportes externos"
              valor={formatearPesos(proyeccionActual.proyeccion.aportesExternosAcumulados)}
              ayuda="Separados de ventas y ganancia."
            />
          </section>

          <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <h2 className="text-lg font-semibold">Meta mensual</h2>
              <p className="mt-1 text-sm text-white/55">
                La meta sirve como referencia. No es una calificación del negocio.
              </p>
            </div>

            {soloConsulta && (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">
                Este celular está como consulta. Para cambiar la meta, usá el celular principal.
              </p>
            )}

            <form className="space-y-3" onSubmit={(event) => void guardarMetaDesdeFormulario(event)}>
              <label className="space-y-1 text-sm text-white/70">
                <span>Meta de ventas del mes</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-mora-principal disabled:opacity-60"
                  type="number"
                  min="0"
                  step="1"
                  value={metaVentas}
                  onChange={(event) => setMetaVentas(event.target.value)}
                  disabled={soloConsulta || guardandoMeta}
                  placeholder="Ej: 1500000"
                />
              </label>

              <button
                className="w-full rounded-2xl bg-mora-principal px-4 py-3 text-sm font-semibold text-white transition hover:bg-mora-principal-hover disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={soloConsulta || guardandoMeta}
              >
                {guardandoMeta ? "Guardando..." : "Guardar meta"}
              </button>
            </form>

            {mensajeMeta && (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/65">
                {mensajeMeta}
              </p>
            )}

            {proyeccionActual.proyeccion.metaVentas && (
              <div className="grid grid-cols-2 gap-3">
                <Metrica
                  label="Meta cargada"
                  valor={formatearPesos(proyeccionActual.proyeccion.metaVentas)}
                />
                <Metrica
                  label="Contra la meta"
                  valor={`${Math.round(proyeccionActual.proyeccion.porcentajeMetaProyectado ?? 0)}%`}
                  ayuda={
                    proyeccionActual.proyeccion.diferenciaMetaProyectada !== undefined
                      ? formatearPesos(proyeccionActual.proyeccion.diferenciaMetaProyectada)
                      : undefined
                  }
                />
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
