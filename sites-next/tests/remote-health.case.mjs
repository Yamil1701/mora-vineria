import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSynchronizer} from '../dist/remote-client.js';
import {emptyData} from '../dist/local-data.js';

test('remote health distinguishes in-flight, forbidden, expired, network error and later confirmed read without changing queued work',async()=>{
  const data=emptyData(),pending={id:'retained',status:'attention',request:{deviceId:'phone'}};
  const w={identity:{businessId:'synthetic',deviceId:'phone'},remote:{revision:0},jobs:[pending]};
  let outcome='FORBIDDEN',reads=0,writes=0;const observations=[];
  const store={current:()=>structuredClone(w),remoteState:async(snapshot,revision)=>{w.remote={revision};assert.deepEqual(snapshot,data);}};
  const client={read:async()=>{reads++;if(outcome)throw Object.assign(Error('Synthetic failure'),{code:outcome});return {snapshot:data,revision:1};},submit:async()=>{writes++;}};
  const sync=createSynchronizer({store,client,changed:()=>observations.push(sync.health)});
  for(const code of ['FORBIDDEN','UNAUTHENTICATED','NETWORK']){outcome=code;await sync.run();assert.equal(sync.health.errorCode,code);assert.equal(sync.health.checked,null);assert.equal(sync.health.checking,false);assert.deepEqual(w.jobs,[pending]);}
  outcome=null;await sync.run();assert.equal(sync.health.error,null);assert.equal(sync.health.errorCode,null);assert.ok(sync.health.checked);assert.equal(reads,4);assert.equal(writes,0);assert.ok(observations.some(x=>x.checking));assert.equal(observations.at(-1).checking,false);
});

import {IDBFactory} from 'fake-indexeddb';
import {createPersistence} from '../dist/persistence-controller.js';
for(const outcome of ['REJECTED','NETWORK'])test('enrollment '+outcome+': correct a rejected code, preserve an unknown attempt identity',async()=>{
  const attempts=[];let first=true;
  const fetcher=async(url,init)=>{const b=JSON.parse(init.body);if(b.action==='read')return Response.json({snapshot:emptyData(),revision:0});assert.equal(b.action,'enroll');attempts.push({command:b.command,proof:init.headers['x-mora-device-key']});if(first){first=false;if(outcome==='NETWORK')throw Error('Synthetic connection lost');return Response.json({code:'REJECTED',message:'Synthetic invalid code'},{status:422});}return Response.json({businessId:'synthetic-business',deviceId:b.command.deviceId,userId:'synthetic-user'});};
  const p=await createPersistence({config:{enabled:true,url:'https://mora-test.supabase.co',publishableKey:'sb_publishable_fixture',fetcher},storeOptions:{indexedDB:new IDBFactory(),name:'enrollment-'+outcome}});
  await p.store.setSession({access_token:'synthetic-ui-only',user:{id:'synthetic-user'}});
  await assert.rejects(p.enroll('first-synthetic-code','QA'));
  if(outcome==='REJECTED')assert.equal(p.current().enrollment,null);else assert.ok(p.current().enrollment);
  await p.enroll('corrected-synthetic-code','QA');assert.equal(p.needsEnrollment(),false);
  if(outcome==='REJECTED'){assert.equal(attempts[1].command.code,'corrected-synthetic-code');assert.notEqual(attempts[0].command.deviceId,attempts[1].command.deviceId);}
  else{assert.deepEqual(attempts[0],attempts[1]);}
  p.close();
});
