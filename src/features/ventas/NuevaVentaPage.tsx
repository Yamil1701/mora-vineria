export function NuevaVentaPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Nueva venta</h1>
        <p className="mt-1 text-sm text-white/65">
          Buscá productos, armá el carrito y confirmá la venta.
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <label className="text-sm font-medium text-white/80" htmlFor="buscar-producto">
          Buscar producto
        </label>
        <input
          id="buscar-producto"
          type="search"
          placeholder="Nombre, marca o categoría"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-mora-principal"
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65">
        El carrito se va a implementar cuando conectemos productos y stock.
      </div>
    </section>
  );
}