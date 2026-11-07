import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDeviceSessionIssuer} from '../backend/device-admission.js';
import {admissionFixture,endpoint,hash} from './device-admission-fixture.mjs';

test('only the designated phone can admit or revoke, even with the same Auth account',async t=>{
  const f=await admissionFixture('https://localhost:8443');
  t.after(()=>f.pg.close());
  const owner={token:f.session().access_token,key:'a'.repeat(64)},principal=randomUUID();
  assert.equal((await f.call('enroll',{deviceId:principal,code:f.loginCode,label:'Yamil'},owner)).status,200);
  const binding={businessId:f.businessId,deviceId:principal};
  const manage=(op,fields={})=>f.call('manage-devices',{...binding,op,...fields},owner);
  const secondary={key:'b'.repeat(64)},deviceId=randomUUID(),otherId=randomUUID();
  const pair=(op,code,id=deviceId,credentials=secondary)=>f.call('pair-device',{op,code,deviceId:id,label:'Otro celular'},credentials);
  assert.equal((await manage('list')).body.canAdmit,true);
  assert.equal((await f.call('manage-devices',{...binding,op:'issue'},{token:owner.token,key:secondary.key})).status,403);
  assert.equal((await f.call('manage-devices',{...binding,op:'issue'},{key:owner.key})).status,401);
  assert.equal((await f.call('manage-devices',{...binding,op:'issue',businessId:randomUUID()},owner)).status,403);
  const first=(await manage('issue')).body.code;
  assert.match(first,/^[a-f0-9]{32}$/);
  const request=await pair('request',first);
  assert.match(request.body.confirmation,/^\d{4}$/);
  assert.equal((await pair('claim',first)).body.state,'requested');
  assert.equal((await pair('request',first,otherId,{key:'c'.repeat(64)})).body.state,'expired');
  assert.equal((await pair('status',first,deviceId,{key:'c'.repeat(64)})).body.state,'expired');
  assert.equal((await manage('status',{code:first})).body.confirmation,request.body.confirmation);
  assert.equal((await manage('approve',{code:first})).body.state,'approved');
  const joined=(await pair('claim',first)).body;
  assert.equal(joined.state,'linked');
  assert.equal(joined.userId,f.userId);
  assert.equal(joined.deviceId,deviceId);
  assert.notEqual(joined.session.access_token,owner.token);
  secondary.token=joined.session.access_token;
  const clientBinding={businessId:f.businessId,deviceId};
  assert.deepEqual((await f.call('manage-devices',{...clientBinding,op:'list'},secondary)).body,{canAdmit:false});
  for(const op of ['issue','approve','cancel','revoke']){
    assert.equal((await f.call('manage-devices',{...clientBinding,op,code:first,targetId:principal},secondary)).status,403);
  }
  assert.equal((await pair('claim',first,deviceId,{key:secondary.key})).body.deviceId,deviceId);
  assert.equal((await manage('status',{code:first})).body.state,'linked');
  assert.equal((await manage('list')).body.devices.length,2);
  assert.equal((await f.call('read',clientBinding,secondary)).status,200);
  assert.equal((await manage('revoke',{targetId:deviceId})).status,200);
  assert.equal((await f.call('read',clientBinding,secondary)).status,403);
  assert.equal((await pair('claim',first,deviceId,{key:secondary.key})).status,403);
  assert.equal((await f.call('read',binding,owner)).status,200);
  const canceled=(await manage('issue')).body.code;
  assert.equal((await manage('cancel',{code:canceled})).body.state,'expired');
  assert.equal((await pair('request',canceled,otherId,{key:'c'.repeat(64)})).body.state,'expired');
  const expired=(await manage('issue')).body.code;
  await f.pg.query("update mora_rc.device_pairings set expires_at=now()-interval '1 minute' where code_hash=$1",[hash(expired)]);
  assert.equal((await pair('request',expired,otherId,{key:'c'.repeat(64)})).body.state,'expired');
  const old=(await manage('issue')).body.code;
  const renewed=(await manage('issue')).body.code;
  assert.equal((await pair('request',old,otherId,{key:'c'.repeat(64)})).body.state,'expired');
  await f.pg.query('update mora_rc.businesses set device_admitter_id=null where id=$1',[f.businessId]);
  assert.equal((await pair('request',renewed,otherId,{key:'c'.repeat(64)})).body.state,'expired');
  assert.equal((await manage('issue')).status,403);
  await assert.rejects(f.pg.transaction(async tx=>{
    await tx.exec('set local role authenticated');
    return tx.query('select snapshot from mora_rc.businesses');
  }),/permission denied/);
});

test('device Auth broker exchanges a magic link for the exact existing user inside Edge',async()=>{
  const userId=randomUUID(),email='fixture@example.invalid',calls=[];
  const issuer=createDeviceSessionIssuer({url:endpoint,secret:'fixture-secret',publicKey:'fixture-public',fetcher:async(url,options)=>{
    const path=new URL(url).pathname;
    calls.push(path);
    if(path.endsWith(userId)){
      assert.equal(options.headers.apikey,'fixture-secret');
      return Response.json({id:userId,email,email_confirmed_at:'2026-11-07'});
    }
    if(path.endsWith('generate_link')){
      assert.deepEqual(JSON.parse(options.body),{type:'magiclink',email});
      return Response.json({id:userId,hashed_token:'d'.repeat(64)});
    }
    assert.equal(options.headers.apikey,'fixture-public');
    assert.deepEqual(JSON.parse(options.body),{type:'email',token_hash:'d'.repeat(64)});
    return Response.json({user:{id:userId},access_token:'new-access',refresh_token:'new-refresh'});
  }});
  const session=await issuer(userId);
  assert.equal(session.access_token,'new-access');
  assert.ok(session.expires_at>Math.floor(Date.now()/1000));
  assert.equal(calls.length,3);
});
