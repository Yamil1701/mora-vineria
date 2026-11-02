import {freezeCartPrices} from './cart-model.js';
import {publicPrice} from './costs.js';
export const supplierKey=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/¼/g,'1/4').replace(/¾/g,'3/4').replace(/\bblco\b/g,'blanco').replace(/\bchic\b/g,'chica').replace(/\b(?:oferta+|efectivo)\b/g,'').replace(/[!,;$]/g,' ').replace(/(\d),(\d)/g,'$1.$2').replace(/\s+/g,' ').trim();
const priceValue=s=>Number(s.replace(/[$\s.]/g,'').replace(',','.'));
const packOf=s=>{const m=s.match(/(?:x|\*)\s*(\d{1,3})(?!\d)/i);return m?Number(m[1]):null;};
const cleanLabel=s=>s.replace(/^[.\s,;]+/,'').replace(/\boferta+\b|\befectivo\b/gi,'').replace(/^\s*y\s+/i,'').replace(/\s+/g,' ').trim();
export function parseSupplierText(text,supplier='El Gringo',aliases=[],products=[]){
  if(typeof text!=='string'||text.length>100000||!text.trim())throw Error('Pegá una lista de hasta 100.000 caracteres.');
  const rows=[];let family='',section='';
  for(const rawLine of text.replace(/\r/g,'').split('\n').map(l=>l.trim()).filter(Boolean)){
    const tokens=[...rawLine.matchAll(/\$?\s*(?:\d{1,3}(?:\.\d{3})+|\d{4,})(?:,\d{2})?/g)].filter(m=>!/^\s*c\s*\/\s*u/i.test(rawLine.slice(m.index+m[0].length)));
    if(!tokens.length){if(/^petacas\s*$/i.test(rawLine)){section='Petacas';continue;}rows.push({label:cleanLabel((section?'Petacas ':'')+rawLine),raw:rawLine,packCost:null,packHint:packOf(rawLine),issue:'Precio incompleto o sin reconocer'});continue;}
    let end=0;
    for(let n=0;n<tokens.length;n++){
      const t=tokens[n],next=tokens[n+1],before=rawLine.slice(end,t.index),tail=rawLine.slice(t.index+t[0].length,next?next.index:undefined);let label=cleanLabel(before.replace(/^\s*(?:x|\*)\s*\d+\s*/i,''));
      if(!label)label=family||'Producto por identificar';
      if(/^(?:\d(?:[.,/ ]\d+)?(?:\s*¼)?(?:\s*(?:l|lts?|cc|ml))?(?:\s*x\s*\d+)?|grande|chica(?:\s+rubia)?|negra|blanco|tinto|de\s+\d.*)$/i.test(label)&&family)label=family+' '+label;
      if(/^\d/.test(label)&&family)label=family+' '+label;
      if(section&&!/^petacas\b/i.test(label))label=section+' '+label;
      const raw=rawLine.slice(end,next?next.index:undefined).trim();
      if(/c\s*\/\s*u/i.test(tail)){const volume=tail.match(/\blitro\b|\b3\/4\b|\b1\/2\b/i)?.[0];if(volume)label+=' '+({litro:'1 L','3/4':'750 ml','1/2':'500 ml'}[volume.toLowerCase()]||volume);}
      const hint=packOf(before)||(!next?packOf(tail):null),cost=priceValue(t[0]);
      let issue=Number.isSafeInteger(cost)&&cost>0?'':'Revisá el precio informado';
      const unit=tail.match(/(\d{4,})\s*c\s*\/\s*u/i);if(unit&&hint&&Number(unit[1])*hint!==cost)issue='El total no coincide con el precio por unidad del texto';
      if(/\b(?:sin|no)\s+(?:precio|stock)\b/i.test(raw))issue='Revisá el texto original';
      rows.push({label,raw,packCost:Number.isSafeInteger(cost)&&cost>0?cost:null,packHint:hint,issue});
      const words=label.replace(/^(?:Petacas\s+)/i,'').split(/\s+/);if(!/^(?:\d|grande|chica|negra)/i.test(cleanLabel(before)))family=words.slice(0,words[0]?.toLowerCase()==='arca'?3:words[0]?.toLowerCase()==='new'?2:1).join(' ');
      end=t.index+t[0].length;
    }
  }
  for(const [n,r] of rows.entries()){
    r.id='row_'+n;r.key=supplierKey(r.label)+'|pack:'+(r.packHint||'?');r.productId=null;r.presentation=null;r.unitsPerPack=null;r.status='review';r.selected=false;r.finalPrice=null;r.expectedPrice=null;r.manualPrice=false;
    const matches=aliases.filter(a=>a.valid&&supplierKey(a.supplier)===supplierKey(supplier)&&a.key===r.key&&products.some(p=>p.id===a.productId&&p.active!==false)&&(!r.packHint||a.unitsPerPack===r.packHint));
    if(matches.length===1&&!r.issue&&r.packCost){const a=matches[0],p=products.find(p=>p.id===a.productId);Object.assign(r,{productId:a.productId,presentation:a.presentation,unitsPerPack:a.unitsPerPack,status:'recognized',expectedPrice:p.price,expectedPriceVersion:p.priceVersion||0,finalPrice:publicPrice(r.packCost,a.unitsPerPack),selected:publicPrice(r.packCost,a.unitsPerPack)!==p.price});}
    else if(!r.issue)r.issue=matches.length>1?'Hay equivalencias en conflicto':r.packHint?'Falta confirmar el producto':'Falta confirmar producto y presentación';
    r.candidateIds=products.filter(p=>supplierKey(p.name+' '+p.variety)===supplierKey(r.label)).map(p=>p.id);
  }
  // Multiple presentations may imply different retail prices: keep the choice human.
  const ids=rows.filter(r=>r.productId).map(r=>r.productId);for(const r of rows)if(r.productId&&ids.filter(id=>id===r.productId).length>1)r.selected=false;
  return rows;
}
export function confirmSupplierRow(data,list,rowId,{productId,presentation,unitsPerPack,packCost,finalPrice,manualPrice=false,acknowledged=false},at){
  const r=list.rows.find(r=>r.id===rowId),p=data.products.find(p=>p.id===productId&&p.active!==false);
  if(!r||!p||!['Unidad','Caja','Pack','Cajón'].includes(presentation)||!Number.isSafeInteger(unitsPerPack)||unitsPerPack<1||unitsPerPack>999||presentation==='Unidad'&&unitsPerPack!==1||!Number.isSafeInteger(packCost)||packCost<1||packCost>999999999)throw Error('Confirmá el producto, la presentación, sus unidades y el costo de esa presentación.');
  if((r.packHint&&r.packHint!==unitsPerPack||r.issue.includes('no coincide'))&&!acknowledged)throw Error('La lista indica otra cantidad por presentación. Confirmá la diferencia para continuar.');
  const suggested=publicPrice(packCost,unitsPerPack),price=manualPrice?Number(finalPrice):suggested;if(!Number.isSafeInteger(price)||price<1)throw Error('Revisá el precio de venta final.');
  const related=data.supplierAliases.filter(a=>supplierKey(a.supplier)===supplierKey(list.supplier)&&a.key===r.key);for(const a of related)a.valid=false;
  data.supplierAliases.push({id:list.id+'_'+rowId+'_'+(related.length+1),supplier:list.supplier,key:r.key,productId,presentation,unitsPerPack,explicitPack:r.packHint||null,at,revision:related.length+1,valid:true});
  Object.assign(r,{productId,presentation,unitsPerPack,packCost,finalPrice:price,manualPrice,expectedPrice:p.price,expectedPriceVersion:p.priceVersion||0,status:'confirmed',issue:'',selected:price!==p.price});return r;
}
export function priceProposals(list){return list.rows.filter(r=>r.status!=='review'&&r.status!=='ignored'&&r.selected&&r.finalPrice!==r.expectedPrice);}
export function applySupplierPrices(data,list,id,at){freezeCartPrices(data);if(data.priceReviews.some(p=>p.id===id))return false;const rows=priceProposals(list);if(!rows.length)throw Error('No hay cambios de precio seleccionados.');if(new Set(rows.map(r=>r.productId)).size!==rows.length)throw Error('Elegí una sola propuesta por producto.');
  for(const r of rows){const p=data.products.find(p=>p.id===r.productId);if(!p||p.price!==r.expectedPrice||(r.expectedPriceVersion??0)!==(p.priceVersion||0))throw Error('Un precio cambió durante la revisión. Abrí esa fila y revisala de nuevo.');}
  const changes=rows.map(r=>({productId:r.productId,before:r.expectedPrice,after:r.finalPrice}));for(const c of changes){const p=data.products.find(p=>p.id===c.productId);p.price=c.after;p.priceVersion=(p.priceVersion||0)+1;}data.priceReviews.push({id,listId:list.id,at,changes});for(const r of rows){r.expectedPrice=r.finalPrice;r.expectedPriceVersion=data.products.find(p=>p.id===r.productId).priceVersion||0;r.selected=false;}return changes;
}
export function knownPresentations(data,productId,supplier='El Gringo'){return data.supplierLists.filter(l=>l.supplier===supplier).slice(-1).flatMap(l=>l.rows.filter(r=>r.productId===productId&&['recognized','confirmed'].includes(r.status)&&data.supplierAliases.some(a=>a.valid&&a.key===r.key&&a.productId===productId&&a.unitsPerPack===r.unitsPerPack)).map(r=>({...r,listId:l.id}))).filter((r,n,a)=>a.findIndex(x=>x.presentation===r.presentation&&x.unitsPerPack===r.unitsPerPack)===n);}
