import {allocationCost,costFraction,addFractions,fractionNumber,lotTotal,lineTotal} from './costs.js';
import {orderProgress} from './purchase-orders.js';
import {appendMovement} from './money-model.js';
export const suggestedPrice=cost=>Math.ceil(cost*1.5/500)*500;
export function receiveGoods(data,{id,supplier,note,items,paid,account,at,day,orderId=null}){
  if(data.receipts.some(r=>r.id===id))return false;
  if(orderId){const o=data.purchaseOrders.find(o=>o.id===orderId);if(!o||['closed','received'].includes(orderProgress(data,o).status)||items.some(i=>!o.items.some(oi=>oi.productId===i.productId)&&i.unplanned!==true))throw Error('Este pedido no admite esta recepción.');}
  if(!id||!supplier?.trim()||!items.length||new Set(items.map(i=>i.productId)).size!==items.length)throw Error('Revisá el proveedor y los productos recibidos.');
  const lines=items.map(i=>{const p=data.products.find(p=>p.id===i.productId),total=lineTotal(i);if(!p||!Number.isSafeInteger(i.qty)||i.qty<=0||!Number.isSafeInteger(total)||total<=0)throw Error('Ingresá unidades reales y costo total de cada línea, mayores a cero.');return {...i,lineCost:total,unitCost:total/i.qty,name:p.name,variety:p.variety,size:p.size};});
  const total=lines.reduce((a,i)=>a+i.lineCost,0);if(!Number.isSafeInteger(total)||total>999999999)throw Error('El total recibido supera el límite permitido.');
  // Validate the monetary entry before changing any stock.
  const staged=structuredClone(data.ledger);if(paid)appendMovement(staged,{kind:'purchase',legs:[{account,amount:-total}],source:'receipt:'+id,note:'Mercadería · '+supplier,at,day});
  const r={id,...(orderId?{orderId}:{}),supplier:supplier.trim(),note:note||'',items:lines,total,paid:!!paid,account:paid?account:null,at,day};
  data.receipts.push(r);for(const [n,i] of lines.entries()){data.lots.push({id:id+'_'+n,receiptId:id,productId:i.productId,qty:i.qty,remaining:i.qty,unitCost:i.unitCost,totalCost:i.lineCost,at});data.products.find(p=>p.id===i.productId).stock+=i.qty;}data.ledger=staged;return r;
}
export function consumeFIFO(data,items,{allowShortfall=false}={}){
  const staged=structuredClone(data.lots),costed=[];
  for(const i of items){
    let left=i.qty,unknown=0;const allocations=[];
    for(const l of staged.filter(l=>l.productId===i.id&&l.remaining>0).sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id))){
      const qty=Math.min(left,l.remaining);
      if(qty){const known=l.unitCost!==null;allocations.push({lotId:l.id,qty,unitCost:l.unitCost,costFraction:known?allocationCost(l,qty):null});if(!known)unknown+=qty;l.remaining-=qty;left-=qty;}
      if(!left)break;
    }
    if(left&&!allowShortfall)throw Error('El stock de '+i.name+' no tiene lotes suficientes. Revisá la recepción.');
    const knownCostFraction=addFractions(allocations.filter(a=>a.costFraction).map(a=>a.costFraction)),unknownQty=unknown+left;
    costed.push({...i,allocations,missingQty:left,unknownQty,knownCostFraction,knownCostTotal:fractionNumber(knownCostFraction),costFraction:unknownQty?null:knownCostFraction,costTotal:unknownQty?null:fractionNumber(knownCostFraction)});
  }
  data.lots=staged;return costed;
}
