import { type FormEvent, useMemo, useState } from "react";

import { useToast } from "../../components/ui";
import { MEDIOS_DE_PAGO } from "../../constants";
import { registrarVenta } from "../../db";
import type { MedioPago } from "../../domain/ventas";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { ventaFormSchema } from "../../schemas";

interface CarritoItem {
  productoId: string;
  cantidad: number;
  precioUnitarioAplicado: number;
  observaciones?: string;
}

function formatearPesos(valor: number): string {
  return `$${valor.toLocaleString("es-AR")}`;
}

export function NuevaVentaPage() {
  const {
    productos,
    categorias,
    cargando,
    error,
    recargar: recargarProductos,
  } = useProductos(false);
  const { configuracion } = useConfiguracionLocal();
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [medioPago, setMedioPago] = useState<MedioPago>("efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [opcionesAbiertas, setOpcionesAbiertas] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const toast = useToast();

  const esConsulta = configuracion?.deviceRole === "consulta";

  const categoriasPorId = useMemo(() => {
    return new Map(categorias.map((categoria) => [categoria.id, categoria.nombre]));
  }, [categorias]);

  const productosPorId = useMemo(() => {
    return new Map(productos.map((producto) => [producto.id, producto]));
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-AR");

    const productosOrdenados = [...productos].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es-AR"),
    );

    if (!texto) {
      return productosOrdenados.filter((producto) => producto.stockActual > 0).slice(0, 6);
    }

    return productosOrdenados
      .filter((producto) => {
        const categoria = categoriasPorId.get(producto.categoriaId) ?? "";
        const textoProducto = [
          producto.nombre,
          producto.marca,
          producto.presentacion,
          categoria,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-AR");

        return textoProducto.includes(texto);
      })
      .slice(0, 10);
  }, [busqueda, categoriasPorId, productos]);

  const totalCarrito = useMemo(() => {
    return carrito.reduce(
      (total, item) => total + item.cantidad * item.precioUnitarioAplicado,
      0,
    );
  }, [carrito]);

  function agregarProducto(productoId: string) {
    const producto = productosPorId.get(productoId);

    if (!producto) {
      toast.error("No se pudo encontrar ese producto.");
      return;
    }

    if (producto.stockActual <= 0) {
      toast.error("No hay stock suficiente", "Este producto no tiene unidades disponibles.");
      return;
    }

    const itemExistente = carrito.find((item) => item.productoId === productoId);

    if (itemExistente && itemExistente.cantidad + 1 > producto.stockActual) {
      toast.error("No hay stock suficiente", `No quedan más unidades disponibles de ${producto.nombre}.`);
      return;
    }

    setCarrito((actual) => {
      if (itemExistente) {
        return actual.map((item) =>
          item.productoId === productoId
            ? {
                ...item,
                cantidad: item.cantidad + 1,
              }
            : item,
        );
      }

      return [
        ...actual,
        {
          productoId,
          cantidad: 1,
          precioUnitarioAplicado: producto.precioVenta,
        },
      ];
    });
  }

  function actualizarCantidad(productoId: string, cantidad: number) {
    const producto = productosPorId.get(productoId);

    if (!producto) return;

    if (cantidad < 1) {
      quitarProducto(productoId);
      return;
    }

    if (cantidad > producto.stockActual) {
      toast.error("No hay stock suficiente", `No hay ${cantidad} unidades disponibles de ${producto.nombre}.`);
      return;
    }

    setCarrito((actual) =>
      actual.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              cantidad,
            }
          : item,
      ),
    );
  }

  function actualizarPrecio(productoId: string, precioUnitarioAplicado: number) {
    setCarrito((actual) =>
      actual.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              precioUnitarioAplicado,
            }
          : item,
      ),
    );
  }

  function actualizarObservacionItem(productoId: string, observacion: string) {
    setCarrito((actual) =>
      actual.map((item) =>
        item.productoId === productoId
          ? {
              ...item,
              observaciones: observacion,
            }
          : item,
      ),
    );
  }

  function quitarProducto(productoId: string) {
    setCarrito((actual) => actual.filter((item) => item.productoId !== productoId));
    setOpcionesAbiertas((actual) => actual.filter((id) => id !== productoId));
  }

  function alternarOpciones(productoId: string) {
    setOpcionesAbiertas((actual) =>
      actual.includes(productoId)
        ? actual.filter((id) => id !== productoId)
        : [...actual, productoId],
    );
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta) {
      toast.warning("Celular de consulta", "Para cargar ventas, usá el celular principal.");
      return;
    }

    const ventaParaGuardar = {
      medioPago,
      detalles: carrito.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitarioAplicado: item.precioUnitarioAplicado,
        observaciones: item.observaciones,
      })),
      observaciones,
    };

    const resultado = ventaFormSchema.safeParse(ventaParaGuardar);

    if (!resultado.success) {
      toast.warning(resultado.error.issues[0]?.message ?? "Revisá los datos de la venta.");
      return;
    }

    for (const item of carrito) {
      const producto = productosPorId.get(item.productoId);

      if (!producto || producto.stockActual < item.cantidad) {
        toast.error("No hay stock suficiente", "Revisá las cantidades antes de continuar.");
        return;
      }
    }

    const resumen = carrito
      .map((item) => {
        const producto = productosPorId.get(item.productoId);
        return `${item.cantidad} x ${producto?.nombre ?? "Producto"}`;
      })
      .join("\n");

    const confirmar = window.confirm(
      `Confirmar venta por ${formatearPesos(totalCarrito)}?\n\n${resumen}`,
    );

    if (!confirmar) return;

    try {
      setGuardando(true);
      await registrarVenta(resultado.data);
      await recargarProductos();
      setCarrito([]);
      setBusqueda("");
      setObservaciones("");
      setOpcionesAbiertas([]);
      toast.success("Venta guardada", "Ya quedó sumada al resumen de hoy.");
    } catch (errorDesconocido) {
      const textoError =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo guardar la venta.";
      toast.error("No se pudo guardar la venta", textoError);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Nueva venta</h1>
        <p className="mt-1 text-sm text-white/65">
          Buscá productos, armá el carrito y confirmá la venta.
        </p>
      </header>

      {esConsulta && (
        <div className="rounded-3xl border border-mora-advertencia/30 bg-mora-advertencia/10 p-4 text-sm leading-6 text-yellow-100">
          Este celular está como consulta. Podés revisar datos, pero no cargar ventas nuevas.
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <label className="text-sm font-medium text-white/80" htmlFor="buscar-producto">
          Buscar producto
        </label>
        <input
          id="buscar-producto"
          type="search"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Nombre, marca o categoría"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-mora-principal"
        />

        <div className="mt-4 space-y-2">
          {cargando && <p className="text-sm text-white/55">Cargando productos...</p>}
          {error && <p className="text-sm text-red-100">{error}</p>}

          {!cargando && productosFiltrados.length === 0 && (
            <p className="text-sm text-white/55">
              No encontramos productos disponibles con esa búsqueda.
            </p>
          )}

          {productosFiltrados.map((producto) => {
            const categoria = categoriasPorId.get(producto.categoriaId) ?? "Sin categoría";
            const sinStock = producto.stockActual <= 0;

            return (
              <button
                key={producto.id}
                type="button"
                onClick={() => agregarProducto(producto.id)}
                disabled={sinStock || esConsulta}
                className="w-full rounded-2xl border border-white/10 bg-black/15 p-3 text-left transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {producto.nombre}
                    </span>
                    <span className="mt-1 block text-xs text-white/50">
                      {[producto.marca, producto.presentacion, categoria]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>

                  <span className="text-right text-sm font-semibold text-white">
                    {formatearPesos(producto.precioVenta)}
                    <span className="mt-1 block text-xs font-normal text-white/45">
                      Stock {producto.stockActual}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={(event) => void manejarSubmit(event)} className="space-y-4">
        <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Carrito</h2>
              <p className="mt-1 text-xs text-white/50">
                Revisá cantidades antes de confirmar.
              </p>
            </div>
            <p className="text-right text-xl font-bold text-white">
              {formatearPesos(totalCarrito)}
            </p>
          </div>

          {carrito.length === 0 && (
            <p className="rounded-2xl bg-black/15 p-3 text-sm text-white/55">
              Agregá al menos un producto para cargar la venta.
            </p>
          )}

          {carrito.map((item) => {
            const producto = productosPorId.get(item.productoId);
            const opcionesVisibles = opcionesAbiertas.includes(item.productoId);

            return (
              <article key={item.productoId} className="rounded-2xl bg-black/15 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {producto?.nombre ?? "Producto no disponible"}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      Stock disponible: {producto?.stockActual ?? 0}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {formatearPesos(item.cantidad * item.precioUnitarioAplicado)}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                    className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04] font-semibold text-white"
                  >
                    −
                  </button>

                  <input
                    value={item.cantidad}
                    onChange={(event) =>
                      actualizarCantidad(item.productoId, Number(event.target.value))
                    }
                    inputMode="numeric"
                    className="h-10 w-16 rounded-2xl border border-white/10 bg-black/20 text-center text-white outline-none focus:border-mora-principal"
                  />

                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                    className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04] font-semibold text-white"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => alternarOpciones(item.productoId)}
                    className="ml-auto rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Más opciones
                  </button>
                </div>

                {opcionesVisibles && (
                  <div className="mt-3 grid gap-3 border-t border-white/10 pt-3">
                    <label className="block">
                      <span className="text-xs text-white/55">Precio aplicado</span>
                      <input
                        value={item.precioUnitarioAplicado}
                        onChange={(event) =>
                          actualizarPrecio(item.productoId, Number(event.target.value))
                        }
                        inputMode="numeric"
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-mora-principal"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs text-white/55">Observación del producto</span>
                      <input
                        value={item.observaciones ?? ""}
                        onChange={(event) =>
                          actualizarObservacionItem(item.productoId, event.target.value)
                        }
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-mora-principal"
                        placeholder="Opcional"
                      />
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => quitarProducto(item.productoId)}
                  className="mt-3 text-xs font-semibold text-red-100"
                >
                  Quitar del carrito
                </button>
              </article>
            );
          })}
        </section>

        <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <label className="block">
            <span className="text-sm text-white/70">Medio de pago</span>
            <select
              value={medioPago}
              onChange={(event) => setMedioPago(event.target.value as MedioPago)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
            >
              {MEDIOS_DE_PAGO.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-white/70">Observaciones</span>
            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              className="mt-1 min-h-20 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="Opcional"
            />
          </label>
        </section>


        <button
          type="submit"
          disabled={guardando || carrito.length === 0 || esConsulta}
          className="w-full rounded-3xl bg-mora-principal px-5 py-4 font-semibold text-white disabled:opacity-60"
        >
          {guardando ? "Guardando venta..." : "Confirmar venta"}
        </button>
      </form>
    </section>
  );
}
