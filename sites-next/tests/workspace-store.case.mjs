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
test('an existing local history stays local until explicit initial import, including newly prepared work',async()=>{
 const{store}=await local();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);await store.remoteState(emptyData(),0);assert.equal(store.current().remote.awaitingImport,true);
 await store.stage(op('local_before_import','movement',{kind:'expense',amount:100,account:'cash',note:'Physical local work'}));const j=store.current().jobs[0];assert.equal(j.status,'local');assert.equal(j.request.businessId,undefined);assert.equal(store.current().data.products.length,1);store.close();
});
test('restore into a bound occupied business cannot replace its authoritative history',async()=>{
 const indexedDB=new IDBFactory(),store=await openWorkspaceStore({indexedDB,name:'occupied'});await store.load();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);await store.remoteState(emptyData(),1);const before=store.current();await assert.rejects(store.restore(await readWorkspaceBackup(backupText(seed()))),/ya tiene registros/);assert.deepEqual(store.current(),before);store.close();
});
test('restoring a legacy copy into a bound empty business requires an explicit initial import',async()=>{
 const indexedDB=new IDBFactory(),store=await openWorkspaceStore({indexedDB,name:'bound-restore'});await store.load();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);await store.restore(await readWorkspaceBackup(backupText(seed())));assert.equal(store.current().remote.awaitingImport,true);assert.equal(store.current().data.products.length,1);store.close();
});
test('two independent IndexedDB connections preserve separate prepared effects atomically',async()=>{
 const indexedDB=new IDBFactory(),a=await openWorkspaceStore({indexedDB,name:'two'}),b=await openWorkspaceStore({indexedDB,name:'two'});await a.load();await b.load();await Promise.all([a.stage(op('a','movement',{kind:'contribution',amount:100,account:'cash',note:'A'})),b.stage(op('b','movement',{kind:'expense',amount:20,account:'cash',note:'B'}))]);const end=await a.load();assert.equal(end.jobs.length,2);assert.equal(end.data.ledger.length,2);assert.equal(end.data.ledger.flatMap(e=>e.legs).reduce((n,l)=>n+l.amount,0),80);a.close();b.close();
});
test('a confirmed sale keeps its receipt context when another device assigned the next number first',async()=>{
 const{store}=await local();await store.stage(op('open_ctx','opening',{items:[{productId:'p1',qty:4,totalCost:8000}]}));
 const base=store.current().data;await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);await store.remoteState(base,0);
 // Pairing an existing local dataset requires an import; emulate its verified completion for this projection regression.
 const indexedDB=new IDBFactory();store.close();const remote=await openWorkspaceStore({indexedDB,name:'numbering'});await remote.load();await remote.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);await remote.remoteState(base,1);
 const payload={items:[{id:'p1',qty:1,price:3500,catalogPriceAtAdd:3500}],method:'cash',received:3500};await remote.stage(op('mine','sale',payload),{finish:(d,r,out)=>{d.workState={page:'done',completedNumber:out.saleNumber};}});const sealed=remote.current().jobs[0].request;
 const server=structuredClone(base);applyCommand(server,op('other','sale',payload));applyCommand(server,op('mine','sale',payload));await remote.confirmed('mine',{...sealed,status:'confirmed',revision:3,result:{saleNumber:'002'}});await remote.remoteState(server,3);assert.equal(remote.current().data.workState.completedNumber,'002');assert.equal(remote.current().data.sales.find(s=>s.number==='002').id,'mine');remote.close();
});
test('large valid product photos survive durable storage and a checksummed backup; excessive files are rejected',async()=>{
 const{store}=await local();const d=seed();d.products[0].photo='data:image/jpeg;base64,'+'A'.repeat(80000);const target=await openWorkspaceStore({indexedDB:new IDBFactory(),name:'photo'});await target.load();await target.restore(await readWorkspaceBackup(backupText(d)));const raw=await workspaceBackup(target.current());assert.equal((await readWorkspaceBackup(raw)).data.products[0].photo,d.products[0].photo);await assert.rejects(readWorkspaceBackup(' '.repeat(30000001)),/30 MB/);store.close();target.close();
});
test('incompatible workspace can be copied read-only for assistance without exporting the device identity or session',async()=>{
 const indexedDB=new IDBFactory(),name='corrupt',store=await openWorkspaceStore({indexedDB,name});await store.load();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'PRIVATE_CORRUPT_DEVICE'},{access_token:'PRIVATE_CORRUPT_AUTH'});store.close();
 const db=await new Promise((r,j)=>{const q=indexedDB.open(name);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});await new Promise((r,j)=>{const tx=db.transaction('workspace','readwrite'),t=tx.objectStore('workspace'),q=t.get('current');q.onsuccess=()=>{const w=q.result;w.version=99;t.put(w,'current');};tx.oncomplete=r;tx.onabort=()=>j(tx.error);});db.close();
 const reopened=await openWorkspaceStore({indexedDB,name});await assert.rejects(reopened.load(),/recuperación/);reopened.close();const{rawWorkspaceCopy}=await import('../dist/workspace-store.js');const raw=await rawWorkspaceCopy({indexedDB,name});assert.doesNotMatch(raw,/PRIVATE_CORRUPT/);assert.equal(JSON.parse(raw).workspace.version,99);assert.equal(JSON.parse(raw).needsAssistance,true);await assert.rejects(readWorkspaceBackup(raw));
});

test('a lost product-create response remains unknown until its matching result, without replaying the same creation into the remote snapshot',async()=>{
 const indexedDB=new IDBFactory(),store=await openWorkspaceStore({indexedDB,name:'lost-product-create'});await store.load();await store.pair({businessId:'b',deviceId:'d',userId:'u',deviceKey:'private'},null);
 await store.stage(op('new_product_lost','product-write',{name:'QA',variety:'Malbec',cat:'Tintos',volume:'750',volumeUnit:'ml',price:3500,target:10}));
 const request=store.current().jobs[0].request,server=emptyData(),result=applyCommand(server,request);await store.mark(request.id,{status:'unknown'});await store.remoteState(server,1);
 assert.equal(store.current().jobs[0].status,'unknown');assert.equal(store.current().data.products.length,1);assert.equal(store.current().jobs[0].projectionError,null);
 let submissions=0;const sync=createSynchronizer({store,client:{read:async()=>({snapshot:server,revision:1}),result:async()=>({...request,status:'confirmed',revision:1,result}),submit:async()=>{submissions++;throw Error('Must recover the original result');}}});
 await sync.run();assert.equal(store.current().jobs[0].status,'confirmed');assert.equal(submissions,0);assert.equal(store.current().data.products.length,1);store.close();
});
