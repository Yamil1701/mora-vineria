import {openWorkspaceStore,workspaceBackup,readWorkspaceBackup,sha256} from './workspace-store.js';
import {createLocalStore,backupText,hasBusinessData,emptyData} from './local-data.js';
import {canonical} from './operations.js';
import {createAuthClient} from './auth-client.js';
import {createRemoteClient,createSynchronizer} from './remote-client.js';
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
export async function createPersistence({config,storage,finish,changed=()=>{},storeOptions={}}){
 const store=await openWorkspaceStore(storeOptions);await store.load();let draftQueue=Promise.resolve(),sync=null,auth=null;
 if(!hasBusinessData(store.current().data)&&!store.current().imports.length&&!store.current().jobs.length&&storage){
  const key=['mora.local.rc1','mora.local.v1'].find(k=>storage.getItem(k));if(key){const original=createLocalStore({getItem:k=>storage.getItem(k)},{key}).load();await store.migrateLegacy(original,key);}else await store.migrateLegacy(emptyData(),'checked-empty');
 }
 await store.resumePrepared(finish);
 const inform=()=>changed(store.current());
 async function credentials(){let w=store.current(),session=w.session;if(!session)throw Object.assign(Error('Ingresá de nuevo. Tus registros se conservan.'),{code:'UNAUTHENTICATED'});
  if(session.expires_at&&session.expires_at*1000<Date.now()+60000){
   try{session=await auth.refresh(session.refresh_token);await store.setSession(session);w=store.current();}
   catch(error){if(error.status===400||error.status===401){await store.setSession(null);inform();}throw Object.assign(error,{code:'UNAUTHENTICATED'});}
  }
  return {accessToken:session.access_token,deviceKey:w.identity?.deviceKey||w.enrollment?.deviceKey};
 }
 if(config.enabled){auth=createAuthClient(config);const client=createRemoteClient({...config,credentials});sync=createSynchronizer({store,client,changed});}
 return {store,current:()=>store.current(),flush:()=>draftQueue,
  needsLogin:()=>!!config.enabled&&!store.current().session,
  needsEnrollment:()=>!!config.enabled&&!!store.current().session&&!store.current().identity,
  status:()=>{const w=store.current(),jobs=w.jobs.filter(j=>!['confirmed','local'].includes(j.status));return {label:jobs.some(j=>j.status==='attention')?'Necesita revisión':jobs.some(j=>j.status==='unknown')?'Falta comprobar el guardado':jobs.length?'Pendiente de guardar':w.identity&&!w.remote?.needsRefresh?'Guardado':'Guardado en este dispositivo',pending:jobs.length,attention:jobs.filter(j=>j.status==='attention').length,awaitingImport:!!w.remote?.awaitingImport};},
  saveDraft:fields=>{const value=structuredClone(fields);draftQueue=draftQueue.catch(()=>{}).then(()=>store.draft(value));return draftQueue;},
  perform:async(kind,id,payload,locals)=>{await draftQueue;const w=store.current(),previous=w.jobs.find(j=>j.id===id),old=w.data.operations.find(o=>o.id===id);const at=previous?.request.at||old?.at||new Date().toISOString();const result=await store.stage({id,kind,payload,at},{locals,finish});if(sync)queueMicrotask(()=>sync.run().catch(()=>{}));return result;},
  export:async(data=null)=>workspaceBackup({...store.current(),...(data?{data}:{})}),readBackup:readWorkspaceBackup,
  restore:async backup=>{await draftQueue;return store.restore(backup);},
  login:async link=>{const session=await auth.verifyLink(link);await store.setSession(session);inform();return session;},
  enroll:async(code,label)=>{let w=store.current();if(!w.enrollment){await store.enrollment({deviceId:crypto.randomUUID(),deviceKey:secret(),code,label});w=store.current();}const candidate=w.enrollment,session=w.session,client=createRemoteClient({...config,credentials});const binding=await client.enroll({deviceId:candidate.deviceId,code:candidate.code,label:candidate.label});await store.pair({...binding,deviceKey:candidate.deviceKey},session);await sync.refresh();inform();return store.current();},
  logout:async()=>{await draftQueue;const w=store.current();try{if(w.session)await auth.signOut(w.session.access_token);}finally{await store.setSession(null);inform();}},
  importInitial:async()=>{await draftQueue;const w=store.current();if(!w.remote?.awaitingImport||w.remote.revision!==0)throw Error('Este negocio no está vacío. Conservá las copias por separado.');if(w.jobs.some(j=>!['local','confirmed'].includes(j.status)))throw Error('Esta copia tiene registros pendientes que necesitan revisión antes de importarse.');const rawBackup=backupText(w.data),sourceDigest=await sha256(canonical(w.data));const result=await store.stage({id:'import_'+w.sourceNamespace,kind:'import-initial',at:new Date().toISOString(),payload:{rawBackup,sourceNamespace:w.sourceNamespace,sourceDigest}},{finish});inform();await sync.run();return result;},
  synchronize:async()=>{await draftQueue;if(sync)await sync.run();},review:async id=>{await draftQueue;if(sync)await sync.review(id);},prior:()=>store.prior(),close:()=>store.close()
 };
}
