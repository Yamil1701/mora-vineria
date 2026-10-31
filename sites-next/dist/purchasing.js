import {knownPresentations} from './supplier-engine.js';
export const presentations=['Unidad','Caja','Pack','Cajón'];
export function purchaseOptions(data,productId,supplier='El Gringo'){
 const p=data.products.find(p=>p.id===productId);if(!p)return [];
 const fresh=knownPresentations(data,productId,supplier),saved=(p.purchasePresentations||[]).filter(r=>r.supplier===supplier);
 const merged=saved.map(r=>{const f=fresh.find(f=>f.presentation===r.presentation&&f.unitsPerPack===r.unitsPerPack);return {...r,...(f?{packCost:f.packCost,listId:f.listId,rowId:f.id,costAt:data.supplierLists.find(l=>l.id===f.listId)?.at}:{}),savedId:r.id};});
 for(const f of fresh)if(!merged.some(r=>r.presentation===f.presentation&&r.unitsPerPack===f.unitsPerPack))merged.push({id:'list_'+f.id,savedId:null,supplier,presentation:f.presentation,unitsPerPack:f.unitsPerPack,packCost:f.packCost,listId:f.listId,rowId:f.id,costAt:data.supplierLists.find(l=>l.id===f.listId)?.at});
 return merged;
}
export function savePurchasePresentation(data,productId,input,{id,at=new Date().toISOString()}={}){
 const p=data.products.find(p=>p.id===productId);if(!p)throw Error('No encontré el producto.');
 const supplier=String(input.supplier||'').trim(),presentation=input.presentation,unitsPerPack=Number(input.unitsPerPack),packCost=input.packCost===''||input.packCost===null||input.packCost===undefined?null:Number(input.packCost);
 if(!supplier||supplier.length>100||!presentations.includes(presentation)||!Number.isSafeInteger(unitsPerPack)||unitsPerPack<1||unitsPerPack>999||(presentation==='Unidad'&&unitsPerPack!==1))throw Error('Revisá el proveedor, la presentación y cuántas unidades trae.');
 if(packCost!==null&&(!Number.isSafeInteger(packCost)||packCost<1||packCost>999999999))throw Error('El costo de referencia debe ser mayor a cero o quedar vacío.');
 const rows=p.purchasePresentations||[],same=rows.find(r=>r.id===input.id)||rows.find(r=>r.supplier===supplier&&r.presentation===presentation&&r.unitsPerPack===unitsPerPack);
 if(!same&&rows.length>=12)throw Error('Este producto ya tiene 12 presentaciones guardadas. Editá una existente.');
 if(rows.some(r=>r!==same&&r.supplier===supplier&&r.presentation===presentation&&r.unitsPerPack===unitsPerPack))throw Error('Esa presentación ya está guardada para este proveedor.');
 const value={id:same?.id||id,supplier,presentation,unitsPerPack,packCost,at,costAt:at};
 if(!value.id)throw Error('Falta identificar la presentación.');
 if(same&&JSON.stringify({...same,at,costAt:at})===JSON.stringify(value))return same;
 p.purchasePresentations=rows.filter(r=>r.id!==value.id).concat(value);
 p.changes=[...(p.changes||[]),{at,kind:'purchase',fields:{purchasePresentations:{before:same?`${same.presentation} × ${same.unitsPerPack}`:null,after:`${presentation} × ${unitsPerPack}`}}}];return value;
}
export function receiptReferenceTotal(i){const units=Number(i.expected),size=Number(i.orderedUnitsPerPack||i.unitsPerPack),cost=Number(i.estimatedPackCost),total=units*cost/size;return units>0&&size>0&&cost>0&&Number.isSafeInteger(total)?total:null;}
export function acceptReceiptLine(d,index){const i=d.items[index],cost=receiptReferenceTotal(i);if(!i||cost===null)throw Error('Revisá la cantidad y el costo real de este producto.');i.qty=String(i.expected);i.lineCost=String(cost);i.packs=i.expected%Number(i.unitsPerPack||1)===0?String(i.expected/Number(i.unitsPerPack||1)):'';i.quantityManual=true;i.checked=true;d.review=false;}
