import {canonical} from './operations.js';
export function createRemoteClient({url,publishableKey,credentials,fetcher=fetch}){
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!publishableKey?.startsWith('sb_publishable_'))throw Error('Configuración de desarrollo inválida.');
 async function call(action,command,extra={}){
  const c=await credentials();if(!c?.accessToken||!c.deviceKey)throw Object.assign(Error('Ingresá de nuevo para guardar los cambios.'),{code:'UNAUTHENTICATED'});
  const r=await fetcher(url+'/functions/v1/mora-command',{method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+c.accessToken,'Content-Type':'application/json','x-mora-device-key':c.deviceKey,...(command?.kind==='import-initial'?{'x-mora-import':'1'}:{})},body:JSON.stringify({action,command:{...command,...extra}})});
  const data=await r.json();if(!r.ok)throw Object.assign(Error(data.message||'No pudimos comprobar el resultado.'),{code:data.code||({401:'UNAUTHENTICATED',403:'FORBIDDEN',409:'CONFLICT',422:'REJECTED'}[r.status]||'UNKNOWN'),status:r.status});return data;
 }
 return {read:binding=>call('read',binding),enroll:input=>call('enroll',input),result:r=>call('result',r),submit:r=>call('submit',r),review:(r,revision)=>call('review',r,{reviewRevision:revision})};
}
export function createSynchronizer({store,client,changed=()=>{}}){
 let running=false;
 const inform=()=>changed(store.current());
 const attention=(id,error)=>store.mark(id,{status:['CONFLICT','REJECTED','FORBIDDEN'].includes(error.code)?'attention':'unknown',error:error.code==='UNAUTHENTICATED'?'Ingresá de nuevo. El registro se conserva.':String(error.message)});
 async function refresh(){const w=store.current();if(!w.identity)return;const r=await client.read({businessId:w.identity.businessId,deviceId:w.identity.deviceId});await store.remoteState(r.snapshot,r.revision);inform();return r;}
 async function send(job,reviewRevision){
  await store.mark(job.id,{status:'sending',error:null});inform();
  try{
   let result=await client.result(job.request);if(!result)result=reviewRevision===undefined?await client.submit(job.request):await client.review(job.request,reviewRevision);
   if(result.expectedRevision!==job.request.expectedRevision||canonical(result.payload)!==canonical(job.request.payload))throw Object.assign(Error('El resultado no coincide con tu registro.'),{code:'REJECTED'});
   await store.confirmed(job.id,result);inform();await refresh();return true;
  }catch(error){const now=store.current().jobs.find(j=>j.id===job.id);if(now.status!=='confirmed')await attention(job.id,error);inform();return false;}
 }
 return {
  refresh,
  async run(){if(running)return;running=true;try{
   if(!store.current().identity||store.current().remote.awaitingImport)return;
   try{await refresh();}catch(error){inform();return;}
   for(;;){const jobs=store.current().jobs.filter(j=>!['confirmed','local','prepared'].includes(j.status));if(!jobs.length||jobs[0].status==='attention')break;const job=jobs[0];if(job.request.deviceId!==store.current().identity.deviceId){await store.mark(job.id,{status:'attention',error:'Este registro pertenece a otro dispositivo. Se conserva para recuperación.'});inform();break;}if(!await send(job))break;}
  }finally{running=false;}},
  async review(id){if(running)throw Error('Esperá a que termine el guardado actual.');running=true;try{const current=await refresh(),job=store.current().jobs.find(j=>j.id===id);if(!job||job.request.deviceId!==store.current().identity.deviceId)throw Error('Este registro necesita recuperación desde su dispositivo de origen.');return await send(job,current.revision);}finally{running=false;}},
  get busy(){return running;}
 };
}
