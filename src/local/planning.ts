import type { PurchaseLine } from '../domain/types';
import { canonical, fail, signed } from '../domain/rules';
import { validateGoal, validateOrder, validatePurchaseDraft, receivedFor, orderStatus, type MonthlyGoal, type PurchaseDraft, type PurchaseOrder } from '../domain/planning';
import type { LocalDatabase } from './database';
/** Preparatory records never write journal, stock, lots or cash. */
export class PlanningService {
 constructor(private db:LocalDatabase){}
 async saveOrder(input:PurchaseOrder){
  const order=structuredClone(input);validateOrder(order);
  return this.db.transaction('rw',this.db.orders,this.db.products,this.db.purchaseDrafts,async()=>{
   const old=await this.db.orders.get(order.id);
   if(old ? old.version!==order.version : order.version!==1)fail('VERSION_CONFLICT','El pedido cambió en otra pantalla. Volvé a abrirlo.');
   if(old&&old.state!=='draft'&&(canonical(old.lines)!==canonical(order.lines)||old.supplier!==order.supplier||order.state==='draft'))fail('ORDER_LOCKED','Un pedido enviado conserva sus productos y cantidades. Prepará otro pedido para cambios.');
   if(old?.state==='cancelled')fail('ORDER_LOCKED','Este pedido está cancelado.');
   if(order.state==='cancelled'&&(await this.db.purchaseDrafts.toArray()).some(d=>d.orderId===order.id&&!d.consumedBy))fail('ORDER_IN_USE','Hay una recepción en preparación. Descartala antes de cancelar el pedido.');
   for(const l of order.lines)if(!(await this.db.products.get(l.productId)))fail('PRODUCT_NOT_FOUND','No se encontró un producto del pedido.');
   const next={...order,version:old?signed(old.version+1):1,updatedAt:new Date().toISOString()};await this.db.orders.put(next);return next;
  });
 }
 async startReceipt(orderId:string|null=null){
  return this.db.transaction('rw',this.db.purchaseDrafts,this.db.orders,this.db.writeIntents,async()=>{
   if(await this.db.writeIntents.count())fail('WRITE_IN_PROGRESS','Cerrá la confirmación anterior antes de preparar otra recepción.');
   const drafts=await this.db.purchaseDrafts.toArray(),existing=drafts.find(d=>!d.consumedBy);
   if(existing){if(existing.orderId!==orderId)fail('RECEIPT_IN_PROGRESS','Hay otra recepción en preparación. Retomala o descartala primero.');return existing;}
   const order=orderId?await this.db.orders.get(orderId):undefined;
   if(orderId&&(!order||!['sent','partial'].includes(orderStatus(order,drafts))))fail('ORDER_NOT_PENDING','El pedido no tiene mercadería pendiente de recibir.');
   const draft:PurchaseDraft={id:crypto.randomUUID(),version:1,orderId,consumedBy:null,updatedAt:new Date().toISOString(),rows:order?order.lines.map(l=>({id:crypto.randomUUID(),orderLineId:l.id,productId:l.productId,quantity:String(l.packs*l.unitsPerPack-receivedFor(order,drafts,l.id)),cost:'',presentation:`Pack de ${l.unitsPerPack} unidades`,reason:''})).filter(r=>r.quantity!=='0'):[]};
   await this.db.purchaseDrafts.add(draft);return draft;
  });
 }
 async reopenLegacyReceipt(receiptId:string,lines:PurchaseLine[]){
  return this.db.transaction('rw',this.db.purchaseDrafts,this.db.receipts,async()=>{
   const existing=await this.db.purchaseDrafts.get(receiptId);if(existing&&!existing.consumedBy)return existing;
   if(existing||await this.db.receipts.get(receiptId)||(await this.db.purchaseDrafts.toArray()).some(d=>!d.consumedBy))fail('RECEIPT_IN_PROGRESS','Hay otra recepción guardada o en preparación.');
   const d:PurchaseDraft={id:receiptId,version:1,orderId:null,consumedBy:null,updatedAt:new Date().toISOString(),rows:lines.map(l=>({id:l.id,productId:l.productId,quantity:String(l.quantity),cost:String(l.totalCost),presentation:l.presentation,reason:l.costReason??'',orderLineId:null}))};validatePurchaseDraft(d);await this.db.purchaseDrafts.add(d);return d;
  });
 }
 async saveReceipt(input:PurchaseDraft){
  const draft=structuredClone(input);validatePurchaseDraft(draft);
  return this.db.transaction('rw',this.db.purchaseDrafts,this.db.products,this.db.writeIntents,this.db.orders,async()=>{
   const old=await this.db.purchaseDrafts.get(draft.id);
   if(!old||old.version!==draft.version||old.consumedBy||old.orderId!==draft.orderId||draft.consumedBy!==null)fail('VERSION_CONFLICT','La recepción cambió en otra pantalla. Cerrá y volvé a abrirla.');
   const intent=await this.db.writeIntents.get('form');if(intent?.command.type==='ReceivePurchase'&&intent.command.payload.receiptId===draft.id)fail('WRITE_IN_PROGRESS','La recepción está pendiente de confirmar y no se puede modificar.');
   const order=draft.orderId?await this.db.orders.get(draft.orderId):null;
   if(draft.orderId&&(!order||order.state!=='sent'))fail('ORDER_NOT_PENDING','El pedido ya no está pendiente.');
   for(const row of draft.rows){if(!(await this.db.products.get(row.productId)))fail('PRODUCT_NOT_FOUND','No se encontró un producto.');if(order&&!order.lines.some(l=>l.id===row.orderLineId&&l.productId===row.productId))fail('ORDER_LINE','La línea no pertenece al pedido.');}
   const next={...draft,version:signed(old.version+1),updatedAt:new Date().toISOString()};await this.db.purchaseDrafts.put(next);return next;
  });
 }
 async discardReceipt(id:string,version:number){
  return this.db.transaction('rw',this.db.purchaseDrafts,this.db.writeIntents,async()=>{
   const d=await this.db.purchaseDrafts.get(id);if(!d||d.consumedBy||d.version!==version||await this.db.writeIntents.count())fail('VERSION_CONFLICT','La recepción cambió o tiene una confirmación pendiente.');
   await this.db.purchaseDrafts.delete(id);
  });
 }
 async saveGoal(input:MonthlyGoal){
  const goal=structuredClone(input);validateGoal(goal);
  return this.db.transaction('rw',this.db.monthlyGoals,async()=>{const old=await this.db.monthlyGoals.get(goal.month);if(old?old.version!==goal.version:goal.version!==1)fail('VERSION_CONFLICT','La meta cambió en otra pantalla. Volvé a abrirla.');const next={...goal,version:old?signed(old.version+1):1,updatedAt:new Date().toISOString()};await this.db.monthlyGoals.put(next);return next;});
 }
}
