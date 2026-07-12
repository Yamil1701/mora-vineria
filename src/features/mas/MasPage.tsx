import { ActionCard, Icon, Page, PageHeader, SectionHeader } from "../../components/ui";
import { useEstadoRespaldo } from "../../hooks/useEstadoRespaldo";

export function MasPage() {
  const { estado: estadoRespaldo } = useEstadoRespaldo();

  return (
    <Page>
      <PageHeader
        title="Más"
        description="Movimientos, análisis y herramientas del dispositivo."
      />

      <section className="space-y-3">
        <SectionHeader title="Operación" />
        <ActionCard
          to="/movimientos"
          title="Movimientos"
          description="Reposiciones, aportes, gastos e historial."
          icon={<Icon name="movimientos" />}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Análisis" />
        <div className="grid gap-3">
          <ActionCard
            to="/reportes"
            title="Reportes"
            description="Ventas, ganancia estimada y productos por período."
            icon={<Icon name="reportes" />}
          />
          <ActionCard
            to="/proyecciones"
            title="Proyecciones"
            description="Evolución y referencia mensual."
            icon={<Icon name="proyecciones" />}
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Sistema" />
        <ActionCard
          to="/configuracion"
          title="Configuración"
          description="Modo del dispositivo, respaldos y exportaciones."
          icon={<Icon name="configuracion" />}
          attentionLabel={estadoRespaldo && estadoRespaldo !== "vigente" ? "Hay una recomendación de respaldo" : undefined}
        />
      </section>
    </Page>
  );
}
