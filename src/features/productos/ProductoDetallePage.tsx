import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EstadoStockBadge } from "../../components/EstadoStockBadge";
import { Button, ButtonLink, Notice, Panel, TaskHeader, useConfirm, useToast } from "../../components/ui";
import { activarProducto, desactivarProducto, eliminarProducto, obtenerProducto } from "../../db";
import type { Producto } from "../../domain/productos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";

export function ProductoDetallePage() {
  const { productoId = "" } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion } = useConfiguracionLocal();
  const { categorias } = useProductos(true);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const esConsulta = configuracion?.deviceRole === "consulta";

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const resultado = await obtenerProducto(productoId);
      setProducto(resultado ?? null);
      setError(resultado ? null : "No encontramos ese producto.");
    } catch { setError("No se pudo cargar el producto."); }
    finally { setCargando(false); }
  }, [productoId]);
  useEffect(() => void cargar(), [cargar]);

  async function cambiarEstado() {
    if (!producto) return;
    if (producto.estado === "activo") {
      const confirmado = await confirm({ title: `Desactivar “${producto.nombre}”`, description: "Dejará de aparecer en nuevas ventas.", confirmLabel: "Desactivar", tone: "danger" });
      if (!confirmado) return;
      await desactivarProducto(producto.id);
      toast.success("Producto desactivado");
    } else {
      await activarProducto(producto.id);
      toast.success("Producto activado");
    }
    await cargar();
  }

  async function eliminar() {
    if (!producto) return;
    const confirmado = await confirm({ title: `Eliminar “${producto.nombre}”`, description: "Si tiene historial, se desactivará para conservar la trazabilidad.", confirmLabel: "Continuar", tone: "danger" });
    if (!confirmado) return;
    const resultado = await eliminarProducto(producto.id);
    if (resultado.eliminado) {
      toast.success("Producto eliminado");
      navigate("/productos", { replace: true });
    } else {
      toast.success("Producto desactivado", "Tenía historial y se conservó.");
      await cargar();
    }
  }

  return (
    <section className="space-y-5">
      <TaskHeader title="Detalle del producto" backLabel="Productos" onBack={() => navigate("/productos")} />
      {cargando && <Notice>Cargando producto...</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      {producto && (
        <>
          <Panel className="space-y-4">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{producto.nombre}</h2><p className="mt-1 text-sm text-white/55">{[producto.marca, producto.presentacion].filter(Boolean).join(" · ") || "Sin marca o presentación"}</p></div><EstadoStockBadge stockActual={producto.stockActual} stockObjetivo={producto.stockObjetivo} /></div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-black/15 p-3"><dt className="text-white/45">Precio</dt><dd className="mt-1 font-semibold">${producto.precioVenta.toLocaleString("es-AR")}</dd></div>
              <div className="rounded-2xl bg-black/15 p-3"><dt className="text-white/45">Costo</dt><dd className="mt-1 font-semibold">${producto.costoCompra.toLocaleString("es-AR")}</dd></div>
              <div className="rounded-2xl bg-black/15 p-3"><dt className="text-white/45">Stock actual</dt><dd className="mt-1 font-semibold">{producto.stockActual}</dd></div>
              <div className="rounded-2xl bg-black/15 p-3"><dt className="text-white/45">Objetivo</dt><dd className="mt-1 font-semibold">{producto.stockObjetivo}</dd></div>
              <div className="col-span-2 rounded-2xl bg-black/15 p-3"><dt className="text-white/45">Categoría</dt><dd className="mt-1 font-semibold">{categorias.find((categoria) => categoria.id === producto.categoriaId)?.nombre ?? "Sin categoría"}</dd></div>
            </dl>
            {producto.observaciones && <p className="text-sm leading-6 text-white/65">{producto.observaciones}</p>}
            {producto.estado === "inactivo" && <Notice tone="warning">Este producto está inactivo.</Notice>}
          </Panel>
          {!esConsulta && (
            <Panel className="space-y-3">
              <ButtonLink to={`/productos/${producto.id}/editar`} fullWidth>Editar producto</ButtonLink>
              <Button variant={producto.estado === "activo" ? "warning" : "success"} fullWidth onClick={() => void cambiarEstado()}>{producto.estado === "activo" ? "Desactivar" : "Activar"}</Button>
              <Button variant="danger" fullWidth onClick={() => void eliminar()}>Eliminar producto</Button>
            </Panel>
          )}
        </>
      )}
    </section>
  );
}
