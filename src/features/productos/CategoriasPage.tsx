import { useNavigate } from "react-router-dom";

import { CategoriasCard } from "../../components/CategoriasCard";
import { Page, TaskHeader } from "../../components/ui";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";

export function CategoriasPage() {
  const navigate = useNavigate();
  const { configuracion } = useConfiguracionLocal();
  return (
    <Page>
      <TaskHeader title="Categorías" description="Organizá los productos sin mezclar esta tarea con el listado." backLabel="Productos" onBack={() => navigate("/productos")} />
      <CategoriasCard soloConsulta={configuracion?.deviceRole === "consulta"} />
    </Page>
  );
}
