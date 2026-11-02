import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,createLocalStore,backupText,readBackup} from '../dist/local-data.js';
import {prepareOperation,applyOperation} from '../dist/operations.js';
import {seeds} from '../dist/catalog-data.js';
import {monthLabel,rangeLabel} from '../dist/display-dates.js';
import {buildReport,reportRange} from '../dist/reports-model.js';

const memory=()=>{const m=new Map();return {m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
const sample=()=>({...emptyData(),products:[{...seeds[0],stock:0,price:3500}]});
const run=(d,id,kind,payload,at='2026-10-31T12:00:00Z')=>{prepareOperation(d,{id,kind,payload,at});return applyOperation(d,id);};

test('legacy and candidate writers cannot replace each other’s snapshots',()=>{
  const s=memory(),old=createLocalStore(s),candidate=createLocalStore(s,{key:'mora.local.rc1'});
  old.load();candidate.load();const a=sample(),b=sample();old.save(a);b.products[0].name='Candidata';candidate.save(b);
  const rc=s.getItem('mora.local.rc1');a.products[0].price=4000;old.save(a);
  assert.equal(s.getItem('mora.local.rc1'),rc);assert.equal(candidate.load().products[0].name,'Candidata');
  assert.equal(old.load().products[0].price,4000);
});
test('quota failure leaves the complete prior snapshot and permits a later retry',()=>{
  const s=memory(),store=createLocalStore(s);store.load();const d=sample();store.save(d);const raw=s.getItem('mora.local.v1');
  const original=s.setItem;s.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};
  run(d,'pending','opening',{items:[{productId:'p1',qty:4,totalCost:null}]});
  assert.throws(()=>store.save(d),/Full/);assert.equal(s.getItem('mora.local.v1'),raw);
  s.setItem=original;store.save(d);assert.equal(store.load().products[0].stock,4);
});
test('interruption after durable preparation resumes exactly once across 100 attempts',()=>{
  const s=memory(),first=createLocalStore(s);first.load();const d=sample();
  prepareOperation(d,{id:'interrupted',kind:'movement',payload:{kind:'expense',amount:100,account:'cash',note:'QA'},at:'2026-10-31T12:00:00Z'});first.save(d);
  const next=createLocalStore(s),recovered=next.load();for(let i=0;i<100;i++)applyOperation(recovered,'interrupted');next.save(recovered);
  assert.equal(next.load().ledger.length,1);assert.equal(next.load().ledger[0].legs[0].amount,-100);
});
test('failure after writing is recovered from durable confirmed result',()=>{
  const s=memory(),store=createLocalStore(s);store.load();const d=sample();run(d,'once','movement',{kind:'contribution',amount:200,account:'cash',note:'QA'});
  const original=s.setItem;s.setItem=(k,v)=>{original(k,v);throw Error('Response lost');};assert.throws(()=>store.save(d));
  const reloaded=createLocalStore(s).load();for(let i=0;i<100;i++)applyOperation(reloaded,'once');assert.equal(reloaded.ledger.length,1);
});
test('an old loaded writer refuses an intervening snapshot without overwriting it',()=>{
  const s=memory(),a=createLocalStore(s),b=createLocalStore(s);a.load();b.load();a.save(sample());const raw=s.getItem('mora.local.v1');
  const other=sample();other.products[0].price=100;assert.throws(()=>b.save(other),/otra pestaña/);assert.equal(s.getItem('mora.local.v1'),raw);
});
test('failed restore checkpoint leaves the destination empty and source untouched',()=>{
  const s=memory(),store=createLocalStore(s);store.load();s.setItem=()=>{throw Error('Storage denied');};
  assert.throws(()=>store.replace(sample()),/Storage denied/);assert.equal(s.getItem('mora.local.v1'),null);
});
test('large valid history and product photo survive exact backup roundtrip',()=>{
  const d=sample();d.products[0].photo='data:image/jpeg;base64,'+'A'.repeat(88000);
  for(let i=0;i<600;i++)run(d,'movement_'+i,'movement',{kind:'expense',amount:1,account:'cash',note:'QA historial '+i});
  const raw=backupText(d);assert.ok(raw.length>400000);assert.deepEqual(readBackup(raw),d);
  assert.throws(()=>readBackup(' '.repeat(10000001)),/10 MB/);
});
test('photo limits and malformed or manipulated JSON fail without changing input',()=>{
  const d=sample(),before=JSON.stringify(d);assert.throws(()=>readBackup('{bad'));const forged=JSON.parse(backupText(d));forged.data.products[0].stock=99;
  assert.throws(()=>readBackup(JSON.stringify(forged)),/cambió/);assert.equal(JSON.stringify(d),before);
  d.products[0].photo='data:image/jpeg;base64,'+'A'.repeat(200000);assert.throws(()=>backupText(d));
});
test('periods show natural Spanish and reject invalid calendar dates',()=>{
  assert.equal(monthLabel('2026-10'),'Octubre de 2026');assert.equal(rangeLabel('2026-10-01','2026-10-31'),'Del 1 al 31 de octubre de 2026');
  assert.equal(reportRange({period:'today'}).label,'Ventas de hoy');assert.throws(()=>reportRange({period:'range',from:'2026-99-01',to:'2027-01-01'}),/Revisá/);
  assert.equal(reportRange({period:'today',now:'2027-01-01T10:59:59Z'}).from,'2026-12-31');
  assert.equal(reportRange({period:'today',now:'2027-01-01T11:00:00Z'}).from,'2027-01-01');
});
test('later corrections are disclosed without silently moving cash to the old period',()=>{
  const d=sample();run(d,'o','opening',{items:[{productId:'p1',qty:2,totalCost:4000}]});
  run(d,'s','sale',{items:[{id:'p1',qty:1,price:3500,catalogPriceAtAdd:3500}],method:'cash',received:3500});
  run(d,'c','sale-correction',{saleId:'s',expectedRevision:0,type:'commercial',reason:'QA precio',items:[{id:'p1',qty:1,price:4000}],discount:0,settlement:'paid',account:'cash',occurredConfirmed:true},'2026-11-02T12:00:00Z');
  const r=buildReport(d,{period:'month',month:'2026-10'});assert.equal(r.sold,4000);assert.equal(r.money.collected,3500);assert.equal(r.laterCorrections.length,1);
  assert.equal(buildReport(d,{period:'month',month:'2026-11'}).money.collected,500);
});
