import {createCommandService} from '../../../command-service.js';
import {createSupabaseRepository} from '../../../supabase-repository.js';
import {createCommandHandler} from '../../../http-handler.js';

// Intentionally disabled until a dedicated Mora dev project passes the hosted gates.
if(Deno.env.get('MORA_ENVIRONMENT')!=='mora-isolated-dev')throw Error('Entorno Mora dev requerido.');
const url=Deno.env.get('SUPABASE_URL')!;
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const publicKey=Deno.env.get('SUPABASE_ANON_KEY')!;
const repository=createSupabaseRepository({url,secretKey:key});
const handler=createCommandHandler({service:createCommandService({repository}),allowedOrigin:Deno.env.get('MORA_ALLOWED_ORIGIN'),authenticate:async token=>{
  const response=await fetch(url+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:'Bearer '+token}});
  if(!response.ok)return null;const user=await response.json();return user.id?{userId:user.id}:null;
}});
Deno.serve(handler);
