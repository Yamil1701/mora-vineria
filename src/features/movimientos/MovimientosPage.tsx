import { type FormEvent, useEffect, useMemo, useState } from "react";

import { MEDIOS_DE_PAGO } from "../../constants";
import { useToast } from "../../components/ui";
import { anularMovimiento, registrarMovimiento } from "../../db";
import type { TipoMovimiento } from "../../domain/movimientos";
import type { MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useMovimientos } from "../../hooks/useMovimientos";
import { useProductos } from "../../hooks/useProductos";
import { movimientoFormSchema } from "../../schemas";

type ReposicionItemForm = {
  id: string;
  productoId: string;
  cantidad: string;
  costoUnitario: string;
};

type MovimientoSimpleForm = {
  descripcion: string;
  monto: string;
  medioPago: MedioPago;
  observaciones: string;
};

const movimientoSimpleInicial: MovimientoSimpleForm = {
  descripcion: "",
  monto: "",
  medioPago: "efectivo",
  observaciones: "",
};

const labelsTipoMovimiento: Record<TipoMovimiento, string> = {
  reposicion: "Reposición",
  aporte_externo: "Aporte externo",
  gasto_puntual: "Gasto puntual",
};

function crearItemReposicion(productoId = ""): ReposicionItemForm {
  return {
    id: `${Date.now()}-${Math.random()}`,
    productoId,
    cantidad: "1",
    costoUnitario: "",
  };
}

