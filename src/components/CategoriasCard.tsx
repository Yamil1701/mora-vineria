import { type FormEvent, useState } from "react";

import {
  activarCategoria,
  actualizarCategoria,
  crearCategoria,
  desactivarCategoria,
  eliminarCategoria,
} from "../db";
import type { Categoria } from "../domain/productos";
import { useCategorias } from "../hooks/useCategorias";
import { categoriaFormSchema } from "../schemas";
import { useConfirm, useToast } from "./ui";

const formInicial = {
  nombre: "",
};

interface CategoriasCardProps {
  onCategoriasChange?: () => void;
  soloConsulta?: boolean;
}

function obtenerMensajeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo guardar la categoría.";
}

export function CategoriasCard({ onCategoriasChange, soloConsulta = false }: CategoriasCardProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [verInactivas, setVerInactivas] = useState(false);
  const { categorias, cargando, error, recargar } = useCategorias(verInactivas);
  const [form, setForm] = useState(formInicial);
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(
    null,
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const categoriaEditando = categorias.find(
    (categoria) => categoria.id === categoriaEditandoId,
  );

  function limpiarFormulario() {
    setCategoriaEditandoId(null);
    setForm(formInicial);
  }

  function iniciarEdicion(categoria: Categoria) {
    setMensaje(null);
    setCategoriaEditandoId(categoria.id);
    setForm({
      nombre: categoria.nombre,
    });
  }

  async function recargarTodo() {
    await recargar();
    onCategoriasChange?.();
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (soloConsulta) {
      toast.warning("Celular de consulta", "Para modificar categorías, usá el celular principal.");
      return;
    }
    setMensaje(null);

    const resultado = categoriaFormSchema.safeParse(form);

    if (!resultado.success) {
      setMensaje(resultado.error.issues[0]?.message ?? "Revisá el nombre.");
      return;
    }

    try {
      setGuardando(true);

      if (categoriaEditandoId) {
        await actualizarCategoria(categoriaEditandoId, resultado.data);
        setMensaje("Categoría actualizada correctamente.");
      } else {
        await crearCategoria(resultado.data);
        setMensaje("Categoría guardada correctamente.");
      }

      limpiarFormulario();
      await recargarTodo();
    } catch (error) {
      setMensaje(obtenerMensajeError(error));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarDesactivar(categoria: Categoria) {
    if (soloConsulta) {
      toast.warning("Celular de consulta", "Para modificar categorías, usá el celular principal.");
      return;
    }

    const confirmado = await confirm({
      title: `Desactivar “${categoria.nombre}”`,
      description: "No aparecerá como opción principal al cargar productos nuevos.",
      confirmLabel: "Desactivar",
      tone: "danger",
    });

    if (!confirmado) return;

    await desactivarCategoria(categoria.id);
    setMensaje("Categoría desactivada.");
    await recargarTodo();
  }

  async function manejarActivar(categoria: Categoria) {
    if (soloConsulta) {
      toast.warning("Celular de consulta", "Para modificar categorías, usá el celular principal.");
      return;
    }

    await activarCategoria(categoria.id);
    setMensaje("Categoría activada correctamente.");
    await recargarTodo();
  }

  async function manejarEliminar(categoria: Categoria) {
    if (soloConsulta) {
      toast.warning("Celular de consulta", "Para modificar categorías, usá el celular principal.");
      return;
    }

    const confirmado = await confirm({
      title: `Eliminar “${categoria.nombre}”`,
      description:
        "Si tiene productos asociados, se desactivará en lugar de eliminarse para conservar los datos.",
      confirmLabel: "Continuar",
      tone: "danger",
    });

    if (!confirmado) return;

    const resultado = await eliminarCategoria(categoria.id);
    await recargarTodo();

    if (resultado.eliminada) {
      setMensaje("Categoría eliminada correctamente.");
    }

    if (resultado.desactivada) {
      setMensaje("La categoría tenía productos asociados, por eso se desactivó.");
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div>
        <p className="text-sm font-semibold text-white">Categorías</p>
        <p className="mt-1 text-xs leading-5 text-white/50">
          Usalas para ordenar productos. Las categorías inactivas no aparecen como opción principal al cargar productos nuevos.
        </p>
      </div>

      {!soloConsulta && <form onSubmit={(event) => void manejarSubmit(event)} className="grid gap-3">
        <label className="block">
          <span className="text-sm text-white/70">
            {categoriaEditando ? "Editar categoría" : "Nueva categoría"}
          </span>
          <input
            value={form.nombre}
            onChange={(event) => setForm({ nombre: event.target.value })}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-mora-principal"
            placeholder="Ej: Vermut"
          />
        </label>

        {mensaje && <p className="text-sm text-white/65">{mensaje}</p>}

        <div className="grid gap-2">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-2xl bg-mora-principal px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {guardando
              ? "Guardando..."
              : categoriaEditando
                ? "Guardar categoría"
                : "Agregar categoría"}
          </button>

          {categoriaEditando && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Listado</p>

        <label className="flex items-center gap-2 text-xs text-white/65">
          <input
            type="checkbox"
            checked={verInactivas}
            onChange={(event) => setVerInactivas(event.target.checked)}
            className="accent-mora-principal"
          />
          Ver inactivas
        </label>
      </div>

      {cargando && <p className="text-sm text-white/65">Cargando categorías...</p>}

      {error && <p className="text-sm text-red-100">{error}</p>}

      {!cargando && categorias.length === 0 && (
        <p className="text-sm text-white/65">Todavía no hay categorías cargadas.</p>
      )}

      <div className="grid gap-2">
        {categorias.map((categoria) => (
          <article
            key={categoria.id}
            className={[
              "rounded-2xl border p-3",
              categoria.activa
                ? "border-white/10 bg-black/10"
                : "border-white/5 bg-black/10 opacity-70",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{categoria.nombre}</p>

                {!categoria.activa && (
                  <p className="mt-1 text-xs text-white/45">Inactiva</p>
                )}
              </div>

              {!soloConsulta && <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => iniciarEdicion(categoria)}
                  className="min-h-12 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white"
                >
                  Editar
                </button>

                {categoria.activa ? (
                  <button
                    type="button"
                    onClick={() => void manejarDesactivar(categoria)}
                    className="min-h-12 rounded-xl border border-mora-advertencia/30 px-3 py-2 text-xs font-semibold text-yellow-100"
                  >
                    Desactivar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void manejarActivar(categoria)}
                    className="min-h-12 rounded-xl border border-mora-exito/30 px-3 py-2 text-xs font-semibold text-green-100"
                  >
                    Activar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void manejarEliminar(categoria)}
                  className="min-h-12 rounded-xl border border-mora-error/30 px-3 py-2 text-xs font-semibold text-red-100"
                >
                  Eliminar
                </button>
              </div>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
