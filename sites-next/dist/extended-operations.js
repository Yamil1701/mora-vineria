import {executeCorrection} from './sale-corrections.js';
import {consumeFIFO} from './receiving.js';
import {appendMovement} from './money-model.js';
import {receiptRemaining} from './business-read.js';
const requireRule=(condition,message)=>{if(!condition)throw Error(message);};
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export const EXTENDED_KINDS=['inventory-adjustment','receipt-payment','monthly-goal','sale-correction'];
export function executeExtended(data,op){
  if(op.kind==='sale-correction'){const trial=structuredClone(data);const result=executeCorrection(trial,op);if(result.status==='review'){data.saleCorrections.push(trial.saleCorrections.at(-1));return result;}for(const key of Object.keys(trial))if(key!=='operations')data[key]=trial[key];return result;}
  const p=op.payload,{at,day,id}=op;
  if(op.kind==='inventory-adjustment'){
    const product=data.products.find(v=>v.id===p.productId);
    requireRule(product&&integer(p.counted)&&p.counted<=99999&&p.reason?.trim()&&['count','loss'].includes(p.reasonKind),'Revisá la cantidad física y el motivo.');
    requireRule(p.expectedStock===product.stock,'El stock cambió. Volvé a revisar el conteo antes de guardarlo.');
    const delta=p.counted-product.stock;
    requireRule(p.reasonKind!=='loss'||delta<0,'Una pérdida debe disminuir las unidades registradas.');
    const offset=Math.min(Math.max(0,-product.stock),Math.max(0,delta)),addedQty=Math.max(0,delta-offset),removedQty=Math.max(0,-delta);
    requireRule(!addedQty||p.totalCost===null||integer(p.totalCost)&&p.totalCost>0,'Ingresá el costo total conocido o dejalo sin informar.');
    let allocations=[],knownCostTotal=0,unknownQty=0;
    if(removedQty){const line=consumeFIFO(data,[{id:product.id,name:product.name,qty:removedQty}],{allowShortfall:false})[0];allocations=line.allocations;knownCostTotal=line.knownCostTotal;unknownQty=line.unknownQty;}
    const adjustment={id,productId:product.id,before:product.stock,counted:p.counted,delta,offset,addedQty,removedQty,allocations,knownCostTotal,unknownQty,totalCost:addedQty?p.totalCost:null,reason:p.reason.trim(),reasonKind:p.reasonKind,at,day};
    if(addedQty)data.lots.push({id:id+'_stock',adjustmentId:id,productId:product.id,qty:addedQty,remaining:addedQty,unitCost:p.totalCost===null?null:p.totalCost/addedQty,totalCost:p.totalCost,at});
    product.stock=p.counted;data.inventoryAdjustments.push(adjustment);return {adjustmentId:id,productId:product.id};
  }
  if(op.kind==='receipt-payment'){
    const receipt=data.receipts.find(r=>r.id===p.receiptId);requireRule(receipt,'No encontré la recepción.');
    const remaining=receiptRemaining(data,receipt);
    requireRule(integer(p.amount)&&p.amount>0&&p.amount<=remaining,'El pago supera lo pendiente o no tiene un importe válido.');
    requireRule(p.paidConfirmed===true,'Confirmá que este pago ya se realizó.');
    appendMovement(data.ledger,{kind:'purchase-payment',legs:[{account:p.account,amount:-p.amount}],source:'receipt-payment:'+id,note:'Pago de mercadería · '+receipt.supplier,at,day});
    data.receiptPayments.push({id,receiptId:receipt.id,amount:p.amount,account:p.account,at,day});return {receiptId:receipt.id,paymentId:id,remaining:remaining-p.amount};
  }
  if(op.kind==='monthly-goal'){
    requireRule(/^\d{4}-(0[1-9]|1[0-2])$/.test(p.month)&&(p.amount===null||integer(p.amount)&&p.amount>0),'Elegí un mes y una meta mayor a cero, o quitá la meta.');
    data.monthlyGoals.push({id,month:p.month,amount:p.amount,at,day});return {month:p.month,goalId:id};
  }
  return undefined;
}
