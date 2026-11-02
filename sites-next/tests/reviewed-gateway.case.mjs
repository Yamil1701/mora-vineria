import {test,after}from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';import{PGlite}from'@electric-sql/pglite';import{emptyData,validateData,backupText}from'../dist/local-data.js';import{createCommandService,requestDigest}from'../backend/command-service.js';import{applyCommand}from'../dist/command-domain.js';import{seeds}from'../dist/catalog-data.js';
const pg=new PGlite();after(()=>pg.close());
const B='11111111-1111-4111-8111-111111111111',U='22222222-2222-4222-8222-222222222222',D='33333333-3333-4333-8333-333333333333',S='44444444-4444-4444-8444-444444444444';
await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create table auth.sessions(id uuid,user_id uuid,not_after timestamptz);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;grant usage on schema auth to authenticated,service_role;select set_config('mora.environment','mora-isolated-dev',false);`);
for(const name of ['20261031101555_secure_command_gateway.sql','20261101014012_rc2_device_enrollment_and_auth_hardening.sql','20261101032050_rc2_reviewed_commands_and_session_validation.sql'])await pg.exec(await fs.readFile(new URL('../backend/supabase/migrations/'+name,import.meta.url),'utf8'));
await pg.query('insert into auth.users values($1)',[U]);await pg.query('insert into auth.sessions values($1,$2,null)',[S,U]);await pg.query('insert into mora_rc.businesses(id,snapshot)values($1,$2)',[B,emptyData()]);await pg.query('insert into mora_rc.memberships values($1,$2,null)',[B,U]);await pg.query('insert into mora_rc.devices(business_id,id,user_id)values($1,$2,$3)',[B,D,U]);
const rpc=async(name,args)=>(await pg.transaction(async tx=>{await tx.exec('set local role service_role');return tx.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) v`,args);})).rows[0].v;
const repository={read:c=>rpc('mora_rc_read',[B,D,U]),lookup:(c,r)=>rpc('mora_rc_lookup',[B,D,U,r]),commit:(c,r,h,n,a)=>rpc('mora_rc_commit',[B,D,U,r,h,n,a]),commitReviewed:(c,r,h,n,a,b)=>rpc('mora_rc_commit_reviewed',[B,D,U,r,h,n,a,b])};const service=createCommandService({repository}),actor={userId:U};
const c=(id,amount,expectedRevision=0)=>({id,kind:'monthly-goal',payload:{month:'2026-11',amount},expectedRevision,businessId:B,deviceId:D,at:'2026-11-01T12:00:00.000Z'});
test('reviewed commit keeps the sealed command and atomically checks a fresh review basis',async()=>{
 await service.submit(actor,c('first',1000));const original=c('delayed',2000);await assert.rejects(service.submit(actor,original),/cambiaron/);await assert.rejects(service.review(actor,{...original,reviewRevision:0}),/cambiaron/);
 const r=await service.review(actor,{...original,reviewRevision:1});assert.equal(r.revision,2);assert.equal(r.expectedRevision,0);assert.equal(r.reviewedRevision,1);assert.deepEqual(await service.result(actor,original),r);assert.deepEqual(await service.submit(actor,original),r);
 await assert.rejects(service.review(actor,{...original,payload:{...original.payload,amount:9},reviewRevision:2}),/different content/);assert.equal((await repository.read()).revision,2);
});
test('session check denies missing, another user, expired and logged-out sessions without browser grants',async()=>{
 assert.equal(await rpc('mora_rc_session_valid',[U,S]),true);assert.equal(await rpc('mora_rc_session_valid',[B,S]),false);await pg.query("update auth.sessions set not_after=now()-interval '1 second'");assert.equal(await rpc('mora_rc_session_valid',[U,S]),false);await pg.query('delete from auth.sessions');assert.equal(await rpc('mora_rc_session_valid',[U,S]),false);
 await assert.rejects(pg.transaction(async tx=>{await tx.exec('set local role authenticated');return tx.query('select public.mora_rc_session_valid($1,$2)',[U,S]);}),/permission denied/);
});
test('a delayed sale does not take cost from lots received after the physical sale',()=>{
 const d={...emptyData(),products:[{...seeds[0],stock:0,price:3500}]};applyCommand(d,{id:'later',kind:'receive',payload:{supplier:'QA',items:[{productId:'p1',qty:4,lineCost:8000}],paid:false},at:'2026-11-01T18:00:00Z'});
 applyCommand(d,{id:'earlier',kind:'sale',payload:{items:[{id:'p1',qty:1,price:3500,catalogPriceAtAdd:3500}],method:'cash',received:3500},at:'2026-11-01T12:00:00Z'});assert.equal(d.sales[0].items[0].unknownQty,1);assert.equal(d.sales[0].items[0].costFraction,null);assert.equal(d.lots[0].remaining,4);assert.equal(d.products[0].stock,3);validateData(d);
});
test('an identical command committed between first lookup and read returns its durable result instead of a false conflict',async()=>{
 const request=c('lookup_read_race',3000,2);let lookups=0;const durable={...request,status:'confirmed',revision:3,result:{month:'2026-11'}};
 const race=createCommandService({repository:{lookup:async()=>++lookups===1?null:durable,read:async()=>({snapshot:emptyData(),revision:3}),commit:async()=>{throw Error('Must not write twice');}}});
 assert.deepEqual(await race.submit(actor,request),durable);assert.equal(lookups,2);
});
