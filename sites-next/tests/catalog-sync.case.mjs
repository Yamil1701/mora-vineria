import {test} from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {openWorkspaceStore,workspaceBackup,readWorkspaceBackup} from '../dist/workspace-store.js';
import {emptyData} from '../dist/local-data.js';
import {canonical} from '../dist/operations.js';
import {productDraft} from '../dist/product-model.js';
import {createSynchronizer} from '../dist/remote-client.js';
import {createCommandService,CommandError} from '../backend/command-service.js';

const businessId='11111111-1111-4111-8111-111111111111';
const userId='22222222-2222-4222-8222-222222222222';
const deviceA='33333333-3333-4333-8333-333333333333';
const deviceB='44444444-4444-4444-8444-444444444444';
const actor={userId},at='2026-11-10T21:00:00.000Z';
const product=name=>({name,variety:'Malbec',cat:'Tintos',volume:'750',volumeUnit:'ml',price:3500,target:10});
const command=(id,kind,payload)=>({id,kind,payload,at});

function server(){
 let snapshot=emptyData(),revision=0,lost=false;
 const results=new Map(),requests=[],reviews=[];
 const repository={
  read:async()=>({snapshot:structuredClone(snapshot),revision}),
  lookup:async(context,request)=>{
   const prior=results.get(request.id);
   if(prior&&canonical(prior.request)!==canonical(request))throw new CommandError('REJECTED','Identidad distinta.');
   return prior?structuredClone(prior.response):null;
  },
  commit:async(context,request,digest,next,response,basis=request.expectedRevision)=>{
   if(basis!==revision)throw new CommandError('CONFLICT','Los datos cambiaron.');
   snapshot=structuredClone(next);revision=response.revision;
   results.set(request.id,{request:structuredClone(request),response:structuredClone(response)});
   return response;
  }
 };
 repository.commitReviewed=(context,request,digest,next,response,basis)=>repository.commit(context,request,digest,next,response,basis);
 const service=createCommandService({repository});
 return {
  service,repository,results,requests,reviews,
  loseNextResponse(){lost=true;},
  client:{
   read:binding=>service.read(actor,binding),
   result:request=>service.result(actor,request),
   submit:async request=>{
    requests.push(structuredClone(request));const response=await service.submit(actor,request);
    if(lost){lost=false;throw Error('Synthetic response lost after commit');}
    return response;
   },
   review:async(request,basis)=>{
    reviews.push({request:structuredClone(request),basis});
    return service.review(actor,{...request,reviewRevision:basis});
   }
  }
 };
}

async function phone(remote,deviceId=deviceA,indexedDB=new IDBFactory()){
 const store=await openWorkspaceStore({indexedDB,name:deviceId});await store.load();
 if(!store.current().identity)await store.pair({businessId,deviceId,userId,deviceKey:'synthetic'},null);
 return {store,indexedDB,sync:createSynchronizer({store,client:remote.client})};
}

async function createProduct(phone,id,name){
 await phone.store.stage(command(id,'product-write',product(name)));
 await phone.sync.run();
}

test('two stale phones create distinct products and drain a backlog without changing any sealed request',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'first','Primero');
 for(const id of ['second','third','fourth'])await b.store.stage(command(id,'product-write',product(id)));
 const originals=b.store.current().jobs.map(job=>job.request);
 await b.sync.run();
 assert.deepEqual(b.store.current().jobs.map(job=>job.status),['confirmed','confirmed','confirmed']);
 assert.deepEqual(b.store.current().jobs.map(job=>job.request),originals);
 assert.deepEqual([...remote.results.keys()],['first','second','third','fourth']);
 assert.equal(remote.reviews.length,3);
 await a.sync.run();assert.equal(a.store.current().data.products.length,4);
 for(let n=0;n<3;n++)await b.sync.run();
 assert.equal(remote.results.size,4);
 a.store.close();b.store.close();
});

test('an existing conflict from the published app recovers its original product and subsequent jobs after reopening',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'other','Otro teléfono');
 await b.store.stage(command('old_product','product-write',product('Pendiente anterior')));
 await b.store.mark('old_product',{status:'attention',error:'Los datos cambiaron. Conservamos el registro para revisar.'});
 await b.store.stage(command('following','product-write',product('Siguiente')));
 const original=b.store.current().jobs[0].request;
 b.store.close();const reopened=await phone(remote,deviceB,b.indexedDB);
 await reopened.sync.run();
 assert.ok(reopened.store.current().jobs.every(job=>job.status==='confirmed'));
 assert.deepEqual(remote.results.get('old_product').request,original);
 assert.equal(reopened.store.current().data.products.length,3);
 a.store.close();reopened.store.close();
});

test('an edit follows unrelated catalog changes when its original product is unchanged, including after backup recovery',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'original','Original');await b.sync.run();
 const draft=productDraft(b.store.current().data.products[0]);
 await b.store.stage(command('edit','product-write',{...draft,name:'Editado'}));
 const job=b.store.current().jobs[0],raw=await workspaceBackup(b.store.current());
 assert.match(job.productBasis,/^[a-f0-9]{64}$/);
 assert.equal((await readWorkspaceBackup(raw)).workspace.jobs[0].productBasis,job.productBasis);
 await createProduct(a,'unrelated','Otro');await b.sync.run();
 assert.equal(b.store.current().jobs[0].status,'confirmed');
 assert.equal(remote.results.get('edit').response.reviewedRevision,2);
 assert.equal(b.store.current().data.products.find(p=>p.id==='original').name,'Editado');
 a.store.close();b.store.close();
});

