import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Notice, Panel, Select, TaskHeader, useToast } from "../../components/ui";
import { configurarTesoreria } from "../../db";
import type { TipoCuentaTesoreria } from "../../domain/tesoreria";

type CuentaBorrador = { id: string; nombre: string; tipo: TipoCuentaTesoreria; saldoInicial: string; fondoCambioObjetivo: string };
const crearCuenta = (nombre = "", tipo: TipoCuentaTesoreria = "digital"): CuentaBorrador => ({ id: crypto.randomUUID(), nombre, tipo, saldoInicial: "", fondoCambioObjetivo: "" });

export function ConfigurarTesoreriaPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [cuentas, setCuentas] = useState<CuentaBorrador[]>([
    crearCuenta("Caja", "efectivo"), crearCuenta("Brubank", "digital"),
  ]);
  const [guardando, setGuardando] = useState(false);

  function actualizar(id: string, cambios: Partial<CuentaBorrador>) {
    setCuentas((actual) => actual.map((cuenta) => cuenta.id === id ? { ...cuenta, ...cambios } : cuenta));
  }
  async function guardar() {
    if (guardando) return;
    try {
      setGuardando(true);
      await configurarTesoreria({ cuentas: cuentas.map((cuenta, indice) => ({
        nombre: cuenta.nombre, tipo: cuenta.tipo, saldoInicial: Number(cuenta.saldoInicial || 0),
        fondoCambioObjetivo: cuenta.tipo === "efectivo" && cuenta.fondoCambioObjetivo ? Number(cuenta.fondoCambioObjetivo) : undefined,
        esPredeterminada: !cuentas.slice(0, indice).some((anterior) => anterior.tipo === cuenta.tipo),
      })) });
      toast.success("Tesorería preparada", "Los importes quedaron como saldos iniciales, no como ventas.");
      navigate("/tesoreria", { replace: true });
    } catch (error) {
      toast.error("No se pudo preparar la tesorería", error instanceof Error ? error.message : undefined);
    } finally { setGuardando(false); }
  }

  return <section className="space-y-5">
    <TaskHeader title="Dinero inicial" description="Copiá lo que existe en la realidad. Los saldos iniciales no cuentan como ventas ni ganancias nuevas." backLabel="Tesorería" onBack={() => navigate("/tesoreria")} />
    <Notice tone="warning">Para tu situación: Caja puede comenzar con $156.600 ($52.400 de cambio + $104.200 reservados para reposición) y Brubank con $87.900. Revisá los importes antes de guardar.</Notice>
    <div className="space-y-3">
      {cuentas.map((cuenta, indice) => <Panel key={cuenta.id} className="space-y-3">
        <div className="flex items-center justify-between"><p className="font-semibold">Cuenta {indice + 1}</p>{cuentas.length > 1 && <Button size="sm" variant="ghost" onClick={() => setCuentas((actual) => actual.filter((item) => item.id !== cuenta.id))}>Quitar</Button>}</div>
        <label className="block"><span className="text-sm text-white/70">Nombre</span><Input value={cuenta.nombre} onChange={(event) => actualizar(cuenta.id, { nombre: event.target.value })} placeholder="Ej: Mercado Pago" /></label>
        <label className="block"><span className="text-sm text-white/70">Tipo</span><Select value={cuenta.tipo} onChange={(event) => actualizar(cuenta.id, { tipo: event.target.value as TipoCuentaTesoreria, fondoCambioObjetivo: "" })}><option value="efectivo">Efectivo</option><option value="digital">Cuenta digital</option></Select></label>
        <label className="block"><span className="text-sm text-white/70">Saldo real inicial</span><Input inputMode="numeric" value={cuenta.saldoInicial} onChange={(event) => actualizar(cuenta.id, { saldoInicial: event.target.value })} placeholder="$0" /></label>
        {cuenta.tipo === "efectivo" && <label className="block"><span className="text-sm text-white/70">Fondo de cambio objetivo</span><Input inputMode="numeric" value={cuenta.fondoCambioObjetivo} onChange={(event) => actualizar(cuenta.id, { fondoCambioObjetivo: event.target.value })} placeholder="Ej: 52400" /></label>}
      </Panel>)}
    </div>
    <Button variant="secondary" fullWidth onClick={() => setCuentas((actual) => [...actual, crearCuenta()])}>Agregar otra cuenta</Button>
    <Button size="lg" fullWidth disabled={guardando} onClick={() => void guardar()}>{guardando ? "Guardando…" : "Guardar saldos iniciales"}</Button>
  </section>;
}
