import { ActionCard, Icon, Notice, Page, PageHeader, SectionHeader } from "../../components/ui";
import { BrandEyebrow } from "../../components/Brand";
import { useEstadoRespaldo } from "../../hooks/useEstadoRespaldo";

export function ConfiguracionPage() {
  const { estado: estadoRespaldo } = useEstadoRespaldo();
  const requiereRespaldo = estadoRespaldo !== null && estadoRespaldo !== "vigente";

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
        {requiereRespaldo && (
          <Notice tone="warning">
            {estadoRespaldo === "sin_respaldo"
              ? "Todavía no creaste un respaldo. Hacé una primera copia para poder recuperar tus datos si la necesitás."
              : "Tu último respaldo tiene más de 7 días. Te recomendamos crear una copia actualizada."}
          </Notice>
        )}
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
    </Page>
  );
}
