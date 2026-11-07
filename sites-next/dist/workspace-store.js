import {emptyData,validateData,readBackup,backupText,hasBusinessData} from './local-data.js';
import {applyCommand,LOCAL_KEYS,sharedSnapshot,withLocal} from './command-domain.js';
import {canonical} from './operations.js';
export const jobStates=['prepared','local','pending','sending','unknown','confirmed','attention'];
const uuid=()=>crypto.randomUUID();
export const sha256=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),x=>x.toString(16).padStart(2,'0')).join('');
const fresh=()=>({version:1,revision:0,sourceNamespace:uuid(),data:emptyData(),jobs:[],imports:[],identity:null,session:null,remote:null});
const checked=w=>{
 if(w?.version!==1||!Number.isSafeInteger(w.revision)||!Array.isArray(w.jobs)||!Array.isArray(w.imports))throw Error('Los datos de este dispositivo necesitan recuperación.');
 w.data=validateData(w.data);if(w.remote)w.remote.snapshot=validateData(w.remote.snapshot);
 const ids=new Set();for(const j of w.jobs){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(j.id)||ids.has(j.id)||!jobStates.includes(j.status)||j.id!==j.request?.id||j.seal!==canonical(j.request))throw Error('Hay un registro pendiente incompatible. Conservá una copia.');ids.add(j.id);}
 return w;
};
function description(data,r,result){const p=r.payload,labels={sale:'Venta',receive:'Mercadería recibida','debt-payment':'Abono',movement:'Movimiento','inventory-adjustment':'Conteo','sale-correction':'Corrección','receipt-payment':'Pago de mercadería','product-write':'Producto','opening':'Stock inicial','monthly-goal':'Meta mensual','import-initial':'Recuperación inicial'};return {label:labels[r.kind]||'Cambio de mercadería',amount:p.amount??(r.kind==='sale'?p.items.reduce((n,i)=>n+i.qty*i.price,0)-(p.discount||0):r.kind==='receive'?p.items.reduce((n,i)=>n+(i.lineCost??i.qty*i.unitCost),0):result?.total??null),lines:(p.items||[]).map(i=>({name:data.products.find(v=>v.id===(i.productId||i.id))?.name||'Producto',qty:i.qty})),customer:p.customer||data.debts.find(d=>d.id===p.debtId)?.customer||'',at:r.at,kind:r.kind,payload:structuredClone(p),result:structuredClone(result)};}
function project(w){
 if(!w.remote)return;
 const previous=w.data,view=structuredClone(w.remote.snapshot);
 for(const j of w.jobs){if(!j.localApplied||['confirmed','local'].includes(j.status))continue;
  // A read may already include a creation whose submit response was lost.
  // Don't replay that creation into the snapshot. Keep the job pending/unknown:
  // only confirmed() may accept a matching server result and mark it confirmed.
  if(j.request.kind==='product-write'&&!j.request.payload.id&&view.products.some(p=>p.id===j.id)){j.projectionError=null;continue;}
  try{const staged=structuredClone(view);applyCommand(staged,j.request);Object.assign(view,validateData(staged));j.projectionError=null;}
  catch(e){j.projectionError=e.message;j.status='attention';j.error='Conservamos lo que registraste. '+e.message;}
 }
 const local=structuredClone(previous);for(const field of ['completedNumber','saleId']){const n=previous.workState[field],old=previous.sales.find(s=>s.number===n);if(old){const replacement=view.sales.find(s=>s.id===old.id);if(replacement)local.workState[field]=replacement.number;}}
 try{w.data=withLocal(view,local);w.remote.projectionBlocked=false;}catch{w.data=previous;w.remote.projectionBlocked=true;}
}
export function openWorkspaceStore({indexedDB=globalThis.indexedDB,name='mora.workspace.rc2',fault=()=>{}}={}){
 if(!indexedDB)return Promise.reject(Error('Este navegador no permite guardar Mora de forma segura. Conservá tu copia y usá otro navegador.'));
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(name,1);req.onupgradeneeded=()=>req.result.createObjectStore('workspace');req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Cerrá otras versiones de Mora para abrir los datos.'));
  req.onsuccess=()=>{
   const db=req.result;let last=null;db.onversionchange=()=>db.close();
   const load=()=>new Promise((done,fail)=>{const tx=db.transaction('workspace','readonly'),r=tx.objectStore('workspace').get('current');let found;r.onsuccess=()=>{found=r.result;};tx.oncomplete=()=>{try{if(!found){change(()=>{}).then(x=>done(x.workspace),fail);return;}last=checked(found);done(structuredClone(last));}catch(e){fail(e);}};tx.onabort=()=>fail(tx.error);});
   const change=fn=>new Promise((done,fail)=>{
    let tx;try{tx=db.transaction('workspace','readwrite',{durability:'strict'});}catch(e){fail(e);return;}
    const table=tx.objectStore('workspace'),r=table.get('current');let result,error;
    r.onsuccess=()=>{try{const w=checked(r.result||fresh());result=fn(w,table);w.revision++;checked(w);fault(w);table.put(w,'current');result={workspace:w,result};}catch(e){error=e;tx.abort();}};
    tx.oncomplete=()=>{last=structuredClone(result.workspace);done(structuredClone(result));};tx.onabort=()=>fail(error||tx.error||Error('No se guardaron los cambios.'));tx.onerror=()=>{error??=tx.error;};
   });
   const api={load,current:()=>structuredClone(last),close:()=>db.close(),
    draft:fields=>change(w=>{if(Object.keys(fields).some(k=>!LOCAL_KEYS.includes(k)))throw Error('Un cambio del negocio necesita su propio registro.');for(const k of LOCAL_KEYS)if(k in fields)w.data[k]=structuredClone(fields[k]);}),
    enrollment:value=>change(w=>{w.enrollment=structuredClone(value);}),
    setSession:session=>change(w=>{if(session&&w.identity&&session.user?.id!==w.identity.userId)throw Error('Esta cuenta no corresponde a los datos de este dispositivo.');w.session=session;}),
    pair:(identity,session)=>change(w=>{if(w.identity&&(identity.businessId!==w.identity.businessId||identity.deviceId!==w.identity.deviceId||identity.userId!==w.identity.userId))throw Error('Conservá estos datos antes de vincular otro negocio.');w.identity=structuredClone(identity);w.session=structuredClone(session);w.enrollment=null;w.remote??={revision:0,snapshot:emptyData(),needsRefresh:true,awaitingImport:hasBusinessData(w.data)};}),
    stage:async(command,{locals=null,finish=()=>{}}={})=>{
     command=JSON.parse(JSON.stringify(command));
     let existing=last?.jobs.find(j=>j.id===command.id);if(existing){if(existing.request.kind!==command.kind||canonical(existing.request.payload)!==canonical(command.payload)||existing.request.at!==command.at)throw Error('Ese intento ya contiene otro registro.');if(existing.status!=='prepared')return {workspace:structuredClone(last),result:existing.localResult};}
     if(!existing)await change(w=>{
      if(w.jobs.some(j=>j.id===command.id))throw Error('El registro ya cambió. Volvé a abrirlo.');
      if(locals)for(const k of LOCAL_KEYS)w.data[k]=structuredClone(locals[k]);
      const count=w.jobs.filter(j=>!['confirmed','local'].includes(j.status)).length;
      const request={...structuredClone(command),...(w.identity&&(!w.remote.awaitingImport||command.kind==='import-initial')?{businessId:w.identity.businessId,deviceId:w.identity.deviceId,expectedRevision:w.remote.revision+count}:{})};
      const preview=command.kind==='import-initial'&&w.remote?withLocal(w.remote.snapshot,w.data):structuredClone(w.data);const result=applyCommand(preview,request);validateData(preview);
      w.jobs.push({id:request.id,request,seal:canonical(request),status:'prepared',localApplied:false,localResult:result,evidence:description(w.data,request,result),error:null});
     });
     return change(w=>{
      const job=w.jobs.find(j=>j.id===command.id);if(job.status!=='prepared')return job.localResult;
      const data=command.kind==='import-initial'&&w.remote?withLocal(w.remote.snapshot,w.data):structuredClone(w.data),result=applyCommand(data,job.request);
      finish(data,job.request,result);w.data=validateData(data);job.localResult=result;job.localApplied=true;job.status=job.request.businessId?'pending':'local';if(command.kind==='import-initial')w.remote.awaitingImport=false;return result;
     });
    },
    resumePrepared:async(finish=()=>{})=>{for(const j of [...last.jobs].filter(j=>j.status==='prepared'))await api.stage(j.request,{finish});return last;},
    mark:(id,patch)=>change(w=>{const j=w.jobs.find(j=>j.id===id);if(!j)throw Error('No encontré ese registro.');if('request'in patch||'seal'in patch||'id'in patch)throw Error('No se puede cambiar la identidad de un intento.');Object.assign(j,structuredClone(patch));}),
    confirmed:(id,result)=>change(w=>{const j=w.jobs.find(j=>j.id===id);if(!j||result.id!==id||result.status!=='confirmed'||result.kind!==j.request.kind||result.expectedRevision!==j.request.expectedRevision||result.at!==j.request.at||canonical(result.payload)!==canonical(j.request.payload)||result.deviceId!==j.request.deviceId||result.businessId!==j.request.businessId)throw Error('El resultado no corresponde al registro preparado.');j.status='confirmed';j.remoteResult=result;j.error=null;if(j.request.kind==='import-initial')for(const local of w.jobs.filter(x=>x.status==='local')){local.status='confirmed';local.importedBy=id;}w.remote.revision=Math.max(w.remote.revision,result.revision);w.remote.needsRefresh=true;}),
    remoteState:(snapshot,revision)=>change(w=>{if(!w.identity||!Number.isSafeInteger(revision)||revision<w.remote.revision)throw Error('La respuesta del negocio está desactualizada.');const awaiting=w.remote.awaitingImport;w.remote={revision,snapshot:sharedSnapshot(snapshot),needsRefresh:false,...(awaiting?{awaitingImport:true}: {})};if(awaiting){if(revision>0)w.remote.projectionBlocked=true;return;}for(const j of w.jobs)if(j.status==='local'&&snapshot.operations.some(o=>o.id===j.id&&o.status==='confirmed'))j.status='confirmed';project(w);}),
    migrateLegacy:(data,source)=>change((w,t)=>{if(hasBusinessData(w.data)||w.jobs.length||w.imports.length)return false;const d=validateData(data);t.put(structuredClone(w),'before-legacy');w.data=d;w.imports.push({id:uuid(),type:'legacy-local',source,at:new Date().toISOString()});return true;}),
    restore:(backup)=>change((w,t)=>{
     if(w.identity&&w.remote.revision!==0)throw Error('El negocio ya tiene registros. Conservá las copias por separado.');
     if(hasBusinessData(w.data)||w.jobs.length||w.imports.some(i=>i.type==='restore'))throw Error('El destino ya tiene datos. Conservá ambos historiales por separado.');
     t.put(structuredClone(w),'before-restore');const data=validateData(backup.data);w.data=data;
     if(backup.workspace){for(const entry of backup.workspace.jobs||[]){const j=structuredClone(entry);if(j.status!=='confirmed'){j.status='attention';j.error='Esta copia conserva un registro de otro dispositivo. Revisalo antes de enviarlo.';}w.jobs.push(j);}if(!w.identity)w.remote=null;}
     if(w.identity)w.remote.awaitingImport=hasBusinessData(w.data);
     w.imports.push({id:backup.migrationId||uuid(),type:'restore',at:new Date().toISOString()});
    }),
    prior:()=>new Promise((done,fail)=>{const tx=db.transaction('workspace','readonly'),r=tx.objectStore('workspace').get('before-restore');r.onsuccess=()=>done(r.result?.data?backupText(r.result.data):null);r.onerror=()=>fail(r.error);})
   };resolve(api);
  };
 });
}
export async function workspaceBackup(w){
 const body={format:'mora-workspace-backup',version:1,migrationId:w.sourceNamespace,business:JSON.parse(backupText(w.data)),workspace:{jobs:w.jobs.map(j=>structuredClone(j)),remote:w.remote?{revision:w.remote.revision,snapshot:sharedSnapshot(w.remote.snapshot),needsRefresh:true}:null,imports:w.imports}};
 const checksum=await sha256(canonical(body));return JSON.stringify({...body,checksum},null,2);
}
export async function readWorkspaceBackup(raw){
 if(typeof raw!=='string'||raw.length>30000000)throw Error('La copia supera el límite de 30 MB.');let b;try{b=JSON.parse(raw);}catch{throw Error('No pudimos leer este archivo JSON.');}
 if(b.format!=='mora-workspace-backup')return {data:readBackup(raw),workspace:null,migrationId:null};
 if(b.version!==1||typeof b.checksum!=='string')throw Error('Esta copia usa una versión incompatible.');const {checksum,...body}=b;if(await sha256(canonical(body))!==checksum)throw Error('La copia cambió o quedó incompleta.');
 const data=readBackup(JSON.stringify(b.business));checked({version:1,revision:0,data,jobs:b.workspace.jobs,imports:b.workspace.imports,remote:b.workspace.remote});return {data,workspace:b.workspace,migrationId:b.migrationId};
}
// Last-resort read-only evidence export. It is intentionally not an importable backup.
export function rawWorkspaceCopy({indexedDB=globalThis.indexedDB,name='mora.workspace.rc2'}={}){
 if(!indexedDB)return Promise.reject(Error('No se pudo acceder al archivo de este dispositivo.'));
 return new Promise((resolve,reject)=>{const q=indexedDB.open(name);q.onupgradeneeded=()=>q.transaction.abort();q.onerror=()=>reject(Error('No encontramos un archivo local para revisar.'));q.onsuccess=()=>{const db=q.result;if(!db.objectStoreNames.contains('workspace')){db.close();reject(Error('El archivo necesita recuperación asistida.'));return;}const tx=db.transaction('workspace','readonly'),r=tx.objectStore('workspace').get('current');let value;r.onsuccess=()=>{value=r.result;};tx.oncomplete=()=>{db.close();if(!value){reject(Error('No encontramos datos locales para revisar.'));return;}const copy=Object.fromEntries(['version','revision','sourceNamespace','data','jobs','imports','remote'].filter(k=>Object.hasOwn(value,k)).map(k=>[k,value[k]]));resolve(JSON.stringify({format:'mora-raw-recovery',version:1,needsAssistance:true,workspace:copy},null,2));};tx.onabort=()=>{db.close();reject(tx.error||Error('No se pudo leer el archivo local.'));};};});
}
