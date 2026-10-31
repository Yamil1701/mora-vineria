// One writer per origin when Web Locks exists. All v27 writers acquire this
// before loading/migrating/saving. Older versions do not participate.
export function startWriterGate({locks,boot,blocked}){
  if(!locks?.request){boot('unavailable');return {release(){}};}
  let release=()=>{},settled=false;
  const done=locks.request('mora.local.v1.writer',{mode:'exclusive',ifAvailable:true},async lock=>{
    settled=true;if(!lock){blocked('Mora ya está abierta en otra pestaña. Cerrala y recargá esta para registrar cambios.');return;}
    const held=new Promise(resolve=>{release=resolve;});boot('exclusive');await held;
  }).catch(()=>{if(!settled)blocked('No se pudo reservar la escritura local. Recargá antes de registrar cambios.');});
  return {release:()=>release(),done};
}
