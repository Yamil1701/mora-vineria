import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, FieldLabel, Input, Page, Panel, Select, TaskHeader, useToast } from "../../components/ui";
import { agregarCuentaTesoreria } from "../../db";
import type { TipoCuentaTesoreria } from "../../domain/tesoreria";

export function NuevaCuentaTesoreriaPage() {
  const navigate = useNavigate(); const toast = useToast();
  const [nombre, setNombre] = useState(""); const [tipo, setTipo] = useState<TipoCuentaTesoreria>("digital");
  const [saldo, setSaldo] = useState(""); const [objetivo, setObjetivo] = useState(""); const [guardando, setGuardando] = useState(false);
  async function guardar() { try { setGuardando(true); await agregarCuentaTesoreria({ nombre, tipo, saldoInicial: Number(saldo || 0), fondoCambioObjetivo: objetivo ? Number(objetivo) : undefined }); toast.success("Cuenta agregada"); navigate("/tesoreria", { replace: true }); } catch (error) { toast.error("No se pudo agregar", error instanceof Error ? error.message : undefined); } finally { setGuardando(false); } }
  return (
    <Page>
      <TaskHeader title="Agregar cuenta" backLabel="Tesorería" onBack={() => navigate("/tesoreria")} />
      <Panel className="space-y-3">
        <div>
          <FieldLabel label="Nombre" htmlFor="nombre-cuenta" />
          <Input id="nombre-cuenta" value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej: Naranja X" />
        </div>
        <div>
          <FieldLabel label="Tipo" htmlFor="tipo-cuenta" />
          <Select id="tipo-cuenta" value={tipo} onChange={(event) => setTipo(event.target.value as TipoCuentaTesoreria)}><option value="digital">Cuenta digital</option><option value="efectivo">Efectivo</option></Select>
        </div>
        <div>
          <FieldLabel label="Saldo inicial" htmlFor="saldo-cuenta" />
          <Input id="saldo-cuenta" inputMode="numeric" value={saldo} onChange={(event) => setSaldo(event.target.value)} />
        </div>
        {tipo === "efectivo" && (
          <div>
            <FieldLabel label="Fondo de cambio objetivo" htmlFor="objetivo-cuenta" />
            <Input id="objetivo-cuenta" inputMode="numeric" value={objetivo} onChange={(event) => setObjetivo(event.target.value)} />
          </div>
        )}
      </Panel>
      <Button fullWidth size="lg" disabled={guardando || !nombre.trim()} onClick={() => void guardar()}>{guardando ? "Guardando…" : "Agregar cuenta"}</Button>
    </Page>
  );
}
