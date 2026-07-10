import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button, Input, Notice, Panel, Select, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { actualizarProducto, crearProducto, obtenerProducto } from "../../db";
import type { Producto } from "../../domain/productos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { productoFormSchema } from "../../schemas";

const formInicial = { nombre: "", categoriaId: "", precioVenta: "", costoCompra: "", marca: "", presentacion: "", stockActual: "", stockObjetivo: "", observaciones: "" };

export function ProductoFormPage() {
  const { productoId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const { configuracion } = useConfiguracionLocal();
  const { categoriasActivas, cargando: cargandoCategorias } = useProductos(false);
  const [productoOriginal, setProductoOriginal] = useState<Producto | null>(null);
  const [form, setForm] = useState(formInicial);
  const [cargando, setCargando] = useState(Boolean(productoId));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esEdicion = Boolean(productoId);
  const esConsulta = configuracion?.deviceRole === "consulta";

  useEffect(() => {
    if (!productoId) return;
    void obtenerProducto(productoId).then((producto) => {
      if (!producto) {
        setError("No encontramos ese producto.");
      } else {
        setProductoOriginal(producto);
        setForm({ nombre: producto.nombre, categoriaId: producto.categoriaId, precioVenta: String(producto.precioVenta), costoCompra: String(producto.costoCompra), marca: producto.marca ?? "", presentacion: producto.presentacion ?? "", stockActual: String(producto.stockActual), stockObjetivo: String(producto.stockObjetivo), observaciones: producto.observaciones ?? "" });
      }
      setCargando(false);
    }).catch(() => { setError("No se pudo cargar el producto."); setCargando(false); });
  }, [productoId]);

  useEffect(() => {
    if (!form.categoriaId && categoriasActivas[0]) setForm((actual) => ({ ...actual, categoriaId: categoriasActivas[0].id }));
  }, [categoriasActivas, form.categoriaId]);

  function cambiar(campo: keyof typeof form, valor: string) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta) return;
    setError(null);
    const resultado = productoFormSchema.safeParse(form);
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? "Revisá los datos.");
      return;
    }
    if (productoOriginal && productoOriginal.stockActual !== resultado.data.stockActual) {
      const confirmado = await confirm({ title: "Cambiar stock manualmente", description: "Este cambio actualiza el stock, pero no crea un movimiento histórico. Usalo solo para corregir una diferencia real.", confirmLabel: "Guardar cambio" });
      if (!confirmado) return;
    }
    try {
      setGuardando(true);
      if (productoId) {
        await actualizarProducto(productoId, resultado.data);
        toast.success("Producto actualizado");
        navigate(`/productos/${productoId}`, { replace: true });
      } else {
        const nuevoId = await crearProducto(resultado.data);
        toast.success("Producto guardado");
        navigate(`/productos/${nuevoId}`, { replace: true });
      }
    } catch {
      setError("No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5">
      <TaskHeader title={esEdicion ? "Editar producto" : "Agregar producto"} backLabel="Productos" onBack={() => navigate(productoId ? `/productos/${productoId}` : "/productos")} />
      {cargando && <Notice>Cargando producto...</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      {esConsulta && <Notice tone="warning">Este dispositivo está en modo consulta.</Notice>}
      {!cargando && !error?.startsWith("No encontramos") && (
        <form onSubmit={(event) => void guardar(event)} className="space-y-4">
          <Panel className="space-y-4">
            <label className="block"><span className="text-sm text-white/70">Nombre</span><Input value={form.nombre} onChange={(event) => cambiar("nombre", event.target.value)} placeholder="Ej: Vino Malbec" /></label>
            <label className="block"><span className="text-sm text-white/70">Categoría</span><Select value={form.categoriaId} onChange={(event) => cambiar("categoriaId", event.target.value)} disabled={cargandoCategorias}>{categoriasActivas.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</Select></label>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="text-sm text-white/70">Precio venta</span><Input value={form.precioVenta} inputMode="numeric" onChange={(event) => cambiar("precioVenta", event.target.value)} /></label>
              <label><span className="text-sm text-white/70">Costo compra</span><Input value={form.costoCompra} inputMode="numeric" onChange={(event) => cambiar("costoCompra", event.target.value)} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="text-sm text-white/70">Stock actual</span><Input value={form.stockActual} inputMode="numeric" onChange={(event) => cambiar("stockActual", event.target.value)} /></label>
              <label><span className="text-sm text-white/70">Stock objetivo</span><Input value={form.stockObjetivo} inputMode="numeric" onChange={(event) => cambiar("stockObjetivo", event.target.value)} /></label>
            </div>
            {esEdicion && <Notice tone="warning">Cambiar el stock actual desde acá no crea un movimiento histórico.</Notice>}
            <div className="grid grid-cols-2 gap-3">
              <label><span className="text-sm text-white/70">Marca</span><Input value={form.marca} onChange={(event) => cambiar("marca", event.target.value)} placeholder="Opcional" /></label>
              <label><span className="text-sm text-white/70">Presentación</span><Input value={form.presentacion} onChange={(event) => cambiar("presentacion", event.target.value)} placeholder="750 ml" /></label>
            </div>
            <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={form.observaciones} onChange={(event) => cambiar("observaciones", event.target.value)} placeholder="Opcional" /></label>
          </Panel>
          <Button type="submit" size="lg" fullWidth disabled={guardando || esConsulta || categoriasActivas.length === 0}>{guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar producto"}</Button>
        </form>
      )}
    </section>
  );
}
