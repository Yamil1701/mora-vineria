// Server only: keys come from Edge runtime, never from browser configuration.
export function createSupabaseRepository({url,secretKey,fetcher=fetch}){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!secretKey)throw Error('Falta el entorno Mora dev.');
  const rpc=async(name,args)=>{
    const headers={apikey:secretKey,'Content-Type':'application/json'};
    if(secretKey.startsWith('eyJ'))headers.Authorization='Bearer '+secretKey;
    const response=await fetcher(url+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(args)});
    const body=await response.json();if(!response.ok){const error=Error(body.message||'No se pudo guardar.');error.code=body.code==='40001'?'CONFLICT':body.code==='42501'?'FORBIDDEN':response.status<500?'REJECTED':'UNKNOWN';throw error;}return body;
  };
  const call=(name,c,extra={})=>rpc(name,{p_business:c.businessId,p_device:c.deviceId,p_actor:c.userId,...extra});
  return {
    sessionValid:(actor,sessionId)=>rpc('mora_rc_session_valid',{p_actor:actor,p_session:sessionId}),
    authorize:(c,credentialHash)=>call('mora_rc_device_access',c,{p_credential:credentialHash}),
    enroll:(actor,p)=>rpc('mora_rc_enroll',{p_actor:actor.userId,p_code:p.codeHash,p_device:p.deviceId,p_credential:p.credentialHash,p_label:p.label}),
    read:c=>call('mora_rc_read',c),
    lookup:(c,r)=>call('mora_rc_lookup',c,{p_request:r}),
    commitReviewed:(c,r,digest,next,response,basis)=>call('mora_rc_commit_reviewed',c,{p_request:r,p_digest:digest,p_next:next,p_response:response,p_basis:basis}),
    commit:(c,r,digest,next,response)=>call('mora_rc_commit',c,{p_request:r,p_digest:digest,p_next:next,p_response:response})
  };
}
