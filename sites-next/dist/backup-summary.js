import {workspaceFormKey} from './draft-model.js';
// Summarize a validated backup without changing any fact or draft.
export function backupSummary(data){
  const count=key=>data[key]?.length||0,w=data.workState||{};
  const prepared=(data.operations||[]).filter(o=>o.status==='prepared'),failed=(data.operations||[]).filter(o=>o.status==='failed');
  const activePrepared=prepared.some(o=>o.id===w.activeOperationId);
  const rows=[['Productos',count('products')],['Ventas',count('sales')],['Movimientos',count('ledger')],['Recepciones',count('receipts')]];
  for(const [label,n] of [['Fiados',count('debts')],['Abonos',count('debtPayments')],['Pagos posteriores de mercadería',count('receiptPayments')],['Aperturas y conteos de stock',count('stockOpenings')+count('inventoryAdjustments')],['Correcciones de ventas',count('saleCorrections')],['Metas mensuales',count('monthlyGoals')],['Pedidos',count('purchaseOrders')],['Listas de proveedor',count('supplierLists')],['Equivalencias',(data.supplierAliases||[]).filter(a=>a.valid).length],['Diferencias por revisar',(data.stockReviews||[]).filter(r=>!data.stockResolutions?.some(v=>v.reviewId===r.id)).length],['Registros en preparación',prepared.length],['Registros que requieren atención',failed.length]])if(n)rows.push([label,n]);
  const cartUnits=Object.values(data.cart||{}).reduce((n,q)=>n+q,0);if(cartUnits)rows.push(['Unidades en el carrito',cartUnits]);
  const draftKeys=['orderDraft','receiptDraft','newProduct','workspaceDraft','supplierDraft','supplierEdit','purchaseDraft',...(!activePrepared?['moneyDraft']:[])];
  const registry=new Set(Object.keys(w.savedForms||{}));
  const slotKey=k=>k==='newProduct'?'product:'+(w.newProduct?.id||'new'):k==='workspaceDraft'?workspaceFormKey(w.workspaceDraft?.kind,w.workspaceFocusId,w.workspaceDraft?.type):k==='purchaseDraft'?'purchase:'+w.purchaseProductId:k==='moneyDraft'?'money:'+w.movementKind:k==='supplierEdit'?'supplier:'+w.supplierListId+':'+w.supplierRowId:null;
  const drafts=registry.size+draftKeys.filter(k=>w[k]&&typeof w[k]==='object'&&Object.keys(w[k]).length&&!registry.has(slotKey(k))).length;if(drafts)rows.push(['Borradores guardados',drafts]);
  return {rows,prepared:prepared.length,failed:failed.length,activePrepared};
}
export function renderBackupSummary(data,esc){
  const s=backupSummary(data);
  const renderRows=rows=>`<div class="restore-counts">${rows.map(([label,n])=>`<div><span>${esc(label)}</span><b>${n}</b></div>`).join('')}</div>`;
  return renderRows(s.rows.slice(0,3))+
    `<details class="workflow-disclosure"><summary>Ver todo lo incluido</summary>${renderRows(s.rows.slice(3))}</details>`+
    (s.prepared?`<p class="restore-recovery-note">El archivo conserva ${s.prepared} ${s.prepared===1?'registro que quedó':'registros que quedaron'} en preparación.${s.activePrepared?' Mora retomará la confirmación pendiente al volver a abrirse, sin repetir los registros ya guardados.':' Se conservan para revisar; no se descartan al recuperar la copia.'}</p>`:'');
}
