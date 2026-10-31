// Fetch-standard handler, tested without deploying a function or exposing credentials.
export function createCommandHandler({service,authenticate,allowedOrigin}){
  if(!/^https:\/\//.test(allowedOrigin||''))throw Error('Definí el origen de desarrollo autorizado.');
  return async request=>{
    const origin=request.headers.get('origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
    if(origin&&origin!==allowedOrigin)return new Response(JSON.stringify({message:'Origen no autorizado.'}),{status:403,headers});
    if(origin)Object.assign(headers,{'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return new Response(JSON.stringify({message:'Método no permitido.'}),{status:405,headers});
    try{
      const authorization=request.headers.get('authorization');if(!authorization?.startsWith('Bearer '))throw Object.assign(Error('Ingresá para continuar.'),{code:'UNAUTHENTICATED'});
      // Auth verifies the bearer. No decoding-only JWT or user_metadata trust.
      const actor=await authenticate(authorization.slice(7));
      if(!actor?.userId)throw Object.assign(Error('Acceso no autorizado.'),{code:'UNAUTHENTICATED'});
      const reader=request.body?.getReader(),chunks=[];let size=0;
      if(reader)for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>300000){await reader.cancel();throw Object.assign(Error('El registro es demasiado grande.'),{code:'REJECTED'});}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      const {action,command}=JSON.parse(text);
      if(!['submit','result'].includes(action))throw Object.assign(Error('Acción inválida.'),{code:'REJECTED'});
      return new Response(JSON.stringify(await service[action](actor,command)),{status:200,headers});
    }catch(error){
      const status={UNAUTHENTICATED:401,FORBIDDEN:403,CONFLICT:409,REJECTED:422}[error.code]||(error instanceof SyntaxError?400:503);
      const message=status===503?'No pudimos comprobar el resultado. Conservá el registro y reintentá con la misma operación.':error.message;
      return new Response(JSON.stringify({code:error.code||'UNKNOWN',message}),{status,headers});
    }
  };
}
