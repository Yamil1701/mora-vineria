import { type FormEvent, useEffect, useMemo, useState } from "react";

import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import { crearProducto } from "../../db";
import { useProductos } from "../../hooks/useProductos";
import { productoFormSchema } from "../../schemas";

const formInicial = {
  nombre: "",
  categoriaId: "",
  precioVenta: "",
  costoCompra: "",
  marca: "",
  presentacion: "",
  stockActual: "",
  stockObjetivo: "",
  observaciones: "",
};

export function ProductosPage() {
  const { productos, categorias, cargando, error, recargar } = useProductos();
  const [form, setForm] = useState(formInicial);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const categoriasPorId = useMemo(() => {
    return new Map(categorias.map((categoria) => [categoria.id, categoria.nombre]));
  }, [categorias]);

  useEffect(() => {
    if (!form.categoriaId && categorias[0]) {
      setForm((actual) => ({
        ...actual,
        categoriaId: categorias[0].id,
      }));
    }
  }, [categorias, form.categoriaId]);

  function actualizarCampo(campo: keyof typeof form, valor: string) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensaje(null);

    const resultado = productoFormSchema.safeParse(form);

    if (!resultado.success) {
      setMensaje(resultado.error.issues[0]?.message ?? "Revisá los datos marcados.");
      return;
    }

    try {
      setGuardando(true);
      await crearProducto(resultado.data);
      await recargar();

      setForm({
        ...formInicial,
        categoriaId: categorias[0]?.id ?? "",
      });

      setMensaje("Producto guardado correctamente.");
    } catch {
      setMensaje("No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Productos</h1>
        <p className="mt-1 text-sm text-white/65">
          Administrá precios, stock y estado de productos.
        </p>
      </header>

      <form
        onSubmit={(event) => void manejarSubmit(event)}
        className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
      >
        <div>
          <p className="text-sm font-semibold text-white">Agregar producto</p>
          <p className="mt-1 text-xs leading-5 text-white/50">
            El costo queda guardado para calcular ganancia estimada, pero no se muestra como dato principal.
          </p>
        </div>

        <label className="block">
          <span className="text-sm text-white/70">Nombre</span>
          <input
            value={form.nombre}
            onChange={(event) => actualizarCampo("nombre", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
            placeholder="Ej: Vino Malbec"
          />
        </label>

        <label className="block">
          <span className="text-sm text-white/70">Categoría</span>
          <select
            value={form.categoriaId}
            onChange={(event) => actualizarCampo("categoriaId", event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-white/70">Precio venta</span>
            <input
              value={form.precioVenta}
              onChange={(event) => actualizarCampo("precioVenta", event.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="8500"
            />
          </label>

          <label className="block">
            <span className="text-sm text-white/70">Costo compra</span>
            <input
              value={form.costoCompra}
              onChange={(event) => actualizarCampo("costoCompra", event.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="5200"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-white/70">Stock actual</span>
            <input
              value={form.stockActual}
              onChange={(event) => actualizarCampo("stockActual", event.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="12"
            />
          </label>

          <label className="block">
            <span className="text-sm text-white/70">Stock objetivo</span>
            <input
              value={form.stockObjetivo}
              onChange={(event) => actualizarCampo("stockObjetivo", event.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="50"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-white/70">Marca</span>
            <input
              value={form.marca}
              onChange={(event) => actualizarCampo("marca", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="Opcional"
            />
          </label>

          <label className="block">
            <span className="text-sm text-white/70">Presentación</span>
            <input
              value={form.presentacion}
              onChange={(event) => actualizarCampo("presentacion", event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
              placeholder="750 ml"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-white/70">Observaciones</span>
          <textarea
            value={form.observaciones}
            onChange={(event) => actualizarCampo("observaciones", event.target.value)}
            className="mt-1 min-h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
            placeholder="Opcional"
          />
        </label>

        {mensaje && <p className="text-sm text-white/65">{mensaje}</p>}

        <button
          type="submit"
          disabled={guardando || categorias.length === 0}
          className="w-full rounded-3xl bg-mora-principal px-5 py-4 font-semibold text-white disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar producto"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Productos cargados</h2>

        {cargando && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Cargando productos...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-mora-error/40 bg-white/[0.04] p-4 text-sm text-white/65">
            {error}
          </div>
        )}

        {!cargando && productos.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
            Todavía no hay productos cargados.
          </div>
        )}

        {productos.map((producto) => (
          <article
            key={producto.id}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">{producto.nombre}</h3>
                <p className="mt-1 text-sm text-white/55">
                  {[producto.marca, producto.presentacion].filter(Boolean).join(" · ") ||
                    "Sin marca o presentación"}
                </p>
              </div>

              <EstadoStockBadge
                stockActual={producto.stockActual}
                stockObjetivo={producto.stockObjetivo}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-black/15 p-3">
                <p className="text-white/45">Categoría</p>
                <p className="mt-1 font-medium text-white">
                  {categoriasPorId.get(producto.categoriaId) ?? "Sin categoría"}
                </p>
              </div>

              <div className="rounded-2xl bg-black/15 p-3">
                <p className="text-white/45">Precio</p>
                <p className="mt-1 font-medium text-white">
                  ${producto.precioVenta.toLocaleString("es-AR")}
                </p>
              </div>

              <div className="rounded-2xl bg-black/15 p-3">
                <p className="text-white/45">Stock actual</p>
                <p className="mt-1 font-medium text-white">{producto.stockActual}</p>
              </div>

              <div className="rounded-2xl bg-black/15 p-3">
                <p className="text-white/45">Stock objetivo</p>
                <p className="mt-1 font-medium text-white">{producto.stockObjetivo}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}