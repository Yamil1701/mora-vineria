import { type FormEvent, useState } from "react";
import { activarCategoria, actualizarCategoria, crearCategoria, desactivarCategoria, eliminarCategoria } from "../db";
import type { Categoria } from "../domain/productos";
import { useCategorias } from "../hooks/useCategorias";
import { useProductos } from "../hooks/useProductos";
import { categoriaFormSchema } from "../schemas";
import { BottomSheet, Button, EmptyState, Input, Notice, useConfirm, useToast } from "./ui";

export function CategoriasCard({ onCategoriasChange, soloConsulta = false }: { onCategoriasChange?: () => void; soloConsulta?: boolean }) {
  const confirm = useConfirm(); const toast = useToast();
  const [verInactivas,setVerInactivas]=useState(false); const { categorias,cargando,error,recargar }=useCategorias(verInactivas);
  const { productos } = useProductos(true);
  const [seleccionada,setSeleccionada]=useState<Categoria|null>(null); const [modo,setModo]=useState<"detalle"|"crear"|"editar">("detalle");
  const [nombre,setNombre]=useState(""); const [guardando,setGuardando]=useState(false);
  async function recargarTodo(){await recargar();onCategoriasChange?.();}
  function nueva(){setNombre("");setModo("crear");setSeleccionada(null);}
  function abrir(c:Categoria){setSeleccionada(c);setNombre(c.nombre);setModo("detalle");}
  async function guardar(e:FormEvent){e.preventDefault();const r=categoriaFormSchema.safeParse({nombre});if(!r.success){toast.warning(r.error.issues[0]?.message??"Revisá el nombre.");return;}try{setGuardando(true);if(modo==="editar"&&seleccionada){await actualizarCategoria(seleccionada.id,r.data);toast.success("Categoría actualizada");}else{await crearCategoria(r.data);toast.success("Categoría guardada");}setSeleccionada(null);await recargarTodo();}catch(err){toast.error("No se pudo guardar",err instanceof Error?err.message:undefined);}finally{setGuardando(false);}}
  async function cambiarEstado(){if(!seleccionada)return;if(seleccionada.activa){if(!await confirm({title:`Desactivar “${seleccionada.nombre}”`,description:"No aparecerá al cargar productos nuevos.",confirmLabel:"Desactivar",tone:"danger"}))return;await desactivarCategoria(seleccionada.id);toast.success("Categoría desactivada");}else{await activarCategoria(seleccionada.id);toast.success("Categoría activada");}setSeleccionada(null);await recargarTodo();}
  async function eliminar(){if(!seleccionada)return;if(!await confirm({title:`Eliminar “${seleccionada.nombre}”`,description:"Si tiene productos asociados, se desactivará para conservar los datos.",confirmLabel:"Continuar",tone:"danger"}))return;const r=await eliminarCategoria(seleccionada.id);toast.success(r.eliminada?"Categoría eliminada":"Categoría desactivada",r.desactivada?"Tenía productos asociados.":undefined);setSeleccionada(null);await recargarTodo();}
  const abierta=Boolean(seleccionada)||modo==="crear";
  return <section className="space-y-4">
    <div className="flex items-center justify-between gap-3"><Button size="sm" variant={verInactivas?"primary":"secondary"} aria-pressed={verInactivas} onClick={()=>setVerInactivas(v=>!v)}>Inactivas</Button>{!soloConsulta&&<Button onClick={nueva}>Agregar categoría</Button>}</div>
    {cargando&&<Notice>Cargando categorías...</Notice>}{error&&<Notice tone="danger">{error}</Notice>}{!cargando&&!categorias.length&&<EmptyState title="Todavía no hay categorías." />}
    <div className="divide-y divide-white/10 border-y border-white/10">{categorias.map(c=>{const cantidad=productos.filter(p=>p.categoriaId===c.id).length;return <button key={c.id} type="button" onClick={()=>abrir(c)} className="flex min-h-16 w-full items-center justify-between gap-3 px-1 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mora-suave"><span><span className="font-semibold">{c.nombre}</span><span className="mt-1 block text-xs text-white/45">{cantidad} producto{cantidad===1?"":"s"}{!c.activa?" · Inactiva":""}</span></span><span aria-hidden="true" className="text-white/30">›</span></button>})}</div>
    <BottomSheet open={abierta} onOpenChange={(open)=>{if(!open){setSeleccionada(null);setModo("detalle");}}} title={modo==="crear"?"Nueva categoría":modo==="editar"?"Editar categoría":seleccionada?.nombre??"Categoría"}>
      {modo==="crear"||modo==="editar"?<form onSubmit={(e)=>void guardar(e)} className="space-y-4"><label><span className="text-sm text-white/70">Nombre</span><Input autoFocus value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: Vermut" /></label><div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={()=>modo==="editar"?setModo("detalle"):setSeleccionada(null)}>Cancelar</Button><Button type="submit" disabled={guardando}>{guardando?"Guardando...":"Guardar"}</Button></div></form>:seleccionada&&<div className="space-y-4"><div className="rounded-2xl bg-white/[.05] p-4"><p className="text-sm text-white/50">Productos asociados</p><p className="mt-1 text-2xl font-bold">{productos.filter(p=>p.categoriaId===seleccionada.id).length}</p><p className="mt-2 text-sm text-white/55">Estado: {seleccionada.activa?"Activa":"Inactiva"}</p></div>{!soloConsulta&&<div className="grid gap-3"><Button onClick={()=>setModo("editar")}>Editar categoría</Button><Button variant="secondary" className={seleccionada.activa?"border-mora-advertencia/35 text-yellow-100":"border-mora-exito/35 text-green-100"} onClick={()=>void cambiarEstado()}>{seleccionada.activa?"Desactivar":"Activar"}</Button><Button variant="danger" onClick={()=>void eliminar()}>Eliminar categoría</Button></div>}</div>}
    </BottomSheet>
  </section>;
}
