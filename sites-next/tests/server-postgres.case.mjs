import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {createCommandService} from '../backend/command-service.js';
import {createCommandHandler} from '../backend/http-handler.js';
import {emptyData,validateData} from '../dist/local-data.js';
import {seeds} from '../dist/catalog-data.js';
const pg=new PGlite();after(()=>pg.close());
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',U='33333333-3333-4333-8333-333333333333',V='44444444-4444-4444-8444-444444444444',D='55555555-5555-4555-8555-555555555555',E='66666666-6666-4666-8666-666666666666';
await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
select set_config('mora.environment','mora-isolated-dev',false);`);
await pg.exec(await fs.readFile(new URL('../backend/supabase/migrations/20261031101555_secure_command_gateway.sql',import.meta.url),'utf8'));
const initial={...emptyData(),products:[{...seeds[0],stock:0,price:3500},{...seeds[1],stock:0,price:4000}]};
await pg.query('insert into auth.users values($1),($2)',[U,V]);
await pg.query('insert into mora_rc.businesses(id,snapshot) values($1,$3),($2,$3)',[A,B,initial]);
await pg.query('insert into mora_rc.memberships(business_id,user_id) values($1,$3),($2,$4)',[A,B,U,V]);
await pg.query('insert into mora_rc.devices(business_id,id,user_id) values($1,$2,$4),($1,$3,$4)',[A,D,E,U]);
const query=(role,user,sql,params=[])=>pg.transaction(async tx=>{
  // The role is a constant in the test, never external SQL input.
  await tx.exec('set local role '+role);
  if(user)await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
  return tx.query(sql,params);
});
const repository={
  read:async c=>(await query('service_role',null,'select public.mora_rc_read($1,$2,$3) v',[c.businessId,c.deviceId,c.userId])).rows[0].v,
  lookup:async(c,r)=>(await query('service_role',null,'select public.mora_rc_lookup($1,$2,$3,$4) v',[c.businessId,c.deviceId,c.userId,r])).rows[0].v,
  commit:async(c,r,d,next,response)=>(await query('service_role',null,'select public.mora_rc_commit($1,$2,$3,$4,$5,$6,$7) v',[c.businessId,c.deviceId,c.userId,r,d,next,response])).rows[0].v
};
const service=createCommandService({repository}),actor={userId:U},context={userId:U,businessId:A,deviceId:D};
const current=()=>repository.read(context);
const command=async(id,kind,payload,deviceId=D)=>({id,kind,payload,businessId:A,deviceId,expectedRevision:(await current()).revision,at:'2026-10-31T12:00:00.000Z'});
const submit=async(id,kind,payload)=>service.submit(actor,await command(id,kind,payload));

test('actual PostgreSQL permissions deny cross-business reads and all direct browser writes',async()=>{
  const rows=(await query('authenticated',U,'select id from mora_rc.businesses')).rows;assert.deepEqual(rows,[{id:A}]);
  assert.equal((await query('authenticated',V,'select * from mora_rc.commands where business_id=$1',[A])).rows.length,0);
  await assert.rejects(query('authenticated',U,'update mora_rc.businesses set revision=9'),/permission denied/);
  await assert.rejects(query('anon',null,'select * from mora_rc.businesses'),/permission denied/);
  await assert.rejects(query('authenticated',U,'select public.mora_rc_read($1,$2,$3)',[A,D,U]),/permission denied/);
  await assert.rejects(repository.read({...context,businessId:B}),/not authorized/);
});
test('server validates and atomically confirms opening, FIFO sale, pending transfer and credit',async()=>{
  await submit('open','opening',{items:[{productId:'p1',qty:12,totalCost:17500},{productId:'p2',qty:3,totalCost:null}]});
  await submit('sale','sale',{items:[{id:'p1',qty:3,price:3500,catalogPriceAtAdd:3500}],method:'mixed',cashShare:'3000',received:5000,creditAmount:5000,customer:'QA',transferAccount:'brubank',transferVerified:false});
  const {snapshot:d}=await current();validateData(d);assert.equal(d.sales.length,1);assert.equal(d.products[0].stock,9);assert.equal(d.lots[0].remaining,9);assert.equal(d.debts[0].amount,5000);assert.equal(d.ledger.length,1);
  assert.equal(d.sales[0].items[0].costFraction.d,'1');assert.equal(d.lots[1].totalCost,null);
});
test('100 competing same-command submissions return one durable result and one effect',async()=>{
  const c=await command('abono','debt-payment',{debtId:'debt_sale',amount:2000,method:'cash'});
  const results=await Promise.all(Array.from({length:100},()=>service.submit(actor,c)));
  for(const r of results)assert.deepEqual(r,results[0]);
  const {snapshot:d}=await current();assert.equal(d.debtPayments.length,1);assert.equal(d.sales.length,1);
  assert.equal((await pg.query("select count(*)::int n from mora_rc.commands where id='abono'")).rows[0].n,1);
  await assert.rejects(service.submit(actor,{...c,payload:{...c.payload,amount:1000}}),/different content/);
});
test('two stale device commands cannot overpay a debt and the physical intention is retained by caller',async()=>{
  const one=await command('pay_a','debt-payment',{debtId:'debt_sale',amount:2000,method:'cash'}),two={...one,id:'pay_b',deviceId:E};
  const results=await Promise.allSettled([service.submit(actor,one),service.submit(actor,two)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
  const {snapshot:d}=await current();assert.equal(d.debtPayments.reduce((n,p)=>n+p.amount,0),4000);assert.equal(two.payload.amount,2000);
  await assert.rejects(submit('too_much','debt-payment',{debtId:'debt_sale',amount:1001,method:'cash'}),/saldo pendiente/);
});
test('a lost response recovers by the same ID after a fresh service instance',async()=>{
  const c=await command('lost','movement',{kind:'expense',amount:100,account:'cash',note:'QA corte'});
  await service.submit(actor,c);const reopened=createCommandService({repository});const r=await reopened.result(actor,c);
  assert.equal(r.status,'confirmed');await reopened.submit(actor,c);
  assert.equal((await current()).snapshot.ledger.filter(e=>e.source==='manual:lost').length,1);
});
test('inventory loss, unpaid receipt, partial/final payment and verification preserve all relations',async()=>{
  await submit('loss','inventory-adjustment',{productId:'p1',expectedStock:9,counted:8,reason:'Rotura QA',reasonKind:'loss',totalCost:null});
  await submit('receipt','receive',{supplier:'QA',note:'',items:[{productId:'p1',qty:6,lineCost:12000}],paid:false,account:'cash'});
  await submit('pay_receipt','receipt-payment',{receiptId:'receipt',amount:2000,account:'cash',paidConfirmed:true});
  await submit('pay_receipt_rest','receipt-payment',{receiptId:'receipt',amount:10000,account:'brubank',paidConfirmed:true});
  await submit('verify','verify-transfer',{saleNumber:'001',partId:'1'});
  const {snapshot:d}=await current();validateData(d);assert.equal(d.receipts.length,1);assert.equal(d.products[0].stock,14);assert.equal(d.receiptPayments.length,2);assert.equal(d.receipts[0].paid,false);
});
test('server commercial/account correction and goals use shared deterministic domain',async()=>{
  const before=JSON.stringify((await current()).snapshot.sales);
  await submit('correct','sale-correction',{saleId:'sale',expectedRevision:0,type:'commercial',reason:'Precio QA',items:[{id:'p1',qty:3,price:4000}],discount:0,settlement:'debt',customer:'QA',account:'cash',occurredConfirmed:false});
  await submit('account','sale-correction',{saleId:'sale',expectedRevision:1,type:'account',reason:'Cuenta QA',partId:'0',account:'mp',occurredConfirmed:true});
  await submit('goal','monthly-goal',{month:'2026-10',amount:50000});
  const {snapshot:d}=await current();assert.equal(JSON.stringify(d.sales),before);assert.equal(d.saleCorrections.length,2);assert.equal(d.monthlyGoals.length,1);validateData(d);
});
test('invalid amount, forged actor, snapshot or device cannot produce a new fact',async()=>{
  const before=await current();await assert.rejects(submit('bad','movement',{kind:'expense',amount:-1,account:'cash',note:'QA'}));
  const c=await command('forged','monthly-goal',{month:'2026-10',amount:1});
  await assert.rejects(service.submit({userId:V},{...c,userId:U,snapshot:initial}),/not authorized/);
  await assert.rejects(service.submit(actor,{...c,deviceId:'77777777-7777-4777-8777-777777777777'}),/not authorized/);
  assert.deepEqual(await current(),before);
});
test('revoked devices cannot submit or replay a previously confirmed command',async()=>{
  const c=await command('revoked','monthly-goal',{month:'2026-11',amount:100});
  await pg.query('update mora_rc.devices set revoked_at=now() where business_id=$1 and id=$2',[A,D]);
  await assert.rejects(service.submit(actor,c),/not authorized/);
  const replay=await pg.query("select request from mora_rc.commands where id='goal'");
  await assert.rejects(service.result(actor,replay.rows[0].request),/not authorized/);
  await pg.query('update mora_rc.devices set revoked_at=null where business_id=$1 and id=$2',[A,D]);
});
test('a late SQL constraint failure rolls back snapshot, result, revision and read projection',async()=>{
  const before=await current(),c=await command('rollback','monthly-goal',{month:'2026-12',amount:10});
  await assert.rejects(repository.commit(context,c,'a'.repeat(64),{...before.snapshot,products:[42]},{...c,status:'confirmed',revision:c.expectedRevision+1,result:{}}));
  assert.deepEqual(await current(),before);assert.equal(await repository.lookup(context,c),null);
});
test('HTTP boundary verifies authentication, origin, method and JSON; ignores body actor',async()=>{
  let verifies=0;const handler=createCommandHandler({service,allowedOrigin:'https://qa.example',authenticate:async token=>{verifies++;return token==='valid'?actor:null;}});
  const c=await command('http','monthly-goal',{month:'2026-12',amount:1000});
  const request=(body,token='valid',origin='https://qa.example')=>new Request('https://api.example',{method:'POST',headers:{origin,Authorization:'Bearer '+token,'Content-Type':'application/json'},body});
  assert.equal((await handler(request(JSON.stringify({action:'submit',command:c}),'invalid'))).status,401);
  assert.equal((await handler(request('{}','valid','https://evil.example'))).status,403);
  assert.equal((await handler(request('{bad'))).status,400);
  const response=await handler(request(JSON.stringify({action:'submit',userId:V,command:{...c,userId:V}})));assert.equal(response.status,200);assert.ok(verifies>=3);
  assert.equal((await handler(new Request('https://api.example'))).status,405);
});


test('revocation after server computation is rechecked atomically by the commit function',async()=>{
  const before=await current(),c=await command('revoked_race','monthly-goal',{month:'2027-01',amount:100});
  const race=createCommandService({repository:{...repository,commit:async(...args)=>{
    await pg.query('update mora_rc.devices set revoked_at=now() where business_id=$1 and id=$2',[A,D]);
    return repository.commit(...args);
  }}});
  await assert.rejects(race.submit(actor,c),/not authorized/);
  await pg.query('update mora_rc.devices set revoked_at=null where business_id=$1 and id=$2',[A,D]);
  assert.deepEqual(await current(),before);assert.equal(await repository.lookup(context,c),null);
});
test('HTTP rejects an oversized streaming request before reading the full body',async()=>{
  const handler=createCommandHandler({service,allowedOrigin:'https://qa.example',authenticate:async()=>actor});
  let pulls=0,cancelled=false;const body=new ReadableStream({pull(c){pulls++;c.enqueue(new Uint8Array(100001));},cancel(){cancelled=true;}});
  const response=await handler(new Request('https://api.example',{method:'POST',headers:{Authorization:'Bearer valid'},body,duplex:'half'}));
  assert.equal(response.status,422);assert.equal(cancelled,true);assert.ok(pulls<=5);
});

test('remote sale consumes two FIFO lots exactly and a physical shortage preserves unknown cost',async()=>{
  await submit('fifo_multi','sale',{items:[{id:'p1',qty:10,price:3500,catalogPriceAtAdd:3500}],method:'cash',received:35000});
  let d=(await current()).snapshot;assert.equal(d.products[0].stock,4);assert.equal(d.sales.at(-1).items[0].allocations.length,2);
  await assert.rejects(submit('short_unaccepted','sale',{items:[{id:'p2',qty:4,price:4000,catalogPriceAtAdd:4000}],method:'cash',received:16000}),/físicamente/);
  await submit('short_physical','sale',{items:[{id:'p2',qty:4,price:4000,catalogPriceAtAdd:4000}],method:'cash',received:16000,shortageAccepted:true,acceptanceVersion:2,shortageAcknowledgements:[{id:'p2',qty:4,stock:3,missing:1}]});
  d=(await current()).snapshot;assert.equal(d.products[1].stock,-1);assert.equal(d.sales.at(-1).items[0].unknownQty,4);assert.equal(d.sales.at(-1).items[0].costFraction,null);assert.ok(d.stockReviews.some(r=>r.saleId==='short_physical'));validateData(d);
});
test('remote orders do not change stock until partial receipt, remaining units can be explicitly closed',async()=>{
  const before=(await current()).snapshot;
  await submit('order_remote','order-create',{supplier:'QA pedido',items:[{productId:'p1',qty:6}]});
  await submit('order_sent','order-sent',{orderId:'order_remote'});
  assert.deepEqual((await current()).snapshot.products,before.products);
  await submit('order_partial','receive',{supplier:'QA pedido',orderId:'order_remote',items:[{productId:'p1',qty:2,lineCost:4000}],paid:true,account:'cash'});
  await submit('order_close','order-close',{orderId:'order_remote'});
  const d=(await current()).snapshot;assert.equal(d.products[0].stock,before.products[0].stock+2);assert.ok(d.purchaseOrders.find(o=>o.id==='order_remote').closedAt);assert.equal(d.receipts.filter(r=>r.orderId==='order_remote').length,1);validateData(d);
});
