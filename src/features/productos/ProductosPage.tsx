import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import { Button, ButtonLink, DelayedFallback, EmptyState, Input, ListSkeleton, Notice, Page, PageHeader, Skeleton } from "../../components/ui";
import { calcularEstadoStock } from "../../domain/productos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { usePreferenciasUi } from "../../stores/preferenciasUi";

export function ProductosPage() {
  const location = useLocation();
  useRestaurarScroll("productos");
  const { configuracion } = useConfiguracionLocal();
  const [verInactivos, setVerInactivos] = useState(false);
  const [soloStockBajo, setSoloStockBajo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const { productos, categorias, cargando, error } = useProductos(verInactivos);
  const vista = usePreferenciasUi((state) => state.vistaProductos);
  const cambiarVista = usePreferenciasUi((state) => state.cambiarVistaProductos);
  const [vistaPendiente, setVistaPendiente] = useState<typeof vista | null>(null);
  const esConsulta = configuracion?.deviceRole === "consulta";
  const vistaSeleccionada = vistaPendiente ?? vista;

  useEffect(() => {
    if (!vistaPendiente) return;
    const timer = window.setTimeout(() => {
      cambiarVista(vistaPendiente);
      setVistaPendiente(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [cambiarVista, vistaPendiente]);

  function solicitarVista(nuevaVista: typeof vista) {
    if (nuevaVista !== vista && !vistaPendiente) setVistaPendiente(nuevaVista);
  }

  const categoriasPorId = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria.nombre])),
    [categorias],
  );
  const productosVisibles = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-AR");
    return productos.filter((producto) => {
      const coincide = !texto || [producto.nombre, producto.marca, producto.presentacion, categoriasPorId.get(producto.categoriaId)]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es-AR")
        .includes(texto);
      const estadoStock = calcularEstadoStock(producto.stockActual, producto.stockObjetivo);
      return coincide && (!soloStockBajo || estadoStock !== "disponible");
    });
  }, [busqueda, categoriasPorId, productos, soloStockBajo]);

  return (
    <Page>
      <PageHeader
        title="Productos"
        description="Consultá precios y stock. Abrí un producto para administrarlo."
        action={!esConsulta ? (
          <div className="grid grid-cols-2 gap-3">
            <ButtonLink to="/productos/nuevo">Agregar</ButtonLink>
            <ButtonLink to="/productos/categorias" variant="secondary">Categorías</ButtonLink>
          </div>
        ) : undefined}
      />

      <section className="sticky top-2 z-[5] space-y-3 rounded-3xl border border-white/10 bg-mora-fondo/95 p-3 shadow-card backdrop-blur">
        <label className="block">
          <span className="sr-only">Buscar productos</span>
          <Input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar producto, marca o categoría" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={soloStockBajo ? "primary" : "secondary"} size="sm" aria-pressed={soloStockBajo} onClick={() => setSoloStockBajo((actual) => !actual)}>Stock bajo</Button>
          <Button variant={verInactivos ? "primary" : "secondary"} size="sm" aria-pressed={verInactivos} onClick={() => setVerInactivos((actual) => !actual)}>Inactivos</Button>
          <div className="ml-auto flex rounded-2xl border border-white/10 p-1" aria-label="Vista del listado">
            <button type="button" className={`min-h-12 rounded-xl px-3 text-xs font-semibold ${vistaSeleccionada === "compacta" ? "bg-mora-principal text-white" : "text-white/60"}`} aria-pressed={vistaSeleccionada === "compacta"} onClick={() => solicitarVista("compacta")}>Lista</button>
            <button type="button" className={`min-h-12 rounded-xl px-3 text-xs font-semibold ${vistaSeleccionada === "cards" ? "bg-mora-principal text-white" : "text-white/60"}`} aria-pressed={vistaSeleccionada === "cards"} onClick={() => solicitarVista("cards")}>Cards</button>
          </div>
        </div>
      </section>

      {cargando && <DelayedFallback><ListSkeleton rows={4} /></DelayedFallback>}
      {error && <Notice tone="danger">{error}</Notice>}
      {!cargando && productosVisibles.length === 0 && <EmptyState title="No encontramos productos con esos filtros." description="Probá cambiar la búsqueda o los filtros." />}

      {vistaPendiente ? <div role="status" aria-label="Cambiando presentación" className={`animate-mora-view-skeleton ${vistaPendiente === "cards" ? "grid gap-3" : "space-y-1"}`}>{Array.from({ length: Math.min(productosVisibles.length || 3, 4) }, (_, index) => <Skeleton key={index} className={vistaPendiente === "cards" ? "h-28" : "h-16 rounded-none"} />)}</div> : <section key={vista} className={vista === "cards" ? "grid gap-3" : "divide-y divide-white/10 border-y border-white/10"} aria-label="Listado de productos">
        {productosVisibles.map((producto, index) => (
          <Link
            key={producto.id}
            to={`/productos/${producto.id}`}
            state={{ backgroundLocation: location }}
            style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
            className={`animate-mora-product-enter block transition-[background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99] ${vista === "cards" ? "rounded-3xl border border-white/10 bg-white/[0.045] p-4" : "min-h-14 border-transparent px-1 py-3"} ${producto.estado === "inactivo" ? "opacity-65" : ""}`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">{producto.nombre}</span>
                <span className={`${vista === "cards" ? "mt-1 block" : "hidden"} truncate text-xs text-white/50`}>
                  {categoriasPorId.get(producto.categoriaId) ?? "Sin categoría"}
                  {[producto.marca, producto.presentacion].filter(Boolean).length ? ` · ${[producto.marca, producto.presentacion].filter(Boolean).join(" · ")}` : ""}
                </span>
                <span className={`${vista === "cards" ? "mt-2" : "mt-1"} flex flex-wrap items-center gap-2`}>
                  <EstadoStockBadge stockActual={producto.stockActual} stockObjetivo={producto.stockObjetivo} />
                  <span className="text-xs text-white/55">{producto.stockActual === 1 ? "Última unidad" : `Quedan ${producto.stockActual}`}</span>
                  {producto.estado === "inactivo" && <span className="text-xs text-white/45">Inactivo</span>}
                </span>
              </span>
              <span className="shrink-0 text-right font-bold text-white">${producto.precioVenta.toLocaleString("es-AR")}</span>
            </span>
          </Link>
        ))}
      </section>}
    </Page>
  );
}
