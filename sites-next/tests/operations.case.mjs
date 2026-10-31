import fs from 'node:fs';
import assert from 'node:assert/strict';
import {emptyData,validateData,backupText,readBackup,createLocalStore} from '../dist/local-data.js';
import {prepareOperation,applyOperation,businessDay,debtBalance} from '../dist/operations.js';
import {receiveGoods} from '../dist/receiving.js';
import {seeds} from '../dist/catalog-data.js';
const at='2026-10-30T12:00:00.000Z',day='2026-10-30';
const dataset=()=>({...emptyData(),products:[{...seeds[0],stock:0,price:3500}]});
const run=(d,id,kind,payload)=>{prepareOperation(d,{id,kind,payload,at});const result=applyOperation(d,id);validateData(d);return result;};
const sale=(qty=1,extra={})=>({items:[{id:'p1',qty,price:3500,catalogPriceAtAdd:3500}],discount:0,method:'cash',received:qty*3500,customer:'',transferAccount:'brubank',transferVerified:false,cashShare:'',shortageAccepted:true,...extra});

// Required six -> seven example: six costs, one explicit unknown, negative stock.
let d=dataset();receiveGoods(d,{id:'r6',supplier:'Proveedor',items:[{productId:'p1',qty:6,lineCost:21000}],paid:false,at,day});
const payload=sale(7);prepareOperation(d,{id:'s7',kind:'sale',payload,at});
const prepared=readBackup(backupText(d));assert.equal(prepared.operations[0].status,'prepared');
applyOperation(d,'s7');validateData(d);assert.equal(d.products[0].stock,-1);assert.equal(d.lots[0].remaining,0);
assert.equal(d.sales[0].items[0].knownCostTotal,21000);assert.equal(d.sales[0].items[0].costTotal,null);assert.equal(d.sales[0].items[0].missingQty,1);assert.equal(d.stockReviews[0].unknownQty,1);
const confirmed=JSON.stringify(d);for(let n=0;n<100;n++){prepareOperation(d,{id:'s7',kind:'sale',payload,at});applyOperation(d,'s7');}assert.equal(JSON.stringify(d),confirmed);
assert.throws(()=>prepareOperation(d,{id:'s7',kind:'sale',payload:sale(8),at}),/otros datos/);
assert.deepEqual(readBackup(backupText(d)),d);
// A later purchase cannot cost a past missing unit. Nothing is silently backfilled.
receiveGoods(d,{id:'later',supplier:'Proveedor',items:[{productId:'p1',qty:2,lineCost:10000}],paid:false,at:'2026-10-31T12:00:00.000Z',day:'2026-10-31'});validateData(d);
assert.equal(d.products[0].stock,1);assert.equal(d.sales[0].items[0].costTotal,null);assert.equal(d.sales[0].items[0].allocations.length,1);
run(d,'resolve7','resolve-stock',{reviewId:'s7_review_0',evidence:'Conteo y factura anteriores verificados',stockDelta:1,totalCost:3000});
assert.equal(d.products[0].stock,2);assert.equal(d.sales[0].items[0].costTotal,null);assert.equal(d.stockResolutions[0].totalCost,3000);

// Initial stock isn't a fictitious purchase and unknown cost isn't zero.
d=dataset();run(d,'initial','opening',{items:[{productId:'p1',qty:3,totalCost:null}]});assert.equal(d.receipts.length,0);assert.equal(d.ledger.length,0);
run(d,'unknown','sale',sale());assert.equal(d.sales[0].items[0].unknownQty,1);assert.equal(d.sales[0].items[0].missingQty,0);assert.equal(d.sales[0].items[0].costTotal,null);assert.equal(d.products[0].stock,2);
assert.deepEqual(readBackup(backupText(d)),d);
d=dataset();run(d,'knownInitial','opening',{items:[{productId:'p1',qty:12,totalCost:17500}]});run(d,'rational','sale',sale());assert.deepEqual(d.sales[0].items[0].costFraction,{n:'4375',d:'3'});

