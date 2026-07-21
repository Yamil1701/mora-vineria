import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  ActionCard,
  Badge,
  Button,
  ErrorState,
  Icon,
  Input,
  Notice,
  Page,
  Panel,
  Spinner,
  TaskHeader,
  useConfirm,
  useToast,
} from "../../components/ui";
import { useEstadoConexion } from "../../hooks/useEstadoConexion";
import { useEstadoSincronizacion } from "../../hooks/useEstadoSincronizacion";
import { useVinculoDispositivo } from "../../hooks/useVinculoDispositivo";
import { buscarActualizacionPwa } from "../../pwa/actualizacion";
import {
  actualizarNombreDispositivoActual,
  desvincularDispositivoActual,
} from "../../sync/dispositivos";
import { prepararNuevaVinculacion } from "../../sync/vinculacion";

function formatearFecha(fecha: string | null | undefined): string {
  if (!fecha) return "Todavía no registrada";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Todavía no registrada";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
}

function abreviarId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-5)}` : id;
}

export function DispositivoPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const enLinea = useEstadoConexion();
  const estadoDatos = useEstadoSincronizacion();
  const { estado, vinculo, mensajeError, refrescar } = useVinculoDispositivo();
  const [nombre, setNombre] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [buscandoActualizacion, setBuscandoActualizacion] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);

  useEffect(() => {
    setNombre(vinculo?.nombreDispositivo ?? "");
  }, [vinculo?.nombreDispositivo]);

  async function guardarNombre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const limpio = nombre.trim();
    if (!vinculo || limpio === vinculo.nombreDispositivo) return;
    if (!limpio || limpio.length > 60) {
      toast.warning("Ingresá un nombre de entre 1 y 60 caracteres");
      return;
    }
    setGuardandoNombre(true);
    try {
      await actualizarNombreDispositivoActual(limpio);
      await refrescar();
      toast.success("Nombre del dispositivo actualizado");
    } catch (error) {
      toast.error("No se pudo cambiar el nombre", error instanceof Error ? error.message : undefined);
    } finally {
      setGuardandoNombre(false);
    }
  }

  async function copiarIdentificador() {
    if (!vinculo) return;
    try {
      await navigator.clipboard.writeText(vinculo.dispositivoRemotoId);
      toast.success("Identificador copiado");
    } catch {
      toast.error("No se pudo copiar el identificador");
    }
  }

  async function actualizarAplicacion() {
    setBuscandoActualizacion(true);
    try {
      const resultado = await buscarActualizacionPwa();
      if (resultado === "actualizada") {
        toast.success("Actualización lista. Reiniciando Mora…");
        window.setTimeout(() => window.location.reload(), 500);
      } else if (resultado === "al_dia") {
        toast.success("Ya tenés la última versión");
      } else {
        toast.warning("La actualización está disponible únicamente en la PWA instalada.");
      }
    } catch {
      toast.error("No pudimos buscar actualizaciones. Revisá la conexión e intentá nuevamente.");
    } finally {
      setBuscandoActualizacion(false);
    }
  }

  async function desvincular() {
    if (!vinculo || vinculo.tipo === "principal") return;
    const pendientes = estadoDatos.pendientes;
    const aceptado = await confirm({
      title: "Desvincular este dispositivo",
      description: pendientes > 0
        ? `Hay ${pendientes} cambio${pendientes === 1 ? "" : "s"} local${pendientes === 1 ? "" : "es"} pendiente${pendientes === 1 ? "" : "s"}. Si continuás, permanecerán solo en esta copia y no se compartirán automáticamente. Sincronizá o hacé un respaldo antes si necesitás conservarlos en el negocio.`
        : "Este celular dejará de acceder a los datos compartidos. Sus datos locales no se borrarán y podrá vincularse nuevamente más adelante.",
      confirmLabel: "Desvincular",
      tone: "danger",
    });
    if (!aceptado) return;
    setDesvinculando(true);
    try {
      await desvincularDispositivoActual();
      await prepararNuevaVinculacion();
      toast.success("Dispositivo desvinculado");
      navigate("/configuracion/sincronizacion/vincular", { replace: true });
    } catch (error) {
      toast.error("No se pudo desvincular", error instanceof Error ? error.message : undefined);
      setDesvinculando(false);
    }
  }

  return (
    <Page>
      <TaskHeader
        title="Dispositivo"
        description="Identidad, acceso y versión de esta instalación."
        backLabel="Más"
        onBack={() => navigate("/mas")}
      />

      {estado === "cargando" && (
        <Panel className="flex min-h-28 items-center justify-center gap-3 text-sm text-white/60">
          <Spinner label="Revisando dispositivo" /> Revisando dispositivo…
        </Panel>
      )}

      {estado === "error" && (
        <ErrorState message={mensajeError ?? "No se pudo revisar el dispositivo."} onRetry={() => void refrescar()} />
      )}

      {(estado === "sin_configuracion" || estado === "sin_vinculo" || estado === "sesion_perdida" || estado === "revocado") && (
        <section className="space-y-3">
          <Notice tone={estado === "revocado" ? "danger" : "warning"}>
            {estado === "sin_configuracion"
              ? "La sincronización no está configurada en esta instalación."
              : estado === "revocado"
                ? "Este dispositivo ya no está autorizado."
                : "Este dispositivo todavía no tiene un vínculo activo."}
          </Notice>
          <ActionCard
            to="/configuracion/sincronizacion"
            title="Ir a Sincronización"
            description="Configurar, recuperar o volver a vincular este celular."
            icon={<Icon name="sincronizar" />}
          />
        </section>
      )}

      {vinculo && (estado === "vinculado" || estado === "error") && (
        <>
          <form className="space-y-3" onSubmit={(event) => void guardarNombre(event)}>
            <Panel className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-white/40">Nombre del dispositivo</p>
                  <p className="mt-1 text-sm text-white/55">Podés reconocerlo así desde el celular principal.</p>
                </div>
                <Badge tone={vinculo.estado === "activo" ? "success" : "danger"}>
                  {vinculo.estado === "activo" ? "Autorizado" : "Revocado"}
                </Badge>
              </div>
              <Input value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={60} disabled={!enLinea || guardandoNombre} />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={!enLinea || guardandoNombre || !nombre.trim() || nombre.trim() === vinculo.nombreDispositivo}
              >
                {guardandoNombre ? "Guardando…" : "Guardar nombre"}
              </Button>
            </Panel>
          </form>

          <Panel className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-white/50">Permiso asignado</p>
                <p className="mt-1 font-semibold text-white">
                  {vinculo.tipo === "principal" ? "Principal" : vinculo.modo === "operacion" ? "Operación" : "Consulta"}
                </p>
              </div>
              <Badge tone={vinculo.modo === "operacion" ? "success" : "neutral"}>
                {vinculo.modo === "operacion" ? "Puede operar" : "Solo consulta"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm">
              <div>
                <p className="text-white/45">Estado</p>
                <p className="mt-1 font-medium">{enLinea ? "Conectado" : "Sin conexión"}</p>
              </div>
              <div>
                <p className="text-white/45">Última sincronización</p>
                <p className="mt-1 font-medium">{formatearFecha(estadoDatos.ultimaSincronizacionAt)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="min-w-0">
                <p className="text-sm text-white/45">Identificador técnico</p>
                <p className="mt-1 truncate font-mono text-sm">{abreviarId(vinculo.dispositivoRemotoId)}</p>
              </div>
              <Button size="sm" variant="ghost" leftIcon={<Icon name="copiar" />} onClick={() => void copiarIdentificador()}>
                Copiar
              </Button>
            </div>
          </Panel>

          <Panel className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mora-principal/10 text-mora-suave">
              <Icon name="actualizar" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Mora v{__APP_VERSION__}</p>
              <p className="mt-1 text-xs leading-5 text-white/50">La búsqueda no modifica tus datos.</p>
            </div>
            <Button size="sm" variant="secondary" disabled={!enLinea || buscandoActualizacion} onClick={() => void actualizarAplicacion()}>
              {buscandoActualizacion ? "Buscando…" : "Actualizar"}
            </Button>
          </Panel>

          {vinculo.tipo === "principal" ? (
            <Notice tone="neutral">
              Para desvincular este celular, transferí primero el control principal desde Sincronización.
            </Notice>
          ) : (
            <Button fullWidth variant="danger" disabled={!enLinea || desvinculando} onClick={() => void desvincular()}>
              {desvinculando ? "Desvinculando…" : "Desvincular este dispositivo"}
            </Button>
          )}
        </>
      )}
    </Page>
  );
}
