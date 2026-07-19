import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  BottomSheet,
  Button,
  DelayedFallback,
  Icon,
  Input,
  ListSkeleton,
  Notice,
  Panel,
  Select,
  TaskHeader,
  Textarea,
  useConfirm,
  useToast,
} from "../../components/ui";
import { DESTINOS_TRANSFERENCIA, MEDIOS_DE_PAGO } from "../../constants";
import { registrarVenta } from "../../db";
import {
  calcularVuelto,
  type CondicionPago,
  type DestinoTransferencia,
  type MedioPago,
} from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { useTesoreria } from "../../hooks/useTesoreria";
import { ventaFormSchema } from "../../schemas";
import { usePreferenciasUi, type ItemBorradorVenta } from "../../stores/preferenciasUi";
import type { CuentaTesoreriaConSaldo } from "../../domain/tesoreria";
import { formatearPesos } from "./ventas.ui";

const redondearArriba = (valor: number, multiplo: number) => Math.ceil(valor / multiplo) * multiplo;

function cuentasCompatiblesConMedio(cuentas: CuentaTesoreriaConSaldo[], medioPago: MedioPago) {
  return cuentas.filter((cuenta) => medioPago === "efectivo" ? cuenta.tipo === "efectivo" : cuenta.tipo === "digital");
}

function elegirCuenta(cuentas: CuentaTesoreriaConSaldo[], cuentaId: string) {
  const id = cuentaId && cuentas.some((cuenta) => cuenta.id === cuentaId)
    ? cuentaId
    : (cuentas.find((cuenta) => cuenta.esPredeterminada)?.id ?? cuentas[0]?.id ?? "");
  return { id, cuenta: cuentas.find((cuenta) => cuenta.id === id) };
}

function obtenerDestinoCuenta(
  medioPago: MedioPago,
  cuenta: CuentaTesoreriaConSaldo | undefined,
  destinoManual: DestinoTransferencia | undefined,
): DestinoTransferencia | undefined {
  if (medioPago !== "transferencia") return undefined;
  if (!cuenta) return destinoManual;
  const nombre = cuenta.nombre.toLocaleLowerCase("es-AR");
  if (nombre.includes("brubank")) return "brubank";
  if (nombre.includes("mercado")) return "mercado_pago";
  if (nombre.includes("naranja")) return "naranja_x";
  return "otro";
}

