import { type FormEvent, useMemo, useRef, useState } from "react";

import {
  activarCategoria,
  actualizarCategoria,
  crearCategoria,
  desactivarCategoria,
  eliminarCategoria,
} from "../db";
import { calcularValorVentaStock, type Categoria } from "../domain/productos";
import { useCategorias } from "../hooks/useCategorias";
import { useProductos } from "../hooks/useProductos";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { categoriaFormSchema } from "../schemas";
import {
  BottomSheet,
  Button,
  EmptyState,
  Input,
  Notice,
  useConfirm,
  useToast,
} from "./ui";

interface CategoriasCardProps {
  onCategoriasChange?: () => void;
  soloConsulta?: boolean;
}

export function CategoriasCard({
  onCategoriasChange,
  soloConsulta = false,
}: CategoriasCardProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [verInactivas, setVerInactivas] = useState(false);
  const { categorias, cargando, error, recargar } = useCategorias(verInactivas);
  const { productos } = useProductos(true);
  const [seleccionada, setSeleccionada] = useState<Categoria | null>(null);
  const [modo, setModo] = useState<"detalle" | "crear" | "editar">("detalle");
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const envioEnCursoRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const { confirmarSalida } = useUnsavedChanges(dirty);

  const resumenPorCategoria = useMemo(() => {
    const resumen = new Map<string, { productos: number; unidades: number; valor: number }>();
    for (const producto of productos) {
      const actual = resumen.get(producto.categoriaId) ?? {
        productos: 0,
        unidades: 0,
        valor: 0,
      };
      actual.productos += 1;
      actual.unidades += producto.stockActual;
      actual.valor += calcularValorVentaStock(producto);
      resumen.set(producto.categoriaId, actual);
    }
    return resumen;
  }, [productos]);

  const productosSeleccionados = useMemo(
    () => seleccionada
      ? productos
          .filter((producto) => producto.categoriaId === seleccionada.id)
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"))
      : [],
    [productos, seleccionada],
  );

  const resumenSeleccionado = seleccionada
    ? resumenPorCategoria.get(seleccionada.id) ?? { productos: 0, unidades: 0, valor: 0 }
    : { productos: 0, unidades: 0, valor: 0 };

  async function recargarTodo() {
    await recargar();
    onCategoriasChange?.();
  }

  function nueva() {
    setNombre("");
    setDirty(false);
    setErrorNombre(null);
    setModo("crear");
    setSeleccionada(null);
  }

  function abrir(categoria: Categoria) {
    setSeleccionada(categoria);
    setNombre(categoria.nombre);
    setModo("detalle");
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (envioEnCursoRef.current) return;
    const resultado = categoriaFormSchema.safeParse({ nombre });
    if (!resultado.success) {
      setErrorNombre(resultado.error.issues[0]?.message ?? "Revisá el nombre.");
      return;
    }

    envioEnCursoRef.current = true;
    try {
      setGuardando(true);
      if (modo === "editar" && seleccionada) {
        await actualizarCategoria(seleccionada.id, resultado.data);
        toast.success("Categoría actualizada");
      } else {
        await crearCategoria(resultado.data);
        toast.success("Categoría guardada");
      }
      setDirty(false);
      setSeleccionada(null);
      setModo("detalle");
      await recargarTodo();
    } catch (errorDesconocido) {
      toast.error(
        "No se pudo guardar",
        errorDesconocido instanceof Error ? errorDesconocido.message : undefined,
      );
    } finally {
      envioEnCursoRef.current = false;
      setGuardando(false);
    }
  }

  async function cambiarEstado() {
    if (!seleccionada) return;
    if (seleccionada.activa) {
      const confirmado = await confirm({
        title: `Desactivar “${seleccionada.nombre}”`,
        description: "No aparecerá al cargar productos nuevos.",
        confirmLabel: "Desactivar",
        tone: "danger",
      });
      if (!confirmado) return;
      await desactivarCategoria(seleccionada.id);
      toast.success("Categoría desactivada");
    } else {
      await activarCategoria(seleccionada.id);
      toast.success("Categoría activada");
    }
    setSeleccionada(null);
    await recargarTodo();
  }

  async function eliminar() {
    if (!seleccionada) return;
    const confirmado = await confirm({
      title: `Eliminar “${seleccionada.nombre}”`,
      description: "Si tiene productos asociados, se desactivará para conservar los datos.",
      confirmLabel: "Continuar",
      tone: "danger",
    });
    if (!confirmado) return;
    const resultado = await eliminarCategoria(seleccionada.id);
    toast.success(
      resultado.eliminada ? "Categoría eliminada" : "Categoría desactivada",
      resultado.desactivada ? "Tenía productos asociados." : undefined,
    );
    setSeleccionada(null);
    await recargarTodo();
  }

  const abierta = Boolean(seleccionada) || modo === "crear";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          variant={verInactivas ? "primary" : "secondary"}
          aria-pressed={verInactivas}
          onClick={() => setVerInactivas((actual) => !actual)}
        >
          Inactivas
        </Button>
        {!soloConsulta && <Button onClick={nueva}>Agregar categoría</Button>}
      </div>

      {cargando && <Notice>Cargando categorías...</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      {!cargando && !categorias.length && <EmptyState title="Todavía no hay categorías." />}

      <div className="divide-y divide-white/10 border-y border-white/10">
        {categorias.map((categoria) => {
          const resumen = resumenPorCategoria.get(categoria.id) ?? {
            productos: 0,
            unidades: 0,
            valor: 0,
          };
          return (
            <button
              key={categoria.id}
              type="button"
              onClick={() => abrir(categoria)}
              className="flex min-h-20 w-full items-center justify-between gap-3 px-1 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave"
            >
              <span className="min-w-0">
                <span className="font-semibold">{categoria.nombre}</span>
                <span className="mt-1 block text-xs text-white/45">
                  {resumen.productos} producto{resumen.productos === 1 ? "" : "s"} · {resumen.unidades} unidades
                  {!categoria.activa ? " · Inactiva" : ""}
                </span>
                <span className="mt-1 block text-xs text-white/55">
                  Valor del stock: ${resumen.valor.toLocaleString("es-AR")}
                </span>
              </span>
              <span aria-hidden="true" className="text-white/30">›</span>
            </button>
          );
        })}
      </div>

      <BottomSheet
        open={abierta}
        preventClose={confirmarSalida}
        onOpenChange={(open) => {
          if (!open) {
            setDirty(false);
            setSeleccionada(null);
            setModo("detalle");
          }
        }}
        title={
          modo === "crear"
            ? "Nueva categoría"
            : modo === "editar"
              ? "Editar categoría"
              : seleccionada?.nombre ?? "Categoría"
        }
      >
        {modo === "crear" || modo === "editar" ? (
          <form onSubmit={(event) => void guardar(event)} className="space-y-4">
            <label>
              <span className="text-sm text-white/70">Nombre</span>
              <Input
                autoFocus
                value={nombre}
                onChange={(event) => {
                  setNombre(event.target.value);
                  setDirty(true);
                  setErrorNombre(null);
                }}
                placeholder="Ej: Vermut"
              />
              {errorNombre && (
                <span role="alert" className="mt-1 block text-xs text-red-200">
                  {errorNombre}
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={async () => {
                  if (await confirmarSalida()) {
                    setDirty(false);
                    if (modo === "editar") setModo("detalle");
                    else setSeleccionada(null);
                  }
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        ) : seleccionada ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[.05] p-4">
                <p className="text-xs text-white/45">Productos</p>
                <p className="mt-1 text-2xl font-bold">{resumenSeleccionado.productos}</p>
              </div>
              <div className="rounded-2xl bg-white/[.05] p-4">
                <p className="text-xs text-white/45">Unidades</p>
                <p className="mt-1 text-2xl font-bold">{resumenSeleccionado.unidades}</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/[.05] p-4">
                <p className="text-xs text-white/45">Valor de venta del stock</p>
                <p className="mt-1 text-2xl font-bold">
                  ${resumenSeleccionado.valor.toLocaleString("es-AR")}
                </p>
                <p className="mt-2 text-xs text-white/45">
                  Calculado con los precios de venta actuales.
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Productos de esta categoría</h3>
                <span className="text-xs text-white/45">
                  {seleccionada.activa ? "Activa" : "Inactiva"}
                </span>
              </div>
              {productosSeleccionados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/45">
                  Esta categoría todavía no tiene productos.
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl border border-white/10">
                  {productosSeleccionados.map((producto) => (
                    <div key={producto.id} className="flex items-start justify-between gap-3 px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{producto.nombre}</p>
                        <p className="mt-1 text-xs text-white/45">
                          Quedan {producto.stockActual} de {producto.stockObjetivo}
                          {producto.estado === "inactivo" ? " · Inactivo" : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">
                          ${calcularValorVentaStock(producto).toLocaleString("es-AR")}
                        </p>
                        <p className="mt-1 text-xs text-white/40">valor disponible</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {!soloConsulta && (
              <div className="grid gap-3">
                <Button onClick={() => {
                  setDirty(false);
                  setModo("editar");
                }}>
                  Editar categoría
                </Button>
                <Button
                  variant={seleccionada.activa ? "warning" : "success"}
                  onClick={() => void cambiarEstado()}
                >
                  {seleccionada.activa ? "Desactivar" : "Activar"}
                </Button>
                <Button variant="danger" onClick={() => void eliminar()}>
                  Eliminar categoría
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </section>
  );
}
