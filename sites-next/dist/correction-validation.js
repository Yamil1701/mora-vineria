import {canonical} from './operations.js';
import {saleKey} from './business-read.js';
import {allocationCost,addFractions,fractionNumber} from './costs.js';
const check=(v,m='La auditoría de correcciones no coincide con sus efectos.')=>{if(!v)throw Error(m);};
const eq=(a,b)=>canonical(a)===canonical(b);
const positive=n=>Number.isSafeInteger(n)&&n>0;
const commercial=s=>({items:s.items,subtotal:s.subtotal,discount:s.discount,total:s.total,count:s.count});
export function validateCorrections(d){
  const sources=new Set();
  for(const sale of d.sales){let previous=sale,revision=0;
    for(const c of d.saleCorrections.filter(v=>v.saleId===saleKey(sale)&&v.status==='applied')){
      const op=d.operations.find(v=>v.id===c.id);check(op?.kind==='sale-correction'&&op.status==='confirmed'&&eq(op.payload,c.requested)&&op.at===c.at&&op.day===c.day&&c.revision===++revision&&c.requested.expectedRevision===revision-1&&eq(commercial(c.before),commercial(previous))&&c.before.number===sale.number&&c.after.number===sale.number&&c.type===c.requested.type&&c.reason===c.requested.reason.trim());
      const a=c.after;check(Array.isArray(a.items)&&a.items.length>0&&new Set(a.items.map(i=>i.id)).size===a.items.length&&a.count===a.items.reduce((n,i)=>n+i.qty,0)&&a.subtotal===a.items.reduce((n,i)=>n+i.qty*i.price,0)&&Number.isSafeInteger(a.discount)&&a.discount>=0&&a.discount<=a.subtotal&&a.total===a.subtotal-a.discount);
      for(const i of a.items){check(positive(i.qty)&&positive(i.price)&&d.products.some(p=>p.id===i.id)&&Array.isArray(i.allocations)&&new Set(i.allocations.map(v=>v.lotId)).size===i.allocations.length);let unknown=i.missingQty||0;for(const x of i.allocations){const l=d.lots.find(l=>l.id===x.lotId);check(l&&l.productId===i.id&&positive(x.qty)&&x.unitCost===l.unitCost&&eq(x.costFraction,l.unitCost===null?null:allocationCost(l,x.qty)));if(l.unitCost===null)unknown+=x.qty;}
        check(i.allocations.reduce((n,v)=>n+v.qty,0)+(i.missingQty||0)===i.qty&&i.unknownQty===unknown);const f=addFractions(i.allocations.filter(v=>v.costFraction).map(v=>v.costFraction));check(eq(i.knownCostFraction,f)&&i.knownCostTotal===fractionNumber(f)&&eq(i.costFraction,unknown?null:f)&&i.costTotal===(unknown?null:fractionNumber(f)));
      }
      const ids=new Set([...c.before.items.map(i=>i.id),...a.items.map(i=>i.id)]),effects=[];
      for(const id of ids){const b=c.before.items.find(i=>i.id===id),n=a.items.find(i=>i.id===id),delta=(b?.qty||0)-(n?.qty||0);if(delta)effects.push({productId:id,delta});const returned=c.returnedLots.filter(l=>l.productId===id);check(returned.reduce((n,l)=>n+l.qty,0)===Math.max(0,delta));const added=c.addedAllocations.filter(v=>v.productId===id);check(added.reduce((n,v)=>n+v.qty,0)===Math.max(0,-delta));for(const x of added){const l=d.lots.find(v=>v.id===x.lotId);check(l&&positive(x.qty)&&l.productId===id&&l.unitCost===x.unitCost&&eq(x.costFraction,allocationCost(l,x.qty)));}for(const l of returned){const actual=d.lots.find(v=>v.id===l.id);check(actual&&actual.correctionId===c.id&&actual.qty===l.qty&&actual.sourceLotId===l.sourceLotId&&actual.at===c.at&&eq(actual.costBasis,l.costBasis)&&b.allocations.some(x=>x.lotId===l.sourceLotId&&x.qty>=l.qty));}}
      check(eq(c.stockEffects,effects)&&Number.isSafeInteger(c.moneyDelta)&&Number.isSafeInteger(c.debtDelta));
      if(c.type==='commercial'){check(eq(a.items.map(i=>({id:i.id,qty:i.qty,price:i.price})),c.requested.items)&&a.discount===(c.requested.discount??c.before.discount));check(a.total-c.before.total===c.moneyDelta+c.debtDelta);check((c.requested.settlement==='debt'?c.moneyDelta===0:c.debtDelta===0));}
      else check(eq(commercial(a),commercial(c.before))&&c.debtDelta===0);
      const source='correction:'+c.id,e=d.ledger.find(v=>v.source===source);
      if(c.moneyDelta){check(c.requested.occurredConfirmed===true&&e?.kind==='sale-correction'&&e.legs.length===1&&e.legs[0].amount===c.moneyDelta&&e.legs[0].account===c.requested.account&&e.at===c.at&&e.day===c.day);if(c.type==='money')check(c.moneyDelta===(c.requested.direction==='collect'?c.requested.amount:-c.requested.amount));sources.add(source);}
      else if(c.type==='account'){const x=c.accountEffect,b=c.before.parts.find(v=>v.id===x.partId),n=a.parts.find(v=>v.id===x.partId);check(b?.verified&&x.amount===b.amount&&x.from===b.account&&x.to===c.requested.account&&n.account===x.to&&c.requested.occurredConfirmed===true&&e?.kind==='payment-correction'&&eq(e.legs,[{account:x.from,amount:-x.amount},{account:x.to,amount:x.amount}])&&e.at===c.at);sources.add(source);}
      else check(!e);
      const adjustments=d.debtAdjustments.filter(v=>v.correctionId===c.id);check(c.debtDelta?adjustments.length===1&&adjustments[0].debtId===c.debtId&&adjustments[0].amount===c.debtDelta:adjustments.length===0);
      previous=a;
    }
  }
  check(d.ledger.every(e=>!['sale-correction','payment-correction'].includes(e.kind)||sources.has(e.source)));
  for(const op of d.operations.filter(o=>o.status==='confirmed'&&o.kind==='sale-correction'))check(d.saleCorrections.some(c=>c.id===op.id&&c.status===op.result.status));
}
