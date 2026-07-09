import { type FormEvent, useEffect, useMemo, useState } from "react";

import { CategoriasCard } from "../../components/CategoriasCard";
import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import {
  activarProducto,
  actualizarProducto,
  crearProducto,
  desactivarProducto,
  eliminarProducto,
} from "../../db";
import type { Producto } from "../../domain/productos";
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

function crearFormDesdeProducto(producto: Producto) {
  return {
    nombre: producto.nombre,
    categoriaId: producto.categoriaId,
    precioVenta: String(producto.precioVenta),
    costoCompra: String(producto.costoCompra),
    marca: producto.marca ?? "",
    presentacion: producto.presentacion ?? "",
    stockActual: String(producto.stockActual),
    stockObjetivo: String(producto.stockObjetivo),
    observaciones: producto.observaciones ?? "",
  };
}

export function ProductosPage() {
  const [verInactivos, setVerInactivos] = useState(false);
  const {
    productos,
    categorias,
    categoriasActivas,
    cargando,
    error,
    recargar,
  } = useProductos(verInactivos);

  const [form, setForm] = useState(formInicial);
  const [productoEditandoId, setProductoEditandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const productoEditando = productos.find(
    (producto) => producto.id === productoEditandoId,
  );

  const categoriasPorId = useMemo(() => {
    return new Map(categorias.map((categoria) => [categoria.id, categoria.nombre]));
  }, [categorias]);

  useEffect(() => {
    if (!form.categoriaId && categoriasActivas[0]) {
      setForm((actual) => ({
        ...actual,
        categoriaId: categoriasActivas[0].id,
      }));
    }
  }, [categoriasActivas, form.categoriaId]);

  function actualizarCampo(campo: keyof typeof form, valor: string) {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function limpiarFormulario() {
    setProductoEditandoId(null);
    setForm({
      ...formInicial,
      categoriaId: categoriasActivas[0]?.id ?? "",
    });
  }

  function iniciarEdicion(producto: Producto) {
    setMensaje(null);
    setProductoEditandoId(producto.id);
    setForm(crearFormDesdeProducto(producto));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

      if (productoEditandoId) {
        await actualizarProducto(productoEditandoId, resultado.data);
        setMensaje("Producto actualizado correctamente.");
      } else {
        await crearProducto(resultado.data);
        setMensaje("Producto guardado correctamente.");
      }

      await recargar();
      limpiarFormulario();
    } catch {
      setMensaje("No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  async function manejarDesactivar(producto: Producto) {
    const confirmar = window.confirm(`¿Desactivar "${producto.nombre}"?`);

    if (!confirmar) return;

    await desactivarProducto(producto.id);
    await recargar();
    setMensaje("Producto desactivado.");
  }

  async function manejarActivar(producto: Producto) {
    await activarProducto(producto.id);
    await recargar();
    setMensaje("Producto activado correctamente.");
  }

  async function manejarEliminar(producto: Producto) {
    const confirmar = window.confirm(
      `¿Eliminar "${producto.nombre}"? Si tiene historial, se va a desactivar para conservar los reportes.`,
    );

    if (!confirmar) return;

    const resultado = await eliminarProducto(producto.id);
    await recargar();

    if (resultado.eliminado) {
      setMensaje("Producto eliminado correctamente.");
    }

    if (resultado.desactivado) {
      setMensaje("El producto tenía historial, por eso se desactivó.");
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

      <CategoriasCard onCategoriasChange={() => void recargar()} />

      <form
        onSubmit={(event) => void manejarSubmit(event)}
        className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
      >
        <div>
          <p className="text-sm font-semibold text-white">
            {productoEditandoId ? "Editar producto" : "Agregar producto"}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/50">
            El costo queda guardado para calcular ganancia estimada, pero no se muestra como dato principal.
          </p>

          {productoEditando && productoEditando.estado === "inactivo" && (
            <p className="mt-2 rounded-2xl border border-mora-advertencia/30 bg-mora-advertencia/10 px-3 py-2 text-xs text-yellow-100">
              Estás editando un producto inactivo.
            </p>
          )}
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
            {categoriasActivas.map((categoria) => (
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

        <div className="grid gap-3">
          <button
            type="submit"
            disabled={guardando || categoriasActivas.length === 0}
            className="w-full rounded-3xl bg-mora-principal px-5 py-4 font-semibold text-white disabled:opacity-60"
          >
            {guardando
              ? "Guardando..."
              : productoEditandoId
                ? "Guardar cambios"
                : "Guardar producto"}
          </button>

          {productoEditandoId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 font-semibold text-white"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Productos cargados</h2>

          <label className="flex items-center gap-2 text-xs text-white/65">
            <input
              type="checkbox"
              checked={verInactivos}
              onChange={(event) => setVerInactivos(event.target.checked)}
              className="accent-mora-principal"
            />
            Ver inactivos
          </label>
        </div>

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
            className={[
              "rounded-3xl border p-4",
              producto.estado === "activo"
                ? "border-white/10 bg-white/[0.04]"
                : "border-white/5 bg-white/[0.02] opacity-75",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white">{producto.nombre}</h3>

                  {producto.estado === "inactivo" && (
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/45">
                      Inactivo
                    </span>
                  )}
                </div>

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

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => iniciarEdicion(producto)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
              >
                Editar
              </button>

              {producto.estado === "activo" ? (
                <button
                  type="button"
                  onClick={() => void manejarDesactivar(producto)}
                  className="rounded-2xl border border-mora-advertencia/30 bg-mora-advertencia/10 px-4 py-3 text-sm font-semibold text-yellow-100"
                >
                  Desactivar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void manejarActivar(producto)}
                  className="rounded-2xl border border-mora-exito/30 bg-mora-exito/10 px-4 py-3 text-sm font-semibold text-green-100"
                >
                  Activar
                </button>
              )}

              <button
                type="button"
                onClick={() => void manejarEliminar(producto)}
                className="rounded-2xl border border-mora-error/30 bg-mora-error/10 px-4 py-3 text-sm font-semibold text-red-100"
              >
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}