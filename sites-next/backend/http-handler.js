// Fetch-standard handler, tested without deploying a function or exposing credentials.
/**
 * @typedef {(actor: {userId: string}, input: any, request: Request) => Promise<unknown>} DeviceAction
 * @param {{
 *   service: Record<string, Function>,
 *   authenticate: (token: string) => Promise<{userId: string} | null>,
 *   allowedOrigin: string | string[],
 *   authorize?: DeviceAction,
 *   enroll?: DeviceAction | null,
 *   admission?: {manage: DeviceAction, pair: (input: any, request: Request) => Promise<unknown>} | null
 * }} options
 */
export function createCommandHandler({service,authenticate,allowedOrigin,authorize=async()=>{},enroll=null,admission=null}){
  const origins=Array.isArray(allowedOrigin)?allowedOrigin:[allowedOrigin];
  if(!origins.length||origins.some(o=>!/^https:\/\//.test(o||'')))throw Error('Definí el origen de desarrollo autorizado.');
  return async request=>{
    const origin=request.headers.get('origin');
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
    if(origin&&!origins.includes(origin))return new Response(JSON.stringify({message:'Origen no autorizado.'}),{status:403,headers});
    if(origin)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-mora-device-key, x-mora-import','Access-Control-Allow-Methods':'POST, OPTIONS'});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='POST')return new Response(JSON.stringify({message:'Método no permitido.'}),{status:405,headers});
    try{
      const authorization=request.headers.get('authorization');
      const pairingRequest=admission&&authorization===null;
      if(!pairingRequest&&!authorization?.startsWith('Bearer '))throw Object.assign(Error('Ingresá para continuar.'),{code:'UNAUTHENTICATED'});
      const actor=pairingRequest?null:await authenticate(authorization.slice(7));
      if(!pairingRequest&&!actor?.userId)throw Object.assign(Error('Acceso no autorizado.'),{code:'UNAUTHENTICATED'});
      const maxBytes=pairingRequest?4096:request.headers.get('x-mora-import')==='1'?11000000:300000;
      const reader=request.body?.getReader(),chunks=[];let size=0;
      if(reader)for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Object.assign(Error('El registro es demasiado grande.'),{code:'REJECTED'});}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      const {action,command}=JSON.parse(text);
      if(action==='pair-device'&&pairingRequest){
        return new Response(JSON.stringify(await admission.pair(command,request)),{status:200,headers});
      }
      if(!actor?.userId)throw Object.assign(Error('Ingresá para continuar.'),{code:'UNAUTHENTICATED'});
      if(action==='manage-devices'&&admission){
        return new Response(JSON.stringify(await admission.manage(actor,command,request)),{status:200,headers});
      }
      if(!['submit','result','read','enroll','review'].includes(action))throw Object.assign(Error('Acción inválida.'),{code:'REJECTED'});
      if(action==='enroll'){if(!enroll)throw Object.assign(Error('Vinculación no disponible.'),{code:'REJECTED'});return new Response(JSON.stringify(await enroll(actor,command,request)),{status:200,headers});}
      await authorize(actor,command,request);
      return new Response(JSON.stringify(await service[action](actor,command)),{status:200,headers});
    }catch(error){
      const status={UNAUTHENTICATED:401,FORBIDDEN:403,CONFLICT:409,REJECTED:422}[error.code]||(error instanceof SyntaxError?400:503);
      const message=status===503?'No pudimos comprobar el resultado. Conservá el registro y reintentá con la misma operación.':error.message;
      return new Response(JSON.stringify({code:error.code||'UNKNOWN',message}),{status,headers});
    }
  };
}
