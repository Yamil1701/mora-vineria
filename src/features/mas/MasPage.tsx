import { ActionCard, Page, PageHeader, SectionHeader } from "../../components/ui";

export function MasPage() {
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
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Análisis" />
        <div className="grid gap-3">
          <ActionCard
            to="/reportes"
            title="Reportes"
            description="Ventas, ganancia estimada y productos por período."
          />
          <ActionCard
            to="/proyecciones"
            title="Proyecciones"
            description="Evolución y referencia mensual."
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Sistema" />
        <ActionCard
          to="/configuracion"
          title="Configuración"
          description="Modo del dispositivo, respaldos y exportaciones."
        />
      </section>
    </Page>
  );
}
