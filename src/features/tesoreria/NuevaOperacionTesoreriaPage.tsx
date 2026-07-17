import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Notice, Panel, Select, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { registrarMovimiento, registrarOperacionTesoreria } from "../../db";
import { useTesoreria } from "../../hooks/useTesoreria";
import { formatearPesos } from "../ventas/ventas.ui";

type TipoOperacion = "aporte_externo" | "retiro" | "transferencia";
const etiquetas: Record<TipoOperacion, string> = { aporte_externo: "Aporte", retiro: "Retiro", transferencia: "Transferencia" };

export function NuevaOperacionTesoreriaPage() {
  const navigate = useNavigate(); const toast = useToast(); const confirm = useConfirm();
  const { resumen } = useTesoreria();
  const cuentas = useMemo(() => resumen?.cuentas ?? [], [resumen?.cuentas]);
  const [tipo, setTipo] = useState<TipoOperacion>("transferencia");
  const [origenId, setOrigenId] = useState(""); const [destinoId, setDestinoId] = useState("");
  const [monto, setMonto] = useState(""); const [descripcion, setDescripcion] = useState("");
  const [registradoPor, setRegistradoPor] = useState(""); const [destinatario, setDestinatario] = useState("");
  const [observaciones, setObservaciones] = useState(""); const [guardando, setGuardando] = useState(false);
  const cuentaOrigenId = origenId || cuentas[0]?.id || "";
  const cuentaDestinoId = destinoId || cuentas.find((cuenta) => cuenta.id !== cuentaOrigenId)?.id || "";
  const origen = useMemo(
    () => cuentas.find((cuenta) => cuenta.id === cuentaOrigenId),
    [cuentas, cuentaOrigenId],
  );

  async function guardar() {
    const importe = Number(monto);
    const detalle = tipo === "transferencia" ? `${origen?.nombre ?? "Origen"} → ${cuentas.find((cuenta) => cuenta.id === cuentaDestinoId)?.nombre ?? "Destino"}` : etiquetas[tipo];
    if (!await confirm({ title: `Confirmar ${etiquetas[tipo].toLowerCase()}`, description: `${detalle} · ${formatearPesos(importe || 0)}. Quedará en el historial y no se editará.`, confirmLabel: "Registrar" })) return;
    try {
      setGuardando(true);
      if (tipo === "transferencia") await registrarOperacionTesoreria({ tipo, cuentaOrigenId, cuentaDestinoId, monto: importe, descripcion: descripcion || "Transferencia entre cuentas", registradoPor, observaciones });
      else if (tipo === "retiro") await registrarOperacionTesoreria({ tipo, cuentaId: cuentaOrigenId, monto: importe, descripcion: descripcion || "Retiro del negocio", registradoPor, destinatario, observaciones });
      else await registrarMovimiento({
        tipo: "aporte_externo",
        cuentaTesoreriaId: cuentaOrigenId,
        medioPago: origen?.tipo === "efectivo" ? "efectivo" : "transferencia",
        monto: importe,
        descripcion: descripcion || "Aporte al negocio",
        observaciones,
      });
      toast.success(`${etiquetas[tipo]} registrado`); navigate("/tesoreria", { replace: true });
    } catch (error) { toast.error("No se pudo registrar", error instanceof Error ? error.message : undefined); }
    finally { setGuardando(false); }
  }

  return <section className="space-y-5"><TaskHeader title="Registrar dinero" description="Usá transferencias para mover dinero propio entre Caja, Brubank u otra cuenta; no altera el total disponible." backLabel="Tesorería" onBack={() => navigate("/tesoreria")} />
    <div className="grid grid-cols-3 gap-2">{(["aporte_externo", "retiro", "transferencia"] as TipoOperacion[]).map((opcion) => <Button key={opcion} size="sm" variant={tipo === opcion ? "primary" : "secondary"} onClick={() => setTipo(opcion)}>{etiquetas[opcion]}</Button>)}</div>
    <Panel className="space-y-4">
      <label className="block"><span className="text-sm text-white/70">{tipo === "aporte_externo" ? "Cuenta que recibe" : "Cuenta de origen"}</span><Select value={cuentaOrigenId} onChange={(event) => setOrigenId(event.target.value)}>{cuentas.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} · {formatearPesos(cuenta.saldo)}</option>)}</Select></label>
      {tipo === "transferencia" && <label className="block"><span className="text-sm text-white/70">Cuenta de destino</span><Select value={cuentaDestinoId} onChange={(event) => setDestinoId(event.target.value)}>{cuentas.filter((cuenta) => cuenta.id !== cuentaOrigenId).map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre}</option>)}</Select></label>}
      <label className="block"><span className="text-sm text-white/70">Monto</span><Input inputMode="numeric" value={monto} onChange={(event) => setMonto(event.target.value)} placeholder="$0" /></label>
      <label className="block"><span className="text-sm text-white/70">Descripción</span><Input value={descripcion} onChange={(event) => setDescripcion(event.target.value)} placeholder={tipo === "retiro" ? "Ej: Retiro de ganancias" : "Opcional; usaremos una descripción clara"} /></label>
      {tipo !== "aporte_externo" && <label className="block"><span className="text-sm text-white/70">{tipo === "retiro" ? "Quién retiró" : "Quién registró"}</span><Input value={registradoPor} onChange={(event) => setRegistradoPor(event.target.value)} placeholder={tipo === "retiro" ? "Obligatorio" : "Opcional"} /></label>}
      {tipo === "retiro" && <label className="block"><span className="text-sm text-white/70">Para quién o para qué fue</span><Input value={destinatario} onChange={(event) => setDestinatario(event.target.value)} placeholder="Obligatorio" /></label>}
      <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Opcional" /></label>
    </Panel>
    {tipo === "aporte_externo" && <Notice>El aporte también quedará en Movimientos y Reportes, separado de ventas y ganancia.</Notice>}
    <Button fullWidth size="lg" disabled={guardando || Number(monto) <= 0 || !cuentaOrigenId || (tipo === "transferencia" && !cuentaDestinoId) || (tipo === "retiro" && (!registradoPor.trim() || !destinatario.trim()))} onClick={() => void guardar()}>{guardando ? "Registrando…" : "Registrar"}</Button>
  </section>;
}
