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