test('concurrent edits of the same product stay pending for explicit review',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'original','Original');await b.sync.run();
 const draft=productDraft(b.store.current().data.products[0]);
 await b.store.stage(command('mine','product-write',{...draft,name:'Mi cambio'}));
 await a.store.stage(command('theirs','product-write',{...draft,name:'Otro cambio'}));await a.sync.run();
 await b.sync.run();
 const job=b.store.current().jobs[0];
 assert.equal(job.status,'attention');assert.equal(job.errorCode,'CONFLICT');
 assert.equal(remote.reviews.length,0);assert.equal(remote.results.has('mine'),false);
 assert.equal((await remote.repository.read()).snapshot.products[0].name,'Otro cambio');
 a.store.close();b.store.close();
});

test('older edits without a known product basis retain their evidence and require explicit review',async()=>{
 const remote=server(),a=await phone(remote);
 await createProduct(a,'original','Original');
 const request={...command('legacy_edit','product-write',{...productDraft(a.store.current().data.products[0]),name:'Anterior'}),businessId,deviceId:deviceB,expectedRevision:0};
 const job={id:request.id,request,status:'attention',error:'Los datos cambiaron.'};
 let writes=0;
 const sync=createSynchronizer({store:{current:()=>({identity:{businessId,deviceId:deviceB},remote:{snapshot:emptyData()},jobs:[job]}),remoteState:async()=>{}},client:{...remote.client,submit:async()=>{writes++;}}});
 await sync.run();assert.equal(writes,0);assert.equal(job.status,'attention');
 assert.equal(remote.reviews.length,0);a.store.close();
});

test('a lost response to an automatically rechecked creation recovers one durable product by its original identity',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'other','Otro');
 const review=remote.client.review;let lose=true;
 remote.client.review=async(...args)=>{const result=await review(...args);if(lose){lose=false;throw Error('Synthetic reviewed response lost');}return result;};
 await b.store.stage(command('lost_create','product-write',product('Respuesta perdida')));
 await b.sync.run();assert.equal(b.store.current().jobs[0].status,'unknown');
 b.store.close();const reopened=await phone(remote,deviceB,b.indexedDB);
 await reopened.sync.run();assert.equal(reopened.store.current().jobs[0].status,'confirmed');
 assert.equal(remote.reviews.length,1);assert.equal(remote.results.size,2);
 assert.equal(reopened.store.current().data.products.length,2);
 a.store.close();reopened.store.close();
});

test('physical movements stay for explicit review and successful review resumes following independent catalog entries',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'other','Otro');
 await b.store.stage(command('cash','movement',{kind:'contribution',amount:500,account:'cash',note:'Aporte físico'}));
 await b.store.stage(command('following','product-write',product('Después del aporte')));
 const original=b.store.current().jobs[0].request;
 await b.sync.run();assert.equal(b.store.current().jobs[0].status,'attention');
 assert.equal(remote.reviews.length,0);assert.equal(remote.results.has('cash'),false);
 assert.equal(await b.sync.review('cash'),true);
 assert.ok(b.store.current().jobs.every(job=>job.status==='confirmed'));
 assert.deepEqual(remote.results.get('cash').request,original);
 assert.equal((await remote.repository.read()).snapshot.ledger.length,1);
 a.store.close();b.store.close();
});

test('a rejected catalog write is retained and does not repeatedly auto-review on every synchronization',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'other','Otro');
 await b.store.stage(command('rejected','product-write',product('Rechazado')));
 remote.client.review=async()=>{throw new CommandError('REJECTED','Validación del servidor.');};
 await b.sync.run();const attempts=remote.requests.length;
 assert.equal(b.store.current().jobs[0].errorCode,'REJECTED');
 await b.sync.run();assert.equal(remote.requests.length,attempts);
 assert.equal(remote.results.has('rejected'),false);
 a.store.close();b.store.close();
});

test('a competing write after the safe check still fails the atomic revision check and preserves the original request',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB);
 await createProduct(a,'first','Primero');
 await b.store.stage(command('racing','product-write',product('En carrera')));
 const request=b.store.current().jobs[0].request,commitReviewed=remote.repository.commitReviewed;
 remote.repository.commitReviewed=async(...args)=>{
  await createProduct(a,'interleaved','Intercalado');
  return commitReviewed(...args);
 };
 await b.sync.run();
 assert.equal(b.store.current().jobs[0].status,'attention');
 assert.equal(remote.results.has('racing'),false);
 assert.equal(remote.results.size,2);
 assert.deepEqual(b.store.current().jobs[0].request,request);
 remote.repository.commitReviewed=commitReviewed;
 await b.sync.run();assert.equal(b.store.current().jobs[0].status,'confirmed');
 assert.equal(remote.results.size,3);
 a.store.close();b.store.close();
});

test('a concurrent duplicate barcode is rejected by the domain and stays available for correction',async()=>{
 const remote=server(),a=await phone(remote),b=await phone(remote,deviceB),barcode='7790001000019';
 await a.store.stage(command('barcode_a','product-write',{...product('Original'),barcode}));
 await a.sync.run();
 await b.store.stage(command('barcode_b','product-write',{...product('Otro'),barcode}));
 await b.sync.run();
 assert.equal(b.store.current().jobs[0].status,'attention');
 assert.equal(b.store.current().jobs[0].errorCode,'REJECTED');
 assert.match(b.store.current().jobs[0].error,/código ya pertenece/);
 assert.equal(remote.results.size,1);
 a.store.close();b.store.close();
});
