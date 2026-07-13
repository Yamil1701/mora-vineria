import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ActionCard,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  Input,
  Notice,
  Page,
  Panel,
  SectionHeader,
  Spinner,
  TaskHeader,
  useConfirm,
  useToast,
} from "../../components/ui";
import type {
  ConflictoCatalogoRemoto,
  DiferenciaStockLocal,
  DispositivoRemoto,
} from "../../domain/sincronizacion";
import { db } from "../../db";
import { useVinculoDispositivo } from "../../hooks/useVinculoDispositivo";
import {
  listarDispositivosRemotos,
  revocarDispositivo,
  transferirDispositivoPrincipal,
} from "../../sync/dispositivos";
import { prepararNuevaVinculacion } from "../../sync/vinculacion";
import { useEstadoSincronizacion } from "../../hooks/useEstadoSincronizacion";
import { useEstadoConexion } from "../../hooks/useEstadoConexion";
import { sincronizarCatalogo } from "../../sync/motorCatalogo";
import {
  listarConflictosCatalogoRemotos,
  resolverConflictoCatalogo,
} from "../../sync/catalogo";
import {
  listarConflictosOperativosRemotos,
  listarDiferenciasStockRemotas,
  resolverConflictoOperativoRemoto,
  resolverDiferenciaStockRemota,
} from "../../sync/operaciones";

const textoEstadoDatos = {
  sin_configurar: "No configurada",
  sincronizado: "Al día",
  pendiente: "Cambios pendientes",
  sincronizando: "Sincronizando…",
  sin_conexion: "Sin conexión",
  alerta: "Requiere atención",
  error: "Error",
} as const;

function describirConflicto(conflicto: ConflictoCatalogoRemoto): string {
  const detalle = conflicto.detalle as {
    payloadLocal?: { entidad?: { nombre?: unknown } };
  } | null;
  const nombre = detalle?.payloadLocal?.entidad?.nombre;
  if (typeof nombre === "string" && nombre.trim()) return nombre;
  return conflicto.tipoEntidad === "producto" ? "Producto modificado" : "Categoría modificada";
}

function formatearUltimaSincronizacion(fecha: string | null | undefined): string | null {
  if (!fecha) return null;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
}

function describirActividadDispositivo(dispositivo: DispositivoRemoto): {
  color: string;
  etiqueta: string;
  ultimaConexion: string;
} {
  if (dispositivo.estado === "revocado") {
    return {
      color: "bg-red-400",
      etiqueta: "Revocado",
      ultimaConexion: formatearUltimaSincronizacion(dispositivo.ultimaActividadAt) ?? "Sin conexión registrada",
    };
  }

  const ultimaActividad = dispositivo.ultimaActividadAt
    ? new Date(dispositivo.ultimaActividadAt).getTime()
    : Number.NaN;
  const reciente = Number.isFinite(ultimaActividad) && Date.now() - ultimaActividad < 2 * 60 * 1000;
  return {
    color: reciente ? "bg-emerald-400" : "bg-amber-300",
    etiqueta: reciente ? "Actividad reciente" : "Sin actividad reciente",
    ultimaConexion: formatearUltimaSincronizacion(dispositivo.ultimaActividadAt) ?? "Sin conexión registrada",
  };
}

