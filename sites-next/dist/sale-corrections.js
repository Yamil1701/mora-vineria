import {saleByKey,effectiveSale,debtRemaining} from './business-read.js';
import {consumeFIFO} from './receiving.js';
import {appendMovement,accounts} from './money-model.js';
import {allocationCost,addFractions,fractionNumber,scaleFraction} from './costs.js';
const rule=(v,message)=>{if(!v)throw Error(message);};
const positive=v=>Number.isSafeInteger(v)&&v>0;
const bank=v=>accounts.some(a=>a.id===v);
const copy=v=>structuredClone(v);
function costLine(d,line,allocations){const fractions=allocations.filter(a=>a.unitCost!==null).map(a=>allocationCost(d.lots.find(l=>l.id===a.lotId),a.qty)),knownCostFraction=addFractions(fractions),unknownQty=allocations.filter(a=>a.unitCost===null).reduce((n,a)=>n+a.qty,0)+(line.missingQty||0);return {...line,allocations,unknownQty,knownCostFraction,knownCostTotal:fractionNumber(knownCostFraction),costFraction:unknownQty?null:knownCostFraction,costTotal:unknownQty?null:fractionNumber(knownCostFraction)};}
export function correctionPreview(data,p,at='2026-01-01T12:00:00.000Z'){
  const d=copy(data),id='preview_correction';return executeCorrection(d,{id,kind:'sale-correction',payload:p,at,day:at.slice(0,10)},true).preview;
}
export function executeCorrection(data,op,previewOnly=false){
  const p=op.payload,original=saleByKey(data,p.saleId),before=effectiveSale(data,p.saleId);
  rule(original&&p.reason?.trim()&&p.reason.trim().length<=300,'Elegí una venta e indicá un motivo.');
  rule(p.expectedRevision===before.revision,'La venta recibió otra corrección. Revisá su estado actual.');
  rule(['commercial','account','money'].includes(p.type),'Elegí el tipo de corrección.');
  const after=copy(before);delete after.revision;delete after.originalId;
  const c={id:op.id,saleId:p.saleId,revision:before.revision+1,type:p.type,reason:p.reason.trim(),requested:copy(p),status:'applied',before:copy(before),after:null,returnedLots:[],addedAllocations:[],stockEffects:[],moneyDelta:0,debtDelta:0,at:op.at,day:op.day};
  const review=message=>{const v={id:op.id,saleId:p.saleId,reason:c.reason,requested:copy(p),status:'review',message,at:op.at,day:op.day};if(!previewOnly)data.saleCorrections.push(v);return {correctionId:op.id,status:'review',preview:v};};
  const debt=data.debts.find(v=>v.saleId===p.saleId),balance=debt?debtRemaining(data,debt.id):0;
  if(p.type==='commercial'){
    rule(Array.isArray(p.items)&&p.items.length>0&&p.items.length<=500&&new Set(p.items.map(i=>i.id)).size===p.items.length,'La venta debe conservar al menos un producto.');
    const next=p.items.map(i=>{const product=data.products.find(v=>v.id===i.id);rule(product&&positive(i.qty)&&i.qty<=99999&&positive(i.price),'Revisá los productos, cantidades y precios.');return {...i,name:product.name,variety:product.variety,size:product.size};});
    const subtotal=next.reduce((n,i)=>n+i.qty*i.price,0),discount=p.discount??before.discount;
    rule(Number.isSafeInteger(subtotal)&&Number.isSafeInteger(discount)&&discount>=0&&discount<=subtotal,'Revisá el descuento y el total.');
    Object.assign(after,{items:[],subtotal,discount,total:subtotal-discount,count:next.reduce((n,i)=>n+i.qty,0)});
    const physical=before.items.some(i=>(next.find(v=>v.id===i.id)?.qty||0)!==i.qty)||next.some(i=>!before.items.some(v=>v.id===i.id));
    if(physical&&before.items.some(i=>i.unknownQty||i.missingQty))return review('La venta tenía unidades sin lote o costo al registrarse. El cambio de cantidades o productos necesita una revisión específica; no se aplicó.');
    if(after.total!==before.total&&before.parts.some(v=>!v.verified))return review('Hay una transferencia sin verificar. Comprobala antes de cambiar el importe comercial.');
    // Returns become new lots at correction time. Original FIFO allocations never change.
    for(const old of before.items){let returned=Math.max(0,old.qty-(next.find(i=>i.id===old.id)?.qty||0));for(const a of [...old.allocations].reverse()){if(!returned)break;const qty=Math.min(a.qty,returned),source=data.lots.find(l=>l.id===a.lotId);rule(source&&source.unitCost!==null,'Falta identificar el costo de la devolución.');const costBasis=scaleFraction(allocationCost(source,qty),1,qty),lot={id:op.id+'_return_'+c.returnedLots.length,correctionId:op.id,sourceLotId:source.id,productId:old.id,qty,remaining:qty,unitCost:fractionNumber(costBasis),costBasis,at:op.at};c.returnedLots.push(copy(lot));data.lots.push(lot);returned-=qty;}}
    for(const i of next){const old=before.items.find(v=>v.id===i.id);let allocations=[];
      if(old){let keep=Math.min(i.qty,old.qty);for(const a of old.allocations){const qty=Math.min(keep,a.qty);if(qty)allocations.push({...a,qty,costFraction:a.unitCost===null?null:allocationCost(data.lots.find(l=>l.id===a.lotId),qty)});keep-=qty;}}
      const extra=Math.max(0,i.qty-(old?.qty||0));if(extra){const available=data.lots.filter(l=>l.productId===i.id&&l.remaining>0).reduce((n,l)=>n+l.remaining,0);if(available<extra)return review('No alcanza el stock con lotes identificados para agregar estas unidades.');const line=consumeFIFO(data,[{...i,qty:extra}],{allowShortfall:false})[0];if(line.unknownQty)return review('Las unidades agregadas tienen costo pendiente. Confirmá ese costo antes de aplicar esta corrección.');for(const a of line.allocations){c.addedAllocations.push({...a,productId:i.id});const found=allocations.find(v=>v.lotId===a.lotId);if(found){found.qty+=a.qty;found.costFraction=allocationCost(data.lots.find(l=>l.id===a.lotId),found.qty);}else allocations.push(a);}}
      after.items.push(costLine(data,{...(old||{}),...i,missingQty:old?.missingQty||0},allocations));
    }
    for(const id of new Set([...before.items.map(i=>i.id),...next.map(i=>i.id)])){const delta=(before.items.find(i=>i.id===id)?.qty||0)-(next.find(i=>i.id===id)?.qty||0);if(delta){data.products.find(v=>v.id===id).stock+=delta;c.stockEffects.push({productId:id,delta});}}
    const delta=after.total-before.total;
    if(delta){rule(['paid','debt'].includes(p.settlement),'Indicá si la diferencia fue pagada o modifica el fiado.');if(p.settlement==='paid'){rule(bank(p.account)&&p.occurredConfirmed===true,'Confirmá la cuenta y el cobro o devolución ya realizado.');c.moneyDelta=delta;}else{rule(delta>0||balance>=-delta,'La reducción supera la deuda pendiente. Registrá la devolución real del excedente por separado.');rule(debt||p.customer?.trim(),'Indicá a nombre de quién queda la deuda adicional.');c.debtDelta=delta;}}
  }
  if(p.type==='account'){
    const part=after.parts.find(v=>v.id===p.partId);rule(part&&part.verified&&bank(p.account)&&p.account!==part.account&&p.occurredConfirmed===true,'Elegí un cobro confirmado y la cuenta correcta, y comprobá la evidencia.');
    c.accountEffect={partId:part.id,from:part.account,to:p.account,amount:part.amount};part.account=p.account;part.method=p.account==='cash'?'cash':'transfer';part.verifiedAt=op.at;
    appendMovement(data.ledger,{kind:'payment-correction',legs:[{account:c.accountEffect.from,amount:-part.amount},{account:p.account,amount:part.amount}],source:'correction:'+op.id,note:'Cuenta corregida · Venta '+original.number,at:op.at,day:op.day});
  }
  if(p.type==='money'){
    rule(positive(p.amount)&&['collect','refund'].includes(p.direction)&&bank(p.account)&&p.occurredConfirmed===true,'Completá el importe y confirmá el cobro o devolución real.');
    const net=original.parts.filter(v=>v.verified).reduce((n,v)=>n+v.amount,0)+data.debtPayments.filter(v=>v.debtId===debt?.id).reduce((n,v)=>n+v.amount,0)+data.saleCorrections.filter(v=>v.saleId===p.saleId&&v.status==='applied').reduce((n,v)=>n+(v.moneyDelta||0),0);
    rule(p.direction!=='refund'||p.amount<=net,'La devolución supera lo cobrado confirmado.');c.moneyDelta=p.direction==='collect'?p.amount:-p.amount;
  }
  if(c.moneyDelta)appendMovement(data.ledger,{kind:'sale-correction',legs:[{account:p.account,amount:c.moneyDelta}],source:'correction:'+op.id,note:(c.moneyDelta>0?'Cobro adicional':'Devolución')+' · Venta '+original.number,at:op.at,day:op.day});
  if(c.debtDelta){let target=debt;if(!target){target={id:'debt_'+op.id,saleId:p.saleId,saleNumber:original.number,customer:p.customer.trim(),amount:0,correctionId:op.id,at:op.at,day:op.day};data.debts.push(target);}c.debtId=target.id;data.debtAdjustments.push({id:op.id+'_debt',debtId:target.id,correctionId:op.id,amount:c.debtDelta,at:op.at,day:op.day});}
  c.after=copy(after);data.saleCorrections.push(c);return {correctionId:op.id,status:'applied',preview:c};
}
