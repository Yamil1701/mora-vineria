import { useNavigate } from "react-router-dom";

import { AvisoDatosLocales } from "../../components/AvisoDatosLocales";
import { ModoDispositivoCard } from "../../components/ModoDispositivoCard";
import { TaskHeader } from "../../components/ui";

export function ModoConfiguracionPage() {
  const navigate = useNavigate();
  return <section className="space-y-5"><TaskHeader title="Modo del dispositivo" backLabel="Configuración" onBack={() => navigate("/configuracion")} /><ModoDispositivoCard /><AvisoDatosLocales /></section>;
}
