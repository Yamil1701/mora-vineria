export function createPurchaseOrder(data,{id,supplier,note='',items,at,day}){
  if(data.purchaseOrders.some(o=>o.id===id))return false;
  if(!id||!supplier?.trim()||supplier.length>100||note.length>160||!items.length||new Set(items.map(i=>i.productId)).size!==items.length)throw Error('Completá el proveedor y elegí al menos un producto.');
  const lines=items.map(i=>{if(i.packs!==undefined){if(!Number.isSafeInteger(i.packs)||i.packs<1||!Number.isSafeInteger(i.unitsPerPack)||i.unitsPerPack<1||i.unitsPerPack>999||!['Unidad','Caja','Pack','Cajón'].includes(i.presentation)||i.presentation==='Unidad'&&i.unitsPerPack!==1)throw Error('Revisá la presentación y las unidades de cada producto.');i={...i,qty:i.packs*i.unitsPerPack};}const p=data.products.find(p=>p.id===i.productId);if(!p||!Number.isSafeInteger(i.qty)||i.qty<1||i.qty>99999)throw Error('Cada producto necesita una cantidad mayor a cero.');return {productId:p.id,name:p.name,variety:p.variety,qty:i.qty,...(i.packs!==undefined?{packs:i.packs,presentation:i.presentation,unitsPerPack:i.unitsPerPack,packCost:i.packCost??null,listId:i.listId||null,rowId:i.rowId||null}:{})};});
  const order={id,supplier:supplier.trim(),note:note.trim(),items:lines,at,day,closedAt:null,sentAt:null};data.purchaseOrders.push(order);return order;
}
export const receivedFor=(data,orderId,productId)=>data.receipts.filter(r=>r.orderId===orderId).reduce((sum,r)=>sum+r.items.filter(i=>i.productId===productId).reduce((n,i)=>n+i.qty,0),0);
export function orderProgress(data,order){const total=order.items.reduce((a,i)=>a+i.qty,0),received=order.items.reduce((a,i)=>a+Math.min(i.qty,receivedFor(data,order.id,i.productId)),0);return {total,received,remaining:total-received,status:order.closedAt?'closed':received===total?'received':received?'partial':order.sentAt?'pending':'draft'};}
export function closePurchaseOrder(data,id,at){const o=data.purchaseOrders.find(o=>o.id===id);if(!o||o.closedAt||!orderProgress(data,o).remaining)return false;o.closedAt=at;return true;}

export function markOrderSent(data,id,at){const o=data.purchaseOrders.find(o=>o.id===id);if(!o||o.sentAt||o.closedAt)return false;o.sentAt=at;return true;}
