export function ProductosPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Productos</h1>
        <p className="mt-1 text-sm text-white/65">
          Administrá precios, stock y estado de productos.
        </p>
      </header>

      <button className="w-full rounded-3xl bg-mora-principal px-5 py-4 font-semibold text-white">
        Agregar producto
      </button>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
        Todavía no hay productos cargados.
      </div>
    </section>
  );
}