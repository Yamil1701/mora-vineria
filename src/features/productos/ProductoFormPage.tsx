import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button, DelayedFallback, Input, Notice, Panel, Select, Skeleton, TaskHeader, Textarea, useConfirm, useToast } from "../../components/ui";
import { actualizarProducto, crearProducto, obtenerProducto } from "../../db";
import type { Producto } from "../../domain/productos";
import { useConfiguracionLocal } from "../../hooks/useConfiguracionLocal";
import { useProductos } from "../../hooks/useProductos";
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges";
import { productoFormSchema } from "../../schemas";

const formInicial = { nombre: "", categoriaId: "", precioVenta: "", costoCompra: "", marca: "", presentacion: "", stockActual: "", stockObjetivo: "", observaciones: "" };
const ErrorCampo = ({ mensaje }: { mensaje?: string }) => mensaje ? <span role="alert" className="mt-1 block text-xs text-red-200">{mensaje}</span> : null;

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
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const envioEnCursoRef = useRef(false);
  const esEdicion = Boolean(productoId);
  const esConsulta = configuracion?.deviceRole === "consulta";
  const { permitirSiguienteNavegacion } = useUnsavedChanges(dirty);

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
    setDirty(true);
    setErroresCampo((actual) => { const siguiente = { ...actual }; delete siguiente[campo]; return siguiente; });
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (esConsulta || envioEnCursoRef.current) return;
    setError(null);
    setErroresCampo({});
    const resultado = productoFormSchema.safeParse(form);
    if (!resultado.success) {
      const siguientes = Object.fromEntries(resultado.error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
      setErroresCampo(siguientes);
      const primerCampo = String(resultado.error.issues[0]?.path[0] ?? "");
      formRef.current?.querySelector<HTMLElement>(`[name="${primerCampo}"]`)?.focus();
      return;
    }
    envioEnCursoRef.current = true;
    try {
      if (productoOriginal && productoOriginal.stockActual !== resultado.data.stockActual) {
        const confirmado = await confirm({ title: "Cambiar stock manualmente", description: "Este cambio actualiza el stock, pero no crea un movimiento histórico. Usalo solo para corregir una diferencia real.", confirmLabel: "Guardar cambio" });
        if (!confirmado) return;
      }
      setGuardando(true);
      if (productoId) {
        const productoActual = await obtenerProducto(productoId);
        if (!productoActual || productoActual.updatedAt !== productoOriginal?.updatedAt) {
          setError("Este producto cambió mientras lo editabas. Volvé al detalle y revisá los datos antes de intentarlo nuevamente.");
          return;
        }
        await actualizarProducto(productoId, resultado.data);
        permitirSiguienteNavegacion();
        setDirty(false);
        toast.success("Producto actualizado");
        navigate(`/productos/${productoId}`, { replace: true });
      } else {
        const nuevoId = await crearProducto(resultado.data);
        permitirSiguienteNavegacion();
        setDirty(false);
        toast.success("Producto guardado");
        navigate(`/productos/${nuevoId}`, { replace: true });
      }
    } catch {
      setError("No se pudo guardar el producto.");
    } finally {
      envioEnCursoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <section className="space-y-5">
      <TaskHeader title={esEdicion ? "Editar producto" : "Agregar producto"} backLabel="Productos" onBack={() => navigate(productoId ? `/productos/${productoId}` : "/productos")} />
      {cargando && <DelayedFallback><div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-40" /><Skeleton className="h-12" /></div></DelayedFallback>}
      {error && <Notice tone="danger">{error}</Notice>}
      {esConsulta && <Notice tone="warning">Este dispositivo está en modo consulta.</Notice>}
      {!cargando && !error?.startsWith("No encontramos") && (
        <form ref={formRef} onSubmit={(event) => void guardar(event)} className="space-y-4" aria-busy={guardando}>
          <Panel className="space-y-4">
            <label className="block"><span className="text-sm text-white/70">Nombre</span><Input name="nombre" value={form.nombre} onChange={(event) => cambiar("nombre", event.target.value)} placeholder="Ej: Vino Malbec" /><ErrorCampo mensaje={erroresCampo.nombre} /></label>
            <label className="block"><span className="text-sm text-white/70">Categoría</span><Select name="categoriaId" value={form.categoriaId} onChange={(event) => cambiar("categoriaId", event.target.value)} disabled={cargandoCategorias}>{categoriasActivas.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}</Select><ErrorCampo mensaje={erroresCampo.categoriaId} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="text-sm text-white/70">Precio venta</span><Input name="precioVenta" value={form.precioVenta} inputMode="numeric" onChange={(event) => cambiar("precioVenta", event.target.value)} /><ErrorCampo mensaje={erroresCampo.precioVenta} /></label>
              <label><span className="text-sm text-white/70">Costo compra</span><Input name="costoCompra" value={form.costoCompra} inputMode="numeric" onChange={(event) => cambiar("costoCompra", event.target.value)} /><ErrorCampo mensaje={erroresCampo.costoCompra} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="text-sm text-white/70">Stock actual</span><Input name="stockActual" value={form.stockActual} inputMode="numeric" onChange={(event) => cambiar("stockActual", event.target.value)} /><ErrorCampo mensaje={erroresCampo.stockActual} /></label>
              <label><span className="text-sm text-white/70">Stock objetivo</span><Input name="stockObjetivo" value={form.stockObjetivo} inputMode="numeric" onChange={(event) => cambiar("stockObjetivo", event.target.value)} /><ErrorCampo mensaje={erroresCampo.stockObjetivo} /></label>
            </div>
            {esEdicion && <Notice tone="warning">Cambiar el stock actual desde acá no crea un movimiento histórico.</Notice>}
            <div className="grid grid-cols-2 gap-3">
              <label><span className="text-sm text-white/70">Marca</span><Input value={form.marca} onChange={(event) => cambiar("marca", event.target.value)} placeholder="Opcional" /></label>
              <label><span className="text-sm text-white/70">Presentación</span><Input value={form.presentacion} onChange={(event) => cambiar("presentacion", event.target.value)} placeholder="750 ml" /></label>
            </div>
            <label className="block"><span className="text-sm text-white/70">Observaciones</span><Textarea value={form.observaciones} onChange={(event) => cambiar("observaciones", event.target.value)} placeholder="Opcional" /></label>
          </Panel>
          <Button type="submit" size="lg" fullWidth className="sticky bottom-2 z-10" disabled={guardando || esConsulta || categoriasActivas.length === 0}>{guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar producto"}</Button>
        </form>
      )}
    </section>
  );
}
