import {addExtendedUsage,validateExtendedData} from './extended-validation.js';
import {validateOperations} from './operation-validation.js';
import {freezeCartPrices} from './cart-model.js';
import {validProductPhoto,productModels} from './product-model.js';
import {allocationCost,scaleFraction,costFraction,addFractions,fractionNumber,lotTotal,lineTotal} from './costs.js';
// One atomic browser-local snapshot. Demo data never enters this store.
import {appendMovement,accounts} from './money-model.js';
export const DATA_KEYS=['products','sales','cart','cartPrices','favorites','ledger','referenceLog','references','checks','lots','receipts','purchaseOrders','supplierLists','supplierAliases','priceReviews','operations','stockOpenings','stockReviews','stockResolutions','debts','debtPayments','saleCorrections','workState','inventoryAdjustments','receiptPayments','debtAdjustments','monthlyGoals'];
export const emptyData=()=>({products:[],sales:[],cart:{},cartPrices:{},favorites:[],ledger:[],referenceLog:[],references:{},checks:[],lots:[],receipts:[],purchaseOrders:[],supplierLists:[],supplierAliases:[],priceReviews:[],workState:{},operations:[],stockOpenings:[],stockReviews:[],stockResolutions:[],debts:[],debtPayments:[],saleCorrections:[],inventoryAdjustments:[],receiptPayments:[],debtAdjustments:[],monthlyGoals:[]});
export const snapshot=s=>{for(const k of DATA_KEYS)if(s[k]===undefined)s[k]=structuredClone(emptyData()[k]);freezeCartPrices(s);return Object.fromEntries(DATA_KEYS.map(k=>[k,structuredClone(s[k])]));};
const insist=(ok,message='El respaldo contiene datos inválidos.')=>{if(!ok)throw Error(message);};
const integer=(n,min=0)=>Number.isSafeInteger(n)&&n>=min&&n<=Number.MAX_SAFE_INTEGER;
const str=(s,max=200)=>typeof s==='string'&&s.length<=max;
const id=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
const date=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT/.test(s)&&Number.isFinite(Date.parse(s));
const day=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\d$/.test(s);
const account=s=>accounts.some(a=>a.id===s);
const unique=(a,k)=>new Set(a.map(x=>x[k])).size===a.length;
export function validateData(input){
  insist(input&&typeof input==='object');const d=JSON.parse(JSON.stringify(input)),legacyDebts=!Object.hasOwn(input,'debts');for(const k of ['purchaseOrders','supplierLists','supplierAliases','priceReviews'])if(!Object.hasOwn(d,k))d[k]=[];
  if(!Object.hasOwn(d,'cartPrices')){d.cartPrices={};freezeCartPrices(d);}
  for(const k of ['operations','stockOpenings','stockReviews','stockResolutions','debts','debtPayments','saleCorrections','inventoryAdjustments','receiptPayments','debtAdjustments','monthlyGoals'])if(!Object.hasOwn(d,k))d[k]=[];if(!Object.hasOwn(d,'workState'))d.workState={};
  insist(DATA_KEYS.every(k=>Object.hasOwn(d,k)));for(const k of ['products','sales','favorites','ledger','referenceLog','checks','lots','receipts','purchaseOrders','supplierLists','supplierAliases','priceReviews'])insist(Array.isArray(d[k])&&d[k].length<=50000);
  insist(d.products.length<=5000&&unique(d.products,'id')&&unique(d.sales,'number')&&unique(d.lots,'id')&&unique(d.receipts,'id')&&unique(d.purchaseOrders,'id'));
  for(const sale of d.sales)if(legacyDebts&&sale.method==='credit'&&sale.total>0&&!d.debts.some(v=>v.saleNumber===sale.number))d.debts.push({id:'debt_legacy_'+sale.number,saleId:sale.id||'legacy_'+sale.number,saleNumber:sale.number,customer:sale.customer,amount:sale.total,at:sale.at,day:sale.day});
  const products=new Map(d.products.map(p=>[p.id,p]));
  for(const p of d.products)insist(id(p.id)&&str(p.name,60)&&p.name.trim()&&str(p.variety,60)&&str(p.size,20)&&str(p.cat,30)&&str(p.origin,120)&&['red','white','rose'].includes(p.tone)&&integer(p.price,1)&&Number.isSafeInteger(p.stock)&&integer(p.target)&&(!p.barcode||/^\d{8,14}$/.test(p.barcode)));
  for(const p of d.products){insist(p.priceVersion===undefined||integer(p.priceVersion));insist(p.active===undefined||typeof p.active==='boolean');insist(!p.model||productModels.includes(p.model));insist(!p.photo||validProductPhoto(p.photo));if(p.changes!==undefined){insist(Array.isArray(p.changes)&&p.changes.length<=50000);for(const c of p.changes){insist(date(c.at)&&['create','edit','activate','deactivate','purchase'].includes(c.kind));if(c.fields)insist(typeof c.fields==='object'&&!Array.isArray(c.fields)&&JSON.stringify(c.fields).length<4000);}}}
  insist(d.products.reduce((n,p)=>n+(p.photo?.length||0),0)<=2500000,'Las fotos superan el espacio disponible.');
  for(const p of d.products)if(p.purchasePresentations!==undefined){insist(Array.isArray(p.purchasePresentations)&&p.purchasePresentations.length<=12&&unique(p.purchasePresentations,'id')&&new Set(p.purchasePresentations.map(r=>r.supplier+'|'+r.presentation+'|'+r.unitsPerPack)).size===p.purchasePresentations.length);for(const r of p.purchasePresentations)insist(id(r.id)&&str(r.supplier,100)&&r.supplier.trim()&&['Unidad','Caja','Pack','Cajón'].includes(r.presentation)&&integer(r.unitsPerPack,1)&&r.unitsPerPack<=999&&(r.presentation!=='Unidad'||r.unitsPerPack===1)&&(r.packCost===null||integer(r.packCost,1)&&r.packCost<=999999999)&&date(r.at)&&date(r.costAt));}
  insist(new Set(d.products.filter(p=>p.barcode).map(p=>p.barcode.padStart(14,'0'))).size===d.products.filter(p=>p.barcode).length);
  insist(d.cart&&typeof d.cart==='object'&&!Array.isArray(d.cart));for(const [p,n] of Object.entries(d.cart))insist(products.has(p)&&integer(n,1));
  insist(d.cartPrices&&typeof d.cartPrices==='object'&&!Array.isArray(d.cartPrices));for(const [p,v] of Object.entries(d.cartPrices))insist(d.cart[p]&&integer(v.catalogPriceAtAdd,1)&&integer(v.appliedUnitPrice,1));insist(Object.keys(d.cart).every(p=>d.cartPrices[p]));
  insist(d.favorites.length<=4&&new Set(d.favorites).size===d.favorites.length&&d.favorites.every(p=>products.has(p)));
  for(const o of d.purchaseOrders){insist(id(o.id)&&str(o.supplier,100)&&o.supplier.trim()&&str(o.note,160)&&date(o.at)&&day(o.day)&&(o.closedAt===null||date(o.closedAt))&&Array.isArray(o.items)&&o.items.length>0&&o.items.length<=500&&unique(o.items,'productId'));for(const i of o.items)insist(products.has(i.productId)&&str(i.name,60)&&str(i.variety,60)&&integer(i.qty,1)&&i.qty<=99999);}
  for(const o of d.purchaseOrders){insist(!o.sentAt||date(o.sentAt));for(const i of o.items)if(i.packs!==undefined)insist(integer(i.packs,1)&&integer(i.unitsPerPack,1)&&i.unitsPerPack<=999&&i.qty===i.packs*i.unitsPerPack&&['Unidad','Caja','Pack','Cajón'].includes(i.presentation)&&(i.packCost===null||integer(i.packCost,1)));}
  insist(unique(d.supplierLists,'id')&&unique(d.supplierAliases,'id')&&unique(d.priceReviews,'id'));
  for(const l of d.supplierLists){insist(id(l.id)&&str(l.supplier,100)&&date(l.at)&&str(l.source,100000)&&Array.isArray(l.rows)&&l.rows.length<=1000&&unique(l.rows,'id'));for(const r of l.rows)insist(id(r.id)&&str(r.raw,100000)&&str(r.label,1000)&&str(r.key,1200)&&str(r.issue,300)&&['review','recognized','confirmed','ignored'].includes(r.status)&&(!r.productId||products.has(r.productId))&&(r.packCost===null||integer(r.packCost,1))&&(r.unitsPerPack===null||integer(r.unitsPerPack,1)&&r.unitsPerPack<=999)&&(r.expectedPrice===null||integer(r.expectedPrice,1))&&(r.finalPrice===null||integer(r.finalPrice,1))&&typeof r.selected==='boolean'&&typeof r.manualPrice==='boolean');}
  for(const a of d.supplierAliases)insist(id(a.id)&&str(a.supplier,100)&&str(a.key,1200)&&products.has(a.productId)&&['Unidad','Caja','Pack','Cajón'].includes(a.presentation)&&integer(a.unitsPerPack,1)&&a.unitsPerPack<=999&&date(a.at)&&integer(a.revision,1)&&typeof a.valid==='boolean'&&(!a.explicitPack||integer(a.explicitPack,1)));
  for(const r of d.priceReviews){insist(id(r.id)&&d.supplierLists.some(l=>l.id===r.listId)&&date(r.at)&&Array.isArray(r.changes)&&r.changes.length>0&&unique(r.changes,'productId'));for(const c of r.changes)insist(products.has(c.productId)&&integer(c.before,1)&&integer(c.after,1));}
  const orders=new Map(d.purchaseOrders.map(o=>[o.id,o]));
  const receipts=new Map(d.receipts.map(r=>[r.id,r]));
  for(const r of d.receipts){insist(!r.orderId||orders.has(r.orderId)&&Array.isArray(r.items)&&r.items.every(i=>orders.get(r.orderId).items.some(oi=>oi.productId===i.productId)||i.unplanned===true));insist(id(r.id)&&str(r.supplier,100)&&str(r.note,160)&&date(r.at)&&day(r.day)&&Array.isArray(r.items)&&r.items.length>0&&r.items.length<=500&&integer(r.total)&&typeof r.paid==='boolean'&&(!r.paid||account(r.account)));insist(new Set(r.items.map(i=>i.productId)).size===r.items.length);let sum=0;for(const i of r.items){insist(products.has(i.productId)&&str(i.name,60)&&str(i.variety,60)&&integer(i.qty,1)&&Number.isFinite(i.unitCost)&&i.unitCost>0&&integer(lineTotal(i),1)&&i.unitCost===lineTotal(i)/i.qty);sum+=lineTotal(i);}insist(sum===r.total&&integer(sum));}
  for(const l of d.lots){
    insist(id(l.id)&&products.has(l.productId)&&date(l.at)&&integer(l.qty,1)&&integer(l.remaining)&&l.remaining<=l.qty);
    if(l.openingId)insist(!l.receiptId&&d.stockOpenings.some(o=>o.id===l.openingId&&o.items.some(i=>i.productId===l.productId&&i.qty===l.qty&&i.totalCost===l.totalCost))&&(l.unitCost===null&&l.totalCost===null||Number.isFinite(l.unitCost)&&l.unitCost>0&&integer(l.totalCost,1)&&l.unitCost===l.totalCost/l.qty));
    else if(l.correctionId){const source=d.lots.find(v=>v.id===l.sourceLotId);insist(source&&source.productId===l.productId&&source.unitCost!==null&&l.unitCost===source.unitCost&&JSON.stringify(l.costBasis)===JSON.stringify(scaleFraction(allocationCost(source,1),1))&&d.saleCorrections.some(c=>c.id===l.correctionId&&c.status==='applied'&&c.returnedLots.some(v=>v.id===l.id)));}
    else if(l.adjustmentId)insist(!l.receiptId&&d.inventoryAdjustments.some(a=>a.id===l.adjustmentId&&a.productId===l.productId)&&(l.unitCost===null&&l.totalCost===null||Number.isFinite(l.unitCost)&&l.unitCost>0&&integer(l.totalCost,1)&&l.unitCost===l.totalCost/l.qty));
    else insist(receipts.has(l.receiptId)&&receipts.get(l.receiptId).items.some(i=>i.productId===l.productId&&i.unitCost===l.unitCost)&&Number.isFinite(l.unitCost)&&l.unitCost>0&&integer(lotTotal(l),1)&&l.unitCost===lotTotal(l)/l.qty);
  }
  const usage=new Map();
  for(const [index,s] of d.sales.entries()){insist(s.number===String(index+1).padStart(3,'0'));insist(/^\d{3,12}$/.test(s.number)&&date(s.at)&&day(s.day)&&['cash','transfer','mixed','credit'].includes(s.method)&&str(s.customer,80)&&integer(s.subtotal)&&integer(s.discount)&&s.discount<=s.subtotal&&s.total===s.subtotal-s.discount&&integer(s.count,1)&&integer(s.received)&&Array.isArray(s.items)&&s.items.length>0&&Array.isArray(s.parts));
    let count=0,sum=0;
    for(const i of s.items){
      insist(products.has(i.id)&&str(i.name,60)&&str(i.variety,60)&&integer(i.qty,1)&&integer(i.price,1)&&Array.isArray(i.allocations));count+=i.qty;sum+=i.qty*i.price;
      let allocated=0,unknown=0;const fractions=[];insist(unique(i.allocations,'lotId'));
      for(const a of i.allocations){const l=d.lots.find(l=>l.id===a.lotId);insist(l&&l.productId===i.id&&integer(a.qty,1)&&a.unitCost===l.unitCost);allocated+=a.qty;
        if(l.unitCost===null){insist(a.costFraction===null);unknown+=a.qty;}
        else{const f=allocationCost(l,a.qty);if(a.costFraction)insist(JSON.stringify(a.costFraction)===JSON.stringify(f));fractions.push(f);}
        usage.set(a.lotId,(usage.get(a.lotId)||0)+a.qty);
      }
      const missing=i.missingQty||0;insist(integer(missing)&&allocated+missing===i.qty);unknown+=missing;
      const f=addFractions(fractions);if(unknown){insist(i.unknownQty===unknown&&i.costTotal===null&&i.costFraction===null&&JSON.stringify(i.knownCostFraction)===JSON.stringify(f)&&i.knownCostTotal===fractionNumber(f));}
      else{if(i.costFraction)insist(JSON.stringify(i.costFraction)===JSON.stringify(f));insist(i.costTotal===fractionNumber(f));}
    }
    insist(count===s.count&&sum===s.subtotal&&unique(s.items,'id'));
    insist(unique(s.parts,'id'));for(const p of s.parts)insist(id(p.id)&&['cash','transfer'].includes(p.method)&&account(p.account)&&integer(p.amount,1)&&typeof p.verified==='boolean'&&(!p.verified||date(p.verifiedAt))&&(p.method!=='cash'||p.account==='cash'&&p.verified)&&(p.method!=='transfer'||p.account!=='cash'));
    const cash=s.parts.filter(p=>p.method==='cash').reduce((a,p)=>a+p.amount,0),transfer=s.parts.filter(p=>p.method==='transfer').reduce((a,p)=>a+p.amount,0);
    const credit=s.creditAmount??(s.method==='credit'?s.total:0);insist(integer(credit)&&credit<=s.total&&(!credit||s.customer.trim())&&cash+transfer+credit===s.total);insist(s.method!=='credit'||s.customer.trim());insist(s.method!=='cash'||transfer===0);insist(s.method!=='transfer'||cash===0);insist(s.method!=='mixed'||cash>0&&transfer>0);insist(s.received>=cash);
  }
  addExtendedUsage(d,usage);
  for(const l of d.lots)insist(l.remaining===l.qty-(usage.get(l.id)||0));
  for(const p of d.products)insist(p.stock===d.lots.filter(l=>l.productId===p.id).reduce((a,l)=>a+l.remaining,0)-d.stockReviews.filter(r=>r.productId===p.id).reduce((n,r)=>n+r.missingQty,0)+d.stockResolutions.filter(r=>r.productId===p.id).reduce((n,r)=>n+r.stockDelta,0)+d.inventoryAdjustments.filter(a=>a.productId===p.id).reduce((n,a)=>n+a.offset,0),'El stock no coincide con los lotes.');
  for(const r of d.receipts)for(const i of r.items){const ls=d.lots.filter(l=>l.receiptId===r.id&&l.productId===i.productId);insist(ls.length===1&&ls[0].qty===i.qty&&ls[0].unitCost===i.unitCost&&lotTotal(ls[0])===lineTotal(i));}
  const ledger=[];for(const e of d.ledger){insist(date(e.at)&&day(e.day)&&str(e.note,200)&&str(e.source,180)&&e.seq===ledger.length+1);insist(appendMovement(ledger,e),'Hay movimientos duplicados.');}
  const saleSources=new Set(),purchaseSources=new Set();for(const s of d.sales)for(const p of s.parts){const source=`sale:${s.number}:${p.id}`,e=ledger.find(e=>e.source===source);if(p.verified){insist(e&&e.kind==='sale'&&e.legs.length===1&&e.legs[0].account===p.account&&e.legs[0].amount===p.amount);saleSources.add(source);}else insist(!e);}
  for(const r of d.receipts){const source='receipt:'+r.id,e=ledger.find(e=>e.source===source);if(r.paid){insist(e&&e.kind==='purchase'&&e.legs.length===1&&e.legs[0].account===r.account&&e.legs[0].amount===-r.total);purchaseSources.add(source);}else insist(!e);}
  insist(ledger.every(e=>e.kind!=='sale'||saleSources.has(e.source)));insist(ledger.every(e=>e.kind!=='purchase'||purchaseSources.has(e.source)));
  insist(d.references&&typeof d.references==='object'&&!Array.isArray(d.references));for(const [a,r] of Object.entries(d.references))insist(a===r.account&&account(a)&&Number.isSafeInteger(r.amount)&&integer(r.seq)&&r.seq<=ledger.length&&date(r.at)&&day(r.day));
  for(const r of d.referenceLog)insist(account(r.account)&&Number.isSafeInteger(r.amount)&&integer(r.seq)&&r.seq<=ledger.length&&date(r.at)&&day(r.day));
  for(const c of d.checks)insist(account(c.account)&&Number.isSafeInteger(c.amount)&&(c.expected===null?c.difference===null:Number.isSafeInteger(c.expected)&&c.difference===c.amount-c.expected)&&date(c.at)&&day(c.day));
  validateOperations(d);validateExtendedData(d);
  return Object.fromEntries(DATA_KEYS.map(k=>[k,d[k]]));
}
export const hasBusinessData=d=>DATA_KEYS.filter(k=>!['workState','cartPrices'].includes(k)).some(k=>Array.isArray(d[k])?d[k].length>0:Object.keys(d[k]||{}).length>0);
function checksum(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
export function readBackup(raw){insist(typeof raw==='string'&&raw.length<=10000000,'El archivo supera el límite de 10 MB.');let v;try{v=JSON.parse(raw);}catch{throw Error('El archivo no es un JSON válido.');}insist(v.format==='mora-vineria'&&[1,2,3,4,5].includes(v.version),'No es un respaldo compatible de esta versión de Mora.');insist(v.version===1||Array.isArray(v.data?.purchaseOrders),'El respaldo no incluye pedidos.');if(v.version===5)insist(DATA_KEYS.every(k=>Object.hasOwn(v.data||{},k)),'El respaldo nuevo está incompleto.');if(v.version>=3){insist(v.integrity?.algorithm==='fnv1a32'&&v.integrity.value===checksum(JSON.stringify(v.data)),'El archivo está incompleto o cambió desde que se exportó.');insist(['supplierLists','supplierAliases','priceReviews'].every(k=>Array.isArray(v.data[k])),'Faltan los datos del proveedor.');}insist(v.mode==='real','Los datos de demostración no se pueden restaurar como datos reales.');return validateData(v.data);}
export function backupText(data){const valid=validateData(data);return JSON.stringify({format:'mora-vineria',version:5,schemaVersion:5,source:'mora-sites-local',mode:'real',exportedAt:new Date().toISOString(),counts:Object.fromEntries(DATA_KEYS.map(k=>[k,Array.isArray(valid[k])?valid[k].length:Object.keys(valid[k]).length])),integrity:{algorithm:'fnv1a32',value:checksum(JSON.stringify(valid))},data:valid},null,2);}
export function createLocalStore(storage){
  const key='mora.local.v1';let lastRaw,revision=0,lastData;
  return {load(){lastRaw=storage.getItem(key);if(!lastRaw){lastData=emptyData();revision=0;}else{const v=JSON.parse(lastRaw);insist(v.format==='mora-local'&&[1,2,3,4,5].includes(v.version)&&integer(v.revision),'Los datos locales no son compatibles.');insist(v.version!==2||Array.isArray(v.data?.purchaseOrders),'Faltan los pedidos en los datos locales.');if(v.version===5)insist(DATA_KEYS.every(k=>Object.hasOwn(v.data||{},k)),'Los datos nuevos están incompletos.');lastData=validateData(v.data);revision=v.revision;}return structuredClone(lastData);},
    save(data){const valid=validateData(data);insist(storage.getItem(key)===lastRaw,'Mora cambió en otra pestaña. Recargá antes de seguir.');if(JSON.stringify(valid)===JSON.stringify(lastData))return;const raw=JSON.stringify({format:'mora-local',version:5,revision:revision+1,data:valid});if(lastRaw&&JSON.parse(lastRaw).version<4&&!storage.getItem(key+'.before-v4'))storage.setItem(key+'.before-v4',lastRaw);if(lastRaw&&JSON.parse(lastRaw).version<5&&!storage.getItem(key+'.before-v5'))storage.setItem(key+'.before-v5',lastRaw);storage.setItem(key,raw);lastRaw=raw;lastData=valid;revision++;},
    prior(){return storage.getItem(key+'.before-restore');},
    replace(data){insist(!hasBusinessData(lastData),'Restaurá la copia en un navegador sin datos. Los datos actuales se conservan.');const valid=validateData(data);insist(storage.getItem(key)===lastRaw,'Mora cambió en otra pestaña. Recargá antes de restaurar.');storage.setItem(key+'.before-restore',backupText(lastData));this.save(valid);},
    raw(){return storage.getItem(key);}
  };
}
