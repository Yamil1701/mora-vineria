// Supabase Auth REST client. Only a publishable key is allowed in this module.
export function createAuthClient({url,publishableKey,fetcher=fetch}){
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!publishableKey?.startsWith('sb_publishable_'))throw Error('Falta la configuración pública de Mora.');
 const call=async(path,body,token=null)=>{const r=await fetcher(url+'/auth/v1/'+path,{method:'POST',headers:{apikey:publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});const data=r.status===204?null:await r.json();if(!r.ok)throw Object.assign(Error(data?.msg||data?.message||'No pudimos comprobar tu acceso.'),{status:r.status,code:data?.error_code});if(data?.access_token&&!data.expires_at)data.expires_at=Math.floor(Date.now()/1000)+(data.expires_in||3600);return data;};
 return {
  verifyLink:async input=>{
   let token=String(input).trim();if(token.startsWith('https://')){const link=new URL(token);if(link.origin!==url&&link.origin!==globalThis.location?.origin)throw Error('El enlace no corresponde a Mora.');token=link.searchParams.get('token_hash')||'';}
   if(!/^[a-f0-9]{40,128}$/i.test(token))throw Error('Pegá el enlace o código de acceso completo.');return call('verify',{token_hash:token,type:'email'});
  },
  refresh:refresh_token=>call('token?grant_type=refresh_token',{refresh_token}),
  signOut:token=>call('logout',{},token)
 };
}
