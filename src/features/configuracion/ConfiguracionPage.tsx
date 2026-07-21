import { ActionCard, Button, Icon, Page, PageHeader, Panel, SectionHeader } from "../../components/ui";
import { BrandEyebrow } from "../../components/Brand";
import { useEstadoRespaldo } from "../../hooks/useEstadoRespaldo";
import { usePreferenciasUi, type TemaApp } from "../../stores/preferenciasUi";

const temas: Array<{ valor: TemaApp; titulo: string; descripcion: string }> = [
  { valor: "oscuro", titulo: "Oscuro", descripcion: "El tema principal de Mora." },
  { valor: "claro", titulo: "Claro", descripcion: "Una versión luminosa para frontear." },
];

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
        <Panel className="grid grid-cols-2 gap-3">
          {temas.map((opcion) => {
            const activo = tema === opcion.valor;
            return (
              <Button
                key={opcion.valor}
                variant={activo ? "primary" : "secondary"}
                className="h-auto min-h-24 flex-col items-start px-4 text-left"
                aria-pressed={activo}
                onClick={() => cambiarTema(opcion.valor)}
              >
                <span className="flex w-full items-center justify-between">
                  <span>{opcion.titulo}</span>
                  <span aria-hidden="true">{activo ? "✓" : ""}</span>
                </span>
                <span className={`text-xs font-normal leading-5 ${activo ? "text-white/80" : "text-white/50"}`}>
                  {opcion.descripcion}
                </span>
              </Button>
            );
          })}
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
