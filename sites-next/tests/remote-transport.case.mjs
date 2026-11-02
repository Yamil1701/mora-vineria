import {test} from 'node:test';
import assert from 'node:assert/strict';
import {supabaseDevTransport,createRemoteQueue} from '../dist/remote-queue.js';
const options={url:'https://mora-test.supabase.co',publishableKey:'sb_publishable_fixture',accessToken:async()=>'synthetic-session'};
test('prepared Edge transport uses a personal bearer and only submits the command envelope',async()=>{
  const requests=[],t=supabaseDevTransport({...options,fetcher:async(url,init)=>{requests.push({url,...init});return Response.json({id:'one'});}});
  await t.result({id:'one'});await t.submit({id:'one'});
  assert.ok(requests.every(r=>r.url===options.url+'/functions/v1/mora-command'));
  assert.deepEqual(requests.map(r=>JSON.parse(r.body).action),['result','submit']);
  assert.equal(requests[0].headers.Authorization,'Bearer synthetic-session');
  assert.throws(()=>supabaseDevTransport({...options,publishableKey:'sb_secret_forbidden'}));
  assert.throws(()=>supabaseDevTransport({...options,publishableKey:'eyJlegacyPrivilegedAmbiguous'}));
});
test('transport classifies rejected, changed and unknown outcomes without claiming confirmation',async()=>{
  for(const [status,code] of [[401,'REJECTED'],[403,'REJECTED'],[409,'CONFLICT'],[422,'REJECTED'],[503,'UNKNOWN']]){
    const t=supabaseDevTransport({...options,fetcher:async()=>Response.json({message:'QA'},{status})});
    await assert.rejects(t.submit({id:'x'}),e=>e.code===code);
  }
  let calls=0;const t=supabaseDevTransport({...options,accessToken:async()=>null,fetcher:()=>{calls++;}});
  await assert.rejects(t.submit({}),/Ingresá/);assert.equal(calls,0);
});
test('an old prepared remote job without a sealed date is preserved for review, never sent',async()=>{
  let calls=0;const key='mora.dev.outbox.v1:b:d',map=new Map([[key,JSON.stringify([{id:'old',request:{id:'old'},physicalEvidence:{paid:true},status:'device-saved'}])]]);
  const q=createRemoteQueue({storage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},businessId:'b',deviceId:'d',transport:{result(){calls++;}}});
  const r=await q.syncOne('old');assert.equal(r.status,'needs-attention');assert.equal(r.physicalEvidence.paid,true);assert.equal(calls,0);
});
