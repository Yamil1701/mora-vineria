import {canonical} from './operations.js';
import {sha256} from './workspace-store.js';
export function createRemoteClient({url,publishableKey,credentials,fetcher=fetch}){
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!publishableKey?.startsWith('sb_publishable_'))throw Error('Configuración de desarrollo inválida.');
 async function call(action,command,extra={},pairingKey=null){
  const c=pairingKey?{deviceKey:pairingKey}:await credentials();if(!c?.deviceKey||!pairingKey&&!c.accessToken)throw Object.assign(Error('Ingresá de nuevo para guardar los cambios.'),{code:'UNAUTHENTICATED'});
  const r=await fetcher(url+'/functions/v1/mora-command',{method:'POST',...(['pair-device','manage-devices'].includes(action)?{signal:AbortSignal.timeout(12000)}:{}),headers:{apikey:publishableKey,...(c.accessToken?{Authorization:'Bearer '+c.accessToken}:{}),'Content-Type':'application/json','x-mora-device-key':c.deviceKey,...(command?.kind==='import-initial'?{'x-mora-import':'1'}:{})},body:JSON.stringify({action,command:{...command,...extra}})});
  const data=await r.json();if(!r.ok)throw Object.assign(Error(data.message||'No pudimos comprobar el resultado.'),{code:data.code||({401:'UNAUTHENTICATED',403:'FORBIDDEN',409:'CONFLICT',422:'REJECTED'}[r.status]||'UNKNOWN'),status:r.status});return data;
 }
 return {manageDevices:(binding,input)=>call('manage-devices',binding,input),pairDevice:({deviceKey,...input})=>call('pair-device',input,{},deviceKey),read:binding=>call('read',binding),enroll:input=>call('enroll',input),result:r=>call('result',r),submit:r=>call('submit',r),review:(r,revision)=>call('review',r,{reviewRevision:revision})};
}
export function createSynchronizer({store,client,changed=()=>{}}){
 let running=false,checked=null,lastError=null;
 const inform=()=>changed(store.current());
 const attention=(id,error)=>store.mark(id,{
  status:['CONFLICT','REJECTED','FORBIDDEN'].includes(error.code)?'attention':'unknown',
  errorCode:error.code||'NETWORK',
  error:error.code==='UNAUTHENTICATED'?'Ingresá de nuevo. El registro se conserva.':error.code?String(error.message):'No pudimos comprobar el guardado. Conservamos el registro para reintentar.'
 });
 async function refresh(){
  const w=store.current();if(!w.identity)return;
  try{
   const r=await client.read({businessId:w.identity.businessId,deviceId:w.identity.deviceId});
   await store.remoteState(r.snapshot,r.revision);checked=new Date().toISOString();lastError=null;inform();return r;
  }catch(error){
   lastError={code:error.code||'NETWORK',message:error.code==='FORBIDDEN'?'Este dispositivo ya no tiene acceso al negocio. Tus registros locales se conservan.':error.code==='UNAUTHENTICATED'?'Tu acceso venció. Volvé a entrar; tus registros se conservan.':'No pudimos comprobar el negocio. Tus registros locales se conservan.'};
   inform();throw error;
  }
 }
 async function independentProduct(job,snapshot){
  if(job.request.kind!=='product-write')return false;
  const id=job.request.payload.id||job.id,product=snapshot.products.find(p=>p.id===id);
  if(!job.request.payload.id)return !product;
  return !!product&&!!job.productBasis&&job.productBasis===await sha256(canonical(product));
 }
 async function send(job,reviewRevision){
  await store.mark(job.id,{status:'sending',error:null,errorCode:null});inform();
  try{
   let result=await client.result(job.request);
   if(!result){
    try{
     result=reviewRevision===undefined?await client.submit(job.request):await client.review(job.request,reviewRevision);
    }catch(error){
     if(error.code!=='CONFLICT'||reviewRevision!==undefined)throw error;
     const current=await refresh();
     // Recheck an independent catalog write against this exact revision. Keep the
     // sealed request and let the server atomically validate and commit it again.
     if(!await independentProduct(job,current.snapshot))throw error;
     result=await client.review(job.request,current.revision);
    }
   }
   if(result.expectedRevision!==job.request.expectedRevision||canonical(result.payload)!==canonical(job.request.payload))throw Object.assign(Error('El resultado no coincide con tu registro.'),{code:'REJECTED'});
   await store.confirmed(job.id,result);inform();await refresh();return true;
  }catch(error){
   const now=store.current().jobs.find(j=>j.id===job.id);
   if(now.status!=='confirmed')await attention(job.id,error);
   inform();return false;
  }
 }
 async function run(){
  if(running)return;
  running=true;inform();
  try{
   if(!store.current().identity||store.current().remote.awaitingImport)return;
   try{await refresh();}catch{return;}
   for(;;){
    const w=store.current(),job=w.jobs.find(j=>!['confirmed','local','prepared'].includes(j.status));
    if(!job)break;
    if(job.request.deviceId!==w.identity.deviceId){
     await store.mark(job.id,{status:'attention',error:'Este registro pertenece a otro dispositivo. Se conserva para recuperación.'});inform();break;
    }
    if(job.status==='attention'&&(job.errorCode&&job.errorCode!=='CONFLICT'||!await independentProduct(job,w.remote.snapshot)))break;
    if(!await send(job))break;
   }
  }finally{running=false;inform();}
 }
 return {
  refresh,run,
  async review(id){
   if(running)throw Error('Esperá a que termine el guardado actual.');
   running=true;let completed=false;
   try{
    const current=await refresh(),job=store.current().jobs.find(j=>j.id===id);
    if(!job||job.request.deviceId!==store.current().identity.deviceId)throw Error('Este registro necesita recuperación desde su dispositivo de origen.');
    completed=await send(job,current.revision);
   }finally{running=false;inform();}
   if(completed)await run();
   return completed;
  },
  get busy(){return running;},get health(){return {checking:running,checked,error:lastError?.message||null,errorCode:lastError?.code||null};}
 };
}
