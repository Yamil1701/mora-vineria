// One semantic command boundary shared by server and durable local preparation.
import {prepareOperation,applyOperation,businessDay,canonical} from './operations.js';
import {validateData,emptyData,readBackup,hasBusinessData} from './local-data.js';
import {writeProduct,setProductActive} from './product-model.js';
import {createPurchaseOrder,markOrderSent,closePurchaseOrder} from './purchase-orders.js';
import {savePurchasePresentation} from './purchasing.js';
import {parseSupplierText,confirmSupplierRow,applySupplierPrices} from './supplier-engine.js';
import {publicPrice,lineTotal} from './costs.js';
import {freezeCartPrices} from './cart-model.js';
import {accounts} from './money-model.js';
export const LOCAL_KEYS=['cart','cartPrices','favorites','workState'];
export const COMMAND_KINDS=['sale','opening','debt-payment','movement','receive','verify-transfer','resolve-stock','correction-review','inventory-adjustment','receipt-payment','sale-correction','monthly-goal','product-write','product-active','order-create','order-sent','order-close','reference','check','purchase-presentation','supplier-list','supplier-row','supplier-prices','adopt-price','import-initial'];
export const sharedSnapshot=data=>{const d=validateData(data),empty=emptyData();for(const key of LOCAL_KEYS)d[key]=empty[key];return d;};
export const sharedEqual=(a,b)=>canonical(sharedSnapshot(a))===canonical(sharedSnapshot(b));
export function withLocal(remote,local){const d=structuredClone(remote);for(const key of LOCAL_KEYS)d[key]=structuredClone(local[key]);return validateData(d);}
export function applyCommand(data,r){
  const {payload:p,kind,id,at}=r,day=businessDay(at);
  if(kind==='product-write')return {productId:writeProduct(data,p,{id,at}).id};
  if(kind==='product-active'){
    if(typeof p.active!=='boolean')throw Error('Estado de producto inválido.');
    setProductActive(data,p.productId,p.active,at);return {productId:p.productId};
  }
  if(kind==='order-create')return {orderId:createPurchaseOrder(data,{...p,id,at,day}).id};
  if(kind==='order-sent'||kind==='order-close'){
    const changed=(kind==='order-sent'?markOrderSent:closePurchaseOrder)(data,p.orderId,at);
    if(!changed)throw Error('El pedido requiere revisión.');return {orderId:p.orderId};
  }
  if(kind==='purchase-presentation')return {presentationId:savePurchasePresentation(data,p.productId,p.config,{id,at}).id};
  if(kind==='supplier-list'){
    if(typeof p.source!=='string'||p.source.length>100000||!p.supplier?.trim()||p.supplier.length>100)throw Error('Revisá la lista y el proveedor.');
    const rows=parseSupplierText(p.source,p.supplier,data.supplierAliases,data.products);if(rows.length>1000)throw Error('La lista tiene demasiadas filas.');
    data.supplierLists.push({id,supplier:p.supplier.trim(),source:p.source,at,rows});return {listId:id};
  }
  if(kind==='supplier-row'){
    const list=data.supplierLists.find(l=>l.id===p.listId);if(!list)throw Error('No encontré la lista.');
    confirmSupplierRow(data,list,p.rowId,p.values,at);
    savePurchasePresentation(data,p.values.productId,{supplier:list.supplier,presentation:p.values.presentation,unitsPerPack:p.values.unitsPerPack,packCost:p.values.packCost},{id:id+'_p',at});return {listId:list.id,rowId:p.rowId};
  }
  if(kind==='supplier-prices'){
    const list=data.supplierLists.find(l=>l.id===p.listId);if(!list||!Array.isArray(p.selectedRowIds)||new Set(p.selectedRowIds).size!==p.selectedRowIds.length)throw Error('Revisá los precios elegidos.');
    if(p.selectedRowIds.some(id=>!list.rows.some(r=>r.id===id)))throw Error('Una fila ya no está disponible.');
    for(const row of list.rows)row.selected=p.selectedRowIds.includes(row.id);
    return {changes:applySupplierPrices(data,list,id,at)};
  }
  if(kind==='adopt-price'){
    const receipt=data.receipts.find(r=>r.id===p.receiptId),line=receipt?.items.find(i=>i.productId===p.productId),product=data.products.find(v=>v.id===p.productId);
    if(!line||!product||(product.priceVersion||0)!==p.expectedPriceVersion)throw Error('El precio cambió. Volvé a revisarlo.');
    freezeCartPrices(data);const before=product.price,after=publicPrice(lineTotal(line),line.qty);
    if(before!==after){product.price=after;product.priceVersion=(product.priceVersion||0)+1;product.changes=[...(product.changes||[]),{at,kind:'edit',fields:{price:{before,after}},receiptId:receipt.id}];}
    return {productId:product.id,price:after};
  }
  if(kind==='import-initial'){
    if(hasBusinessData(data))throw Error('El negocio ya tiene datos. No se mezclan historiales.');
    if(typeof p.sourceNamespace!=='string'||!/^[0-9a-f-]{36}$/i.test(p.sourceNamespace)||typeof p.sourceDigest!=='string'||!/^[0-9a-f]{64}$/.test(p.sourceDigest))throw Error('La copia necesita una identidad de origen válida.');
    const imported=readBackup(p.rawBackup);Object.assign(data,sharedSnapshot(imported));return {imported:true,sourceNamespace:p.sourceNamespace,sourceDigest:p.sourceDigest};
  }
  if(kind==='reference'||kind==='check'){
    if(!accounts.some(a=>a.id===p.account)||!Number.isSafeInteger(p.amount)||Math.abs(p.amount)>999999999||p.account==='cash'&&p.amount<0)throw Error('Cuenta o importe inválidos.');
    const seq=data.ledger.length;
    if(kind==='reference'){const ref={account:p.account,amount:p.amount,seq,at,day};data.references[p.account]=ref;data.referenceLog.push(ref);return {account:p.account};}
    const ref=data.references[p.account],expected=ref?ref.amount+data.ledger.filter(e=>e.seq>ref.seq).flatMap(e=>e.legs).filter(l=>l.account===p.account).reduce((n,l)=>n+l.amount,0):null;
    data.checks.push({account:p.account,amount:p.amount,expected,difference:expected===null?null:p.amount-expected,at,day});return {account:p.account};
  }
  const previous=data.operations.find(o=>o.id===id);if(previous&&previous.at!==at)throw Error('La fecha no coincide con la preparación original.');
  prepareOperation(data,{id,kind,payload:p,at});return applyOperation(data,id);
}
