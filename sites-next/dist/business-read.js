// Read models never invent money or rewrite the recorded facts.
export const saleKey=s=>s.id||'legacy_'+s.number;
export const saleByKey=(d,id)=>d.sales.find(s=>saleKey(s)===id||s.number===id);
export const correctionsFor=(d,id)=>d.saleCorrections.filter(c=>c.saleId===id&&c.status==='applied').sort((a,b)=>a.revision-b.revision);
export function effectiveSale(d,id){
  const original=saleByKey(d,id);if(!original)return null;
  const corrections=correctionsFor(d,saleKey(original)),recorded=corrections.at(-1)?.after,after=recorded?structuredClone(recorded):null;
  if(after)after.parts=after.parts.map(p=>{const current=original.parts.find(v=>v.id===p.id);return !p.verified&&current?.verified?{...p,verified:true,verifiedAt:current.verifiedAt}:p;});
  return {...structuredClone(original),...(after?structuredClone(after):{}),revision:corrections.length,originalId:saleKey(original)};
}
export function debtRemaining(d,id){
  const debt=d.debts.find(v=>v.id===id);if(!debt)throw Error('No encontré el fiado.');
  return debt.amount+(d.debtAdjustments||[]).filter(v=>v.debtId===id).reduce((n,v)=>n+v.amount,0)-d.debtPayments.filter(v=>v.debtId===id).reduce((n,v)=>n+v.amount,0);
}
export const receiptPaid=(d,r)=>(r.paid?r.total:0)+(d.receiptPayments||[]).filter(p=>p.receiptId===r.id).reduce((n,p)=>n+p.amount,0);
export const receiptRemaining=(d,r)=>r.total-receiptPaid(d,r);
export const monthlyGoal=(d,month)=>(d.monthlyGoals||[]).filter(g=>g.month===month).at(-1)?.amount??null;
export function pendingStockReviews(d){
  const resolved=new Set(d.stockResolutions.map(s=>s.reviewId));
  const sales=new Map(d.sales.map(s=>[saleKey(s),s]));
  const lots=new Map(d.lots.map(l=>[l.id,l]));
  const initialCounts=new Set(d.inventoryAdjustments.filter(a=>a.before===0&&a.reasonKind==='count'&&a.totalCost===null).map(a=>a.id));
  // A later return to zero stock does not make a new count an opening.
  const firstLot=new Map();
  for(const lot of d.lots){
    const first=firstLot.get(lot.productId);
    if(!first||Date.parse(lot.at)<Date.parse(first.at))firstLot.set(lot.productId,lot);
  }
  return d.stockReviews.filter(r=>{
    if(resolved.has(r.id))return false;
    if(r.missingQty||r.stockShortfall)return true;
    const line=sales.get(r.saleId)?.items.find(i=>i.id===r.productId);
    const costsDeclaredUnknown=(line?.allocations||[]).reduce((units,part)=>{
      const lot=lots.get(part.lotId);
      const initial=lot?.openingId||initialCounts.has(lot?.adjustmentId)&&firstLot.get(r.productId)===lot;
      return initial&&part.unitCost===null?units+part.qty:units;
    },0);
    return !r.unknownQty||costsDeclaredUnknown!==r.unknownQty;
  });
}
export const movementLabel=kind=>({sale:'Cobro de venta','debt-payment':'Abono de fiado',contribution:'Aporte',expense:'Gasto',withdrawal:'Retiro',move:'Traspaso',purchase:'Compra de mercadería','purchase-payment':'Pago de mercadería','sale-correction':'Corrección de venta','payment-correction':'Corrección de cuenta'}[kind]||'Movimiento');
export function identifiedSaleCost(d,s){let known=0,unknown=0;for(const i of s.items){const r=d.stockReviews.find(r=>r.saleNumber===s.number&&r.productId===i.id),resolution=r&&d.stockResolutions.find(v=>v.reviewId===r.id);known+=(i.knownCostTotal??i.costTotal??0)+(resolution?.totalCost||0);unknown+=resolution?0:(i.unknownQty||0);}return {known,unknown};}
