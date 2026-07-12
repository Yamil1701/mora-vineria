import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ActionCard,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  Notice,
  Page,
  Panel,
  SectionHeader,
  Spinner,
  TaskHeader,
  useConfirm,
  useToast,
} from "../../components/ui";
import type { DispositivoRemoto } from "../../domain/sincronizacion";
import { useVinculoDispositivo } from "../../hooks/useVinculoDispositivo";
import {
  listarDispositivosRemotos,
  revocarDispositivo,
  transferirDispositivoPrincipal,
} from "../../sync/dispositivos";
import { prepararNuevaVinculacion } from "../../sync/vinculacion";

export function SincronizacionPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { estado, vinculo, mensajeError, refrescar } = useVinculoDispositivo();
  const [dispositivos, setDispositivos] = useState<DispositivoRemoto[]>([]);
  const [cargandoDispositivos, setCargandoDispositivos] = useState(false);
  const [errorDispositivos, setErrorDispositivos] = useState<string | null>(null);

  const cargarDispositivos = useCallback(async () => {
    if (estado !== "vinculado" || vinculo?.tipo !== "principal" || !navigator.onLine) return;
    setCargandoDispositivos(true);
    setErrorDispositivos(null);
    try {
      setDispositivos(await listarDispositivosRemotos());
    } catch (error) {
      setErrorDispositivos(error instanceof Error ? error.message : "No se pudieron cargar los dispositivos.");
    } finally {
      setCargandoDispositivos(false);
    }
  }, [estado, vinculo?.tipo]);

  useEffect(() => { void cargarDispositivos(); }, [cargarDispositivos]);

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
          <Panel className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{vinculo.nombreDispositivo}</p>
                <p className="mt-1 text-sm text-white/55">Identidad de este dispositivo</p>
              </div>
              <Badge tone={vinculo.estado === "activo" ? "success" : "danger"}>{vinculo.estado === "activo" ? "Activo" : "Revocado"}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={vinculo.tipo === "principal" ? "info" : "neutral"}>{vinculo.tipo === "principal" ? "Principal" : "Vinculado"}</Badge>
              <Badge tone={vinculo.modo === "operacion" ? "success" : "neutral"}>{vinculo.modo === "operacion" ? "Operación" : "Consulta"}</Badge>
              {!navigator.onLine && <Badge tone="warning">Sin conexión</Badge>}
            </div>
          </Panel>

          {vinculo.tipo === "principal" ? (
            <section className="space-y-3">
              <SectionHeader title="Administración" />
              <ActionCard to="/configuracion/sincronizacion/generar" title="Vincular otro celular" description="Genera un QR de un solo uso durante cinco minutos." />

              <SectionHeader title="Dispositivos autorizados" />
              {cargandoDispositivos && <Panel className="flex items-center justify-center gap-3 text-sm text-white/60"><Spinner size="sm" label="Cargando dispositivos" /> Cargando…</Panel>}
              {errorDispositivos && <ErrorState message={errorDispositivos} onRetry={() => void cargarDispositivos()} />}
              {!cargandoDispositivos && !errorDispositivos && dispositivos.length === 0 && <EmptyState title="No hay dispositivos para mostrar" description="Revisá la conexión e intentá nuevamente." />}
              {dispositivos.map((dispositivo) => {
                const actual = dispositivo.id === vinculo.dispositivoRemotoId;
                return (
                  <Panel key={dispositivo.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-semibold text-white">{dispositivo.nombre}</p><p className="mt-1 text-xs text-white/50">{dispositivo.modo === "operacion" ? "Puede operar" : "Solo consulta"}</p></div>
                      <Badge tone={actual ? "info" : "neutral"}>{actual ? "Este celular" : dispositivo.tipo === "principal" ? "Principal" : "Vinculado"}</Badge>
                    </div>
                    {!actual && (
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
            <Notice tone="neutral">El dispositivo principal administra los emparejamientos, revocaciones y transferencias.</Notice>
          )}
        </>
      )}
    </Page>
  );
}
