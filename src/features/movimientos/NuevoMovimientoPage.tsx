import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Notice, Panel, Select, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { registrarMovimiento } from "../../db";
import type { TipoMovimiento } from "../../domain/movimientos";
import type { MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { movimientoFormSchema } from "../../schemas";
import { formatearPesos } from "../ventas/ventas.ui";

interface ItemReposicion { id: string; productoId: string; cantidad: string; costoUnitario: string }
const labels: Record<TipoMovimiento, string> = { reposicion: "Reposición", aporte_externo: "Aporte externo", gasto_puntual: "Gasto puntual" };
const crearItem = (productoId = ""): ItemReposicion => ({ id: `${Date.now()}-${Math.random()}`, productoId, cantidad: "1", costoUnitario: "" });
const ErrorCampo = ({ mensaje }: { mensaje?: string }) => mensaje ? <span role="alert" className="mt-1 block text-xs text-red-200">{mensaje}</span> : null;

export function NuevoMovimientoPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion } = useConfiguracionLocal();
  const { productos, recargar: recargarProductos } = useProductos(false);
  const [tipo, setTipo] = useState<TipoMovimiento>("reposicion");
  const [descripcion, setDescripcion] = useState("Reposición de mercadería");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [aporteIncluido, setAporteIncluido] = useState("");
  const [items, setItems] = useState<ItemReposicion[]>([crearItem()]);
  const [guardando, setGuardando] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const envioEnCursoRef = useRef(false);
  const esConsulta = configuracion?.deviceRole === "consulta";
  const productoInicial = productos[0]?.id ?? "";
  const totalReposicion = useMemo(() => items.reduce((total, item) => total + (Number(item.cantidad) || 0) * (Number(item.costoUnitario) || 0), 0), [items]);
  const { confirmarSalida, permitirSiguienteNavegacion } = useUnsavedChanges(dirty);

  useEffect(() => {
    if (!productoInicial) return;
    setItems((actual) => actual.map((item) => ({ ...item, productoId: item.productoId || productoInicial })));
  }, [productoInicial]);

  function elegirTipo(nuevoTipo: TipoMovimiento) {
    setDirty(true);
    setTipo(nuevoTipo);
    setDescripcion(nuevoTipo === "reposicion" ? "Reposición de mercadería" : "");
    setMonto("");
    setObservaciones("");
  }

  function actualizarItem(id: string, campo: keyof Omit<ItemReposicion, "id">, valor: string) {
    setDirty(true);
    setItems((actual) => actual.map((item) => item.id === id ? { ...item, [campo]: valor } : item));
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta || envioEnCursoRef.current) return;
    const values = tipo === "reposicion" ? {
      tipo,
      descripcion,
      monto: totalReposicion,
      medioPago,
      detalles: items.map((item) => ({ productoId: item.productoId, cantidad: item.cantidad, costoUnitario: item.costoUnitario })),
      aporteExternoIncluido: aporteIncluido.trim() ? Number(aporteIncluido) : undefined,
      observaciones,
    } : { tipo, descripcion, monto, medioPago, observaciones };
    const resultado = movimientoFormSchema.safeParse(values);
    if (!resultado.success) {
      const siguientes = Object.fromEntries(resultado.error.issues.map((issue) => [issue.path.join("."), issue.message]));
      setErroresCampo(siguientes);
      const primerCampo = resultado.error.issues[0]?.path.join(".") ?? "";
      formRef.current?.querySelector<HTMLElement>(`[name="${primerCampo}"]`)?.focus();
      return;
    }
    setErroresCampo({});
    envioEnCursoRef.current = true;
    try {
      const confirmado = await confirm({
        title: `Registrar ${labels[tipo].toLowerCase()}`,
        description: tipo === "reposicion" ? `Se actualizará el stock por ${formatearPesos(totalReposicion)}.` : `Se guardará por ${formatearPesos(resultado.data.monto)} en la jornada actual.`,
        confirmLabel: "Registrar",
      });
      if (!confirmado) return;
      setGuardando(true);
      const id = await registrarMovimiento(resultado.data);
      await recargarProductos();
      permitirSiguienteNavegacion();
      setDirty(false);
      toast.success(`${labels[tipo]} registrada`);
      navigate(`/movimientos/${id}`, { replace: true });
    } catch (errorDesconocido) {
      toast.error("No se pudo registrar el movimiento", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally { envioEnCursoRef.current = false; setGuardando(false); }
  }

  return (
    <section className="space-y-5">
      <TaskHeader title="Registrar movimiento" description="Elegí qué ocurrió y completá solamente los datos necesarios." backLabel="Movimientos" onBack={async () => { if (await confirmarSalida()) navigate("/movimientos"); }} />
      {esConsulta && <Notice tone="warning">Este dispositivo está en modo consulta.</Notice>}
      <div className="grid gap-2">
        {(["reposicion", "aporte_externo", "gasto_puntual"] as TipoMovimiento[]).map((opcion) => (
          <Button key={opcion} size="lg" variant={tipo === opcion ? "primary" : "secondary"} aria-pressed={tipo === opcion} onClick={() => elegirTipo(opcion)}>{labels[opcion]}</Button>
        ))}
      </div>

      <form ref={formRef} onSubmit={(event) => void guardar(event)} onChange={() => setDirty(true)} className="space-y-4" aria-busy={guardando}>
        <Panel className="space-y-4 animate-mora-enter">
          <div><h2 className="text-lg font-semibold">{labels[tipo]}</h2><p className="mt-1 text-sm text-white/55">{tipo === "reposicion" ? "Sumará unidades al stock." : tipo === "aporte_externo" ? "Dinero incorporado al negocio; no es una venta." : "Un gasto excepcional del negocio."}</p></div>
          <label className="block"><span className="text-sm text-white/70">Descripción</span><Input name="descripcion" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} placeholder={tipo === "gasto_puntual" ? "Ej: Reparación" : "Descripción"} /><ErrorCampo mensaje={erroresCampo.descripcion} /></label>

          {tipo === "reposicion" ? (
            <>
              <div className="space-y-3">
                {items.map((item, indice) => (
                  <div key={item.id} className="space-y-3 rounded-2xl bg-black/15 p-3">
                    <div className="flex items-center justify-between"><p className="text-sm font-semibold">Producto {indice + 1}</p>{items.length > 1 && <Button variant="ghost" size="sm" onClick={() => { setDirty(true); setItems((actual) => actual.filter((actualItem) => actualItem.id !== item.id)); }}>Quitar</Button>}</div>
                    <Select name={`detalles.${indice}.productoId`} value={item.productoId} onChange={(event) => actualizarItem(item.id, "productoId", event.target.value)}>{productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}</Select>
                    <div className="grid grid-cols-2 gap-3"><label><span className="text-xs text-white/55">Cantidad</span><Input name={`detalles.${indice}.cantidad`} value={item.cantidad} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "cantidad", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.cantidad`]} /></label><label><span className="text-xs text-white/55">Costo unitario</span><Input name={`detalles.${indice}.costoUnitario`} value={item.costoUnitario} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "costoUnitario", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.costoUnitario`]} /></label></div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" fullWidth onClick={() => { setDirty(true); setItems((actual) => [...actual, crearItem(productoInicial)]); }}>Agregar otro producto</Button>
              <div className="rounded-2xl bg-black/15 p-4"><p className="text-xs text-white/50">Total de la reposición</p><p className="mt-1 text-2xl font-bold">{formatearPesos(totalReposicion)}</p></div>
              <label className="block"><span className="text-sm text-white/70">Aporte externo incluido</span><Input value={aporteIncluido} inputMode="numeric" onChange={(event) => setAporteIncluido(event.target.value)} placeholder="Opcional" /></label>
            </>
          ) : (
            <label className="block"><span className="text-sm text-white/70">Monto</span><Input name="monto" value={monto} inputMode="numeric" onChange={(event) => setMonto(event.target.value)} placeholder="0" /><ErrorCampo mensaje={erroresCampo.monto} /></label>
          )}

          <label className="block"><span className="text-sm text-white/70">Medio de pago</span><Select value={medioPago} onChange={(event) => setMedioPago(event.target.value as MedioPago)}>{MEDIOS_DE_PAGO.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}</Select></label>
          <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Opcional" /></label>
        </Panel>
        <Button type="submit" size="lg" fullWidth className="sticky bottom-2 z-10" disabled={guardando || esConsulta || (tipo === "reposicion" && productos.length === 0)}>{guardando ? "Registrando..." : `Registrar ${labels[tipo].toLowerCase()}`}</Button>
      </form>
    </section>
  );
}
