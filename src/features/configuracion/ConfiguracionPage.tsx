import { ActionCard, FieldLabel, Icon, Page, PageHeader, Panel, SectionHeader, Select } from "../../components/ui";
import { BrandEyebrow } from "../../components/Brand";
import { useEstadoRespaldo } from "../../hooks/useEstadoRespaldo";
import { usePreferenciasUi, type TemaApp } from "../../stores/preferenciasUi";

export function ConfiguracionPage() {
  const { estado: estadoRespaldo } = useEstadoRespaldo();
  const requiereRespaldo = estadoRespaldo !== null && estadoRespaldo !== "vigente";
  const tema = usePreferenciasUi((estado) => estado.tema);
  const cambiarTema = usePreferenciasUi((estado) => estado.cambiarTema);

  return (
    <Page>
      <PageHeader
        eyebrow={<BrandEyebrow />}
        title="Configuración"
        description="Apariencia, protección de datos y salidas auxiliares."
      />

      <section className="space-y-3">
        <SectionHeader title="Apariencia" description="El cambio se aplica en este dispositivo." />
        <Panel className="space-y-2">
          <FieldLabel
            label="Tema de la aplicación"
            description="Oscuro prioriza el uso nocturno; Claro mejora la lectura con luz ambiente."
            htmlFor="tema-aplicacion"
          />
          <Select
            id="tema-aplicacion"
            value={tema}
            onChange={(event) => cambiarTema(event.target.value as TemaApp)}
          >
            <option value="oscuro">Oscuro</option>
            <option value="claro">Claro</option>
          </Select>
        </Panel>
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
    </Page>
  );
}
