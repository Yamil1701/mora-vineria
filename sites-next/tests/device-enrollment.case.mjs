import {test,after} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import{PGlite}from'@electric-sql/pglite';import{emptyData}from'../dist/local-data.js';
const pg=new PGlite();after(()=>pg.close());const B='11111111-1111-4111-8111-111111111111',U='22222222-2222-4222-8222-222222222222',V='33333333-3333-4333-8333-333333333333',D='44444444-4444-4444-8444-444444444444',E='55555555-5555-4555-8555-555555555555';
await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('is_anonymous',coalesce(nullif(current_setting('request.jwt.claim.is_anonymous',true),''),'false')::boolean)$$;grant usage on schema auth to authenticated;select set_config('mora.environment','mora-isolated-dev',false);`);
for(const name of ['20261031101555_secure_command_gateway.sql','20261101014012_rc2_device_enrollment_and_auth_hardening.sql','20261101043103_rc2_enrollment_foreign_key_indexes.sql'])await pg.exec(await fs.readFile(new URL('../backend/supabase/migrations/'+name,import.meta.url),'utf8'));
await pg.query('insert into auth.users values($1),($2)',[U,V]);await pg.query('insert into mora_rc.businesses(id,snapshot)values($1,$2)',[B,emptyData()]);await pg.query('insert into mora_rc.memberships values($1,$2,null)',[B,U]);await pg.query("insert into mora_rc.enrollments(code_hash,business_id,user_id,expires_at)values($1,$2,$3,now()+interval '1 day')",['a'.repeat(64),B,U]);
const server=(sql,args=[])=>pg.transaction(async tx=>{await tx.exec('set local role service_role');return tx.query(sql,args);});
test('one-use device enrollment has a recoverable result and cannot be reused for another device or user',async()=>{
 const args=[U,'a'.repeat(64),D,'b'.repeat(64),'QA'];const one=await server('select public.mora_rc_enroll($1,$2,$3,$4,$5) v',args);assert.equal(one.rows[0].v.deviceId,D);assert.deepEqual((await server('select public.mora_rc_enroll($1,$2,$3,$4,$5) v',args)).rows,one.rows);
 await assert.rejects(server('select public.mora_rc_enroll($1,$2,$3,$4,$5)',[U,'a'.repeat(64),E,'b'.repeat(64),'QA']),/already used/);await assert.rejects(server('select public.mora_rc_enroll($1,$2,$3,$4,$5)',[V,'a'.repeat(64),E,'b'.repeat(64),'QA']),/unavailable/);
 assert.equal((await pg.query('select count(*)::int n from mora_rc.devices')).rows[0].n,1);
});
test('device access requires current membership, proof and non-revoked device',async()=>{
 assert.equal((await server('select public.mora_rc_device_access($1,$2,$3,$4) ok',[B,D,U,'b'.repeat(64)])).rows[0].ok,true);
 await assert.rejects(server('select public.mora_rc_device_access($1,$2,$3,$4)',[B,D,U,'c'.repeat(64)]),/credential/);
 await pg.query('update mora_rc.devices set revoked_at=now() where id=$1',[D]);await assert.rejects(server('select public.mora_rc_device_access($1,$2,$3,$4)',[B,D,U,'b'.repeat(64)]),/not authorized/);
 await assert.rejects(server('select public.mora_rc_enroll($1,$2,$3,$4,$5)',[U,'a'.repeat(64),D,'b'.repeat(64),'QA']),/not authorized/);
});
test('anonymous Auth claim cannot read even with a matching membership; browser cannot enroll by direct SQL',async()=>{
 await pg.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[U]);assert.equal((await tx.query('select * from mora_rc.businesses')).rows.length,1);await tx.exec("select set_config('request.jwt.claim.is_anonymous','true',true)");assert.equal((await tx.query('select * from mora_rc.businesses')).rows.length,0);});
 await assert.rejects(pg.transaction(async tx=>{await tx.exec('set local role authenticated');return tx.query('select * from mora_rc.enrollments');}),/permission denied/);
});

test('incremental enrollment indexes cover both composite foreign keys without changing permissions',async()=>{
 const rows=(await pg.query("select indexname,indexdef from pg_indexes where schemaname='mora_rc' and tablename='enrollments' and indexname<>'enrollments_pkey' order by indexname")).rows;assert.equal(rows.length,2);assert.ok(rows.some(r=>r.indexdef.includes('(business_id, used_device)')));assert.ok(rows.some(r=>r.indexdef.includes('(business_id, user_id)')));
});
