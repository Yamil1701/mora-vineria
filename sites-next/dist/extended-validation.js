import {validateCorrections} from './correction-validation.js';
import {canonical,businessDay} from './operations.js';
import {allocationCost,addFractions,fractionNumber} from './costs.js';
import {receiptPaid,debtRemaining} from './business-read.js';
const check=(ok,message='Los nuevos registros no son coherentes.')=>{if(!ok)throw Error(message);};
const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
export function addExtendedUsage(d,usage){
  for(const adjustment of d.inventoryAdjustments)for(const a of adjustment.allocations)usage.set(a.lotId,(usage.get(a.lotId)||0)+a.qty);
  for(const correction of d.saleCorrections.filter(c=>c.status==='applied'))for(const a of correction.addedAllocations||[])usage.set(a.lotId,(usage.get(a.lotId)||0)+a.qty);
}
export function validateExtendedData(d){
  for(const key of ['inventoryAdjustments','receiptPayments','debtAdjustments','monthlyGoals']){
    check(Array.isArray(d[key])&&d[key].length<=50000&&new Set(d[key].map(v=>v.id)).size===d[key].length);
    for(const v of d[key])check(id(v.id)&&date(v.at)&&v.day===businessDay(v.at));
  }
  validateCorrections(d);
  const commands=new Map(d.operations.map(o=>[o.id,o]));
  for(const a of d.inventoryAdjustments){
    check(commands.get(a.id)?.status==='confirmed'&&commands.get(a.id)?.kind==='inventory-adjustment'&&d.products.some(p=>p.id===a.productId)&&integer(a.counted)&&Number.isSafeInteger(a.before)&&a.delta===a.counted-a.before&&a.reason?.trim()&&['count','loss'].includes(a.reasonKind));
    const op=commands.get(a.id),p=op.payload;check(p.productId===a.productId&&p.expectedStock===a.before&&p.counted===a.counted&&p.reason.trim()===a.reason&&p.reasonKind===a.reasonKind&&a.at===op.at&&a.day===op.day&&a.totalCost===(a.addedQty?p.totalCost:null)&&(!a.addedQty||a.totalCost===null||integer(a.totalCost,1))&&(a.reasonKind!=='loss'||a.delta<0));
    check(a.offset===Math.min(Math.max(0,-a.before),Math.max(0,a.delta))&&a.addedQty===Math.max(0,a.delta-a.offset)&&a.removedQty===Math.max(0,-a.delta)&&Array.isArray(a.allocations)&&new Set(a.allocations.map(v=>v.lotId)).size===a.allocations.length);
    check(a.allocations.reduce((n,v)=>n+v.qty,0)===a.removedQty);
    for(const v of a.allocations)check(integer(v.qty,1)&&d.lots.some(l=>l.id===v.lotId&&l.productId===a.productId&&l.unitCost===v.unitCost));
    const fractions=a.allocations.filter(v=>v.unitCost!==null).map(v=>allocationCost(d.lots.find(l=>l.id===v.lotId),v.qty));check(a.knownCostTotal===fractionNumber(addFractions(fractions))&&a.unknownQty===a.allocations.filter(v=>v.unitCost===null).reduce((n,v)=>n+v.qty,0));
    for(const v of a.allocations)check(canonical(v.costFraction)===canonical(v.unitCost===null?null:allocationCost(d.lots.find(l=>l.id===v.lotId),v.qty)));
    const lots=d.lots.filter(l=>l.adjustmentId===a.id);check(a.addedQty?lots.length===1&&lots[0].qty===a.addedQty&&lots[0].productId===a.productId&&lots[0].totalCost===a.totalCost:lots.length===0);
  }
  const paymentSources=new Set();
  for(const p of d.receiptPayments){
    const r=d.receipts.find(v=>v.id===p.receiptId),op=commands.get(p.id),source='receipt-payment:'+p.id,e=d.ledger.find(v=>v.source===source);
    check(r&&integer(p.amount,1)&&op?.kind==='receipt-payment'&&op.status==='confirmed'&&op.payload.receiptId===p.receiptId&&op.payload.amount===p.amount&&op.payload.account===p.account&&op.payload.paidConfirmed===true&&p.at===op.at&&p.day===op.day);
    check(e?.kind==='purchase-payment'&&e.legs.length===1&&e.legs[0].account===p.account&&e.legs[0].amount===-p.amount);paymentSources.add(source);
  }
  for(const r of d.receipts)check(receiptPaid(d,r)<=r.total);
  check(d.ledger.every(e=>e.kind!=='purchase-payment'||paymentSources.has(e.source)));
  for(const g of d.monthlyGoals)check(/^\d{4}-(0[1-9]|1[0-2])$/.test(g.month)&&(g.amount===null||integer(g.amount,1))&&commands.get(g.id)?.kind==='monthly-goal'&&commands.get(g.id).status==='confirmed'&&commands.get(g.id).payload.month===g.month&&commands.get(g.id).payload.amount===g.amount&&commands.get(g.id).at===g.at);
  for(const a of d.debtAdjustments)check(d.debts.some(v=>v.id===a.debtId)&&Number.isSafeInteger(a.amount)&&a.amount!==0&&d.saleCorrections.some(v=>v.id===a.correctionId&&v.status==='applied'));
  for(const op of d.operations.filter(o=>o.status==='confirmed')){const key={'inventory-adjustment':'inventoryAdjustments','receipt-payment':'receiptPayments','monthly-goal':'monthlyGoals'}[op.kind];if(key)check(d[key].some(v=>v.id===op.id));}
  for(const debt of d.debts)check(debtRemaining(d,debt.id)>=0);
}
