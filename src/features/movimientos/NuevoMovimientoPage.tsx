import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { BottomSheet, Button, Input, Notice, Panel, ResultDialog, Select, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { registrarMovimiento } from "../../db";
import type { TipoMovimiento } from "../../domain/movimientos";
import type { MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { useTesoreria } from "../../hooks/useTesoreria";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { movimientoFormSchema } from "../../schemas";
import { leerPropuestaReposicion, quitarPropuestaReposicion } from "../proyecciones/propuestaReposicion";
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

interface ResumenGuardado {
  id: string;
  tipo: TipoMovimiento;
  total: number;
  productos: Array<{ nombre: string; unidades: number }>;
  pago: string;
}

interface PagoReposicion {
  cuentaTesoreriaId: string;
  monto: string;
}

const labels: Record<TipoMovimiento, string> = {
  reposicion: "Reposición",
  aporte_externo: "Aporte externo",
  gasto_puntual: "Gasto puntual",
};

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

const ErrorCampo = ({ mensaje }: { mensaje?: string }) => mensaje
  ? <span role="alert" className="mt-1 block text-xs text-red-200">{mensaje}</span>
  : null;

function calcularResumenItem(item: ItemReposicion) {
  if (item.modoCarga === "bultos") {
    const cantidadBultos = Number(item.cantidadBultos) || 0;
    const unidadesPorBulto = Number(item.unidadesPorBulto) || 0;
    const costoPorBulto = Number(item.costoPorBulto) || 0;
    return { unidades: cantidadBultos * unidadesPorBulto, subtotal: cantidadBultos * costoPorBulto };
  }
  return {
    unidades: Number(item.cantidad) || 0,
    subtotal: (Number(item.cantidad) || 0) * (Number(item.costoUnitario) || 0),
  };
}

export function NuevoMovimientoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion } = useConfiguracionLocal();
  const { productos, categorias, recargar: recargarProductos } = useProductos(false);
  const { resumen: tesoreria } = useTesoreria();
  const desdeProyeccion = searchParams.get("desde") === "proyeccion";
  const [propuestaInicial] = useState(() => desdeProyeccion ? leerPropuestaReposicion() : null);
  const [primerItem] = useState(() => crearItem());
  const otroMovimiento = searchParams.get("tipo") === "otro";
  const [tipo, setTipo] = useState<TipoMovimiento>("reposicion");
  const [tipoElegido, setTipoElegido] = useState(!otroMovimiento);
  const [descripcion, setDescripcion] = useState("Reposición de mercadería");
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [cuentaTesoreriaId, setCuentaTesoreriaId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [aporteIncluido, setAporteIncluido] = useState("");
  const [items, setItems] = useState<ItemReposicion[]>(() => propuestaInicial?.items.map((item, indice) => ({
    id: `propuesta-${indice}-${Date.now()}`,
    productoId: item.productoId,
    modoCarga: item.modoCarga,
    cantidad: String(item.cantidad),
    costoUnitario: String(item.costoUnitario),
    cantidadBultos: String(item.cantidadBultos ?? 1),
    unidadesPorBulto: String(item.unidadesPorBulto ?? 1),
    costoPorBulto: String(item.costoPorBulto ?? item.costoUnitario),
  })) ?? [primerItem]);
  const [itemsAbiertos, setItemsAbiertos] = useState<string[]>([]);
  const [pagosReposicion, setPagosReposicion] = useState<PagoReposicion[]>(() => propuestaInicial?.pagos.map((pago) => ({
    cuentaTesoreriaId: pago.cuentaTesoreriaId,
    monto: String(pago.monto),
  })) ?? []);
  const [itemBuscandoProductoId, setItemBuscandoProductoId] = useState<string | null>(null);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [dirty, setDirty] = useState(Boolean(propuestaInicial));
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [resumenGuardado, setResumenGuardado] = useState<ResumenGuardado | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const envioEnCursoRef = useRef(false);
  const aperturaInicialAplicadaRef = useRef(false);
  const esConsulta = configuracion?.deviceRole === "consulta";
  const productoInicial = productos[0]?.id ?? "";
  const productosPorId = useMemo(() => new Map(productos.map((producto) => [producto.id, producto])), [productos]);
  const categoriasPorId = useMemo(() => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])), [categorias]);
  const productosFiltrados = useMemo(() => {
    const texto = busquedaProducto.trim().toLocaleLowerCase("es-AR");
    return [...productos]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"))
      .filter((producto) => !texto || [producto.nombre, producto.marca, producto.presentacion, categoriasPorId.get(producto.categoriaId)]
        .filter(Boolean).join(" ").toLocaleLowerCase("es-AR").includes(texto))
      .slice(0, 20);
  }, [busquedaProducto, categoriasPorId, productos]);
  const totalReposicion = useMemo(() => items.reduce((total, item) => total + calcularResumenItem(item).subtotal, 0), [items]);
  const totalPagosReposicion = useMemo(() => pagosReposicion.reduce((total, pago) => total + (Number(pago.monto) || 0), 0), [pagosReposicion]);
  const cuentasCompatibles = useMemo(() => (tesoreria?.cuentas ?? []).filter((cuenta) =>
    medioPago === "efectivo" ? cuenta.tipo === "efectivo" : cuenta.tipo === "digital"), [medioPago, tesoreria]);
  const cuentaElegidaId = cuentaTesoreriaId && cuentasCompatibles.some((cuenta) => cuenta.id === cuentaTesoreriaId)
    ? cuentaTesoreriaId
    : (cuentasCompatibles.find((cuenta) => cuenta.esPredeterminada)?.id ?? cuentasCompatibles[0]?.id ?? "");
  const { confirmarSalida, permitirSiguienteNavegacion } = useUnsavedChanges(dirty);

  useEffect(() => {
    if (!productoInicial) return;
    setItems((actual) => actual.map((item) => ({ ...item, productoId: item.productoId || productoInicial })));
  }, [productoInicial]);

  useEffect(() => {
    if (aperturaInicialAplicadaRef.current || !items[0]) return;
    aperturaInicialAplicadaRef.current = true;
    setItemsAbiertos([items[0].id]);
  }, [items]);

  function elegirTipo(nuevoTipo: Exclude<TipoMovimiento, "reposicion">) {
    setDirty(true);
    setTipo(nuevoTipo);
    setTipoElegido(true);
    setDescripcion("");
    setMonto("");
    setObservaciones("");
  }

  function actualizarItem<Campo extends keyof Omit<ItemReposicion, "id">>(id: string, campo: Campo, valor: ItemReposicion[Campo]) {
    setDirty(true);
    setItems((actual) => actual.map((item) => item.id === id ? { ...item, [campo]: valor } : item));
  }

  function alternarItem(id: string) {
    setItemsAbiertos((actual) => actual.includes(id) ? actual.filter((itemId) => itemId !== id) : [...actual, id]);
  }

  function agregarItem() {
    const item = crearItem(productoInicial);
    setDirty(true);
    setItems((actual) => [...actual, item]);
    setItemsAbiertos((actual) => [...actual, item.id]);
  }

  function quitarItem(id: string) {
    setDirty(true);
    setItems((actual) => actual.filter((item) => item.id !== id));
    setItemsAbiertos((actual) => actual.filter((itemId) => itemId !== id));
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
      distribucionPagos: pagosReposicion.length ? pagosReposicion.map((pago) => ({
        cuentaTesoreriaId: pago.cuentaTesoreriaId,
        monto: pago.monto,
      })) : undefined,
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
    } : {
      tipo,
      descripcion,
      monto,
      medioPago,
      cuentaTesoreriaId: tesoreria?.configurada ? cuentaElegidaId : undefined,
      observaciones,
    };
    const resultado = movimientoFormSchema.safeParse(values);
    if (!resultado.success) {
      const siguientes = Object.fromEntries(resultado.error.issues.map((issue) => [issue.path.join("."), issue.message]));
      setErroresCampo(siguientes);
      const primeraRuta = resultado.error.issues[0]?.path ?? [];
      const indiceDetalle = primeraRuta[0] === "detalles" && typeof primeraRuta[1] === "number" ? primeraRuta[1] : null;
      if (indiceDetalle !== null && items[indiceDetalle]) setItemsAbiertos((actual) => Array.from(new Set([...actual, items[indiceDetalle]!.id])));
      window.setTimeout(() => formRef.current?.querySelector<HTMLElement>(`[name="${primeraRuta.join(".")}"]`)?.focus(), 0);
      toast.warning(resultado.error.issues[0]?.message ?? "Revisá el movimiento.");
      return;
    }
    setErroresCampo({});
    const medioLabel = pagosReposicion.length > 1
      ? `${pagosReposicion.length} cuentas`
      : pagosReposicion.length === 1
        ? tesoreria?.cuentas.find((cuenta) => cuenta.id === pagosReposicion[0]?.cuentaTesoreriaId)?.nombre ?? "Una cuenta"
        : MEDIOS_DE_PAGO.find((opcion) => opcion.value === medioPago)?.label ?? "Otro";
    const confirmado = await confirm({
      title: `Registrar ${labels[tipo].toLowerCase()}`,
      description: tipo === "reposicion"
        ? `${items.length} producto${items.length === 1 ? "" : "s"} · ${formatearPesos(totalReposicion)} · ${medioLabel}.`
        : `${descripcion.trim()} · ${formatearPesos(resultado.data.monto)} · ${medioLabel}.`,
      confirmLabel: "Registrar",
    });
    if (!confirmado) return;
    envioEnCursoRef.current = true;
    try {
      setGuardando(true);
      const id = await registrarMovimiento(resultado.data);
      await recargarProductos();
      permitirSiguienteNavegacion();
      setDirty(false);
      quitarPropuestaReposicion();
      toast.success(`${labels[tipo]} registrada`);
      setResumenGuardado({
        id,
        tipo,
        total: tipo === "reposicion" ? totalReposicion : Number(monto),
        productos: tipo === "reposicion" ? items.map((item) => ({ nombre: productosPorId.get(item.productoId)?.nombre ?? "Producto", unidades: calcularResumenItem(item).unidades })) : [],
        pago: medioLabel,
      });
    } catch (errorDesconocido) {
      toast.error("No se pudo registrar el movimiento", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally {
      envioEnCursoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5">
      <TaskHeader title={tipo === "reposicion" ? "Registrar reposición" : "Registrar otro movimiento"} description={tipo === "reposicion" ? "Agregá los productos comprados y revisá el total antes de guardar." : "Elegí un aporte o gasto y completá los datos breves."} backLabel="Movimientos" onBack={async () => { if (await confirmarSalida()) navigate("/movimientos"); }} />
      {esConsulta && <Notice tone="warning">Este dispositivo está en modo consulta.</Notice>}

      {!tipoElegido ? (
        <section className="space-y-3">
          <button type="button" onClick={() => elegirTipo("aporte_externo")} className="min-h-24 w-full rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-left transition active:scale-[.99]"><span className="block font-semibold">Aporte externo</span><span className="mt-1 block text-sm text-white/50">Dinero incorporado al negocio; no es una venta.</span></button>
          <button type="button" onClick={() => elegirTipo("gasto_puntual")} className="min-h-24 w-full rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-left transition active:scale-[.99]"><span className="block font-semibold">Gasto puntual</span><span className="mt-1 block text-sm text-white/50">Un gasto excepcional del negocio.</span></button>
        </section>
      ) : (
        <form ref={formRef} onSubmit={(event) => void guardar(event)} onChange={() => setDirty(true)} className="space-y-4" aria-busy={guardando}>
          {otroMovimiento && <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3"><span className="text-sm font-semibold">{labels[tipo]}</span><Button size="sm" variant="ghost" onClick={() => setTipoElegido(false)}>Cambiar tipo</Button></div>}
          <Panel className="space-y-4 animate-mora-enter">
            <label className="block"><span className="text-sm text-white/70">Descripción</span><Input name="descripcion" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} placeholder={tipo === "gasto_puntual" ? "Ej: Reparación" : tipo === "reposicion" ? "Reposición de mercadería" : "Ej: Dinero para mercadería"} /><ErrorCampo mensaje={erroresCampo.descripcion} /></label>

            {tipo === "reposicion" ? (
              <>
                <div className="space-y-3">
                  {items.map((item, indice) => {
                    const resumen = calcularResumenItem(item);
                    const abierto = itemsAbiertos.includes(item.id);
                    return <section key={item.id} className="rounded-2xl border border-white/10 bg-black/15 p-3">
                      <button type="button" onClick={() => alternarItem(item.id)} className="flex min-h-12 w-full items-center justify-between gap-3 text-left"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{productosPorId.get(item.productoId)?.nombre ?? `Producto ${indice + 1}`}</span><span className="mt-1 block text-xs text-white/45">{resumen.unidades} unidades · {formatearPesos(resumen.subtotal)}</span></span><span aria-hidden="true" className={`text-white/40 transition ${abierto ? "rotate-90" : ""}`}>›</span></button>
                      {abierto && <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                        <input type="hidden" name={`detalles.${indice}.productoId`} value={item.productoId} />
                        <button type="button" onClick={() => { setBusquedaProducto(""); setItemBuscandoProductoId(item.id); }} className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[.99]"><span className="block font-semibold">{productosPorId.get(item.productoId)?.nombre ?? "Elegir producto"}</span><span className="mt-1 block text-xs text-white/45">Tocar para buscar o cambiar</span></button>
                        <ErrorCampo mensaje={erroresCampo[`detalles.${indice}.productoId`]} />
                        <div className="grid grid-cols-2 gap-2"><Button size="sm" variant={item.modoCarga === "bultos" ? "primary" : "secondary"} onClick={() => actualizarItem(item.id, "modoCarga", "bultos")}>Packs o bultos</Button><Button size="sm" variant={item.modoCarga === "unidades" ? "primary" : "secondary"} onClick={() => actualizarItem(item.id, "modoCarga", "unidades")}>Unidades sueltas</Button></div>
                        {item.modoCarga === "bultos" ? <><div className="grid grid-cols-2 gap-3"><label><span className="text-xs text-white/55">Cantidad de packs</span><Input name={`detalles.${indice}.cantidadBultos`} value={item.cantidadBultos} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "cantidadBultos", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.cantidadBultos`]} /></label><label><span className="text-xs text-white/55">Unidades por pack</span><Input name={`detalles.${indice}.unidadesPorBulto`} value={item.unidadesPorBulto} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "unidadesPorBulto", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.unidadesPorBulto`]} /></label></div><label className="block"><span className="text-xs text-white/55">Precio de cada pack</span><Input name={`detalles.${indice}.costoPorBulto`} value={item.costoPorBulto} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "costoPorBulto", event.target.value)} placeholder="$0" /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.costoPorBulto`]} /></label></> : <div className="grid grid-cols-2 gap-3"><label><span className="text-xs text-white/55">Cantidad</span><Input name={`detalles.${indice}.cantidad`} value={item.cantidad} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "cantidad", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.cantidad`]} /></label><label><span className="text-xs text-white/55">Costo por unidad</span><Input name={`detalles.${indice}.costoUnitario`} value={item.costoUnitario} inputMode="numeric" onChange={(event) => actualizarItem(item.id, "costoUnitario", event.target.value)} /><ErrorCampo mensaje={erroresCampo[`detalles.${indice}.costoUnitario`]} /></label></div>}
                        <div className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-xs"><span className="text-white/55">Entran {resumen.unidades} unidades</span><span className="font-semibold">{formatearPesos(resumen.subtotal)}</span></div>
                        {items.length > 1 && <Button variant="ghost" size="sm" onClick={() => quitarItem(item.id)}>Eliminar producto</Button>}
                      </div>}
                    </section>;
                  })}
                </div>
                <Button variant="secondary" fullWidth className="border-mora-principal/45 text-mora-suave" onClick={agregarItem}>Agregar otro producto</Button>
                <div className="rounded-2xl bg-black/15 p-4"><p className="text-xs text-white/50">Total de la reposición</p><p className="mt-1 text-2xl font-bold">{formatearPesos(totalReposicion)}</p></div>
                <label className="block"><span className="text-sm text-white/70">Aporte externo incluido</span><Input value={aporteIncluido} inputMode="numeric" onChange={(event) => setAporteIncluido(event.target.value)} placeholder="Opcional" /></label>
              </>
            ) : <label className="block"><span className="text-sm text-white/70">Monto</span><Input name="monto" value={monto} inputMode="numeric" onChange={(event) => setMonto(event.target.value)} placeholder="0" /><ErrorCampo mensaje={erroresCampo.monto} /></label>}

            {tipo === "reposicion" && pagosReposicion.length > 0 && tesoreria?.configurada ? <section className="space-y-3 rounded-2xl border border-mora-principal/25 bg-mora-principal/[0.06] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Pago entre cuentas</p><p className="mt-1 text-xs text-white/45">Primero Caja y después las cuentas digitales.</p></div><Button size="sm" variant="ghost" onClick={() => setPagosReposicion([])}>Usar una</Button></div>{pagosReposicion.map((pago, indice) => { const cuenta = tesoreria.cuentas.find((item) => item.id === pago.cuentaTesoreriaId); return <label key={pago.cuentaTesoreriaId} className="grid grid-cols-[1fr_8rem] items-center gap-3"><span className="text-sm"><span className="block font-medium">{cuenta?.nombre ?? "Cuenta"}</span><span className="mt-1 block text-xs text-white/40">Disponible {formatearPesos(cuenta?.saldo ?? 0)}</span></span><Input inputMode="numeric" value={pago.monto} onChange={(event) => { setDirty(true); setPagosReposicion((actual) => actual.map((item, itemIndice) => itemIndice === indice ? { ...item, monto: event.target.value } : item)); }} /></label>; })}<div className="flex justify-between border-t border-white/10 pt-3 text-sm"><span className="text-white/55">Distribuido</span><strong className={Math.abs(totalPagosReposicion - totalReposicion) < 0.01 ? "text-green-100" : "text-yellow-100"}>{formatearPesos(totalPagosReposicion)} de {formatearPesos(totalReposicion)}</strong></div></section> : <><label className="block"><span className="text-sm text-white/70">Medio de pago</span><Select value={medioPago} onChange={(event) => { setMedioPago(event.target.value as MedioPago); setCuentaTesoreriaId(""); }}>{MEDIOS_DE_PAGO.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}</Select></label>{tesoreria?.configurada && <label className="block"><span className="text-sm text-white/70">{tipo === "aporte_externo" ? "Cuenta que recibe" : "Cuenta que paga"}</span><Select value={cuentaElegidaId} onChange={(event) => setCuentaTesoreriaId(event.target.value)}>{cuentasCompatibles.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} · {formatearPesos(cuenta.saldo)}</option>)}</Select></label>}</>}
            <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Opcional" /></label>
          </Panel>
          <Button type="submit" size="lg" fullWidth className="sticky bottom-2 z-10" disabled={guardando || esConsulta || (tesoreria?.configurada && !pagosReposicion.length && !cuentaElegidaId) || (pagosReposicion.length > 0 && Math.abs(totalPagosReposicion - totalReposicion) > 0.01) || (tipo === "reposicion" && productos.length === 0)}>{guardando ? "Registrando…" : `Registrar ${labels[tipo].toLowerCase()}`}</Button>
        </form>
      )}

      <BottomSheet open={Boolean(itemBuscandoProductoId)} onOpenChange={(abierto) => { if (!abierto) { setItemBuscandoProductoId(null); setBusquedaProducto(""); } }} title="Elegir producto" description="Buscá sin recorrer toda la lista.">
        <div className="space-y-3"><Input type="search" value={busquedaProducto} onChange={(event) => setBusquedaProducto(event.target.value)} placeholder="Nombre, marca o categoría" /><div className="space-y-2">{productosFiltrados.map((producto) => <button key={producto.id} type="button" onClick={() => elegirProducto(producto.id)} className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/15 p-3 text-left transition active:scale-[.99]"><span className="block font-semibold">{producto.nombre}</span><span className="mt-1 block text-xs text-white/45">{categoriasPorId.get(producto.categoriaId) ?? "Sin categoría"}{producto.marca ? ` · ${producto.marca}` : ""} · Stock {producto.stockActual}</span></button>)}</div>{productosFiltrados.length === 0 && <p className="py-6 text-center text-sm text-white/50">No encontramos productos con esa búsqueda.</p>}</div>
      </BottomSheet>

      <ResultDialog open={Boolean(resumenGuardado)} title={`${resumenGuardado ? labels[resumenGuardado.tipo] : "Movimiento"} registrada`} description="El movimiento ya quedó guardado y su impacto fue aplicado." onAccept={() => { if (resumenGuardado) navigate(`/movimientos?destacada=${encodeURIComponent(resumenGuardado.id)}`, { replace: true }); }}>
        {resumenGuardado && <div className="space-y-3 rounded-2xl bg-black/15 p-4"><div className="space-y-1">{resumenGuardado.productos.slice(0, 4).map((producto) => <div key={producto.nombre} className="flex justify-between gap-3 text-sm"><span className="text-white/65">{producto.nombre}</span><span>{producto.unidades} u.</span></div>)}</div><div className="flex justify-between border-t border-white/10 pt-3 font-semibold"><span>Total</span><span>{formatearPesos(resumenGuardado.total)}</span></div><p className="text-xs text-white/45">Pagar con {resumenGuardado.pago}</p></div>}
      </ResultDialog>
    </section>
  );
}
