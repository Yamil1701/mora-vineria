import {readFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {emptyData} from '../dist/local-data.js';
import {createDeviceAdmission} from '../backend/device-admission.js';
import {createCommandHandler} from '../backend/http-handler.js';
import {createSupabaseRepository} from '../backend/supabase-repository.js';

export const hash=value=>createHash('sha256').update(value).digest('hex');
export const endpoint='https://dedcvvgiuxpwdzqqdifn.supabase.co';
export async function admissionFixture(origin){
  const pg=new PGlite(),businessId=randomUUID(),userId=randomUUID(),loginCode='a'.repeat(48);
  const sessions=new Map();
  const session=()=>{const access_token=randomUUID();sessions.set(access_token,userId);return {
    access_token,refresh_token:randomUUID(),expires_at:Math.floor(Date.now()/1000)+3600,user:{id:userId}
  };};
  await pg.exec(`
    create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;
    select set_config('mora.environment','mora-isolated-dev',false);
  `);
  for(const name of ['20261031101555_secure_command_gateway.sql','20261101014012_rc2_device_enrollment_and_auth_hardening.sql','20261101043103_rc2_enrollment_foreign_key_indexes.sql','20261107195330_device_admission.sql']){
    await pg.exec(await readFile(new URL('../backend/supabase/migrations/'+name,import.meta.url),'utf8'));
  }
  await pg.query('insert into auth.users(id) values($1)',[userId]);
  await pg.query('insert into mora_rc.businesses(id,snapshot) values($1,$2)',[businessId,emptyData()]);
  await pg.query('insert into mora_rc.memberships(business_id,user_id) values($1,$2)',[businessId,userId]);
  await pg.query("insert into mora_rc.enrollments(code_hash,business_id,user_id,expires_at) values($1,$2,$3,now()+interval '1 hour')",[hash(loginCode),businessId,userId]);
  const repo=createSupabaseRepository({url:endpoint,secretKey:'fixture-server-only',fetcher:async(url,options)=>{
    const name=new URL(url).pathname.split('/').at(-1);
    const values=Object.values(JSON.parse(options.body));
    try{
      const result=await pg.transaction(async tx=>{
        await tx.exec('set local role service_role');
        return tx.query(`select public.${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) as result`,values);
      });
      return Response.json(result.rows[0].result);
    }catch(error){return Response.json({code:error.code,message:error.message},{status:error.code==='42501'?403:400});}
  }});
  const deviceKey=request=>{
    const key=request.headers.get('x-mora-device-key');
    if(!key||!/^[a-f0-9]{64}$/.test(key))throw Object.assign(Error('Device proof required'),{code:'FORBIDDEN'});
    return key;
  };
  const handler=createCommandHandler({
    allowedOrigin:origin,
    admission:createDeviceAdmission({repo,hash,deviceKey,issueSession:async()=>session()}),
    authenticate:async token=>({userId:sessions.get(token)}),
    authorize:(actor,input,request)=>repo.authorize({...input,...actor},hash(deviceKey(request))),
    enroll:async(actor,input,request)=>{
      const identity=await repo.enroll(actor,{...input,codeHash:hash(input.code),credentialHash:hash(deviceKey(request))});
      // Fixture only. Production designation is an explicit operator action.
      await pg.query('update mora_rc.businesses set device_admitter_id=$1 where id=$2 and device_admitter_id is null',[identity.deviceId,businessId]);
      return identity;
    },
    service:{read:(actor,input)=>repo.read({...input,...actor})}
  });
  const call=async(action,command,{token,key}={})=>{
    const request=new Request(endpoint+'/functions/v1/mora-command',{
      method:'POST',headers:{Origin:origin,'Content-Type':'application/json',
        ...(token?{Authorization:'Bearer '+token}:{}),...(key?{'x-mora-device-key':key}:{})},
      body:JSON.stringify({action,command})
    });
    const response=await handler(request);
    return {status:response.status,body:await response.json()};
  };
  return {pg,repo,call,handler,session,businessId,userId,loginCode};
}