export function NuevaVentaPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { productos, categorias, cargando, error, recargar } = useProductos(false);
  const { configuracion } = useConfiguracionLocal();
  const { resumen: tesoreria } = useTesoreria();
  const borrador = usePreferenciasUi((estado) => estado.borradorVenta);
  const actualizarBorrador = usePreferenciasUi((estado) => estado.actualizarBorradorVenta);
  const vaciarBorrador = usePreferenciasUi((estado) => estado.vaciarBorradorVenta);
  const [recuperadoInicial] = useState(() => borrador.items.length > 0);
  const [mostrarRecuperado, setMostrarRecuperado] = useState(recuperadoInicial);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<ItemBorradorVenta[]>(borrador.items);
  const [condicionPago, setCondicionPago] = useState<CondicionPago>(borrador.condicionPago ?? "contado");
  const [medioPago, setMedioPago] = useState<MedioPago>(borrador.medioPago === "mercado_pago" ? "transferencia" : borrador.medioPago);
  const [destinoTransferencia, setDestinoTransferencia] = useState<DestinoTransferencia | undefined>(borrador.destinoTransferencia ?? (borrador.medioPago === "mercado_pago" ? "mercado_pago" : undefined));
  const [cuentaTesoreriaId, setCuentaTesoreriaId] = useState("");
  const [pagoCombinado, setPagoCombinado] = useState(borrador.pagoCombinado ?? false);
  const [montoPagoPrincipal, setMontoPagoPrincipal] = useState(borrador.montoPagoPrincipal ?? 0);
  const [medioPagoSecundario, setMedioPagoSecundario] = useState<MedioPago>(borrador.medioPagoSecundario ?? "transferencia");
  const [destinoTransferenciaSecundario, setDestinoTransferenciaSecundario] = useState<DestinoTransferencia | undefined>(borrador.destinoTransferenciaSecundario);
  const [cuentaTesoreriaSecundariaId, setCuentaTesoreriaSecundariaId] = useState("");
  const [montoCobradoInicial, setMontoCobradoInicial] = useState(borrador.montoCobradoInicial ?? 0);
  const [clienteFiadoNombre, setClienteFiadoNombre] = useState(borrador.clienteFiadoNombre ?? "");
  const [clienteFiadoNota, setClienteFiadoNota] = useState(borrador.clienteFiadoNota ?? "");
  const [vencimientoFiado, setVencimientoFiado] = useState(borrador.vencimientoFiado ?? "");
  const [observaciones, setObservaciones] = useState(borrador.observaciones);
  const [sheetAbierto, setSheetAbierto] = useState(recuperadoInicial);
  const [pasoSheet, setPasoSheet] = useState<"carrito" | "cobro">("carrito");
  const [opcionesAbiertas, setOpcionesAbiertas] = useState<string[]>([]);
  const [pagaCon, setPagaCon] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const esConsulta = configuracion?.deviceRole === "consulta";
  const cuentasCompatibles = useMemo(() => cuentasCompatiblesConMedio(tesoreria?.cuentas ?? [], medioPago), [medioPago, tesoreria]);
  const { id: cuentaElegidaId, cuenta: cuentaElegida } = elegirCuenta(cuentasCompatibles, cuentaTesoreriaId);
  const destinoCuenta = obtenerDestinoCuenta(medioPago, cuentaElegida, destinoTransferencia);
  const cuentasCompatiblesSecundarias = useMemo(() => cuentasCompatiblesConMedio(tesoreria?.cuentas ?? [], medioPagoSecundario), [medioPagoSecundario, tesoreria]);
  const { id: cuentaSecundariaElegidaId, cuenta: cuentaSecundariaElegida } = elegirCuenta(cuentasCompatiblesSecundarias, cuentaTesoreriaSecundariaId);
  const destinoCuentaSecundaria = obtenerDestinoCuenta(medioPagoSecundario, cuentaSecundariaElegida, destinoTransferenciaSecundario);

  useEffect(() => {
    actualizarBorrador({
      items: carrito,
      condicionPago,
      medioPago,
      destinoTransferencia,
      pagoCombinado,
      montoPagoPrincipal,
      medioPagoSecundario,
      destinoTransferenciaSecundario,
      montoCobradoInicial,
      clienteFiadoNombre,
      clienteFiadoNota,
      vencimientoFiado,
      observaciones,
    });
  }, [actualizarBorrador, carrito, clienteFiadoNombre, clienteFiadoNota, condicionPago, destinoTransferencia, destinoTransferenciaSecundario, medioPago, medioPagoSecundario, montoCobradoInicial, montoPagoPrincipal, observaciones, pagoCombinado, vencimientoFiado]);

  const categoriasPorId = useMemo(() => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])), [categorias]);
  const productosPorId = useMemo(() => new Map(productos.map((producto) => [producto.id, producto])), [productos]);
  const idsCarrito = useMemo(() => new Set(carrito.map((item) => item.productoId)), [carrito]);
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-AR");
    return [...productos]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"))
      .filter((producto) => !idsCarrito.has(producto.id)
        && producto.stockActual > 0
        && (!texto || [producto.nombre, producto.marca, producto.presentacion, categoriasPorId.get(producto.categoriaId)]
          .filter(Boolean).join(" ").toLocaleLowerCase("es-AR").includes(texto)))
      .slice(0, 12);
  }, [busqueda, categoriasPorId, idsCarrito, productos]);
  const total = useMemo(() => carrito.reduce((suma, item) => suma + item.cantidad * item.precioUnitarioAplicado, 0), [carrito]);
  const montoARecibir = condicionPago === "contado" ? total : Math.max(0, montoCobradoInicial);
  const saldoFiado = condicionPago === "fiado" ? total - montoARecibir : 0;
  const montoPagoSecundario = Math.max(0, total - montoPagoPrincipal);
  const usaPagoCombinado = condicionPago === "contado" && pagoCombinado;
  const montoEnEfectivo = usaPagoCombinado
    ? medioPago === "efectivo" ? montoPagoPrincipal : medioPagoSecundario === "efectivo" ? montoPagoSecundario : 0
    : medioPago === "efectivo" ? montoARecibir : 0;
  const vuelto = calcularVuelto(montoEnEfectivo, pagaCon);
  const importesRapidos = useMemo(() => {
    if (montoEnEfectivo <= 0) return [];
    return Array.from(new Set([
      redondearArriba(montoEnEfectivo, 1000),
      redondearArriba(montoEnEfectivo, 5000),
      redondearArriba(montoEnEfectivo, 10000),
      20000,
      50000,
    ])).filter((importe) => importe >= montoEnEfectivo).sort((a, b) => a - b).slice(0, 4);
  }, [montoEnEfectivo]);

  function agregarProducto(productoId: string) {
    const producto = productosPorId.get(productoId);
    if (!producto || producto.stockActual <= 0 || idsCarrito.has(productoId)) return;
    setCarrito((actual) => [...actual, { productoId, cantidad: 1, precioUnitarioAplicado: producto.precioVenta }]);
  }

  function quitar(productoId: string) {
    const esUltimo = carrito.length === 1 && carrito[0]?.productoId === productoId;
    setCarrito((actual) => actual.filter((item) => item.productoId !== productoId));
    if (esUltimo) {
      setMostrarRecuperado(false);
      setSheetAbierto(false);
    }
  }

  function actualizarCantidad(productoId: string, cantidad: number) {
    const producto = productosPorId.get(productoId);
    if (!producto) return;
    if (cantidad < 1) return quitar(productoId);
    if (cantidad > producto.stockActual) {
      toast.warning(`Solo quedan ${producto.stockActual} unidades.`);
      return;
    }
    setCarrito((actual) => actual.map((item) => item.productoId === productoId ? { ...item, cantidad } : item));
  }

  function actualizarItem(productoId: string, cambios: Partial<ItemBorradorVenta>) {
    setCarrito((actual) => actual.map((item) => item.productoId === productoId ? { ...item, ...cambios } : item));
  }

  function elegirCondicion(nueva: CondicionPago) {
    setCondicionPago(nueva);
    setPagaCon(0);
    setErrores({});
    if (nueva === "fiado") {
      setMontoCobradoInicial(0);
      setPagoCombinado(false);
    }
  }

  function elegirPagoCombinado(combinado: boolean) {
    setPagoCombinado(combinado);
    setPagaCon(0);
    setErrores({});
    if (combinado) {
      setMontoPagoPrincipal((actual) => actual > 0 && actual < total ? actual : Math.max(1, Math.floor(total / 2)));
      if (medioPagoSecundario === medioPago) {
        setMedioPagoSecundario(medioPago === "efectivo" ? "transferencia" : "efectivo");
      }
    }
  }

  function elegirMedioPrincipal(nuevo: MedioPago) {
    setMedioPago(nuevo);
    setCuentaTesoreriaId("");
    if (nuevo !== "transferencia") setDestinoTransferencia(undefined);
    if (pagoCombinado && medioPagoSecundario === nuevo) {
      setMedioPagoSecundario(nuevo === "efectivo" ? "transferencia" : "efectivo");
      setCuentaTesoreriaSecundariaId("");
    }
  }

  function elegirMedioSecundario(nuevo: MedioPago) {
    setMedioPagoSecundario(nuevo);
    setCuentaTesoreriaSecundariaId("");
    if (nuevo !== "transferencia") setDestinoTransferenciaSecundario(undefined);
  }

  function limpiarVenta() {
    setCarrito([]);
    setObservaciones("");
    setCondicionPago("contado");
    setMedioPago("efectivo");
    setDestinoTransferencia(undefined);
    setPagoCombinado(false);
    setMontoPagoPrincipal(0);
    setMedioPagoSecundario("transferencia");
    setDestinoTransferenciaSecundario(undefined);
    setCuentaTesoreriaId("");
    setCuentaTesoreriaSecundariaId("");
    setMontoCobradoInicial(0);
    setClienteFiadoNombre("");
    setClienteFiadoNota("");
    setVencimientoFiado("");
    setPagaCon(0);
    setMostrarRecuperado(false);
    setSheetAbierto(false);
    vaciarBorrador();
  }

  async function confirmarVaciado() {
    const aceptado = await confirm({
      title: "Vaciar venta pendiente",
      description: "Se quitarán todos los productos y los datos de cobro cargados.",
      confirmLabel: "Vaciar carrito",
      tone: "danger",
    });
    if (aceptado) limpiarVenta();
  }

  async function guardarVenta() {
    if (esConsulta || guardando) return;
    const cobrosIniciales = usaPagoCombinado ? [
      {
        monto: montoPagoPrincipal,
        medioPago,
        destinoTransferencia: destinoCuenta,
        cuentaTesoreriaId: tesoreria?.configurada ? cuentaElegidaId : undefined,
      },
      {
        monto: montoPagoSecundario,
        medioPago: medioPagoSecundario,
        destinoTransferencia: destinoCuentaSecundaria,
        cuentaTesoreriaId: tesoreria?.configurada ? cuentaSecundariaElegidaId : undefined,
      },
    ] : undefined;
    const resultado = ventaFormSchema.safeParse({
      condicionPago,
      medioPago: montoARecibir > 0 ? medioPago : undefined,
      destinoTransferencia: montoARecibir > 0 ? destinoCuenta : undefined,
      cuentaTesoreriaId: montoARecibir > 0 && tesoreria?.configurada ? cuentaElegidaId : undefined,
      cobrosIniciales,
      montoCobradoInicial,
      clienteFiadoNombre,
      clienteFiadoNota,
      vencimientoFiado,
      detalles: carrito,
      observaciones,
    });
    if (!resultado.success) {
      const nuevosErrores: Record<string, string> = {};
      for (const issue of resultado.error.issues) {
        const campo = String(issue.path[0] ?? "general");
        nuevosErrores[campo] ??= issue.message;
      }
      setErrores(nuevosErrores);
      toast.warning(resultado.error.issues[0]?.message ?? "Revisá la venta.");
      return;
    }

    for (const item of carrito) {
      const producto = productosPorId.get(item.productoId);
      if (!producto || producto.stockActual < item.cantidad) {
        toast.error("Cambió la cantidad disponible", "Revisá el carrito antes de cobrar.");
        setPasoSheet("carrito");
        await recargar();
        return;
      }
    }

    const aceptado = await confirm({
      title: condicionPago === "fiado" ? "Confirmar venta fiada" : "Confirmar venta",
      description: (
        <div className="space-y-2">
          <ul className="space-y-1 text-white/80">
            {carrito.slice(0, 3).map((item) => (
              <li key={item.productoId}>{productosPorId.get(item.productoId)?.nombre ?? "Producto"} · {item.cantidad}</li>
            ))}
          </ul>
          {carrito.length > 3 && <p className="text-sm text-white/55">Y {carrito.length - 3} producto{carrito.length - 3 === 1 ? "" : "s"} más.</p>}
          {condicionPago === "fiado" && <p className="text-sm text-white/70">Cliente: {clienteFiadoNombre.trim()}</p>}
          <div className="space-y-1 border-t border-white/10 pt-2">
            <p className="font-semibold">Total: {formatearPesos(total)}</p>
            {usaPagoCombinado && <p className="text-sm text-white/70">Pago combinado: {formatearPesos(montoPagoPrincipal)} en {MEDIOS_DE_PAGO.find((opcion) => opcion.value === medioPago)?.label} y {formatearPesos(montoPagoSecundario)} en {MEDIOS_DE_PAGO.find((opcion) => opcion.value === medioPagoSecundario)?.label}.</p>}
            {condicionPago === "fiado" && <p className="text-sm text-yellow-100">Quedará debiendo {formatearPesos(saldoFiado)}</p>}
          </div>
        </div>
      ),
      confirmLabel: "Guardar venta",
    });
    if (!aceptado) return;

    try {
      setGuardando(true);
      const id = await registrarVenta(resultado.data);
      limpiarVenta();
      toast.success(condicionPago === "fiado" ? "Venta fiada guardada" : "Venta guardada");
      navigate(`/ventas?destacada=${encodeURIComponent(id)}`, { replace: true });
    } catch (errorDesconocido) {
      toast.error("No se pudo guardar la venta", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5 pb-24">
      <TaskHeader title="Nueva venta" description="Buscá y tocá un producto para agregarlo." backLabel="Ventas" onBack={() => navigate("/ventas")} />
      {esConsulta && <Notice tone="warning">Este celular está en modo consulta.</Notice>}

      <Panel className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-white/80">Buscar producto</span>
          <Input autoFocus type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre, marca o categoría" />
        </label>
        {cargando && <DelayedFallback><ListSkeleton rows={3} /></DelayedFallback>}
        {error && <p role="alert" className="text-sm text-red-100">{error}</p>}
        <div className="space-y-2">
          {productosFiltrados.map((producto) => (
            <button key={producto.id} type="button" onClick={() => agregarProducto(producto.id)} disabled={esConsulta} className="animate-mora-enter min-h-16 w-full rounded-2xl border border-white/10 bg-black/15 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[.99] disabled:opacity-50">
              <span className="flex justify-between gap-3">
                <span>
                  <span className="block font-semibold">{producto.nombre}</span>
                  <span className="mt-1 block text-xs text-white/50">{categoriasPorId.get(producto.categoriaId) ?? "Sin categoría"} · {producto.stockActual === 1 ? "Última unidad" : `Quedan ${producto.stockActual}`}</span>
                </span>
                <span className="font-semibold">{formatearPesos(producto.precioVenta)}</span>
              </span>
            </button>
          ))}
        </div>
        {!cargando && productosFiltrados.length === 0 && (
          <div className="py-6 text-center text-sm text-white/50">
            <p>{carrito.length && !busqueda ? "Todos los productos disponibles ya están en el carrito." : productos.length ? "No encontramos productos disponibles." : "Primero necesitás cargar un producto."}</p>
            {!productos.length && !esConsulta && <Link to="/productos/nuevo" className="mt-3 inline-flex min-h-12 items-center font-semibold text-mora-suave">Agregar primer producto</Link>}
          </div>
        )}
      </Panel>

      {!esConsulta && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+.75rem)]">
          <button type="button" onClick={() => { setPasoSheet("carrito"); setSheetAbierto(true); setMostrarRecuperado(false); }} disabled={!carrito.length} className="mx-auto flex min-h-16 w-full max-w-md items-center justify-between rounded-3xl border border-white/15 bg-mora-principal px-5 text-white shadow-[0_12px_35px_rgba(0,0,0,.4)] disabled:bg-white/10 disabled:text-white/45">
            <span className="flex items-center gap-3"><Icon name="carrito" /><span><span className="block text-left font-semibold">{carrito.length ? `Carrito · ${carrito.length}` : "Carrito vacío"}</span>{mostrarRecuperado && <span className="block text-left text-xs text-white/75">Venta pendiente recuperada</span>}</span></span>
            <strong>{formatearPesos(total)}</strong>
          </button>
        </div>
      )}

      <BottomSheet open={sheetAbierto} onOpenChange={setSheetAbierto} title={pasoSheet === "carrito" ? "Carrito" : "Revisar y cobrar"} description={pasoSheet === "carrito" ? `${carrito.length} producto${carrito.length === 1 ? "" : "s"} · ${formatearPesos(total)}` : `Total ${formatearPesos(total)}`}>
        {pasoSheet === "carrito" ? (
          <div className="space-y-3">
            {recuperadoInicial && mostrarRecuperado && <div className="flex items-center justify-between gap-3 rounded-2xl bg-mora-exito/10 p-3 text-sm text-green-100"><span>Recuperamos esta venta.</span><button type="button" className="font-semibold" onClick={() => setMostrarRecuperado(false)}>Entendido</button></div>}
            {carrito.map((item) => {
              const producto = productosPorId.get(item.productoId);
              const abiertas = opcionesAbiertas.includes(item.productoId);
              return (
                <Panel key={item.productoId} className="space-y-3">
                  <div className="flex justify-between gap-3"><div><p className="font-semibold">{producto?.nombre ?? "Producto no disponible"}</p><p className="text-xs text-white/50">{formatearPesos(item.precioUnitarioAplicado)} cada uno</p></div><strong>{formatearPesos(item.cantidad * item.precioUnitarioAplicado)}</strong></div>
                  <div className="flex items-center gap-2"><button type="button" onClick={() => quitar(item.productoId)} className="min-h-12 rounded-2xl px-3 text-sm font-semibold text-red-200 hover:bg-mora-error/15">Eliminar</button><div className="ml-auto flex items-center gap-2"><Button variant="secondary" className="h-12 w-12 p-0 text-xl" onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}>−</Button><span className="min-w-8 text-center font-semibold">{item.cantidad}</span><Button variant="secondary" className="h-12 w-12 p-0 text-xl" onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}>＋</Button></div></div>
                  <button type="button" className="text-sm text-white/55" onClick={() => setOpcionesAbiertas((actual) => actual.includes(item.productoId) ? actual.filter((id) => id !== item.productoId) : [...actual, item.productoId])}>{abiertas ? "Ocultar opciones" : "Precio y observación"}</button>
                  {abiertas && <div className="grid gap-3 border-t border-white/10 pt-3"><label><span className="text-xs text-white/55">Precio aplicado</span><Input value={item.precioUnitarioAplicado} inputMode="numeric" onChange={(event) => actualizarItem(item.productoId, { precioUnitarioAplicado: Number(event.target.value) })} /></label><label><span className="text-xs text-white/55">Observación</span><Input value={item.observaciones ?? ""} onChange={(event) => actualizarItem(item.productoId, { observaciones: event.target.value })} /></label></div>}
                </Panel>
              );
            })}
            <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2"><Button variant="ghost" onClick={() => void confirmarVaciado()}>Vaciar</Button><Button disabled={!carrito.length} onClick={() => setPasoSheet("cobro")}>Revisar y cobrar</Button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <Panel className="space-y-2">{carrito.map((item) => <div key={item.productoId} className="flex justify-between text-sm"><span className="text-white/70">{item.cantidad} × {productosPorId.get(item.productoId)?.nombre}</span><strong>{formatearPesos(item.cantidad * item.precioUnitarioAplicado)}</strong></div>)}<div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold"><span>Total</span><span>{formatearPesos(total)}</span></div></Panel>

            <Panel className="space-y-3">
              <p className="text-sm font-semibold text-white">¿Cómo se paga?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={condicionPago === "contado" ? "primary" : "secondary"} aria-pressed={condicionPago === "contado"} onClick={() => elegirCondicion("contado")}>Cobrar todo</Button>
                <Button variant={condicionPago === "fiado" ? "primary" : "secondary"} aria-pressed={condicionPago === "fiado"} onClick={() => elegirCondicion("fiado")}>Fiar parte o total</Button>
              </div>

              {condicionPago === "fiado" && (
                <div className="space-y-3 border-t border-white/10 pt-3">
                  <label className="block"><span className="text-sm text-white/70">Cliente</span><Input value={clienteFiadoNombre} onChange={(event) => { setClienteFiadoNombre(event.target.value); setErrores((actual) => ({ ...actual, clienteFiadoNombre: "" })); }} placeholder="Nombre obligatorio" />{errores.clienteFiadoNombre && <span className="mt-1 block text-xs text-red-200">{errores.clienteFiadoNombre}</span>}</label>
                  <label className="block"><span className="text-sm text-white/70">Nota del cliente</span><Input value={clienteFiadoNota} onChange={(event) => setClienteFiadoNota(event.target.value)} placeholder="Opcional" /></label>
                  <label className="block"><span className="text-sm text-white/70">Vencimiento</span><Input type="date" value={vencimientoFiado} onChange={(event) => setVencimientoFiado(event.target.value)} /></label>
                  <label className="block"><span className="text-sm text-white/70">Recibe ahora</span><Input value={montoCobradoInicial || ""} inputMode="numeric" placeholder="$0" onChange={(event) => { setMontoCobradoInicial(Number(event.target.value)); setPagaCon(0); setErrores((actual) => ({ ...actual, montoCobradoInicial: "" })); }} />{errores.montoCobradoInicial && <span className="mt-1 block text-xs text-red-200">{errores.montoCobradoInicial}</span>}</label>
                  <div className="grid grid-cols-3 gap-2"><Button size="sm" variant={montoCobradoInicial === 0 ? "primary" : "secondary"} onClick={() => setMontoCobradoInicial(0)}>Nada</Button><Button size="sm" variant="secondary" onClick={() => setMontoCobradoInicial(Math.floor(total / 2))}>La mitad</Button><Button size="sm" variant="secondary" onClick={() => setMontoCobradoInicial(Math.max(0, total - 1000))}>Faltan $1.000</Button></div>
                  <div className="rounded-2xl bg-mora-advertencia/10 p-4 text-sm"><div className="flex justify-between text-white/60"><span>Recibe</span><span>{formatearPesos(montoARecibir)}</span></div><div className="mt-2 flex justify-between font-semibold text-yellow-100"><span>Queda debiendo</span><span>{formatearPesos(Math.max(0, saldoFiado))}</span></div></div>
                </div>
              )}

              {montoARecibir > 0 && (
                <div className="space-y-3 border-t border-white/10 pt-3">
                  {condicionPago === "contado" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant={!pagoCombinado ? "primary" : "secondary"} aria-pressed={!pagoCombinado} onClick={() => elegirPagoCombinado(false)}>Un medio</Button>
                      <Button size="sm" variant={pagoCombinado ? "primary" : "secondary"} aria-pressed={pagoCombinado} onClick={() => elegirPagoCombinado(true)}>Pago combinado</Button>
                    </div>
                  )}
                  <div className={usaPagoCombinado ? "space-y-3 rounded-2xl border border-white/10 bg-black/10 p-3" : "space-y-3"}>
                    <p className="text-sm font-semibold text-white/80">{usaPagoCombinado ? "Primer pago" : "Medio de pago"}</p>
                    {usaPagoCombinado && <label className="block"><span className="text-sm text-white/70">Importe</span><Input value={montoPagoPrincipal || ""} inputMode="numeric" placeholder="$0" onChange={(event) => { setMontoPagoPrincipal(Number(event.target.value)); setPagaCon(0); }} /></label>}
                    <div className="flex flex-wrap gap-2">{MEDIOS_DE_PAGO.map((opcion) => <Button key={opcion.value} size="sm" variant={medioPago === opcion.value ? "primary" : "secondary"} aria-pressed={medioPago === opcion.value} onClick={() => elegirMedioPrincipal(opcion.value)}>{opcion.label}</Button>)}</div>
                    {tesoreria?.configurada ? <label className="block"><span className="text-sm text-white/70">Cuenta que recibe</span><Select value={cuentaElegidaId} onChange={(event) => setCuentaTesoreriaId(event.target.value)}>{cuentasCompatibles.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} · {formatearPesos(cuenta.saldo)}</option>)}</Select></label> : medioPago === "transferencia" && <><p className="pt-2 text-sm text-white/70">¿Dónde recibís el dinero?</p><div className="flex flex-wrap gap-2">{DESTINOS_TRANSFERENCIA.map((opcion) => <Button key={opcion.value} size="sm" variant={destinoTransferencia === opcion.value ? "primary" : "secondary"} aria-pressed={destinoTransferencia === opcion.value} onClick={() => setDestinoTransferencia(opcion.value)}>{opcion.label}</Button>)}</div></>}
                  </div>
                  {usaPagoCombinado && (
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/10 p-3">
                      <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-white/80">Segundo pago</p><strong>{formatearPesos(montoPagoSecundario)}</strong></div>
                      <p className="text-xs text-white/50">El importe restante se calcula automáticamente.</p>
                      <div className="flex flex-wrap gap-2">{MEDIOS_DE_PAGO.map((opcion) => <Button key={opcion.value} size="sm" disabled={opcion.value === medioPago} variant={medioPagoSecundario === opcion.value ? "primary" : "secondary"} aria-pressed={medioPagoSecundario === opcion.value} onClick={() => elegirMedioSecundario(opcion.value)}>{opcion.label}</Button>)}</div>
                      {tesoreria?.configurada ? <label className="block"><span className="text-sm text-white/70">Cuenta que recibe</span><Select value={cuentaSecundariaElegidaId} onChange={(event) => setCuentaTesoreriaSecundariaId(event.target.value)}>{cuentasCompatiblesSecundarias.map((cuenta) => <option key={cuenta.id} value={cuenta.id}>{cuenta.nombre} · {formatearPesos(cuenta.saldo)}</option>)}</Select></label> : medioPagoSecundario === "transferencia" && <><p className="pt-2 text-sm text-white/70">¿Dónde recibís el dinero?</p><div className="flex flex-wrap gap-2">{DESTINOS_TRANSFERENCIA.map((opcion) => <Button key={opcion.value} size="sm" variant={destinoTransferenciaSecundario === opcion.value ? "primary" : "secondary"} aria-pressed={destinoTransferenciaSecundario === opcion.value} onClick={() => setDestinoTransferenciaSecundario(opcion.value)}>{opcion.label}</Button>)}</div></>}
                      <div className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"><span className="text-white/60">Total cubierto</span><strong>{formatearPesos(montoPagoPrincipal + montoPagoSecundario)}</strong></div>
                    </div>
                  )}
                  {montoEnEfectivo > 0 && <div className="space-y-3 border-t border-white/10 pt-3"><label><span className="text-sm text-white/70">Pagan en efectivo con</span><Input value={pagaCon || ""} inputMode="numeric" placeholder={formatearPesos(montoEnEfectivo)} onChange={(event) => setPagaCon(Number(event.target.value))} /></label><div className="flex flex-wrap gap-2">{importesRapidos.map((importe) => <Button key={importe} size="sm" variant={pagaCon === importe ? "primary" : "secondary"} onClick={() => setPagaCon(importe)}>{formatearPesos(importe)}</Button>)}</div>{pagaCon > 0 && (vuelto === null ? <Notice tone="warning">El importe no alcanza para cubrir el pago en efectivo.</Notice> : <div className="rounded-2xl bg-mora-exito/10 p-4"><span className="text-sm text-green-100">Vuelto</span><p className="text-2xl font-bold text-white">{formatearPesos(vuelto)}</p></div>)}</div>}
                </div>
              )}

              <label className="block border-t border-white/10 pt-3"><span className="text-sm text-white/70">Observaciones de la venta</span><Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Opcional" /></label>
            </Panel>

            <div className="grid grid-cols-[1fr_2fr] gap-3"><Button variant="secondary" onClick={() => setPasoSheet("carrito")}>Volver</Button><Button disabled={guardando || saldoFiado < 0 || (usaPagoCombinado && (montoPagoPrincipal <= 0 || montoPagoSecundario <= 0 || medioPago === medioPagoSecundario)) || (montoARecibir > 0 && tesoreria?.configurada && (!cuentaElegidaId || (usaPagoCombinado && !cuentaSecundariaElegidaId))) || (montoARecibir > 0 && medioPago === "transferencia" && !destinoCuenta) || (usaPagoCombinado && medioPagoSecundario === "transferencia" && !destinoCuentaSecundaria)} onClick={() => void guardarVenta()}>{guardando ? "Guardando..." : "Confirmar venta"}</Button></div>
          </div>
        )}
      </BottomSheet>
    </section>
  );
}
