import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Select, TaskHeader, useToast } from "../../components/ui";
import { agregarCuentaTesoreria } from "../../db";
import type { TipoCuentaTesoreria } from "../../domain/tesoreria";

export function NuevaCuentaTesoreriaPage() {
  const navigate = useNavigate(); const toast = useToast();
  const [nombre, setNombre] = useState(""); const [tipo, setTipo] = useState<TipoCuentaTesoreria>("digital");
  const [saldo, setSaldo] = useState(""); const [objetivo, setObjetivo] = useState(""); const [guardando, setGuardando] = useState(false);
  async function guardar() { try { setGuardando(true); await agregarCuentaTesoreria({ nombre, tipo, saldoInicial: Number(saldo || 0), fondoCambioObjetivo: objetivo ? Number(objetivo) : undefined }); toast.success("Cuenta agregada"); navigate("/tesoreria", { replace: true }); } catch (error) { toast.error("No se pudo agregar", error instanceof Error ? error.message : undefined); } finally { setGuardando(false); } }
  return <section className="space-y-5"><TaskHeader title="Agregar cuenta" backLabel="Tesorería" onBack={() => navigate("/tesoreria")} /><label className="block"><span className="text-sm text-white/70">Nombre</span><Input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej: Naranja X" /></label><label className="block"><span className="text-sm text-white/70">Tipo</span><Select value={tipo} onChange={(event) => setTipo(event.target.value as TipoCuentaTesoreria)}><option value="digital">Cuenta digital</option><option value="efectivo">Efectivo</option></Select></label><label className="block"><span className="text-sm text-white/70">Saldo inicial</span><Input inputMode="numeric" value={saldo} onChange={(event) => setSaldo(event.target.value)} /></label>{tipo === "efectivo" && <label className="block"><span className="text-sm text-white/70">Fondo de cambio objetivo</span><Input inputMode="numeric" value={objetivo} onChange={(event) => setObjetivo(event.target.value)} /></label>}<Button fullWidth size="lg" disabled={guardando || !nombre.trim()} onClick={() => void guardar()}>{guardando ? "Guardando…" : "Agregar cuenta"}</Button></section>;
}
