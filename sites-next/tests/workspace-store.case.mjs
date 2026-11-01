import {test} from 'node:test';import assert from 'node:assert/strict';import{IDBFactory}from'fake-indexeddb';
import{openWorkspaceStore,workspaceBackup,readWorkspaceBackup}from'../dist/workspace-store.js';import{emptyData,backupText}from'../dist/local-data.js';import{seeds}from'../dist/catalog-data.js';import{applyCommand}from'../dist/command-domain.js';import{createSynchronizer}from'../dist/remote-client.js';
const at='2026-10-31T12:00:00Z',seed=()=>({...emptyData(),products:[{...seeds[0],stock:0,price:3500}]});
const op=(id,kind,payload)=>({id,kind,payload,at});
async function local(fault){const indexedDB=new IDBFactory(),store=await openWorkspaceStore({indexedDB,name:'qa',fault});await store.load();await store.migrateLegacy(seed(),'synthetic');return {store,indexedDB};}
test('IndexedDB retains a stable workspace identity, prepares and confirms a local effect exactly once',async()=>{
 let {store,indexedDB}=await local();const ns=store.current().sourceNamespace,c=op('one','movement',{kind:'expense',amount:100,account:'cash',note:'QA'});
 for(let i=0;i<100;i++)await store.stage(c);assert.equal(store.current().data.ledger.length,1);assert.equal(store.current().jobs.length,1);store.close();store=await openWorkspaceStore({indexedDB,name:'qa'});await store.load();assert.equal(store.current().sourceNamespace,ns);assert.equal(store.current().data.ledger[0].legs[0].amount,-100);store.close();
});
test('interruption after durable preparation recovers once after reopening',async()=>{
 let enabled=false,count=0;let {store,indexedDB}=await local(()=>{if(enabled&&++count===2)throw Error('Interrupted');});enabled=true;
 await assert.rejects(store.stage(op('cut','movement',{kind:'contribution',amount:500,account:'cash',note:'QA'})),/Interrupted/);assert.equal(store.current().jobs[0].status,'prepared');assert.equal(store.current().data.ledger.length,0);store.close();store=await openWorkspaceStore({indexedDB,name:'qa'});await store.load();await store.resumePrepared();await store.resumePrepared();assert.equal(store.current().data.ledger.length,1);store.close();
});
test('quota or storage failure rolls back the entire attempted write',async()=>{
 let blocked=false;const {store}=await local(()=>{if(blocked)throw new DOMException('Full','QuotaExceededError');});const before=store.current();blocked=true;
 await assert.rejects(store.stage(op('quota','movement',{kind:'expense',amount:20,account:'cash',note:'QA'})),/Full/);assert.deepEqual(await store.load(),before);store.close();
});
test('draft saves cannot smuggle business changes and changed command contents cannot reuse an ID',async()=>{
 const {store}=await local();await assert.rejects(store.draft({products:[]}),/propio registro/);const c=op('sealed','monthly-goal',{month:'2026-10',amount:5000});await store.stage(c);await assert.rejects(store.stage({...c,payload:{month:'2026-10',amount:9000}}),/otro registro/);assert.equal(store.current().data.monthlyGoals[0].amount,5000);store.close();
});
test('workspace backup includes pending evidence but never sessions or device credentials',async()=>{
 const indexedDB=new IDBFactory(),store=await openWorkspaceStore({indexedDB,name:'backup'});await store.load();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'PRIVATE_DEVICE_KEY'},{access_token:'PRIVATE_ACCESS',refresh_token:'PRIVATE_REFRESH',user:{id:'u'}});
 await store.stage(op('pending','monthly-goal',{month:'2026-10',amount:1000}));const raw=await workspaceBackup(store.current());assert.doesNotMatch(raw,/PRIVATE_/);const parsed=await readWorkspaceBackup(raw);assert.equal(parsed.workspace.jobs[0].status,'pending');assert.deepEqual(parsed.data,store.current().data);
 await assert.rejects(readWorkspaceBackup(raw.replace('1000','2000')),/cambió/);const target=await openWorkspaceStore({indexedDB,name:'restore'});await target.load();await target.restore(parsed);assert.equal(target.current().jobs[0].status,'attention');assert.equal(target.current().jobs[0].evidence.kind,'monthly-goal');await assert.rejects(target.restore(parsed),/ya tiene datos/);store.close();target.close();
});
test('v5 restore, v3/v4 readers and checkpoint remain compatible without replacing the source',async()=>{
 const {store,indexedDB}=await local();const raw=backupText(store.current().data);const target=await openWorkspaceStore({indexedDB,name:'empty'});await target.load();await target.restore(await readWorkspaceBackup(raw));assert.deepEqual(target.current().data,store.current().data);assert.equal(JSON.parse(await target.prior()).data.products.length,0);store.close();target.close();
});
test('lost remote response is recovered with the same request and one persisted effect',async()=>{
 const indexedDB=new IDBFactory(),store=await openWorkspaceStore({indexedDB,name:'sync'});await store.load();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);
 let server=emptyData(),revision=0,calls=0,lost=true;const results=new Map();const client={read:async()=>({snapshot:server,revision}),result:async r=>results.get(r.id)||null,submit:async r=>{calls++;applyCommand(server,r);revision++;const answer={...r,status:'confirmed',revision,result:server.operations.at(-1)?.result};results.set(r.id,answer);if(lost){lost=false;throw Error('Response lost');}return answer;}};
 await store.stage(op('remote','monthly-goal',{month:'2026-10',amount:1000}));const sync=createSynchronizer({store,client});await sync.run();assert.equal(store.current().jobs[0].status,'unknown');await sync.run();assert.equal(store.current().jobs[0].status,'confirmed');assert.equal(calls,1);assert.equal(server.monthlyGoals.length,1);assert.equal(store.current().data.monthlyGoals.length,1);store.close();
});
test('pending creation and a cart survive a remote refresh before that creation is confirmed',async()=>{
 const indexedDB=new IDBFactory(),store=await openWorkspaceStore({indexedDB,name:'cart'});await store.load();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);
 await store.stage(op('new_product','product-write',{name:'QA',variety:'Malbec',cat:'Tintos',volume:'750',volumeUnit:'ml',price:3500,target:10}));await store.draft({cart:{new_product:1},cartPrices:{new_product:{catalogPriceAtAdd:3500,appliedUnitPrice:3500}}});await store.remoteState(emptyData(),0);assert.equal(store.current().data.products.length,1);assert.equal(store.current().data.cart.new_product,1);store.close();
});
