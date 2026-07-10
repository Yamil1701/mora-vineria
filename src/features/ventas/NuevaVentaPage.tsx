import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Notice, Panel, Select, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { registrarVenta } from "../../db";
import type { MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { ventaFormSchema } from "../../schemas";
import { usePreferenciasUi, type ItemBorradorVenta } from "../../stores/preferenciasUi";
import { formatearPesos } from "./ventas.ui";

export function NuevaVentaPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { productos, categorias, cargando, error, recargar } = useProductos(false);
  const { configuracion } = useConfiguracionLocal();
  const borrador = usePreferenciasUi((state) => state.borradorVenta);
  const actualizarBorrador = usePreferenciasUi((state) => state.actualizarBorradorVenta);
  const vaciarBorrador = usePreferenciasUi((state) => state.vaciarBorradorVenta);
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<ItemBorradorVenta[]>(borrador.items);
  const [medioPago, setMedioPago] = useState<MedioPago>(borrador.medioPago);
  const [observaciones, setObservaciones] = useState(borrador.observaciones);
  const [opcionesAbiertas, setOpcionesAbiertas] = useState<string[]>([]);
  const [paso, setPaso] = useState<"productos" | "cobro">("productos");
  const [guardando, setGuardando] = useState(false);
  const esConsulta = configuracion?.deviceRole === "consulta";

  useEffect(() => {
    actualizarBorrador({ items: carrito, medioPago, observaciones });
  }, [actualizarBorrador, carrito, medioPago, observaciones]);

  const categoriasPorId = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])),
    [categorias],
  );
  const productosPorId = useMemo(
    () => new Map(productos.map((producto) => [producto.id, producto])),
    [productos],
  );
  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-AR");
    const ordenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"));

    if (!texto) return ordenados.filter((producto) => producto.stockActual > 0).slice(0, 8);

    return ordenados
      .filter((producto) =>
        [producto.nombre, producto.marca, producto.presentacion, categoriasPorId.get(producto.categoriaId)]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-AR")
          .includes(texto),
      )
      .slice(0, 12);
  }, [busqueda, categoriasPorId, productos]);
  const total = useMemo(
    () => carrito.reduce((acumulado, item) => acumulado + item.cantidad * item.precioUnitarioAplicado, 0),
    [carrito],
  );

  function agregarProducto(productoId: string) {
    const producto = productosPorId.get(productoId);
    if (!producto || producto.stockActual <= 0) return;

    setCarrito((actual) => {
      const existente = actual.find((item) => item.productoId === productoId);
      if (existente) {
        if (existente.cantidad >= producto.stockActual) {
          toast.warning("No queda más stock disponible de ese producto.");
          return actual;
        }
        return actual.map((item) => item.productoId === productoId ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...actual, { productoId, cantidad: 1, precioUnitarioAplicado: producto.precioVenta }];
    });
  }

  function actualizarCantidad(productoId: string, cantidad: number) {
    const producto = productosPorId.get(productoId);
    if (!producto) return;
    if (cantidad < 1) {
      setCarrito((actual) => actual.filter((item) => item.productoId !== productoId));
      return;
    }
    if (cantidad > producto.stockActual) {
      toast.warning("No hay stock suficiente", `Quedan ${producto.stockActual} unidades.`);
      return;
    }
    setCarrito((actual) => actual.map((item) => item.productoId === productoId ? { ...item, cantidad } : item));
  }

  function actualizarItem(productoId: string, cambios: Partial<ItemBorradorVenta>) {
    setCarrito((actual) => actual.map((item) => item.productoId === productoId ? { ...item, ...cambios } : item));
  }

  async function confirmarVaciado() {
    const confirmado = await confirm({
      title: "Vaciar venta pendiente",
      description: "Se quitarán todos los productos y observaciones de este carrito.",
      confirmLabel: "Vaciar carrito",
      tone: "danger",
    });
    if (!confirmado) return;
    setCarrito([]);
    setObservaciones("");
    setMedioPago("efectivo");
    setOpcionesAbiertas([]);
    vaciarBorrador();
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta) return;

    const values = { medioPago, detalles: carrito, observaciones };
    const resultado = ventaFormSchema.safeParse(values);
    if (!resultado.success) {
      toast.warning(resultado.error.issues[0]?.message ?? "Revisá la venta.");
      return;
    }

    for (const item of carrito) {
      const producto = productosPorId.get(item.productoId);
      if (!producto || producto.stockActual < item.cantidad) {
        toast.error("Cambió el stock disponible", "Volvé a productos y revisá las cantidades.");
        setPaso("productos");
        await recargar();
        return;
      }
    }

    const confirmado = await confirm({
      title: "Confirmar venta",
      description: (
        <div className="space-y-3">
          <ul className="space-y-1 text-white/80">
            {carrito.map((item) => <li key={item.productoId}>{item.cantidad} × {productosPorId.get(item.productoId)?.nombre ?? "Producto"}</li>)}
          </ul>
          <p className="border-t border-white/10 pt-3 font-semibold">Total: {formatearPesos(total)}</p>
        </div>
      ),
      confirmLabel: "Guardar venta",
    });
    if (!confirmado) return;

    try {
      setGuardando(true);
      const ventaId = await registrarVenta(resultado.data);
      vaciarBorrador();
      setCarrito([]);
      setObservaciones("");
      toast.success("Venta guardada", "Ya está reflejada en el stock y el historial.");
      navigate(`/ventas?destacada=${encodeURIComponent(ventaId)}`, { replace: true });
    } catch (errorDesconocido) {
      toast.error("No se pudo guardar la venta", errorDesconocido instanceof Error ? errorDesconocido.message : undefined);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5 pb-24">
      <TaskHeader
        title={paso === "productos" ? "Nueva venta" : "Revisar y cobrar"}
        description={paso === "productos" ? "Buscá productos y armá el carrito." : "Confirmá el medio de pago y el total."}
        backLabel={paso === "productos" ? "Ventas" : "Productos"}
        onBack={() => paso === "cobro" ? setPaso("productos") : navigate("/ventas")}
      />

      {esConsulta && <Notice tone="warning">Este celular está en modo consulta. Para vender, usá el celular principal.</Notice>}
      {borrador.actualizadoAt && carrito.length > 0 && paso === "productos" && (
        <Notice tone="success">
          <div className="flex items-center justify-between gap-3">
            <span>Recuperamos la venta que había quedado pendiente.</span>
            <Button variant="ghost" size="sm" onClick={() => void confirmarVaciado()}>Vaciar</Button>
          </div>
        </Notice>
      )}

      {paso === "productos" ? (
        <>
          <Panel className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-white/80">Buscar producto</span>
              <Input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre, marca o categoría" />
            </label>
            {cargando && <p role="status" className="text-sm text-white/55">Cargando productos...</p>}
            {error && <p role="alert" className="text-sm text-red-100">{error}</p>}
            <div className="space-y-2">
              {productosFiltrados.map((producto) => (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => agregarProducto(producto.id)}
                  disabled={producto.stockActual <= 0 || esConsulta}
                  className="min-h-16 w-full rounded-2xl border border-white/10 bg-black/15 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold text-white">{producto.nombre}</span>
                      <span className="mt-1 block text-xs text-white/50">{categoriasPorId.get(producto.categoriaId) ?? "Sin categoría"} · Stock {producto.stockActual}</span>
                    </span>
                    <span className="font-semibold text-white">{formatearPesos(producto.precioVenta)}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Carrito</h2>
                <p className="mt-1 text-sm text-white/55">{carrito.length} producto{carrito.length === 1 ? "" : "s"}</p>
              </div>
              {carrito.length > 0 && <Button variant="ghost" size="sm" onClick={() => void confirmarVaciado()}>Vaciar</Button>}
            </div>

            {carrito.length === 0 && <Notice>Elegí un producto para comenzar.</Notice>}
            {carrito.map((item) => {
              const producto = productosPorId.get(item.productoId);
              const opcionesVisibles = opcionesAbiertas.includes(item.productoId);
              return (
                <Panel key={item.productoId} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{producto?.nombre ?? "Producto no disponible"}</p>
                      <p className="mt-1 text-xs text-white/50">{formatearPesos(item.precioUnitarioAplicado)} por unidad</p>
                    </div>
                    <p className="font-bold text-white">{formatearPesos(item.cantidad * item.precioUnitarioAplicado)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" className="h-12 w-12 p-0 text-xl" aria-label={`Quitar una unidad de ${producto?.nombre ?? "producto"}`} onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}>−</Button>
                    <Input aria-label={`Cantidad de ${producto?.nombre ?? "producto"}`} value={item.cantidad} inputMode="numeric" onChange={(event) => actualizarCantidad(item.productoId, Number(event.target.value))} className="w-16 text-center" />
                    <Button variant="secondary" className="h-12 w-12 p-0 text-xl" aria-label={`Agregar una unidad de ${producto?.nombre ?? "producto"}`} onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}>＋</Button>
                    <Button variant="ghost" className="ml-auto" aria-expanded={opcionesVisibles} onClick={() => setOpcionesAbiertas((actual) => actual.includes(item.productoId) ? actual.filter((id) => id !== item.productoId) : [...actual, item.productoId])}>Opciones</Button>
                  </div>
                  {opcionesVisibles && (
                    <div className="animate-mora-enter space-y-3 border-t border-white/10 pt-3">
                      <label className="block"><span className="text-xs text-white/55">Precio aplicado</span><Input value={item.precioUnitarioAplicado} inputMode="numeric" onChange={(event) => actualizarItem(item.productoId, { precioUnitarioAplicado: Number(event.target.value) })} /></label>
                      <label className="block"><span className="text-xs text-white/55">Observación del producto</span><Input value={item.observaciones ?? ""} onChange={(event) => actualizarItem(item.productoId, { observaciones: event.target.value })} placeholder="Opcional" /></label>
                      <Button variant="danger" fullWidth onClick={() => setCarrito((actual) => actual.filter((actualItem) => actualItem.productoId !== item.productoId))}>Quitar del carrito</Button>
                    </div>
                  )}
                </Panel>
              );
            })}
          </section>
        </>
      ) : (
        <form id="form-cobro" onSubmit={(event) => void manejarSubmit(event)} className="space-y-4">
          <Panel className="space-y-3">
            {carrito.map((item) => (
              <div key={item.productoId} className="flex justify-between gap-3 text-sm">
                <span className="text-white/75">{item.cantidad} × {productosPorId.get(item.productoId)?.nombre ?? "Producto"}</span>
                <span className="font-semibold">{formatearPesos(item.cantidad * item.precioUnitarioAplicado)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/10 pt-3 text-xl font-bold"><span>Total</span><span>{formatearPesos(total)}</span></div>
          </Panel>
          <Panel className="space-y-3">
            <label className="block"><span className="text-sm text-white/70">Medio de pago</span><Select value={medioPago} onChange={(event) => setMedioPago(event.target.value as MedioPago)}>{MEDIOS_DE_PAGO.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}</Select></label>
            <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} placeholder="Opcional" /></label>
          </Panel>
        </form>
      )}

      {!esConsulta && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-mora-fondo/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur">
          <div className="mx-auto max-w-md">
            {paso === "productos" ? (
              <Button size="lg" fullWidth disabled={carrito.length === 0} onClick={() => setPaso("cobro")}>
                Revisar y cobrar · {formatearPesos(total)}
              </Button>
            ) : (
              <Button type="submit" form="form-cobro" size="lg" fullWidth disabled={guardando}>
                {guardando ? "Guardando venta..." : `Confirmar venta · ${formatearPesos(total)}`}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
