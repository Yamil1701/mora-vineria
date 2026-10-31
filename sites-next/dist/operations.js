import {executeExtended} from './extended-operations.js';
import {debtRemaining} from './business-read.js';
import {consumeFIFO,receiveGoods} from './receiving.js';
import {appendMovement,buildPaymentParts} from './money-model.js';
import {costFraction} from './costs.js';

export function businessDay(at) {
  const instant = new Date(at);
  if (!Number.isFinite(instant.getTime())) throw Error('Fecha inválida.');
  return new Date(instant.getTime()-11*3600000).toISOString().slice(0,10);
}
export function canonical(value) {
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
const positive = n => Number.isSafeInteger(n)&&n>0;
const requireRule = (ok, message) => {if(!ok)throw Error(message);};
export function prepareOperation(data,{id,kind,payload,at}) {
  requireRule(/^[a-zA-Z0-9_-]{1,80}$/.test(id),'La operación necesita una identidad válida.');
  const existing=data.operations.find(o=>o.id===id),sealed=canonical(payload);
  if(existing){requireRule(existing.kind===kind&&canonical(existing.payload)===sealed,'Ese intento ya tiene otros datos. Recuperá el resultado original.');return existing;}
  requireRule(!(kind==='receive'&&data.receipts.some(r=>r.id===id)),'Ya existe una recepción con ese identificador.');
  const operation={id,kind,payload:JSON.parse(sealed),at,day:businessDay(at),status:'prepared',result:null};
  data.operations.push(operation);return operation;
}
export function applyOperation(data,id) {
  const operation=data.operations.find(o=>o.id===id);
  requireRule(operation,'No encontré la operación preparada.');
  if(operation.status==='confirmed')return structuredClone(operation.result);
  requireRule(operation.status==='prepared','Esta operación requiere revisión antes de reintentar.');
  // Work on a detached copy. The caller must persist the complete result once.
  const staged=structuredClone(data),op=staged.operations.find(o=>o.id===id);
  const result=execute(staged,op);
  Object.assign(op,{status:'confirmed',result});
  Object.assign(data,staged);return structuredClone(result);
}
export function failOperation(data,id,message){
  const op=data.operations.find(o=>o.id===id);requireRule(op&&op.status!=='confirmed','No se puede marcar fallida una operación confirmada.');
  op.status='failed';op.failure=String(message).slice(0,500);op.result=null;
}
export const debtBalance=debtRemaining;
function execute(data,op) {
  const p=op.payload,at=op.at,day=op.day;
  if(op.kind==='sale'){
    requireRule(p.items?.length&&new Set(p.items.map(i=>i.id)).size===p.items.length,'Revisá los productos.');
    const lines=p.items.map(i=>{const product=data.products.find(v=>v.id===i.id);requireRule(product&&product.active!==false&&positive(i.qty)&&positive(i.price)&&positive(i.catalogPriceAtAdd),'Revisá cantidades y precios.');return {id:i.id,name:product.name,variety:product.variety,size:product.size,qty:i.qty,price:i.price,catalogPriceAtAdd:i.catalogPriceAtAdd,recordedStock:product.stock,stockShortfall:Math.max(0,i.qty-Math.max(0,product.stock))};});
    const shortage=lines.some(i=>i.qty>data.products.find(v=>v.id===i.id).stock);
    requireRule(!shortage||p.shortageAccepted===true,'Confirmá que tenés físicamente los productos con faltante.');
    if(shortage&&p.acceptanceVersion===2)requireRule(Array.isArray(p.shortageAcknowledgements)&&lines.filter(i=>i.stockShortfall>0).every(i=>p.shortageAcknowledgements.some(a=>a.id===i.id&&a.qty===i.qty&&a.stock===i.recordedStock&&a.missing===i.stockShortfall)),'La disponibilidad cambió. Confirmá las cantidades actuales.');
    const subtotal=lines.reduce((n,i)=>n+i.qty*i.price,0),discount=p.discount||0,total=subtotal-discount;
    requireRule(Number.isSafeInteger(subtotal)&&Number.isSafeInteger(discount)&&discount>=0&&total>=0,'Revisá el descuento.');
    const creditAmount=p.creditAmount??(p.method==='credit'?total:0),paidTotal=total-creditAmount;
    requireRule(Number.isSafeInteger(creditAmount)&&creditAmount>=0&&creditAmount<=total&&(!creditAmount||p.customer?.trim()),'Revisá el importe fiado y el nombre.');
    const paymentMethod=paidTotal===0?'credit':p.method==='credit'?'cash':p.method;
    const parts=buildPaymentParts({method:paymentMethod,total:paidTotal,share:p.cashShare,account:p.transferAccount,verified:p.transferVerified,at}).map((part,n)=>({...part,id:String(n)}));
    const cash=parts.filter(v=>v.method==='cash').reduce((n,v)=>n+v.amount,0);
    requireRule(Number.isSafeInteger(p.received)&&p.received>=cash,'El efectivo recibido no alcanza.');
    const items=consumeFIFO(data,lines,{allowShortfall:true});
    const number=String(data.sales.length+1).padStart(3,'0');
    const sale={id:op.id,operationId:op.id,number,at,day,subtotal,discount,total,method:p.method,customer:p.customer?.trim()||'',creditAmount,parts,count:items.reduce((n,i)=>n+i.qty,0),received:p.received,items};
    for(const [index,i] of items.entries()){data.products.find(v=>v.id===i.id).stock-=i.qty;if(i.unknownQty||i.stockShortfall)data.stockReviews.push({id:op.id+'_review_'+index,saleId:op.id,saleNumber:number,productId:i.id,missingQty:i.missingQty,unknownQty:i.unknownQty,stockShortfall:i.stockShortfall,at,day});}
    data.sales.push(sale);
    for(const part of parts.filter(v=>v.verified))appendMovement(data.ledger,{kind:'sale',legs:[{account:part.account,amount:part.amount}],source:`sale:${number}:${part.id}`,note:`Venta ${number}`,at,day});
    if(creditAmount)data.debts.push({id:'debt_'+op.id,saleId:op.id,saleNumber:number,customer:sale.customer,amount:creditAmount,at,day});
    return {saleNumber:number,saleId:op.id};
  }
  if(op.kind==='opening'){
    requireRule(p.items?.length&&new Set(p.items.map(i=>i.productId)).size===p.items.length,'Revisá las existencias iniciales.');
    for(const [n,i]of p.items.entries()){
      const product=data.products.find(v=>v.id===i.productId);
      requireRule(product&&positive(i.qty)&&(i.totalCost===null||positive(i.totalCost)),'Revisá cantidades y costos iniciales.');
      requireRule(!data.sales.some(s=>s.items.some(v=>v.id===i.productId))&&!data.lots.some(l=>l.productId===i.productId),'Este producto ya tiene movimientos. Usá un ajuste de inventario.');
      data.lots.push({id:op.id+'_'+n,openingId:op.id,productId:i.productId,qty:i.qty,remaining:i.qty,unitCost:i.totalCost===null?null:i.totalCost/i.qty,totalCost:i.totalCost,at});product.stock+=i.qty;
    }
    data.stockOpenings.push({id:op.id,items:structuredClone(p.items),at,day});return {openingId:op.id};
  }
  if(op.kind==='debt-payment'){
    const balance=debtBalance(data,p.debtId);
    requireRule(positive(p.amount)&&p.amount<=balance,`El saldo pendiente es $${balance}. Revisá el importe para no cobrar de más.`);
    requireRule(!['transfer','mixed'].includes(p.method)||p.transferVerified===true,'Comprobá la transferencia antes de registrar el abono.');
    const parts=buildPaymentParts({method:p.method,total:p.amount,share:p.cashShare,account:p.account,verified:true,at}).map((v,n)=>({...v,id:String(n)}));
    requireRule(parts.length>0&&parts.every(v=>v.verified),'Comprobá el pago antes de registrar el abono.');
    data.debtPayments.push({id:op.id,debtId:p.debtId,amount:p.amount,parts,at,day});
    for(const part of parts)appendMovement(data.ledger,{kind:'debt-payment',legs:[{account:part.account,amount:part.amount}],source:`debt:${op.id}:${part.id}`,note:'Abono de fiado',at,day});
    return {debtId:p.debtId,balance:balance-p.amount};
  }
  if(op.kind==='movement'){
    requireRule(positive(p.amount)&&p.note?.trim()&&['expense','contribution','move','withdrawal'].includes(p.kind),'Revisá el movimiento.');
    const legs=p.kind==='move'?[{account:p.account,amount:-p.amount},{account:p.to,amount:p.amount}]:[{account:p.account,amount:p.kind==='contribution'?p.amount:-p.amount}];
    appendMovement(data.ledger,{kind:p.kind,legs,source:'manual:'+op.id,note:p.note,at,day});return {source:'manual:'+op.id};
  }
  if(op.kind==='receive'){
    const receipt=receiveGoods(data,{...p,id:op.id,at,day});return {receiptId:receipt.id};
  }
  if(op.kind==='verify-transfer'){
    const sale=data.sales.find(s=>s.number===p.saleNumber),part=sale?.parts.find(v=>v.id===p.partId);requireRule(part,'No encontré el pago.');
    if(!part.verified){appendMovement(data.ledger,{kind:'sale',legs:[{account:part.account,amount:part.amount}],source:`sale:${sale.number}:${part.id}`,note:`Venta ${sale.number}`,at,day});part.verified=true;part.verifiedAt=at;}
    return {saleNumber:sale.number,partId:part.id};
  }
  if(op.kind==='resolve-stock'){
    const review=data.stockReviews.find(r=>r.id===p.reviewId);requireRule(review&&!data.stockResolutions.some(r=>r.reviewId===p.reviewId),'La diferencia ya está resuelta o no existe.');
    requireRule(p.evidence?.trim()&&Number.isSafeInteger(p.stockDelta)&&(review.unknownQty>0?Number.isSafeInteger(p.totalCost)&&p.totalCost>=0:p.totalCost===null),'Indicá evidencia, ajuste físico y costo comprobado.');
    const regularized=data.stockResolutions.filter(r=>r.productId===review.productId).reduce((n,r)=>n+r.stockDelta,0)+data.inventoryAdjustments.filter(a=>a.productId===review.productId).reduce((n,a)=>n+a.offset,0),missing=data.stockReviews.filter(r=>r.productId===review.productId).reduce((n,r)=>n+r.missingQty,0);
    requireRule(p.stockDelta>=0&&p.stockDelta<=Math.max(0,missing-regularized),'La diferencia física ya fue regularizada o el cambio supera las unidades sin lote. Usá Contar productos para otro ajuste.');
    data.stockResolutions.push({id:op.id,reviewId:p.reviewId,productId:review.productId,evidence:p.evidence,stockDelta:p.stockDelta,totalCost:p.totalCost,costFraction:review.unknownQty>0?costFraction(p.totalCost,review.unknownQty):null,at,day});
    data.products.find(v=>v.id===review.productId).stock+=p.stockDelta;return {reviewId:p.reviewId};
  }
  if(op.kind==='correction-review'){
    requireRule(data.sales.some(s=>(s.id||'legacy_'+s.number)===p.saleId)&&p.reason?.trim()&&p.requested&&Object.keys(p.requested).length,'Revisá la venta y el motivo.');
    // Ambiguous physical/FIFO/payment effects stay pending. No invented refund.
    data.saleCorrections.push({id:op.id,saleId:p.saleId,reason:p.reason,requested:structuredClone(p.requested),status:'review',at,day});return {correctionId:op.id,status:'review'};
  }
  const extended=executeExtended(data,op);if(extended!==undefined)return extended;
  throw Error('Esta operación todavía no está implementada.');
}
