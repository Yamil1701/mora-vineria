import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BottomSheet, Button, Input, Notice, Panel, Select, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { registrarMovimiento } from "../../db";
import type { TipoMovimiento } from "../../domain/movimientos";
import type { MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { useTesoreria } from "../../hooks/useTesoreria";
import { movimientoFormSchema } from "../../schemas";
import { formatearPesos } from "../ventas/ventas.ui";

type ModoCargaReposicion = "unidades" | "bultos";
interface ItemReposicion {
  id: string;
  productoId: string;
  modoCarga: ModoCargaReposicion;
  cantidad: string;
  costoUnitario: string;
  cantidadBultos: string;
  unidadesPorBulto: string;
  costoPorBulto: string;
}
const labels: Record<TipoMovimiento, string> = { reposicion: "Reposición", aporte_externo: "Aporte externo", gasto_puntual: "Gasto puntual" };
const crearItem = (productoId = ""): ItemReposicion => ({
  id: `${Date.now()}-${Math.random()}`,
  productoId,
  modoCarga: "bultos",
  cantidad: "1",
  costoUnitario: "",
  cantidadBultos: "1",
  unidadesPorBulto: "6",
  costoPorBulto: "",
});
const ErrorCampo = ({ mensaje }: { mensaje?: string }) => mensaje ? <span role="alert" className="mt-1 block text-xs text-red-200">{mensaje}</span> : null;

function calcularResumenItem(item: ItemReposicion) {
  if (item.modoCarga === "bultos") {
    const cantidadBultos = Number(item.cantidadBultos) || 0;
    const unidadesPorBulto = Number(item.unidadesPorBulto) || 0;
    const costoPorBulto = Number(item.costoPorBulto) || 0;
    return {
      unidades: cantidadBultos * unidadesPorBulto,
      subtotal: cantidadBultos * costoPorBulto,
    };
  }
  return {
    unidades: Number(item.cantidad) || 0,
    subtotal: (Number(item.cantidad) || 0) * (Number(item.costoUnitario) || 0),
  };
}

export function NuevoMovimientoPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion } = useConfiguracionLocal();
  const { productos, categorias, recargar: recargarProductos } = useProductos(false);
  const { resumen: tesoreria } = useTesoreria();
  const [tipo, setTipo] = useState<TipoMovimiento>("reposicion");
  const [descripcion, setDescripcion] = useState("Reposición de mercadería");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [cuentaTesoreriaId, setCuentaTesoreriaId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [aporteIncluido, setAporteIncluido] = useState("");
  const [items, setItems] = useState<ItemReposicion[]>([crearItem()]);
  const [itemBuscandoProductoId, setItemBuscandoProductoId] = useState<string | null>(null);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const envioEnCursoRef = useRef(false);
  const esConsulta = configuracion?.deviceRole === "consulta";
  const productoInicial = productos[0]?.id ?? "";
  const productosPorId = useMemo(() => new Map(productos.map((producto) => [producto.id, producto])), [productos]);
  const categoriasPorId = useMemo(() => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])), [categorias]);
  const productosFiltrados = useMemo(() => {
    const texto = busquedaProducto.trim().toLocaleLowerCase("es-AR");
    return [...productos]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"))
      .filter((producto) => !texto || [
        producto.nombre,
        producto.marca,
        producto.presentacion,
        categoriasPorId.get(producto.categoriaId),
      ].filter(Boolean).join(" ").toLocaleLowerCase("es-AR").includes(texto))
      .slice(0, 20);
  }, [busquedaProducto, categoriasPorId, productos]);
  const totalReposicion = useMemo(() => items.reduce(
    (total, item) => total + calcularResumenItem(item).subtotal,
    0,
  ), [items]);
  const cuentasCompatibles = useMemo(() => (tesoreria?.cuentas ?? []).filter((cuenta) =>
    medioPago === "efectivo" ? cuenta.tipo === "efectivo" : cuenta.tipo === "digital"), [medioPago, tesoreria]);
  const cuentaElegidaId = cuentaTesoreriaId && cuentasCompatibles.some((cuenta) => cuenta.id === cuentaTesoreriaId)
    ? cuentaTesoreriaId : (cuentasCompatibles.find((cuenta) => cuenta.esPredeterminada)?.id ?? cuentasCompatibles[0]?.id ?? "");
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

  function actualizarItem<Campo extends keyof Omit<ItemReposicion, "id">>(
    id: string,
    campo: Campo,
    valor: ItemReposicion[Campo],
  ) {
    setDirty(true);
    setItems((actual) => actual.map((item) => item.id === id ? { ...item, [campo]: valor } : item));
  }

  function abrirBuscadorProducto(itemId: string) {
    setBusquedaProducto("");
    setItemBuscandoProductoId(itemId);
  }

  function elegirProducto(productoId: string) {
    if (!itemBuscandoProductoId) return;
    actualizarItem(itemBuscandoProductoId, "productoId", productoId);
    setItemBuscandoProductoId(null);
    setBusquedaProducto("");
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta || envioEnCursoRef.current) return;
    const values = tipo === "reposicion" ? {
      tipo,
      descripcion,
      monto: totalReposicion,
      medioPago,
      cuentaTesoreriaId: tesoreria?.configurada ? cuentaElegidaId : undefined,
      detalles: items.map((item) => item.modoCarga === "bultos" ? {
        modoCarga: "bultos" as const,
        productoId: item.productoId,
        cantidadBultos: item.cantidadBultos,
        unidadesPorBulto: item.unidadesPorBulto,
        costoPorBulto: item.costoPorBulto,
      } : {
        modoCarga: "unidades" as const,
        productoId: item.productoId,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
      }),
      aporteExternoIncluido: aporteIncluido.trim() ? Number(aporteIncluido) : undefined,
      observaciones,
    } : { tipo, descripcion, monto, medioPago, cuentaTesoreriaId: tesoreria?.configurada ? cuentaElegidaId : undefined, observaciones };
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
                    <input type="hidden" name={`detalles.${indice}.productoId`} value={item.productoId} />
                    <button type="button" onClick={() => abrirBuscadorProducto(item.id)} className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[.99]">
                      <span className="block font-semibold">{productosPorId.get(item.productoId)?.nombre ?? "Elegir producto"}</span>
                      <span className="mt-1 block text-xs text-white/45">{productosPorId.get(item.productoId) ? `${categoriasPorId.get(productosPorId.get(item.productoId)?.categoriaId ?? "") ?? "Sin categoría"} · Tocar para cambiar` : "Buscá por nombre, marca o categoría"}</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2" aria-label="Forma de carga">
                      <Button size="sm" variant={item.modoCarga === "bultos" ? "primary" : "secondary"} aria-pressed={item.modoCarga === "bultos"} onClick={() => actualizarItem(item.id, "modoCarga", "bultos")}>Packs o bultos</Button>
                      <Button size="sm" variant={item.modoCarga === "unidades" ? "primary" : "secondary"} aria-pressed={item.modoCarga === "unidades"} onClick={() => actualizarItem(item.id, "modoCarga", "unidades")}>Unidades sueltas</Button>
                    </div>
                    {item.modoCarga === "bultos" ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <label><span className="text-xs text-white/55">Cantidad de packs</span><Input name={`detalles.${indice}.cantidadBultos`} value={item.cantidadBultos} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "cantidadBultos", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.cantidadBultos`]} /></label>
                          <label><span className="text-xs text-white/55">Unidades por pack</span><Input name={`detalles.${indice}.unidadesPorBulto`} value={item.unidadesPorBulto} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "unidadesPorBulto", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.unidadesPorBulto`]} /></label>
                        </div>
                        <label className="block"><span className="text-xs text-white/55">Precio de cada pack</span><Input name={`detalles.${indice}.costoPorBulto`} value={item.costoPorBulto} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "costoPorBulto", event.target.value)} placeholder="$0" /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.costoPorBulto`]} /></label>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <label><span className="text-xs text-white/55">Cantidad de unidades</span><Input name={`detalles.${indice}.cantidad`} value={item.cantidad} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "cantidad", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.cantidad`]} /></label>
                        <label><span className="text-xs text-white/55">Costo por unidad</span><Input name={`detalles.${indice}.costoUnitario`} value={item.costoUnitario} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "costoUnitario", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.costoUnitario`]} /></label>
                      </div>
                    )}
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-xs">
                      <span className="text-white/55">Entran {calcularResumenItem(item).unidades} unidades</span>
                      <span className="font-semibold text-white">{formatearPesos(calcularResumenItem(item).subtotal)}</span>
                    </div>
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

          <label className="block"><span className="text-sm text-white/70">Medio de pago</span><Select value={medioPago} onChange={(event) => { setMedioPago(event.target.value as MedioPago); setCuentaTesoreriaId(""); }}>{MEDIOS_DE_PAGO.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}</Select></label>
          {tesoreria?.configurada && <label className="block"><span className="text-sm text-white/70">{tipo === "aporte_externo" ? "Cuenta que recibe" : "Cuenta que paga"}</span><Select value={cuentaElegidaId} onChange={(event) => setCuentaTesoreriaId(event.target.value)}>{cuentasCompatibles.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} · {formatearPesos(cuenta.saldo)}</option>)}</Select></label>}
          <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Opcional" /></label>
        </Panel>
        <Button type="submit" size="lg" fullWidth className="sticky bottom-2 z-10" disabled={guardando || esConsulta || (tesoreria?.configurada && !cuentaElegidaId) || (tipo === "reposicion" && productos.length === 0)}>{guardando ? "Registrando..." : `Registrar ${labels[tipo].toLowerCase()}`}</Button>
      </form>
      <BottomSheet
        open={Boolean(itemBuscandoProductoId)}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setItemBuscandoProductoId(null);
            setBusquedaProducto("");
          }
        }}
        title="Elegir producto"
        description="Buscá sin recorrer toda la lista."
      >
        <div className="space-y-3">
          <Input type="search" value={busquedaProducto} onChange={(event) => setBusquedaProducto(event.target.value)} placeholder="Nombre, marca o categoría" />
          <div className="space-y-2">
            {productosFiltrados.map((producto) => (
              <button key={producto.id} type="button" onClick={() => elegirProducto(producto.id)} className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/15 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[.99]">
                <span className="block font-semibold">{producto.nombre}</span>
                <span className="mt-1 block text-xs text-white/45">{categoriasPorId.get(producto.categoriaId) ?? "Sin categoría"}{producto.marca ? ` · ${producto.marca}` : ""} · Stock {producto.stockActual}</span>
              </button>
            ))}
          </div>
          {productosFiltrados.length === 0 && <p className="py-6 text-center text-sm text-white/50">No encontramos productos con esa búsqueda.</p>}
        </div>
      </BottomSheet>
    </section>
  );
}
