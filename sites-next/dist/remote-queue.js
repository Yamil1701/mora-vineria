// Isolated development adapter. The application does not import or activate it.
// A result is remote-confirmed only after the transport returns a durable result.
const stable=v=>v&&typeof v==='object'?Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}':JSON.stringify(v);
export function createRemoteQueue({storage,transport,businessId,deviceId}){
  if(!businessId||!deviceId||!transport)throw Error('Falta configurar el entorno aislado.');
  const key='mora.dev.outbox.v1:'+businessId+':'+deviceId;let active=false;
  const read=()=>{const raw=storage.getItem(key);const jobs=raw?JSON.parse(raw):[];if(!Array.isArray(jobs))throw Error('La cola requiere recuperación.');return jobs;};
  const write=jobs=>storage.setItem(key,JSON.stringify(jobs));
  return {
    entries:()=>structuredClone(read()),
    enqueue({id,kind,payload,expectedRevision,physicalEvidence=null}){
      if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('La identidad y versión deben existir antes del envío.');
      const request={id,kind,payload:structuredClone(payload),expectedRevision,businessId,deviceId},jobs=read(),old=jobs.find(j=>j.id===id);
      if(old){if(stable(old.request)!==stable(request))throw Error('La operación ya tiene otro contenido.');return structuredClone(old);}
      const job={id,request,status:'device-saved',physicalEvidence:structuredClone(physicalEvidence),result:null,error:null};jobs.push(job);write(jobs);return structuredClone(job);
    },
    async syncOne(id){
      if(active)throw Error('Ya hay un envío en curso en este adaptador.');active=true;
      try{let jobs=read(),job=jobs.find(j=>j.id===id);if(!job)throw Error('Operación no encontrada.');if(['remote-confirmed','needs-attention'].includes(job.status))return structuredClone(job);
        job.status='awaiting-server';write(jobs);
        let result;
        try{result=await transport.result(job.request);if(!result)result=await transport.submit(job.request);}
        catch(error){jobs=read();job=jobs.find(j=>j.id===id);job.status=['CONFLICT','REJECTED'].includes(error.code)?'needs-attention':'outcome-unknown';job.error=String(error.message);write(jobs);return structuredClone(job);}
        jobs=read();job=jobs.find(j=>j.id===id);if(!result||result.id!==id||result.businessId!==businessId||result.deviceId!==deviceId||result.kind!==job.request.kind||result.expectedRevision!==job.request.expectedRevision||stable(result.payload)!==stable(job.request.payload)||result.status!=='confirmed'){job.status='needs-attention';job.error='El resultado remoto no corresponde exactamente a este comando.';write(jobs);return structuredClone(job);}
        job.status='remote-confirmed';job.result=structuredClone(result);job.error=null;write(jobs);return structuredClone(job);
      }finally{active=false;}
    }
  };
}
export function supabaseDevTransport({url,publishableKey,accessToken,fetcher=fetch}){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!publishableKey||!accessToken)throw Error('Configuración de desarrollo incompleta.');
  async function rpc(name,args){const response=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:publishableKey,Authorization:'Bearer '+await accessToken(),'Content-Type':'application/json'},body:JSON.stringify(args)});const body=await response.json();if(!response.ok){const error=Error(body.message||'El servidor rechazó el registro.');error.code=body.code==='40001'?'CONFLICT':response.status<500?'REJECTED':'UNKNOWN';throw error;}return body;}
  return {result:r=>rpc('mora_dev_command_result',{p_business:r.businessId,p_id:r.id}),submit:r=>rpc('mora_dev_apply_goal',{p_business:r.businessId,p_device:r.deviceId,p_id:r.id,p_expected:r.expectedRevision,p_kind:r.kind,p_payload:r.payload})};
}