function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString("es-AR")}`;
}

function formatearFecha(fechaIso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaIso));
}

function obtenerMedioPagoLabel(value?: string): string {
  if (!value) return "Sin medio indicado";

  return MEDIOS_DE_PAGO.find((medio) => medio.value === value)?.label ?? "Otro";
}

function obtenerClaseTipo(tipo: TipoMovimiento): string {
  if (tipo === "reposicion") return "border-mora-principal/30 bg-mora-principal/10 text-pink-100";
  if (tipo === "aporte_externo") return "border-mora-exito/30 bg-mora-exito/10 text-green-100";

  return "border-mora-advertencia/30 bg-mora-advertencia/10 text-yellow-100";
}

export function MovimientosPage() {
  const [tipoActivo, setTipoActivo] = useState<TipoMovimiento>("reposicion");
  const { productos, recargar: recargarProductos } = useProductos(false);
  const { movimientos, cargando, error, recargar } = useMovimientos(50);
  const { configuracion } = useConfiguracionLocal();

  const [reposicionDescripcion, setReposicionDescripcion] = useState("Reposición de mercadería");
  const [reposicionMedioPago, setReposicionMedioPago] = useState<MedioPago>("efectivo");
  const [aporteExternoIncluido, setAporteExternoIncluido] = useState("");
  const [reposicionObservaciones, setReposicionObservaciones] = useState("");
  const [itemsReposicion, setItemsReposicion] = useState<ReposicionItemForm[]>([
    crearItemReposicion(),
  ]);

  const [movimientoSimple, setMovimientoSimple] = useState(movimientoSimpleInicial);
  const [guardando, setGuardando] = useState(false);
  const toast = useToast();
  const [movimientoAnulandoId, setMovimientoAnulandoId] = useState<string | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [guardandoAnulacion, setGuardandoAnulacion] = useState(false);

  const esConsulta = configuracion?.deviceRole === "consulta";
  const productoInicialId = productos[0]?.id ?? "";

  const totalReposicion = useMemo(
    () =>
      itemsReposicion.reduce((total, item) => {
        const cantidad = Number(item.cantidad);
        const costoUnitario = Number(item.costoUnitario);

        if (!Number.isFinite(cantidad) || !Number.isFinite(costoUnitario)) return total;

        return total + cantidad * costoUnitario;
      }, 0),
    [itemsReposicion],
  );

  const movimientosActivos = movimientos.filter((movimiento) => movimiento.estado === "activo");
  const totalReinversion = movimientosActivos
    .filter((movimiento) => movimiento.tipo === "reposicion")
    .reduce((total, movimiento) => total + movimiento.monto, 0);
  const totalAportesExternos = movimientosActivos.reduce((total, movimiento) => {
    if (movimiento.tipo === "aporte_externo") return total + movimiento.monto;
    if (movimiento.tipo === "reposicion") {
      return total + (movimiento.aporteExternoIncluido ?? 0);
    }

    return total;
  }, 0);
  const totalGastosPuntuales = movimientosActivos
    .filter((movimiento) => movimiento.tipo === "gasto_puntual")
    .reduce((total, movimiento) => total + movimiento.monto, 0);

  useEffect(() => {
    if (!productoInicialId) return;

    setItemsReposicion((actual) =>
      actual.map((item) => ({
        ...item,
        productoId: item.productoId || productoInicialId,
      })),
    );
  }, [productoInicialId]);

  function actualizarItemReposicion(
    itemId: string,
    campo: keyof Omit<ReposicionItemForm, "id">,
    valor: string,
  ) {
    setItemsReposicion((actual) =>
      actual.map((item) => (item.id === itemId ? { ...item, [campo]: valor } : item)),
    );
  }

  function agregarItemReposicion() {
    setItemsReposicion((actual) => [...actual, crearItemReposicion(productoInicialId)]);
  }

  function quitarItemReposicion(itemId: string) {
    setItemsReposicion((actual) => {
      if (actual.length === 1) return actual;

      return actual.filter((item) => item.id !== itemId);
    });
  }

  function limpiarReposicion() {
    setReposicionDescripcion("Reposición de mercadería");
    setReposicionMedioPago("efectivo");
    setAporteExternoIncluido("");
    setReposicionObservaciones("");
    setItemsReposicion([crearItemReposicion(productoInicialId)]);
  }

  function limpiarMovimientoSimple() {
    setMovimientoSimple(movimientoSimpleInicial);
  }

  async function manejarReposicionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta) {
      toast.warning(
        "Celular de consulta",
        "Para registrar movimientos, usá el celular principal.",
      );
      return;
    }

    const movimientoParaGuardar = {
      tipo: "reposicion" as const,
      descripcion: reposicionDescripcion,
      monto: totalReposicion,
      medioPago: reposicionMedioPago,
      detalles: itemsReposicion.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
      })),
      aporteExternoIncluido: aporteExternoIncluido.trim()
        ? Number(aporteExternoIncluido)
        : undefined,
      observaciones: reposicionObservaciones,
    };

    const resultado = movimientoFormSchema.safeParse(movimientoParaGuardar);

    if (!resultado.success) {
      toast.warning(resultado.error.issues[0]?.message ?? "Revisá los datos de la reposición.");
      return;
    }

    const confirmar = window.confirm(
      `Registrar reposición por ${formatearPesos(totalReposicion)}? El stock de los productos se va a actualizar.`,
    );

    if (!confirmar) return;

    try {
      setGuardando(true);
      await registrarMovimiento(resultado.data);
      await Promise.all([recargar(), recargarProductos()]);
      limpiarReposicion();
      toast.success("Reposición registrada", "El stock se actualizó.");
    } catch (errorDesconocido) {
      const textoError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo registrar la reposición.";
      toast.error("No se pudo registrar la reposición", textoError);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarMovimientoSimpleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta) {
      toast.warning(
        "Celular de consulta",
        "Para registrar movimientos, usá el celular principal.",
      );
      return;
    }

    const movimientoParaGuardar = {
      tipo: tipoActivo,
      descripcion: movimientoSimple.descripcion,
      monto: movimientoSimple.monto,
      medioPago: movimientoSimple.medioPago,
      observaciones: movimientoSimple.observaciones,
    };

    const resultado = movimientoFormSchema.safeParse(movimientoParaGuardar);

    if (!resultado.success) {
      toast.warning(resultado.error.issues[0]?.message ?? "Revisá los datos del movimiento.");
      return;
    }

    const confirmar = window.confirm(
      `Registrar ${labelsTipoMovimiento[tipoActivo].toLowerCase()} por ${formatearPesos(resultado.data.monto)}?`,
    );

    if (!confirmar) return;

    try {
      setGuardando(true);
      await registrarMovimiento(resultado.data);
      await recargar();
      limpiarMovimientoSimple();
      toast.success(
        tipoActivo === "aporte_externo"
          ? "Aporte externo registrado"
          : "Gasto puntual registrado",
      );
    } catch (errorDesconocido) {
      const textoError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo registrar el movimiento.";
      toast.error("No se pudo registrar el movimiento", textoError);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarAnulacion(movimientoId: string) {
    const motivo = motivoAnulacion.trim();

    if (esConsulta) {
      toast.warning(
        "Celular de consulta",
        "Para anular movimientos, usá el celular principal.",
      );
      return;
    }

    if (!motivo) {
      toast.warning("Indicá el motivo de anulación.");
      return;
    }

    const confirmar = window.confirm(
      "¿Anular este movimiento? Si es una reposición, se va a intentar revertir el stock.",
    );

    if (!confirmar) return;

    try {
      setGuardandoAnulacion(true);
      await anularMovimiento(movimientoId, { motivoAnulacion: motivo });
      await Promise.all([recargar(), recargarProductos()]);
      setMovimientoAnulandoId(null);
      setMotivoAnulacion("");
      toast.success("Movimiento anulado");
    } catch (errorDesconocido) {
      const textoError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo anular el movimiento.";
      toast.error("No se pudo anular el movimiento", textoError);
    } finally {
      setGuardandoAnulacion(false);
    }
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Movimientos</h1>
        <p className="mt-1 text-sm text-white/65">
          Reposición, aportes externos y gastos puntuales.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-white/45">Reinversión</p>
          <p className="mt-1 text-sm font-bold text-white">{formatearPesos(totalReinversion)}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-white/45">Aportes</p>
          <p className="mt-1 text-sm font-bold text-white">{formatearPesos(totalAportesExternos)}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-white/45">Gastos</p>
          <p className="mt-1 text-sm font-bold text-white">{formatearPesos(totalGastosPuntuales)}</p>
        </div>
      </section>

      {esConsulta && (
        <div className="rounded-3xl border border-mora-advertencia/30 bg-mora-advertencia/10 p-4 text-sm leading-6 text-yellow-100">
          Este celular está como consulta. Podés revisar movimientos, pero no cargarlos ni anularlos desde acá.
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {(["reposicion", "aporte_externo", "gasto_puntual"] as TipoMovimiento[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => {
              setTipoActivo(tipo);
            }}
            className={`rounded-3xl px-4 py-3 text-sm font-semibold ${
              tipoActivo === tipo
                ? "bg-mora-principal text-white"
                : "border border-white/10 bg-white/[0.04] text-white"
            }`}
          >
            {labelsTipoMovimiento[tipo]}
          </button>
        ))}
      </div>


      {tipoActivo === "reposicion" ? (
        <form
          onSubmit={(event) => void manejarReposicionSubmit(event)}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div>
            <h2 className="text-lg font-semibold">Registrar reposición</h2>
            <p className="mt-1 text-xs leading-5 text-white/50">
              Sumá mercadería comprada y actualizá el stock disponible.
            </p>
          </div>

          <label className="block">
            <span className="text-sm text-white/70">Descripción</span>
            <input
              value={reposicionDescripcion}
              onChange={(event) => setReposicionDescripcion(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
            />
          </label>

          <div className="space-y-3">
            {itemsReposicion.map((item, index) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-black/15 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Producto {index + 1}</p>
                  {itemsReposicion.length > 1 && (
                    <button
                      type="button"
                      onClick={() => quitarItemReposicion(item.id)}
                      className="text-xs font-semibold text-red-100"
                    >
                      Quitar
                    </button>
                  )}
                </div>

                <label className="mt-3 block">
                  <span className="text-xs text-white/55">Producto</span>
                  <select
                    value={item.productoId}
                    onChange={(event) =>
                      actualizarItemReposicion(item.id, "productoId", event.target.value)
                    }
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none focus:border-mora-principal"
                  >
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} · Stock {producto.stockActual}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-white/55">Cantidad</span>
                    <input
                      value={item.cantidad}
                      onChange={(event) =>
                        actualizarItemReposicion(item.id, "cantidad", event.target.value)
                      }
                      inputMode="numeric"
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none focus:border-mora-principal"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs text-white/55">Costo unitario</span>
                    <input
                      value={item.costoUnitario}
                      onChange={(event) =>
                        actualizarItemReposicion(item.id, "costoUnitario", event.target.value)
                      }
                      inputMode="numeric"
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none focus:border-mora-principal"
                      placeholder="5200"
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={agregarItemReposicion}
              disabled={productos.length === 0}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Agregar otro producto
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-white/70">Medio de pago</span>
              <select
                value={reposicionMedioPago}
                onChange={(event) => setReposicionMedioPago(event.target.value as MedioPago)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              >
                {MEDIOS_DE_PAGO.map((medioPago) => (
                  <option key={medioPago.value} value={medioPago.value}>
                    {medioPago.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-white/70">Aporte externo</span>
              <input
                value={aporteExternoIncluido}
                onChange={(event) => setAporteExternoIncluido(event.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
                placeholder="Opcional"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-white/70">Observaciones</span>
            <textarea
              value={reposicionObservaciones}
              onChange={(event) => setReposicionObservaciones(event.target.value)}
              className="mt-1 min-h-20 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="Opcional"
            />
          </label>

          <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs text-white/50">Total de reposición</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatearPesos(totalReposicion)}</p>
            {aporteExternoIncluido.trim() && Number(aporteExternoIncluido) > 0 && (
              <p className="mt-2 text-xs text-white/55">
                Capital del negocio: {formatearPesos(totalReposicion - Number(aporteExternoIncluido))}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={guardando || esConsulta || productos.length === 0}
            className="w-full rounded-3xl bg-mora-principal px-5 py-4 font-semibold text-white disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Registrar reposición"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(event) => void manejarMovimientoSimpleSubmit(event)}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div>
            <h2 className="text-lg font-semibold">Registrar {labelsTipoMovimiento[tipoActivo].toLowerCase()}</h2>
            <p className="mt-1 text-xs leading-5 text-white/50">
              {tipoActivo === "aporte_externo"
                ? "Registrá dinero que entra desde fuera del movimiento normal del negocio."
                : "Usá esta opción para gastos puntuales del negocio."}
            </p>
          </div>

          <label className="block">
            <span className="text-sm text-white/70">Descripción</span>
            <input
              value={movimientoSimple.descripcion}
              onChange={(event) =>
                setMovimientoSimple((actual) => ({ ...actual, descripcion: event.target.value }))
              }
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder={tipoActivo === "aporte_externo" ? "Ej: aporte para compra" : "Ej: gasto puntual"}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-white/70">Monto</span>
              <input
                value={movimientoSimple.monto}
                onChange={(event) =>
                  setMovimientoSimple((actual) => ({ ...actual, monto: event.target.value }))
                }
                inputMode="numeric"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
                placeholder="10000"
              />
            </label>

            <label className="block">
              <span className="text-sm text-white/70">Medio</span>
              <select
                value={movimientoSimple.medioPago}
                onChange={(event) =>
                  setMovimientoSimple((actual) => ({
                    ...actual,
                    medioPago: event.target.value as MedioPago,
                  }))
                }
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              >
                {MEDIOS_DE_PAGO.map((medioPago) => (
                  <option key={medioPago.value} value={medioPago.value}>
                    {medioPago.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-white/70">Observaciones</span>
            <textarea
              value={movimientoSimple.observaciones}
              onChange={(event) =>
                setMovimientoSimple((actual) => ({ ...actual, observaciones: event.target.value }))
              }
              className="mt-1 min-h-20 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="Opcional"
            />
          </label>

          <button
            type="submit"
            disabled={guardando || esConsulta}
            className="w-full rounded-3xl bg-mora-principal px-5 py-4 font-semibold text-white disabled:opacity-60"
          >
            {guardando ? "Guardando..." : `Registrar ${labelsTipoMovimiento[tipoActivo].toLowerCase()}`}
          </button>
        </form>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historial de movimientos</h2>

        {cargando && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Cargando movimientos...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-mora-error/40 bg-white/[0.04] p-4 text-sm text-white/65">
            {error}
          </div>
        )}

        {!cargando && movimientos.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Todavía no hay movimientos cargados.
          </div>
        )}

        {movimientos.map((movimiento) => (
          <article
            key={movimiento.id}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`rounded-full border px-2 py-1 text-xs ${obtenerClaseTipo(movimiento.tipo)}`}>
                  {labelsTipoMovimiento[movimiento.tipo]}
                </span>
                <h3 className="mt-3 font-semibold text-white">{movimiento.descripcion}</h3>
                <p className="mt-1 text-xs text-white/45">
                  {formatearFecha(movimiento.fechaHoraReal)} · {obtenerMedioPagoLabel(movimiento.medioPago)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-white">{formatearPesos(movimiento.monto)}</p>
                {movimiento.estado === "anulado" && (
                  <p className="mt-1 rounded-full border border-mora-error/30 px-2 py-1 text-xs text-red-100">
                    Anulado
                  </p>
                )}
              </div>
            </div>

            {movimiento.tipo === "reposicion" && movimiento.detallesReposicion.length > 0 && (
              <div className="mt-4 space-y-2">
                {movimiento.detallesReposicion.map((detalle) => (
                  <div
                    key={detalle.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-black/15 px-3 py-2 text-sm"
                  >
                    <span className="text-white/75">
                      {detalle.cantidad} x {detalle.producto?.nombre ?? "Producto eliminado"}
                    </span>
                    <span className="font-semibold text-white">{formatearPesos(detalle.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}

            {movimiento.tipo === "reposicion" && (movimiento.aporteExternoIncluido ?? 0) > 0 && (
              <p className="mt-3 rounded-2xl bg-black/15 p-3 text-sm leading-6 text-white/60">
                Incluye aporte externo: {formatearPesos(movimiento.aporteExternoIncluido ?? 0)}
              </p>
            )}

            {movimiento.observaciones && (
              <p className="mt-3 rounded-2xl bg-black/15 p-3 text-sm leading-6 text-white/60">
                {movimiento.observaciones}
              </p>
            )}

            {movimiento.estado === "anulado" && movimiento.motivoAnulacion && (
              <p className="mt-3 rounded-2xl border border-mora-error/25 bg-mora-error/10 p-3 text-sm leading-6 text-red-100">
                Motivo de anulación: {movimiento.motivoAnulacion}
              </p>
            )}

            {movimiento.estado === "activo" && (
              <div className="mt-4 border-t border-white/10 pt-3">
                {movimientoAnulandoId === movimiento.id ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs text-white/55">Motivo de anulación</span>
                      <textarea
                        value={motivoAnulacion}
                        onChange={(event) => setMotivoAnulacion(event.target.value)}
                        className="mt-1 min-h-20 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-mora-principal"
                        placeholder="Ejemplo: movimiento cargado por error"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMovimientoAnulandoId(null);
                          setMotivoAnulacion("");
                        }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => void confirmarAnulacion(movimiento.id)}
                        disabled={guardandoAnulacion || esConsulta}
                        className="rounded-2xl border border-mora-error/40 bg-mora-error/15 px-3 py-2 text-sm font-semibold text-red-100 disabled:opacity-60"
                      >
                        {guardandoAnulacion ? "Anulando..." : "Anular"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMovimientoAnulandoId(movimiento.id);
                      setMotivoAnulacion("");
                    }}
                    disabled={esConsulta}
                    className="text-sm font-semibold text-red-100 disabled:opacity-50"
                  >
                    Anular movimiento
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
