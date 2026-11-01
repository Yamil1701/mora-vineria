// Development operator only. Never import into dist/ or a browser bundle.
import fs from'node:fs/promises';import{resolve,dirname}from'node:path';import{fileURLToPath}from'node:url';import{randomUUID,randomBytes,createHash}from'node:crypto';import{emptyData}from'../dist/local-data.js';
const URL='https://dedcvvgiuxpwdzqqdifn.supabase.co',hash=s=>createHash('sha256').update(s).digest('hex'),literal=s=>"'"+String(s).replaceAll("'","''")+"'";
export function bootstrapSQL(f){
 if(!f.run||f.users.length!==3||!f.users.every(u=>u.session?.user?.app_metadata?.mora_synthetic_run===f.run&&!u.session.user.is_anonymous))throw Error('Only authenticated synthetic fixtures can be provisioned.');
 const rows=['begin;'];for(const id of f.businesses)rows.push(`insert into mora_rc.businesses(id,snapshot)values(${literal(id)}::uuid,${literal(JSON.stringify(emptyData()))}::jsonb);`);
 for(const [n,b]of[[0,0],[1,0],[2,1]])rows.push(`insert into mora_rc.memberships(business_id,user_id)values(${literal(f.businesses[b])}::uuid,${literal(f.created[n].id)}::uuid);`);
 for(const x of [...f.devices,...f.ui]){const business=x.businessIndex??(x.userIndex===2?1:0),actor=f.created[x.userIndex].id;rows.push(`insert into mora_rc.enrollments(code_hash,business_id,user_id,expires_at)select ${literal(hash(x.code))},${literal(f.businesses[business])}::uuid,id,now()+interval '1 day' from auth.users where id=${literal(actor)}::uuid and raw_app_meta_data->>'mora_synthetic_run'=${literal(f.run)};`);}
 rows.push('commit;');return rows.join('\n');
}
export async function prepareSynthetic({request}){
 const run=randomUUID(),f={run,users:[],created:[],businesses:[randomUUID(),randomUUID()],devices:[],ui:[],uiLoginLinks:[]};
 for(let i=0;i<3;i++){const email=`mora.qa.${run}.${i}@example.invalid`,user=await request('admin/users',{email,email_confirm:true,app_metadata:{mora_synthetic_run:run}});if(!user.id)throw Error('Synthetic Auth user was not created.');const link=await request('admin/generate_link',{type:'magiclink',email}),session=await request('verify',{token_hash:link.hashed_token,type:'email'},false);if(session.user?.id!==user.id||session.user?.is_anonymous)throw Error('Synthetic Auth proof failed.');f.users.push({email,session});f.created.push({email,id:user.id});}
 for(const [userIndex,businessIndex]of[[0,0],[0,0],[1,0],[2,1],[0,0]])f.devices.push({id:randomUUID(),key:randomBytes(32).toString('hex'),code:randomBytes(24).toString('hex'),userIndex,businessIndex});
 for(const userIndex of[0,0,2,2])f.ui.push({userIndex,code:randomBytes(24).toString('hex')});
 for(const i of[0,2]){const email=f.users[i].email,link=await request('admin/generate_link',{type:'magiclink',email});f.uiLoginLinks.push({email,token_hash:link.hashed_token});}
 return f;
}
async function main(){
 if(process.env.MORA_ENVIRONMENT!=='mora-isolated-dev')throw Error('Explicit Mora development environment required.');
 const output=resolve(process.env.MORA_HOSTED_FIXTURE||'');const repo=resolve(dirname(fileURLToPath(import.meta.url)),'../..');if(!process.env.MORA_HOSTED_FIXTURE||output.startsWith(repo+'/'))throw Error('Choose a private fixture path outside the repository.');
 const publicKey=process.env.MORA_QA_PUBLISHABLE_KEY;if(!publicKey?.startsWith('sb_publishable_'))throw Error('Missing public test configuration.');
 await fs.mkdir(dirname(output),{recursive:true,mode:0o700});
 if(process.argv.includes('--prepare')){
  if(await fs.stat(output).then(()=>true,()=>false))throw Error('Fixture already exists. Preserve it; choose another path for a fresh run.');const secret=process.env.MORA_QA_SERVER_KEY;if(!secret)throw Error('Server-only operator credential required.');
  const request=async(path,body,admin=true)=>{const key=admin?secret:publicKey;const r=await fetch(URL+'/auth/v1/'+path,{method:'POST',headers:{apikey:key,'Content-Type':'application/json',...(admin&&key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)});if(!r.ok)throw Error('Synthetic Auth setup failed: '+r.status);return r.json();};
  const f=await prepareSynthetic({request});await fs.writeFile(output,JSON.stringify(f),{mode:0o600});await fs.writeFile(output+'.seed.sql',bootstrapSQL(f),{mode:0o600});await fs.writeFile(resolve(dirname(output),'public-key.json'),JSON.stringify({url:URL,publishableKey:publicKey}),{mode:0o600});console.log('Synthetic identities prepared. Apply the private seed SQL to the verified Mora RC schema, then run --enroll. No email was sent.');
 }else if(process.argv.includes('--enroll')){
  const f=JSON.parse(await fs.readFile(output,'utf8'));bootstrapSQL(f);
  for(const d of f.devices){const r=await fetch(URL+'/functions/v1/mora-command',{method:'POST',headers:{apikey:publicKey,Authorization:'Bearer '+f.users[d.userIndex].session.access_token,'Content-Type':'application/json','x-mora-device-key':d.key,Origin:'https://127.0.0.1:8443'},body:JSON.stringify({action:'enroll',command:{deviceId:d.id,code:d.code,label:'Synthetic QA '+d.userIndex}})});if(!r.ok)throw Error('Synthetic enrollment failed: '+r.status);d.binding=await r.json();await fs.writeFile(output,JSON.stringify(f),{mode:0o600});}console.log('Five synthetic devices enrolled; fixture remains private.');
 }else throw Error('Use --prepare or --enroll.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