export function SincronizacionPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { estado, vinculo, mensajeError, refrescar } = useVinculoDispositivo();
  const estadoDatos = useEstadoSincronizacion();
  const enLinea = useEstadoConexion();
  const [dispositivos, setDispositivos] = useState<DispositivoRemoto[]>([]);
  const [cargandoDispositivos, setCargandoDispositivos] = useState(false);
  const [errorDispositivos, setErrorDispositivos] = useState<string | null>(null);
  const [conflictos, setConflictos] = useState<ConflictoCatalogoRemoto[]>([]);
  const [conflictosOperativos, setConflictosOperativos] = useState<ConflictoCatalogoRemoto[]>([]);
  const [diferencias, setDiferencias] = useState<DiferenciaStockLocal[]>([]);
  const [nombresProductos, setNombresProductos] = useState<Record<string, string>>({});
  const [stocksContados, setStocksContados] = useState<Record<string, string>>({});
  const [notasConciliacion, setNotasConciliacion] = useState<Record<string, string>>({});
  const [resolviendoConflicto, setResolviendoConflicto] = useState<string | null>(null);

  const cargarDispositivos = useCallback(async (mostrarCarga = true) => {
    if (estado !== "vinculado" || vinculo?.tipo !== "principal" || !enLinea) return;
    if (mostrarCarga) setCargandoDispositivos(true);
    setErrorDispositivos(null);
    try {
      setDispositivos((await listarDispositivosRemotos()).filter((dispositivo) => dispositivo.estado === "activo"));
    } catch (error) {
      setErrorDispositivos(error instanceof Error ? error.message : "No se pudieron cargar los dispositivos.");
    } finally {
      if (mostrarCarga) setCargandoDispositivos(false);
    }
  }, [enLinea, estado, vinculo?.tipo]);

  useEffect(() => { void cargarDispositivos(); }, [cargarDispositivos]);

  useEffect(() => {
    if (estado !== "vinculado" || vinculo?.tipo !== "principal" || !enLinea) return;
    const intervalo = window.setInterval(() => void cargarDispositivos(false), 15_000);
    return () => window.clearInterval(intervalo);
  }, [cargarDispositivos, enLinea, estado, vinculo?.tipo]);

  const cargarConflictos = useCallback(async () => {
    if (estado !== "vinculado" || vinculo?.tipo !== "principal" || !enLinea) return;
    try {
      const [catalogo, operativos, diferenciasRemotas] = await Promise.all([
        listarConflictosCatalogoRemotos(),
        listarConflictosOperativosRemotos(),
        listarDiferenciasStockRemotas(),
      ]);
      setConflictos(catalogo);
      setConflictosOperativos(operativos);
      setDiferencias(diferenciasRemotas);
      const productos = await db.productos.bulkGet(
        Array.from(new Set(diferenciasRemotas.map((item) => item.productoId))),
      );
      setNombresProductos(Object.fromEntries(
        productos.filter(Boolean).map((producto) => [producto!.id, producto!.nombre]),
      ));
    } catch {
      // El estado general de sincronización seguirá mostrando el error recuperable.
    }
  }, [enLinea, estado, vinculo?.tipo]);

  useEffect(() => { void cargarConflictos(); }, [cargarConflictos, estadoDatos.conflictos]);

  async function resolverConflicto(
    conflicto: ConflictoCatalogoRemoto,
    resolucion: "local" | "remoto",
  ) {
    const conservarLocal = resolucion === "local";
    const aceptado = await confirm({
      title: conservarLocal ? "Aplicar el cambio pendiente" : "Conservar los datos compartidos",
      description: conservarLocal
        ? "La versión de este cambio reemplazará la versión compartida más reciente."
        : "Se descartará este cambio pendiente y se usará la versión que ya está compartida.",
      confirmLabel: conservarLocal ? "Aplicar cambio" : "Usar compartida",
      tone: conservarLocal ? "default" : "danger",
    });
    if (!aceptado || !vinculo) return;
    setResolviendoConflicto(conflicto.id);
    try {
      await resolverConflictoCatalogo(conflicto.id, resolucion);
      await sincronizarCatalogo(vinculo);
      await cargarConflictos();
      toast.success("Conflicto resuelto");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo resolver el conflicto.");
    } finally {
      setResolviendoConflicto(null);
    }
  }

  async function conciliarDiferencia(diferencia: DiferenciaStockLocal) {
    const stockContado = Number(stocksContados[diferencia.id]);
    if (!Number.isInteger(stockContado) || stockContado < 0) {
      toast.warning("Ingresá el stock contado actual");
      return;
    }
    const aceptado = await confirm({
      title: "Confirmar stock contado",
      description: `El stock compartido de ${nombresProductos[diferencia.productoId] ?? "este producto"} quedará en ${stockContado}.`,
      confirmLabel: "Conciliar stock",
      tone: "default",
    });
    if (!aceptado || !vinculo) return;
    setResolviendoConflicto(diferencia.id);
    try {
      await resolverDiferenciaStockRemota({
        diferenciaId: diferencia.id,
        stockContado,
        nota: notasConciliacion[diferencia.id]?.trim() || undefined,
      });
      await sincronizarCatalogo(vinculo);
      await cargarConflictos();
      toast.success("Stock conciliado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo conciliar el stock.");
    } finally {
      setResolviendoConflicto(null);
    }
  }

  async function usarVersionCompartida(conflicto: ConflictoCatalogoRemoto) {
    const aceptado = await confirm({
      title: "Usar el estado compartido",
      description: "Este celular reemplazará el cambio local rechazado por el estado confirmado en los demás dispositivos.",
      confirmLabel: "Usar compartida",
      tone: "danger",
    });
    if (!aceptado || !vinculo) return;
    setResolviendoConflicto(conflicto.id);
    try {
      await resolverConflictoOperativoRemoto(conflicto.id);
      await sincronizarCatalogo(vinculo);
      await cargarConflictos();
      toast.success("Conflicto resuelto");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo resolver el conflicto.");
    } finally {
      setResolviendoConflicto(null);
    }
  }

  async function prepararComoNuevo() {
    const aceptado = await confirm({
      title: "Preparar este celular nuevamente",
      description: "Se quitará solamente la identidad de sincronización guardada en este dispositivo. Los productos y movimientos locales no se borrarán.",
      confirmLabel: "Preparar celular",
      tone: "default",
    });
    if (!aceptado) return;
    await prepararNuevaVinculacion();
    navigate("/configuracion/sincronizacion/vincular");
  }

  async function revocar(dispositivo: DispositivoRemoto) {
    const aceptado = await confirm({
      title: `Revocar ${dispositivo.nombre}`,
      description: "Ese celular dejará de acceder a los datos compartidos. Sus datos locales no se borrarán.",
      confirmLabel: "Revocar dispositivo",
      tone: "danger",
    });
    if (!aceptado) return;
    try {
      await revocarDispositivo(dispositivo.id);
      toast.success("Dispositivo revocado");
      await cargarDispositivos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo revocar el dispositivo.");
    }
  }

  async function transferir(dispositivo: DispositivoRemoto) {
    const aceptado = await confirm({
      title: `Transferir el control a ${dispositivo.nombre}`,
      description: "Este celular dejará de administrar dispositivos. Ambos conservarán el modo Operación.",
      confirmLabel: "Transferir control",
      tone: "default",
    });
    if (!aceptado) return;
    try {
      await transferirDispositivoPrincipal(dispositivo.id);
      toast.success("Control principal transferido");
      await refrescar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo transferir el control.");
    }
  }

  return (
    <Page>
      <TaskHeader
        title="Sincronización"
        description="Vinculá celulares con nombre propio y controlá cuáles pueden operar o consultar."
        backLabel="Configuración"
        onBack={() => navigate("/configuracion")}
      />

      {estado === "cargando" && <Panel className="flex min-h-28 items-center justify-center gap-3 text-sm text-white/60"><Spinner label="Revisando dispositivo" /> Revisando dispositivo…</Panel>}

      {estado === "sin_configuracion" && (
        <Notice tone="warning">Supabase todavía no está configurado en esta instalación. Creá <code>.env.local</code> desde <code>.env.example</code> y volvé a compilar.</Notice>
      )}

      {estado === "sin_vinculo" && (
        <section className="space-y-3">
          <SectionHeader title="Elegí cómo comenzar" description="Solo el primer celular usa el código de activación. Los demás se vinculan con un QR." />
          <ActionCard to="/configuracion/sincronizacion/activar" title="Configurar el primer celular" description="Crea el negocio remoto y convierte este celular en principal." />
          <ActionCard to="/configuracion/sincronizacion/vincular" title="Vincular este celular" description="Escanea el QR generado por el dispositivo principal." />
          <ActionCard to="/configuracion/sincronizacion/recuperar" title="Recuperar el dispositivo principal" description="Usa el código de recuperación si el principal ya no está disponible." />
        </section>
      )}

      {(estado === "sesion_perdida" || estado === "revocado") && (
        <section className="space-y-3">
          <Notice tone="danger">
            {estado === "revocado" ? "Este dispositivo fue revocado o ya no está autorizado." : "Se perdió la sesión anónima que identificaba este celular."}
          </Notice>
          <Button fullWidth variant="secondary" onClick={() => void prepararComoNuevo()}>Vincular nuevamente</Button>
          <ButtonLink fullWidth variant="warning" to="/configuracion/sincronizacion/recuperar">Recuperar como principal</ButtonLink>
        </section>
      )}

      {estado === "error" && <ErrorState message={mensajeError ?? "No se pudo revisar la sincronización."} onRetry={() => void refrescar()} />}

      {vinculo && (estado === "vinculado" || estado === "error") && (
        <>
          <section className="space-y-3">
            <SectionHeader title="Estado actual" description="Este celular guarda primero los cambios localmente y los comparte en segundo plano." />
            <Panel className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{vinculo.nombreDispositivo}</p>
                  <p className="mt-1 text-sm text-white/55">
                    {vinculo.tipo === "principal" ? "Celular principal" : "Celular vinculado"}
                    {" · "}
                    {vinculo.modo === "operacion" ? "Puede operar" : "Solo consulta"}
                  </p>
                </div>
                <Badge tone={vinculo.estado === "activo" ? "success" : "danger"}>{vinculo.estado === "activo" ? "Activo" : "Revocado"}</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone={vinculo.tipo === "principal" ? "info" : "neutral"}>{vinculo.tipo === "principal" ? "Principal" : "Vinculado"}</Badge>
                <Badge tone={vinculo.modo === "operacion" ? "success" : "neutral"}>{vinculo.modo === "operacion" ? "Operación" : "Consulta"}</Badge>
                {!enLinea && <Badge tone="warning">Sin conexión</Badge>}
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">Datos compartidos</p>
                    <p className="mt-1 text-sm leading-5 text-white/55">
                      {estadoDatos.mensaje
                        ?? (estadoDatos.fase === "sincronizado"
                          ? "Todo está al día."
                          : `${estadoDatos.pendientes} cambio${estadoDatos.pendientes === 1 ? "" : "s"} pendiente${estadoDatos.pendientes === 1 ? "" : "s"}.`)}
                    </p>
                    {formatearUltimaSincronizacion(estadoDatos.ultimaSincronizacionAt) && (
                      <p className="mt-2 text-xs text-white/40">Última sincronización: {formatearUltimaSincronizacion(estadoDatos.ultimaSincronizacionAt)}</p>
                    )}
                  </div>
                  <Badge tone={estadoDatos.fase === "sincronizado" ? "success" : estadoDatos.fase === "error" ? "danger" : estadoDatos.fase === "sin_conexion" ? "neutral" : "warning"}>
                    {textoEstadoDatos[estadoDatos.fase]}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  disabled={!enLinea || estadoDatos.fase === "sincronizando"}
                  onClick={() => void sincronizarCatalogo(vinculo)}
                >
                  {estadoDatos.fase === "sincronizando" ? "Sincronizando…" : "Sincronizar ahora"}
                </Button>
              </div>
            </Panel>
          </section>

          {vinculo.tipo === "principal" && conflictos.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="Cambios para revisar" description="Aparecen si dos celulares modificaron el mismo dato antes de compartirlo." />
              {conflictos.map((conflicto) => (
                <Panel key={conflicto.id} className="space-y-3 border-amber-400/35">
                  <div>
                    <p className="font-semibold text-white">{describirConflicto(conflicto)}</p>
                    <p className="mt-1 text-xs text-white/50">{conflicto.tipo === "VERSION_CONFLICTO" ? "Cambió en otro celular" : "Necesita una decisión"}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button size="sm" variant="secondary" disabled={resolviendoConflicto === conflicto.id} onClick={() => void resolverConflicto(conflicto, "remoto")}>Usar compartida</Button>
                    <Button size="sm" disabled={resolviendoConflicto === conflicto.id} onClick={() => void resolverConflicto(conflicto, "local")}>Aplicar pendiente</Button>
                  </div>
                </Panel>
              ))}
            </section>
          )}

          {vinculo.tipo === "principal" && diferencias.length > 0 && (
            <section className="space-y-3">
              <SectionHeader
                title="Conciliar stock"
                description="Una operación real superó el stock compartido. Contá las unidades actuales para cerrar la diferencia sin perder la venta."
              />
              {diferencias.map((diferencia) => (
                <Panel key={diferencia.id} className="space-y-4 border-amber-400/35">
                  <div>
                    <p className="font-semibold text-white">
                      {nombresProductos[diferencia.productoId] ?? "Producto"}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                      Faltaron {diferencia.unidadesFaltantes} {diferencia.unidadesFaltantes === 1 ? "unidad" : "unidades"} al procesar la operación.
                    </p>
                  </div>
                  <label className="block">
                    <span className="text-sm text-white/70">¿Cuántas unidades hay ahora?</span>
                    <Input
                      inputMode="numeric"
                      min="0"
                      value={stocksContados[diferencia.id] ?? ""}
                      onChange={(event) => setStocksContados((actual) => ({
                        ...actual,
                        [diferencia.id]: event.target.value,
                      }))}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-white/70">Nota (opcional)</span>
                    <Input
                      value={notasConciliacion[diferencia.id] ?? ""}
                      onChange={(event) => setNotasConciliacion((actual) => ({
                        ...actual,
                        [diferencia.id]: event.target.value,
                      }))}
                    />
                  </label>
                  <Button
                    fullWidth
                    disabled={resolviendoConflicto === diferencia.id}
                    onClick={() => void conciliarDiferencia(diferencia)}
                  >
                    {resolviendoConflicto === diferencia.id ? "Conciliando…" : "Guardar stock contado"}
                  </Button>
                </Panel>
              ))}
            </section>
          )}

          {vinculo.tipo === "principal" && conflictosOperativos.some((item) => item.tipo !== "STOCK_FALTANTE") && (
            <section className="space-y-3">
              <SectionHeader
                title="Operaciones para revisar"
                description="Son cambios simultáneos que no pueden decidirse automáticamente."
              />
              {conflictosOperativos.filter((item) => item.tipo !== "STOCK_FALTANTE").map((conflicto) => {
                const detalle = conflicto.detalle as { mensaje?: unknown } | null;
                const mensaje = typeof detalle?.mensaje === "string"
                  ? detalle.mensaje
                  : "El cambio local no coincide con el estado compartido.";
                return (
                  <Panel key={conflicto.id} className="space-y-3 border-amber-400/35">
                    <div>
                      <p className="font-semibold text-white">
                        {conflicto.tipo === "COBRO_EXCEDENTE" ? "Cobros mayores al total" : "Cambio rechazado"}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-white/55">{mensaje}</p>
                    </div>
                    {conflicto.tipo === "COBRO_EXCEDENTE" ? (
                      <Notice tone="warning">Revisá la venta fiada y anulá el cobro incorrecto. El historial se conservará.</Notice>
                    ) : (
                      <Button
                        fullWidth
                        variant="secondary"
                        disabled={resolviendoConflicto === conflicto.id}
                        onClick={() => void usarVersionCompartida(conflicto)}
                      >
                        Usar versión compartida
                      </Button>
                    )}
                  </Panel>
                );
              })}
            </section>
          )}

          {vinculo.tipo === "principal" ? (
            <section className="space-y-3">
              <SectionHeader title="Celulares" description="Revisá su acceso y la última vez que tuvieron actividad compartida." />
              <ActionCard to="/configuracion/sincronizacion/generar" title="Vincular otro celular" description="Genera un QR de un solo uso durante cinco minutos." />

              {cargandoDispositivos && <Panel className="flex items-center justify-center gap-3 text-sm text-white/60"><Spinner size="sm" label="Cargando dispositivos" /> Cargando…</Panel>}
              {errorDispositivos && <ErrorState message={errorDispositivos} onRetry={() => void cargarDispositivos()} />}
              {!cargandoDispositivos && !errorDispositivos && dispositivos.length === 0 && <EmptyState title="No hay dispositivos para mostrar" description="Revisá la conexión e intentá nuevamente." />}
              {dispositivos.map((dispositivo) => {
                const actual = dispositivo.id === vinculo.dispositivoRemotoId;
                const actividad = describirActividadDispositivo(dispositivo);
                return (
                  <Panel key={dispositivo.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{dispositivo.nombre}</p>
                        <p className="mt-1 text-xs text-white/50">{dispositivo.modo === "operacion" ? "Puede operar" : "Solo consulta"}</p>
                      </div>
                      <Badge tone={dispositivo.estado === "revocado" ? "danger" : actual ? "info" : "neutral"}>{dispositivo.estado === "revocado" ? "Revocado" : actual ? "Este celular" : dispositivo.tipo === "principal" ? "Principal" : "Vinculado"}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/55">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${actividad.color}`} aria-hidden="true" />
                      <span>{actividad.etiqueta}</span>
                      <span aria-hidden="true">·</span>
                      <span>Última conexión: {actividad.ultimaConexion}</span>
                    </div>
                    {!actual && dispositivo.estado === "activo" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="warning" onClick={() => void transferir(dispositivo)}>Hacer principal</Button>
                        <Button size="sm" variant="danger" onClick={() => void revocar(dispositivo)}>Revocar</Button>
                      </div>
                    )}
                  </Panel>
                );
              })}
            </section>
          ) : (
            <section className="space-y-3">
              <SectionHeader title="Administración" />
              <Notice tone="neutral">El celular principal administra nuevos vínculos, revocaciones y transferencias.</Notice>
            </section>
          )}
        </>
      )}
    </Page>
  );
}
