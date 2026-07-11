import { ActionCard, Page, PageHeader, SectionHeader } from "../../components/ui";
import { BrandEyebrow } from "../../components/Brand";

export function ConfiguracionPage() {
  return <Page>
    <PageHeader eyebrow={<BrandEyebrow />} title="Configuración" description="Elegí qué aspecto del dispositivo querés revisar." />
    <section className="space-y-3"><SectionHeader title="Dispositivo" /><ActionCard to="/configuracion/modo" title="Modo del dispositivo" description="Principal o consulta y almacenamiento local." /></section>
    <section className="space-y-3"><SectionHeader title="Protección de datos" /><ActionCard to="/configuracion/respaldos" title="Respaldos y restauración" description="Crear una copia completa o recuperar datos." /></section>
    <section className="space-y-3"><SectionHeader title="Salidas auxiliares" /><ActionCard to="/configuracion/exportaciones" title="Exportar CSV" description="Productos, ventas y movimientos para planillas." /></section>
  </Page>;
}