// Partial credit, no duplicate sales on partial and final repayments.
d=dataset();run(d,'creditStock','opening',{items:[{productId:'p1',qty:6,totalCost:12000}]});
run(d,'creditSale','sale',sale(2,{creditAmount:5000,customer:'Ana',received:2000}));assert.equal(d.debts[0].amount,5000);assert.equal(d.ledger[0].legs[0].amount,2000);
run(d,'pay1','debt-payment',{debtId:'debt_creditSale',amount:2000,method:'cash'});assert.equal(debtBalance(d,'debt_creditSale'),3000);
const before=JSON.stringify(d);prepareOperation(d,{id:'excess',kind:'debt-payment',payload:{debtId:'debt_creditSale',amount:4000,method:'cash'},at});const sealed=JSON.stringify(d);assert.throws(()=>applyOperation(d,'excess'),/saldo pendiente/);assert.equal(JSON.stringify(d),sealed);
run(d,'pay2','debt-payment',{debtId:'debt_creditSale',amount:3000,method:'transfer',account:'brubank',transferVerified:true});assert.equal(debtBalance(d,'debt_creditSale'),0);assert.equal(d.sales.length,1);assert.equal(d.products[0].stock,4);assert.equal(d.debtPayments.length,2);
assert.deepEqual(readBackup(backupText(d)),d);
const ledger=JSON.stringify(d.ledger),sales=JSON.stringify(d.sales),lots=JSON.stringify(d.lots);
run(d,'correction','correction-review',{saleId:'creditSale',reason:'Cantidad mal anotada',requested:{quantity:1,productId:'p1',commercialPrice:3000}});assert.equal(JSON.stringify(d.sales),sales);assert.equal(JSON.stringify(d.ledger),ledger);assert.equal(JSON.stringify(d.lots),lots);assert.equal(d.saleCorrections[0].status,'review');

// Lost response after snapshot write: reload + same operation returns the result.
const mem=new Map(),storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
let store=createLocalStore(storage);store.load();store.save(d);let loaded=store.load();const result=applyOperation(loaded,'creditSale');assert.equal(result.saleNumber,'001');store.save(loaded);assert.equal(loaded.sales.length,1);
const damaged=structuredClone(d);damaged.debtPayments[0].amount++;assert.throws(()=>validateData(damaged));
const damagedStock=structuredClone(d);damagedStock.products[0].stock++;assert.throws(()=>validateData(damagedStock));
const damagedPrice=structuredClone(d);damagedPrice.operations.find(o=>o.id==='creditSale').payload.items[0].price++;assert.throws(()=>validateData(damagedPrice));
assert.equal(businessDay('2026-11-01T10:59:59.000Z'),'2026-10-31');assert.equal(businessDay('2026-11-01T11:00:00.000Z'),'2026-11-01');assert.equal(businessDay('2027-01-01T10:00:00.000Z'),'2026-12-31');
console.log('Operations: 6→7 with one unknown cost, negative stock, 100 retries, changed-ID rejection, initial known/unknown stock, exact FIFO, partial credit + repayments, overpayment rejection, conservative corrections, corruption rejection and lost-response recovery.');

// Every current payment mode remains consistent; cash records net of change.
for(const [id,extra,expectedLegs] of [
 ['cashExact',{method:'cash',received:3500},1],
 ['cashChange',{method:'cash',received:10000},1],
 ['transferConfirmed',{method:'transfer',received:0,transferVerified:true},1],
 ['transferPending',{method:'transfer',received:0,transferVerified:false},0],
 ['mixed',{method:'mixed',cashShare:'1000',received:5000,transferVerified:true},2],
 ['mixedCredit',{method:'mixed',cashShare:'1000',received:5000,transferVerified:true,creditAmount:500,customer:'Ana'},2]
]){const x=dataset();run(x,'open_'+id,'opening',{items:[{productId:'p1',qty:6,totalCost:18000}]});run(x,id,'sale',sale(1,extra));assert.equal(x.ledger.length,expectedLegs);assert.equal(x.products[0].stock,5);assert.equal(x.sales.length,1);assert.equal(x.ledger.filter(e=>e.legs[0].account==='cash').reduce((n,e)=>n+e.legs[0].amount,0),extra.method==='cash'?3500:extra.method==='mixed'?1000:0);}
const oldMemory=new Map([['mora.local.v1',JSON.stringify({format:'mora-local',version:3,revision:1,data:dataset()})]]);const oldStore=createLocalStore({getItem:k=>oldMemory.get(k)??null,setItem:(k,v)=>oldMemory.set(k,v)});const oldRaw=oldMemory.get('mora.local.v1');const migrated=oldStore.load();migrated.products[0].target++;oldStore.save(migrated);assert.equal(oldMemory.get('mora.local.v1.before-v4'),oldRaw);

const legacyV3=readBackup(fs.readFileSync(new URL('./fixtures/backup-v3.json',import.meta.url),'utf8'));assert.equal(legacyV3.cartPrices.p1.appliedUnitPrice,3500);assert.equal(legacyV3.debts[0].amount,3500);assert.equal(legacyV3.products[0].stock,5);assert.equal(legacyV3.sales[0].items[0].costTotal,3000);assert.equal(legacyV3.ledger.length,0);assert.deepEqual(readBackup(backupText(legacyV3)),legacyV3);
