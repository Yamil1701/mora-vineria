import { useEstadoSesion } from "../../hooks/useEstadoSesion";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import { Button, ButtonLink, DelayedFallback, EmptyState, ErrorState, Input, ListSkeleton, Page, PageHeader, Select, Skeleton } from "../../components/ui";
import { calcularEstadoStock, describirEquivalenciaEnPacks, ordenarProductos, type OrdenProductos } from "../../domain/productos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { useRestaurarScroll } from "../../hooks/useRestaurarScroll";
import { usePreferenciasUi } from "../../stores/preferenciasUi";

export function ProductosPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  useRestaurarScroll("productos");
  const { configuracion } = useConfiguracionLocal();
  const [verInactivos, setVerInactivos] = useEstadoSesion("productos:verInactivos", false);
  const [soloStockBajo, setSoloStockBajo] = useEstadoSesion("productos:soloStockBajo", false);
  const [categoriaFiltro, setCategoriaFiltro] = useEstadoSesion("productos:categoria", "todas");
  const [busqueda, setBusqueda] = useEstadoSesion("productos:busqueda", "");
  const {
    productos,
    categorias,
    unidadesVendidasPorProducto,
    cargando,
    error,
    recargar,
  } = useProductos(verInactivos);
  const vista = usePreferenciasUi((state) => state.vistaProductos);
  const cambiarVista = usePreferenciasUi((state) => state.cambiarVistaProductos);
  const orden = usePreferenciasUi((state) => state.ordenProductos);
  const cambiarOrden = usePreferenciasUi((state) => state.cambiarOrdenProductos);
  const [vistaPendiente, setVistaPendiente] = useState<typeof vista | null>(null);
  useEffect(() => {
    if (searchParams.get("stock") !== "bajo") return;
    setSoloStockBajo(true);
    setBusqueda("");
    const siguientes = new URLSearchParams(searchParams);
    siguientes.delete("stock");
    setSearchParams(siguientes, { replace: true });
  }, [searchParams, setSearchParams, setSoloStockBajo, setBusqueda]);
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
    return ordenarProductos(productos
      .filter((producto) => {
        const coincide = !texto || [producto.nombre, producto.marca, producto.presentacion, categoriasPorId.get(producto.categoriaId)]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-AR")
          .includes(texto);
        const estadoStock = calcularEstadoStock(producto.stockActual, producto.stockObjetivo);
        return coincide && (categoriaFiltro === "todas" || producto.categoriaId === categoriaFiltro) && (!soloStockBajo || estadoStock !== "disponible");
      }), orden, unidadesVendidasPorProducto);
  }, [
    busqueda,
    categoriasPorId,
    categoriaFiltro,
    orden,
    productos,
    soloStockBajo,
    unidadesVendidasPorProducto,
  ]);

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

      <section className="sticky top-0 z-[5] space-y-3 border-b border-white/10 bg-mora-fondo py-3">
        <label className="block">
          <span className="sr-only">Buscar productos</span>
          <Input type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar producto, marca o categoría" />
        </label>
        <label className="block"><span className="sr-only">Filtrar por categoría</span><Select value={categoriaFiltro} onChange={(event) => setCategoriaFiltro(event.target.value)}><option value="todas">Todas las categorías</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</Select></label>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={soloStockBajo ? "primary" : "secondary"} size="sm" aria-pressed={soloStockBajo} onClick={() => setSoloStockBajo((actual) => !actual)}>Stock bajo</Button>
          <Button variant={verInactivos ? "primary" : "secondary"} size="sm" aria-pressed={verInactivos} onClick={() => setVerInactivos((actual) => !actual)}>Inactivos</Button>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Ordenar productos</span>
            <Select value={orden} onChange={(event) => cambiarOrden(event.target.value as OrdenProductos)} className="!min-h-12">
              <option value="mas_vendidos">Más vendidos</option>
              <option value="stock_urgente">Stock urgente</option>
              <option value="nombre">Nombre</option>
            </Select>
          </label>
          <div className="ml-auto flex rounded-2xl border border-white/10 p-1" aria-label="Vista del listado">
            <button type="button" className={`min-h-12 rounded-xl px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave ${vistaSeleccionada === "compacta" ? "bg-mora-principal text-white" : "text-white/60 hover:bg-white/[0.08]"}`} aria-pressed={vistaSeleccionada === "compacta"} onClick={() => solicitarVista("compacta")}>Lista</button>
            <button type="button" className={`min-h-12 rounded-xl px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave ${vistaSeleccionada === "cards" ? "bg-mora-principal text-white" : "text-white/60 hover:bg-white/[0.08]"}`} aria-pressed={vistaSeleccionada === "cards"} onClick={() => solicitarVista("cards")}>Tarjetas</button>
          </div>
        </div>
      </section>

      {cargando && <DelayedFallback><ListSkeleton rows={4} /></DelayedFallback>}
      {error && <ErrorState message={error} onRetry={() => void recargar()} />}
      {!cargando && productosVisibles.length === 0 && <EmptyState title={productos.length ? "No encontramos productos con esos filtros." : "Todavía no hay productos."} description={productos.length ? "Probá cambiar la búsqueda o los filtros." : "Cargá el primero para empezar a vender y controlar stock."} action={productos.length ? <Button variant="secondary" onClick={() => { setBusqueda(""); setSoloStockBajo(false); setCategoriaFiltro("todas"); setVerInactivos(false); }}>Limpiar filtros</Button> : !esConsulta ? <ButtonLink to="/productos/nuevo">Agregar primer producto</ButtonLink> : undefined} />}

      {!cargando && <p role="status" className="text-sm text-white/65">{productosVisibles.length} producto{productosVisibles.length === 1 ? "" : "s"}{busqueda || soloStockBajo ? " con estos filtros" : " en el catálogo"}</p>}
      {vistaPendiente ? <div role="status" aria-label="Cambiando presentación" className={`animate-mora-view-skeleton ${vistaPendiente === "cards" ? "grid gap-3" : "space-y-1"}`}>{Array.from({ length: Math.min(productosVisibles.length || 3, 4) }, (_, index) => <Skeleton key={index} className={vistaPendiente === "cards" ? "h-28" : "h-16 rounded-none"} />)}</div> : <section key={vista} className={vista === "cards" ? "grid gap-3 sm:grid-cols-2" : "divide-y divide-white/10 border-y border-white/10"} aria-label="Listado de productos">
        {productosVisibles.map((producto, index) => (
          <Link
            key={producto.id}
            to={`/productos/${producto.id}`}
            state={{ backgroundLocation: location }}
            style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
            className={`animate-mora-product-enter block transition-[background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave active:scale-[0.99] ${vista === "cards" ? "rounded-2xl border border-white/10 bg-white/[0.045] p-4" : "min-h-14 border-transparent px-1 py-3"} ${producto.estado === "inactivo" ? "opacity-65" : ""}`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block break-words font-semibold text-white">{producto.nombre}</span>
                <span className={`${vista === "cards" ? "mt-1 block" : "hidden"} truncate text-xs text-white/65`}>
                  {categoriasPorId.get(producto.categoriaId) ?? "Sin categoría"}
                  {[producto.marca, producto.presentacion].filter(Boolean).length ? ` · ${[producto.marca, producto.presentacion].filter(Boolean).join(" · ")}` : ""}
                </span>
                <span className={`${vista === "cards" ? "mt-2" : "mt-1"} flex flex-wrap items-center gap-2`}>
                  <EstadoStockBadge stockActual={producto.stockActual} stockObjetivo={producto.stockObjetivo} />
                  <span className="text-xs text-white/65">Quedan {producto.stockActual} de {producto.stockObjetivo}</span>
                  <span className="text-xs text-white/65">
                    {unidadesVendidasPorProducto[producto.id] ?? 0} {(unidadesVendidasPorProducto[producto.id] ?? 0) === 1 ? "vendido" : "vendidos"}
                  </span>
                  {vista === "cards" && describirEquivalenciaEnPacks(producto) && (
                    <span className="text-xs text-white/65">{describirEquivalenciaEnPacks(producto)}</span>
                  )}
                  {vista === "cards" && <span className="mora-stock-track mt-1 w-full" aria-hidden="true"><span style={{width: `${Math.min(100, producto.stockActual / Math.max(1, producto.stockObjetivo) * 100)}%`}} /></span>}
                  {producto.estado === "inactivo" && <span className="text-xs text-white/65">Inactivo</span>}
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
