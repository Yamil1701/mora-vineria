import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Notice, Panel, Select, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { registrarConteoCaja } from "../../db";
import { useTesoreria } from "../../hooks/useTesoreria";
import { formatearPesos } from "../ventas/ventas.ui";

const DENOMINACIONES = [100, 200, 500, 1000, 2000, 10000, 20000];

export function ConteoCajaPage() {
  const navigate = useNavigate(); const toast = useToast(); const confirm = useConfirm();
  const { resumen } = useTesoreria(); const cuentas = resumen?.cuentas.filter((cuenta) => cuenta.tipo === "efectivo") ?? [];
  const [cuentaId, setCuentaId] = useState(""); const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [otro, setOtro] = useState(""); const [observaciones, setObservaciones] = useState(""); const [guardando, setGuardando] = useState(false);
  const cuentaElegidaId = cuentaId || cuentas[0]?.id || ""; const cuenta = cuentas.find((item) => item.id === cuentaElegidaId);
  const total = useMemo(() => DENOMINACIONES.reduce((suma, denominacion) => suma + denominacion * (cantidades[String(denominacion)] ?? 0), 0) + Number(otro || 0), [cantidades, otro]);
  const diferencia = total - (cuenta?.saldo ?? 0);
  async function guardar() {
    const aceptado = await confirm({ title: "Guardar conteo", description: diferencia === 0 ? "La caja coincide. El conteo quedará en el historial." : `Hay una diferencia de ${formatearPesos(Math.abs(diferencia))}. Se registrará un ajuste para que el saldo coincida con el dinero contado.`, confirmLabel: "Guardar conteo", tone: "default" });
    if (!aceptado) return;
    try { setGuardando(true); await registrarConteoCaja({ cuentaId: cuentaElegidaId, montoContado: total, detalleDenominaciones: { ...cantidades, ...(Number(otro || 0) > 0 ? { otroImporte: Number(otro) } : {}) }, observaciones }); toast.success("Conteo guardado"); navigate("/tesoreria", { replace: true }); }
    catch (error) { toast.error("No se pudo guardar el conteo", error instanceof Error ? error.message : undefined); }
    finally { setGuardando(false); }
  }
  return <section className="space-y-5"><TaskHeader title="Conteo de caja" description="Contá el efectivo real. Si no coincide, la diferencia quedará registrada como ajuste trazable." backLabel="Tesorería" onBack={() => navigate("/tesoreria")} />
    <label className="block"><span className="text-sm text-white/70">Caja</span><Select value={cuentaElegidaId} onChange={(event) => setCuentaId(event.target.value)}>{cuentas.map((item) => <option key={item.id} value={item.id}>{item.nombre} · esperado {formatearPesos(item.saldo)}</option>)}</Select></label>
    <Panel className="space-y-3"><p className="font-semibold">Billetes y monedas</p>{DENOMINACIONES.map((denominacion) => <label key={denominacion} className="grid grid-cols-[1fr_7rem] items-center gap-3"><span className="text-sm text-white/65">{formatearPesos(denominacion)}</span><Input inputMode="numeric" value={cantidades[String(denominacion)] || ""} onChange={(event) => setCantidades((actual) => ({ ...actual, [denominacion]: Number(event.target.value || 0) }))} placeholder="0" /></label>)}<label className="grid grid-cols-[1fr_7rem] items-center gap-3"><span className="text-sm text-white/65">Otro importe</span><Input inputMode="numeric" value={otro} onChange={(event) => setOtro(event.target.value)} placeholder="$0" /></label></Panel>
    <Panel><p className="text-xs text-white/45">Total contado</p><p className="mt-1 text-3xl font-bold">{formatearPesos(total)}</p><p className={`mt-2 text-sm ${diferencia === 0 ? "text-green-200" : "text-yellow-100"}`}>{diferencia === 0 ? "Coincide con el saldo esperado" : `${diferencia > 0 ? "Sobran" : "Faltan"} ${formatearPesos(Math.abs(diferencia))}`}</p></Panel>
    <label className="block"><span className="text-sm text-white/70">Nota</span><Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Opcional" /></label>
    {diferencia !== 0 && <Notice tone="warning">El ajuste no se oculta: queda en el historial para poder revisar qué pasó.</Notice>}
    <Button fullWidth size="lg" disabled={guardando || !cuentaElegidaId} onClick={() => void guardar()}>{guardando ? "Guardando…" : "Guardar conteo"}</Button>
  </section>;
}
