import {WORKFLOW_FIELDS,WORKFLOW_PAGES} from './workflow-state.js';
export const DRAFT_FIELDS=[...WORKFLOW_FIELDS,'saleOperationId','activeOperationId','shortageAccepted','completedNumber','page','received','method','discount','discountDraft','customer','transferAccount','transferVerified','cashShare','orderDraft','orderId','receiptDraft','receiptId','moneyFilter','moneyDraft','movementKind','newProduct','productId','accountId','countDraft','supplierDraft','supplierEdit','supplierListId','supplierRowId','purchaseDraft','purchaseProductId','purchaseReturn','search','category','stockFilter','availableOnly','inactiveOnly','zeroOnly','noTargetOnly','catalogView','salesSearch','salesMethod','pendingOnly','dateFrom','dateTo','saleId','supplyTab','favoritesDraft','supplierReturn','supplierShowAll','supplierLinkSearch','barcode','priceReviewId','areaContexts'];
const pages=[...WORKFLOW_PAGES,'home','sales','cash','more','catalog','product','sale','cart','pay','payOptions','discount','supplierPaste','supplierList','supplierRow','supplierLink','supplierPrices','restore','purchasePresentation','orderBuild','orderProducts','orderDetail','done','settings','saleDetail','data','orders','receiveProducts','receive','receiptDetail','favorites','history','status','scan','createProduct','editProduct','countMoney','reference','moneyHistory','registerMoney','moveMoney','moneyForm','controlHistory'];
const requireDraft=ok=>{if(!ok)throw Error('El trabajo en preparación está incompleto o no es compatible.');};
export function validateDrafts(data){
  const w=data.workState;
  requireDraft(w&&typeof w==='object'&&!Array.isArray(w)&&Object.keys(w).every(k=>DRAFT_FIELDS.includes(k))&&JSON.stringify(w).length<=500000);
  if(w.page!==undefined)requireDraft(pages.includes(w.page));
  if(w.areaContexts)requireDraft(typeof w.areaContexts==='object'&&!Array.isArray(w.areaContexts)&&Object.keys(w.areaContexts).length<=pages.length&&Object.entries(w.areaContexts).every(([p,r])=>pages.includes(p)&&r&&r.page===p));
  if(w.method!==undefined)requireDraft(['cash','transfer','mixed','credit'].includes(w.method));
  for(const key of ['moneyDraft','newProduct','countDraft','supplierDraft','supplierEdit','purchaseDraft','shortageAccepted','workspaceDraft'])if(w[key]!=null)requireDraft(typeof w[key]==='object'&&!Array.isArray(w[key]));
  for(const key of ['orderDraft','receiptDraft'])if(w[key]!=null){
    const v=w[key];requireDraft(typeof v==='object'&&typeof v.id==='string'&&Array.isArray(v.items)&&v.items.length<=500&&v.items.every(i=>i&&data.products.some(p=>p.id===i.productId)));
  }
  for(const key of ['received','cashShare','discountDraft','customer','search','salesSearch','supplierLinkSearch','barcode','creditShare','workspaceSearch','workspaceMoneyKind','workspaceMoneyFrom','workspaceMoneyTo','reportPeriod','reportMonth','reportFrom','reportTo'])if(w[key]!==undefined)requireDraft(typeof w[key]==='string'&&w[key].length<=1000);
  if(w.workspaceDraft)requireDraft(typeof w.workspaceDraft.id==='string'&&w.workspaceDraft.id.length<=80&&typeof w.workspaceDraft.kind==='string');
  if(w.discount!==undefined)requireDraft(Number.isSafeInteger(w.discount)&&w.discount>=0);
  if(w.activeOperationId)requireDraft(data.operations.some(o=>o.id===w.activeOperationId));
  for(const [productId,quantity]of Object.entries(w.shortageAccepted||{}))requireDraft(data.products.some(p=>p.id===productId)&&(Number.isSafeInteger(quantity)&&quantity>0||typeof quantity==='string'&&/^\d+:-?\d+:\d+$/.test(quantity)));
  if(w.page==='product')requireDraft(data.products.some(p=>p.id===w.productId));
  if(w.page==='saleDetail')requireDraft(data.sales.some(s=>s.number===w.saleId));
  if(w.page==='receiptDetail')requireDraft(data.receipts.some(r=>r.id===w.receiptId));
  if(w.page==='orderDetail')requireDraft(data.purchaseOrders.some(o=>o.id===w.orderId));
  if(['supplierRow','supplierLink'].includes(w.page))requireDraft(data.supplierLists.some(l=>l.id===w.supplierListId&&l.rows.some(r=>r.id===w.supplierRowId)));
}
