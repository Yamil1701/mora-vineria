import {EXTENDED_KINDS} from './extended-operations.js';
import {validateDrafts} from './draft-model.js';
import {costFraction} from './costs.js';
import {businessDay,canonical} from './operations.js';
const ok=(condition,message='Los datos de operaciones no son coherentes.')=>{if(!condition)throw Error(message);};
const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const kinds=[...EXTENDED_KINDS,'sale','opening','debt-payment','movement','receive','verify-transfer','resolve-stock','correction-review'];
export function validateOperations(d){
  for(const k of ['operations','stockOpenings','stockReviews','stockResolutions','debts','debtPayments','saleCorrections']){
    ok(Array.isArray(d[k])&&d[k].length<=50000&&new Set(d[k].map(r=>r.id)).size===d[k].length);
    for(const r of d[k])ok(id(r.id)&&stamp(r.at)&&r.day===businessDay(r.at));
  }
  const sales=new Map(d.sales.map(s=>[s.id||'legacy_'+s.number,s]));
  for(const o of d.operations){
    ok(kinds.includes(o.kind)&&['prepared','confirmed','failed'].includes(o.status)&&o.payload&&typeof o.payload==='object'&&!Array.isArray(o.payload)&&canonical(o.payload).length<=200000);
    ok(o.status!=='confirmed'?o.result===null:o.result&&typeof o.result==='object');
    if(o.status==='failed')ok(typeof o.failure==='string'&&o.failure.length>0&&o.failure.length<=500);if(o.status!=='confirmed')continue;
    if(o.kind==='sale'){
      const s=sales.get(o.id);ok(s&&s.operationId===o.id&&o.result.saleId===s.id&&o.result.saleNumber===s.number&&s.day===o.day&&s.at===o.at);
      ok(o.payload.items.length===s.items.length&&o.payload.items.every(i=>s.items.some(v=>v.id===i.id&&v.qty===i.qty&&v.price===i.price&&v.catalogPriceAtAdd===i.catalogPriceAtAdd)));
      ok((o.payload.discount||0)===s.discount&&(o.payload.creditAmount??(o.payload.method==='credit'?s.total:0))===(s.creditAmount||0));
    }else if(o.kind==='opening')ok(d.stockOpenings.some(v=>v.id===o.id&&canonical(v.items)===canonical(o.payload.items)));
    else if(o.kind==='debt-payment')ok(d.debtPayments.some(v=>v.id===o.id&&v.debtId===o.payload.debtId&&v.amount===o.payload.amount));
    else if(o.kind==='movement')ok(d.ledger.some(v=>v.source==='manual:'+o.id&&v.kind===o.payload.kind));
    else if(o.kind==='receive')ok(d.receipts.some(v=>v.id===o.id));
    else if(o.kind==='resolve-stock')ok(d.stockResolutions.some(v=>v.id===o.id));
    else if(o.kind==='correction-review')ok(d.saleCorrections.some(v=>v.id===o.id));
    else if(o.kind==='verify-transfer')ok(d.sales.some(s=>s.number===o.payload.saleNumber&&s.parts.some(p=>p.id===o.payload.partId&&p.verified)));
  }
  for(const s of d.sales)if(s.operationId)ok(d.operations.some(o=>o.id===s.operationId&&o.kind==='sale'&&o.status==='confirmed'));
  for(const opening of d.stockOpenings){ok(d.operations.some(o=>o.id===opening.id&&o.kind==='opening'&&o.status==='confirmed'));ok(Array.isArray(opening.items)&&opening.items.length>0&&new Set(opening.items.map(i=>i.productId)).size===opening.items.length);
    for(const i of opening.items)ok(d.products.some(p=>p.id===i.productId)&&integer(i.qty,1)&&(i.totalCost===null||integer(i.totalCost,1))&&d.lots.filter(l=>l.openingId===opening.id&&l.productId===i.productId).length===1);
  }
  for(const r of d.stockReviews){const s=sales.get(r.saleId),line=s?.items.find(i=>i.id===r.productId);ok(line&&s.number===r.saleNumber&&integer(r.missingQty)&&integer(r.unknownQty)&&(r.unknownQty>0||r.stockShortfall>0)&&r.stockShortfall===line.stockShortfall&&r.missingQty===line.missingQty&&r.unknownQty===line.unknownQty&&r.at===s.at);}
  for(const s of d.sales)for(const i of s.items)if(i.unknownQty||i.stockShortfall)ok(d.stockReviews.filter(r=>r.saleId===s.id&&r.productId===i.id).length===1);
  ok(new Set(d.stockResolutions.map(r=>r.reviewId)).size===d.stockResolutions.length);
  for(const r of d.stockResolutions){const review=d.stockReviews.find(v=>v.id===r.reviewId),op=d.operations.find(o=>o.id===r.id);ok(op?.kind==='resolve-stock'&&op.status==='confirmed'&&op.payload.reviewId===r.reviewId&&op.payload.evidence.trim()===r.evidence&&op.payload.stockDelta===r.stockDelta&&op.payload.totalCost===r.totalCost&&op.at===r.at&&op.day===r.day);ok(review&&review.productId===r.productId&&r.evidence?.trim()&&Number.isSafeInteger(r.stockDelta)&&(review.unknownQty>0?integer(r.totalCost)&&canonical(r.costFraction)===canonical(costFraction(r.totalCost,review.unknownQty)):r.totalCost===null&&r.costFraction===null));}
  ok(new Set(d.debts.map(v=>v.saleNumber)).size===d.debts.length);
  for(const debt of d.debts){const sale=sales.get(debt.saleId);ok(sale&&sale.number===debt.saleNumber&&(debt.correctionId?d.saleCorrections.some(c=>c.id===debt.correctionId&&c.status==='applied'&&c.debtId===debt.id)&&debt.amount===0:debt.customer===sale.customer&&debt.amount===(sale.creditAmount??(sale.method==='credit'?sale.total:0))&&integer(debt.amount,1)));ok(d.debtPayments.filter(p=>p.debtId===debt.id).reduce((n,p)=>n+p.amount,0)<=debt.amount+(d.debtAdjustments||[]).filter(a=>a.debtId===debt.id).reduce((n,a)=>n+a.amount,0));}
  for(const sale of d.sales)if(sale.creditAmount||sale.method==='credit')ok(d.debts.some(v=>v.saleNumber===sale.number));
  const paymentSources=new Set();
  for(const payment of d.debtPayments){const op=d.operations.find(o=>o.id===payment.id);ok(op?.kind==='debt-payment'&&op.status==='confirmed'&&op.payload.debtId===payment.debtId&&op.payload.amount===payment.amount&&op.at===payment.at&&op.day===payment.day);ok(d.debts.some(v=>v.id===payment.debtId)&&integer(payment.amount,1)&&Array.isArray(payment.parts)&&payment.parts.length>0&&new Set(payment.parts.map(p=>p.id)).size===payment.parts.length&&payment.parts.reduce((n,p)=>n+p.amount,0)===payment.amount);
    for(const part of payment.parts){const source=`debt:${payment.id}:${part.id}`,entry=d.ledger.find(e=>e.source===source);ok(['cash','transfer'].includes(part.method)&&(part.method==='cash'?part.account==='cash':['brubank','mp','nx'].includes(part.account))&&part.verified&&integer(part.amount,1)&&entry?.kind==='debt-payment'&&entry.legs.length===1&&entry.legs[0].amount===part.amount&&entry.legs[0].account===part.account);paymentSources.add(source);}
  }
  ok(d.ledger.every(e=>e.kind!=='debt-payment'||paymentSources.has(e.source)));
  for(const c of d.saleCorrections)ok(sales.has(c.saleId)&&c.reason?.trim()&&['review','applied'].includes(c.status)&&c.requested&&Object.keys(c.requested).length>0);
  ok(d.workState&&typeof d.workState==='object'&&!Array.isArray(d.workState)&&JSON.stringify(d.workState).length<=500000);
  validateDrafts(d);
  // Drafts may contain incomplete strings, never confirmed effects.
  if(d.workState.saleOperationId)ok(id(d.workState.saleOperationId));
}
