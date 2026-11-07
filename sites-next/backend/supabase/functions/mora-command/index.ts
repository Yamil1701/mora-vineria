import {createCommandService} from '../../../command-service.js';
import {createSupabaseRepository} from '../../../supabase-repository.js';
import {createCommandHandler} from '../../../http-handler.js';
import {createDeviceAdmission,createDeviceSessionIssuer} from '../../../device-admission.js';
import {devConfig} from './dev-config.ts';
const url=Deno.env.get('SUPABASE_URL')||'';
if((Deno.env.get('MORA_ENVIRONMENT')??devConfig.environment)!=='mora-isolated-dev'||url!==`https://${devConfig.projectRef}.supabase.co`)throw Error('Mora isolated development project required.');
const secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY');
const repo=createSupabaseRepository({url,secretKey:secret});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const reject=()=>Object.assign(Error('Este dispositivo no está autorizado.'),{code:'FORBIDDEN'});
const deviceKey=(req:Request)=>{const key=req.headers.get('x-mora-device-key')||'';if(!/^[a-zA-Z0-9_-]{40,100}$/.test(key))throw reject();return key;};
const admission=createDeviceAdmission({repo,hash,deviceKey,issueSession:createDeviceSessionIssuer({url,secret,publicKey})});
const handler=createCommandHandler({service:createCommandService({repository:repo}),allowedOrigin:devConfig.allowedOrigins,admission,
 authenticate:async(token:string)=>{
  const r=await fetch(url+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:'Bearer '+token}});if(!r.ok)return null;
  const user=await r.json();if(!user.id||user.is_anonymous)return null;
  let claim;try{claim=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{return null;}
  if(claim.sub!==user.id||!claim.session_id||!await repo.sessionValid(user.id,claim.session_id))return null;
  return {userId:user.id};
 },
 authorize:async(actor:any,c:any,req:Request)=>repo.authorize({userId:actor.userId,businessId:c?.businessId,deviceId:c?.deviceId},await hash(deviceKey(req))),
 enroll:async(actor:any,c:any,req:Request)=>{
  if(!c||!/^[-0-9a-f]{36}$/i.test(c.deviceId)||typeof c.code!=='string'||c.code.length<20||c.code.length>150||typeof c.label!=='string'||!c.label.trim()||c.label.length>80)throw Object.assign(Error('Revisá el código de vinculación.'),{code:'REJECTED'});
  return repo.enroll(actor,{deviceId:c.deviceId,codeHash:await hash(c.code),credentialHash:await hash(deviceKey(req)),label:c.label.trim()});
 }
});
Deno.serve(handler);
