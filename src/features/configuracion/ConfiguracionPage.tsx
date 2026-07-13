import { useState } from "react";

import { ActionCard, Button, Icon, Page, PageHeader, Panel, SectionHeader, Spinner, useToast } from "../../components/ui";
import { BrandEyebrow } from "../../components/Brand";
import { useEstadoRespaldo } from "../../hooks/useEstadoRespaldo";
import { buscarActualizacionPwa } from "../../pwa/actualizacion";

export function ConfiguracionPage() {
  const { estado: estadoRespaldo } = useEstadoRespaldo();
  const requiereRespaldo = estadoRespaldo !== null && estadoRespaldo !== "vigente";
  const toast = useToast();
  const [buscandoActualizacion, setBuscandoActualizacion] = useState(false);

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

  return (
    <Page>
      <PageHeader eyebrow={<BrandEyebrow />} title="Configuración" description="Elegí qué aspecto del dispositivo querés revisar." />

      <section className="space-y-3">
        <SectionHeader title="Dispositivo" />
        <ActionCard
          to="/configuracion/sincronizacion"
          title="Sincronización entre celulares"
          description="Estado, celulares autorizados y recuperación."
          icon={<Icon name="sincronizar" />}
        />
        <ActionCard
          to="/configuracion/modo"
          title="Modo del dispositivo"
          description="Operación o consulta según su vínculo actual."
          icon={<Icon name="dispositivo" />}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Protección de datos" />
        <ActionCard
          to="/configuracion/respaldos"
          title="Respaldos y restauración"
          description="Crear una copia completa o recuperar datos."
          icon={<Icon name="respaldo" />}
          attentionLabel={requiereRespaldo ? "Hay una recomendación de respaldo" : undefined}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Salidas auxiliares" />
        <ActionCard
          to="/configuracion/exportaciones"
          title="Exportar CSV"
          description="Productos, ventas y movimientos para planillas."
          icon={<Icon name="exportar" />}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Aplicación" />
        <Panel className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mora-principal/10 text-mora-suave"><Icon name="actualizar" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Última versión</p>
            <p className="mt-1 text-xs leading-5 text-white/50">Busca cambios publicados sin modificar tus datos.</p>
          </div>
          <Button size="sm" variant="secondary" disabled={buscandoActualizacion} onClick={() => void actualizarAplicacion()}>
            {buscandoActualizacion ? <Spinner size="sm" label="Buscando" /> : "Actualizar"}
          </Button>
        </Panel>
      </section>
    </Page>
  );
}
