// Server only. The privileged key is injected at runtime and never exported to dist/.
export function createSupabaseRepository({url,secretKey,fetcher=fetch}){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!secretKey)throw Error('Falta el entorno Mora dev.');
  const call=async(name,context,extra={})=>{
    const response=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:secretKey,Authorization:'Bearer '+secretKey,'Content-Type':'application/json'},body:JSON.stringify({p_business:context.businessId,p_device:context.deviceId,p_actor:context.userId,...extra})});
    const body=await response.json();if(!response.ok){const error=Error(body.message||'No se pudo guardar.');error.code=body.code==='40001'?'CONFLICT':body.code==='42501'?'FORBIDDEN':response.status<500?'REJECTED':'UNKNOWN';throw error;}return body;
  };
  return {
    read:c=>call('mora_rc_read',c),
    lookup:(c,r)=>call('mora_rc_lookup',c,{p_request:r}),
    commit:(c,r,digest,next,response)=>call('mora_rc_commit',c,{p_request:r,p_digest:digest,p_next:next,p_response:response})
  };
}
