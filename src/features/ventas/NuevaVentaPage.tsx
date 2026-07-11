import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet, Button, Icon, Input, Notice, Panel, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { DESTINOS_TRANSFERENCIA, MEDIOS_DE_PAGO } from "../../constants";
import { registrarVenta } from "../../db";
import { calcularVuelto, type DestinoTransferencia, type MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { ventaFormSchema } from "../../schemas";
import { usePreferenciasUi, type ItemBorradorVenta } from "../../stores/preferenciasUi";
import { formatearPesos } from "./ventas.ui";

const redondearArriba = (valor: number, multiplo: number) => Math.ceil(valor / multiplo) * multiplo;

export function NuevaVentaPage() {
  const navigate = useNavigate(); const confirm = useConfirm(); const toast = useToast();
  const { productos, categorias, cargando, error, recargar } = useProductos(false);
  const { configuracion } = useConfiguracionLocal();
  const borrador = usePreferenciasUi((s) => s.borradorVenta);
  const actualizarBorrador = usePreferenciasUi((s) => s.actualizarBorradorVenta);
  const vaciarBorrador = usePreferenciasUi((s) => s.vaciarBorradorVenta);
  const [recuperadoInicial] = useState(() => borrador.items.length > 0);
  const [mostrarRecuperado, setMostrarRecuperado] = useState(recuperadoInicial);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<ItemBorradorVenta[]>(borrador.items);
  const [medioPago, setMedioPago] = useState<MedioPago>(borrador.medioPago === "mercado_pago" ? "transferencia" : borrador.medioPago);
  const [destinoTransferencia, setDestinoTransferencia] = useState<DestinoTransferencia | undefined>(borrador.destinoTransferencia ?? (borrador.medioPago === "mercado_pago" ? "mercado_pago" : undefined));
  const [observaciones, setObservaciones] = useState(borrador.observaciones);
  const [sheetAbierto, setSheetAbierto] = useState(recuperadoInicial);
  const [pasoSheet, setPasoSheet] = useState<"carrito" | "cobro">("carrito");
  const [opcionesAbiertas, setOpcionesAbiertas] = useState<string[]>([]);
  const [pagaCon, setPagaCon] = useState(0); const [guardando, setGuardando] = useState(false);
  const esConsulta = configuracion?.deviceRole === "consulta";

  useEffect(() => { actualizarBorrador({ items: carrito, medioPago, destinoTransferencia, observaciones }); }, [actualizarBorrador, carrito, medioPago, destinoTransferencia, observaciones]);
  const categoriasPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c.nombre])), [categorias]);
  const productosPorId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const idsCarrito = useMemo(() => new Set(carrito.map((i) => i.productoId)), [carrito]);
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-AR");
    return [...productos].sort((a,b) => a.nombre.localeCompare(b.nombre,"es-AR")).filter((p) => !idsCarrito.has(p.id) && p.stockActual > 0 && (!texto || [p.nombre,p.marca,p.presentacion,categoriasPorId.get(p.categoriaId)].filter(Boolean).join(" ").toLocaleLowerCase("es-AR").includes(texto))).slice(0,12);
  }, [busqueda, categoriasPorId, productos, idsCarrito]);
  const total = useMemo(() => carrito.reduce((a,i) => a + i.cantidad * i.precioUnitarioAplicado, 0), [carrito]);
  const vuelto = calcularVuelto(total, pagaCon);
  const importesRapidos = useMemo(() => Array.from(new Set([redondearArriba(total,1000), redondearArriba(total,5000), redondearArriba(total,10000), 20000, 50000])).filter((n) => n >= total).sort((a,b)=>a-b).slice(0,4), [total]);

  function agregarProducto(productoId: string) {
    const p = productosPorId.get(productoId); if (!p || p.stockActual <= 0 || idsCarrito.has(productoId)) return;
    setCarrito((actual) => [...actual, { productoId, cantidad: 1, precioUnitarioAplicado: p.precioVenta }]);
  }
  function actualizarCantidad(productoId: string, cantidad: number) {
    const p = productosPorId.get(productoId); if (!p) return;
    if (cantidad < 1) { setCarrito((a) => a.filter((i) => i.productoId !== productoId)); return; }
    if (cantidad > p.stockActual) { toast.warning(`Solo quedan ${p.stockActual} unidades.`); return; }
    setCarrito((a) => a.map((i) => i.productoId === productoId ? {...i,cantidad} : i));
  }
  function actualizarItem(productoId: string, cambios: Partial<ItemBorradorVenta>) { setCarrito((a) => a.map((i) => i.productoId === productoId ? {...i,...cambios} : i)); }
  function quitar(productoId: string) { setCarrito((a) => a.filter((i) => i.productoId !== productoId)); }
  async function confirmarVaciado() {
    if (!await confirm({ title:"Vaciar venta pendiente", description:"Se quitarán todos los productos y observaciones.", confirmLabel:"Vaciar carrito", tone:"danger" })) return;
    setCarrito([]); setObservaciones(""); setMedioPago("efectivo"); setDestinoTransferencia(undefined); setPagaCon(0); setMostrarRecuperado(false); setSheetAbierto(false); vaciarBorrador();
  }
  async function guardarVenta() {
    if (esConsulta || guardando) return;
    const resultado = ventaFormSchema.safeParse({ medioPago, destinoTransferencia, detalles: carrito, observaciones });
    if (!resultado.success) { toast.warning(resultado.error.issues[0]?.message ?? "Revisá la venta."); return; }
    for (const item of carrito) { const p = productosPorId.get(item.productoId); if (!p || p.stockActual < item.cantidad) { toast.error("Cambió la cantidad disponible", "Revisá el carrito antes de cobrar."); setPasoSheet("carrito"); await recargar(); return; } }
    if (!await confirm({ title:"Confirmar venta", description:<div className="space-y-2"><p>{carrito.length} producto{carrito.length===1?"":"s"}</p><p className="border-t border-white/10 pt-2 font-semibold">Total: {formatearPesos(total)}</p></div>, confirmLabel:"Guardar venta" })) return;
    try { setGuardando(true); const id = await registrarVenta(resultado.data); vaciarBorrador(); setCarrito([]); toast.success("Venta guardada"); navigate(`/ventas?destacada=${encodeURIComponent(id)}`, {replace:true}); }
    catch (e) { toast.error("No se pudo guardar la venta", e instanceof Error ? e.message : undefined); }
    finally { setGuardando(false); }
  }

  return <section className="space-y-5 pb-24">
    <TaskHeader title="Nueva venta" description="Buscá y tocá un producto para agregarlo." backLabel="Ventas" onBack={() => navigate("/ventas")} />
    {esConsulta && <Notice tone="warning">Este celular está en modo consulta.</Notice>}
    <Panel className="space-y-3">
      <label className="block"><span className="text-sm font-medium text-white/80">Buscar producto</span><Input autoFocus type="search" value={busqueda} onChange={(e)=>setBusqueda(e.target.value)} placeholder="Nombre, marca o categoría" /></label>
      {cargando && <p role="status" className="text-sm text-white/55">Cargando productos...</p>}{error && <p role="alert" className="text-sm text-red-100">{error}</p>}
      <div className="space-y-2">{productosFiltrados.map((p)=><button key={p.id} type="button" onClick={()=>agregarProducto(p.id)} disabled={esConsulta} className="animate-mora-enter min-h-16 w-full rounded-2xl border border-white/10 bg-black/15 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[.99] disabled:opacity-50"><span className="flex justify-between gap-3"><span><span className="block font-semibold">{p.nombre}</span><span className="mt-1 block text-xs text-white/50">{categoriasPorId.get(p.categoriaId) ?? "Sin categoría"} · {p.stockActual === 1 ? "Última unidad" : `Quedan ${p.stockActual}`}</span></span><span className="font-semibold">{formatearPesos(p.precioVenta)}</span></span></button>)}</div>
      {!cargando && productosFiltrados.length===0 && <p className="py-6 text-center text-sm text-white/50">{carrito.length && !busqueda ? "Todos los productos disponibles ya están en el carrito." : "No encontramos productos disponibles."}</p>}
    </Panel>

    {!esConsulta && <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+.75rem)]"><button type="button" onClick={()=>{setPasoSheet("carrito");setSheetAbierto(true);setMostrarRecuperado(false);}} disabled={!carrito.length} className="mx-auto flex min-h-16 w-full max-w-md items-center justify-between rounded-3xl border border-white/15 bg-mora-principal px-5 text-white shadow-[0_12px_35px_rgba(0,0,0,.4)] disabled:bg-white/10 disabled:text-white/45"><span className="flex items-center gap-3"><Icon name="carrito" /> <span><span className="block text-left font-semibold">{carrito.length ? `Carrito · ${carrito.length}` : "Carrito vacío"}</span>{mostrarRecuperado && <span className="block text-left text-xs text-white/75">Venta pendiente recuperada</span>}</span></span><strong>{formatearPesos(total)}</strong></button></div>}

    <BottomSheet open={sheetAbierto} onOpenChange={setSheetAbierto} title={pasoSheet === "carrito" ? "Carrito" : "Revisar y cobrar"} description={pasoSheet === "carrito" ? `${carrito.length} producto${carrito.length===1?"":"s"} · ${formatearPesos(total)}` : `Total ${formatearPesos(total)}`}>
      {pasoSheet === "carrito" ? <div className="space-y-3">
        {recuperadoInicial && mostrarRecuperado && <div className="flex items-center justify-between gap-3 rounded-2xl bg-mora-exito/10 p-3 text-sm text-green-100"><span>Recuperamos esta venta.</span><button type="button" className="font-semibold" onClick={()=>setMostrarRecuperado(false)}>Entendido</button></div>}
        {carrito.map((item)=>{ const p=productosPorId.get(item.productoId); const abiertas=opcionesAbiertas.includes(item.productoId); return <Panel key={item.productoId} className="space-y-3"><div className="flex justify-between gap-3"><div><p className="font-semibold">{p?.nombre ?? "Producto no disponible"}</p><p className="text-xs text-white/50">{formatearPesos(item.precioUnitarioAplicado)} cada uno</p></div><strong>{formatearPesos(item.cantidad*item.precioUnitarioAplicado)}</strong></div><div className="flex items-center gap-2"><Button variant="secondary" className="h-12 w-12 p-0 text-xl" onClick={()=>actualizarCantidad(item.productoId,item.cantidad-1)}>−</Button><span className="min-w-10 text-center font-semibold">{item.cantidad}</span><Button variant="secondary" className="h-12 w-12 p-0 text-xl" onClick={()=>actualizarCantidad(item.productoId,item.cantidad+1)}>＋</Button><button type="button" aria-label={`Eliminar ${p?.nombre ?? "producto"}`} onClick={()=>quitar(item.productoId)} className="ml-auto flex h-12 w-12 items-center justify-center rounded-2xl text-red-200 hover:bg-mora-error/15"><Icon name="eliminar" /></button></div><button type="button" className="text-sm text-white/55" onClick={()=>setOpcionesAbiertas((a)=>a.includes(item.productoId)?a.filter(id=>id!==item.productoId):[...a,item.productoId])}>{abiertas?"Ocultar opciones":"Precio y observación"}</button>{abiertas&&<div className="grid gap-3 border-t border-white/10 pt-3"><label><span className="text-xs text-white/55">Precio aplicado</span><Input value={item.precioUnitarioAplicado} inputMode="numeric" onChange={(e)=>actualizarItem(item.productoId,{precioUnitarioAplicado:Number(e.target.value)})}/></label><label><span className="text-xs text-white/55">Observación</span><Input value={item.observaciones??""} onChange={(e)=>actualizarItem(item.productoId,{observaciones:e.target.value})}/></label></div>}</Panel>})}
        <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2"><Button variant="ghost" onClick={()=>void confirmarVaciado()}>Vaciar</Button><Button disabled={!carrito.length} onClick={()=>setPasoSheet("cobro")}>Revisar y cobrar</Button></div>
      </div> : <div className="space-y-4">
        <Panel className="space-y-2">{carrito.map((i)=><div key={i.productoId} className="flex justify-between text-sm"><span className="text-white/70">{i.cantidad} × {productosPorId.get(i.productoId)?.nombre}</span><strong>{formatearPesos(i.cantidad*i.precioUnitarioAplicado)}</strong></div>)}<div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold"><span>Total</span><span>{formatearPesos(total)}</span></div></Panel>
        <Panel className="space-y-3"><p className="text-sm text-white/70">Medio de pago</p><div className="flex flex-wrap gap-2">{MEDIOS_DE_PAGO.map((o)=><Button key={o.value} size="sm" variant={medioPago===o.value?"primary":"secondary"} aria-pressed={medioPago===o.value} onClick={()=>{setMedioPago(o.value);if(o.value!=="transferencia")setDestinoTransferencia(undefined);}}>{o.label}</Button>)}</div>{medioPago==="transferencia"&&<><p className="pt-2 text-sm text-white/70">¿Dónde recibís el dinero?</p><div className="flex flex-wrap gap-2">{DESTINOS_TRANSFERENCIA.map((o)=><Button key={o.value} size="sm" variant={destinoTransferencia===o.value?"primary":"secondary"} aria-pressed={destinoTransferencia===o.value} onClick={()=>setDestinoTransferencia(o.value)}>{o.label}</Button>)}</div></>}
        {medioPago==="efectivo"&&<div className="space-y-3 border-t border-white/10 pt-3"><label><span className="text-sm text-white/70">Pagan con</span><Input value={pagaCon||""} inputMode="numeric" placeholder={formatearPesos(total)} onChange={(e)=>setPagaCon(Number(e.target.value))}/></label><div className="flex flex-wrap gap-2">{importesRapidos.map((n)=><Button key={n} size="sm" variant={pagaCon===n?"primary":"secondary"} onClick={()=>setPagaCon(n)}>{formatearPesos(n)}</Button>)}</div>{pagaCon>0&&(vuelto===null?<Notice tone="warning">El importe no alcanza para cubrir la venta.</Notice>:<div className="rounded-2xl bg-mora-exito/10 p-4"><span className="text-sm text-green-100">Vuelto</span><p className="text-2xl font-bold text-white">{formatearPesos(vuelto)}</p></div>)}</div>}
        <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={observaciones} onChange={(e)=>setObservaciones(e.target.value)} placeholder="Opcional" /></label></Panel>
        <div className="grid grid-cols-[1fr_2fr] gap-3"><Button variant="secondary" onClick={()=>setPasoSheet("carrito")}>Volver</Button><Button disabled={guardando || (medioPago==="transferencia"&&!destinoTransferencia)} onClick={()=>void guardarVenta()}>{guardando?"Guardando...":"Confirmar venta"}</Button></div>
      </div>}
    </BottomSheet>
  </section>;
}
