import {fail,whole,uuid,text} from './rules';
import type {Product} from './types';
export type SupplierAlias={id:string;version:number;supplier:string;label:string;unitsPerPack:number;productId:string;updatedAt:string};
export type SupplierRow={id:string;original:string;label:string;unitsPerPack:number|null;packCost:number|null;productId:string|null;confirmed:boolean;price:number|null;selected:boolean};
export type SupplierList={id:string;version:number;supplier:string;original:string;rows:SupplierRow[];importedAt:string;updatedAt:string};
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-AR').replace(/\s+/g,' ').trim();
function check(v:unknown):asserts v{if(!v)fail('INVALID_SUPPLIER','La lista o equivalencia contiene datos inválidos.');}
function shape(v:unknown,keys:string[]):asserts v is Record<string,unknown>{check(!!v&&typeof v==='object'&&!Array.isArray(v));check(Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)));}
export function suggestedPrice(cost:number,units:number){whole(cost);whole(units,'Unidades por presentación',true);const n=BigInt(cost)*3n,d=BigInt(units)*1000n;return whole(Number((n+d-1n)/d*500n));}
export function validateAlias(a:SupplierAlias){shape(a,['id','version','supplier','label','unitsPerPack','productId','updatedAt']);uuid(a.id);uuid(a.productId);whole(a.version,'Versión',true);whole(a.unitsPerPack,'Pack',true);text(a.supplier,'Proveedor');text(a.label,'Etiqueta',true);check(a.supplier===normalize(a.supplier)&&a.label===normalize(a.label));check(Number.isFinite(Date.parse(a.updatedAt)));}
export function validateSupplierList(l:SupplierList){shape(l,['id','version','supplier','original','rows','importedAt','updatedAt']);uuid(l.id);whole(l.version,'Versión',true);text(l.supplier,'Proveedor');check(typeof l.original==='string'&&l.original.length<=50000);check(Number.isFinite(Date.parse(l.updatedAt))&&Number.isFinite(Date.parse(l.importedAt)));check(Array.isArray(l.rows)&&l.rows.length<=100);const ids=new Set<string>();for(const r of l.rows){shape(r,['id','original','label','unitsPerPack','packCost','productId','confirmed','price','selected']);uuid(r.id);check(!ids.has(r.id));ids.add(r.id);check(typeof r.original==='string'&&r.original.length<=1000);text(r.label,'Artículo');if(r.unitsPerPack!==null)whole(r.unitsPerPack,'Pack',true);if(r.packCost!==null)whole(r.packCost,'Costo');if(r.price!==null)whole(r.price,'Precio');if(r.productId!==null)uuid(r.productId);check(typeof r.confirmed==='boolean'&&typeof r.selected==='boolean');if(r.confirmed)check(r.productId!==null&&r.unitsPerPack!==null&&r.packCost!==null&&r.price!==null);if(r.selected)check(r.confirmed);}}
/** No name inheritance, guessed variants or inferred missing thousands. */
export function parseSupplierList(original:string,supplier:string,products:Product[],aliases:SupplierAlias[]):SupplierList{
 if(original.length>50000)fail('LIST_TOO_LARGE','La lista admite hasta 50.000 caracteres.');
 const lines=original.split(/\r?\n/).filter(s=>s.trim());if(lines.length>100||lines.some(s=>s.length>1000))fail('LIST_TOO_LARGE','Revisá hasta 100 renglones por lista, de hasta 1.000 caracteres cada uno.');
 const rows=lines.map(original=>{
  const clean=original.trim().replace(/\s+ofert[a-záéíóú!]*\s*$/i,'').trim();
  const packMatches=[...clean.matchAll(/(?:x|\*)\s*(\d{1,4})(?=\s|$|[,;])/gi)];
  let unitsPerPack=packMatches.length===1&&Number(packMatches[0][1])>0?Number(packMatches[0][1]):null;
  const withoutPack=packMatches.length===1?clean.replace(packMatches[0][0],' ').trim():clean;
  const priceMatch=withoutPack.match(/(?:\s+|\s*\$\s*)(\d{1,3}(?:\.\d{3})+|\d+)\s*$/);
  let packCost=priceMatch?Number(priceMatch[1].replaceAll('.','')):null;
  if(packCost!==null&&!Number.isSafeInteger(packCost))packCost=null;
  const label=(priceMatch?withoutPack.slice(0,priceMatch.index).replace(/\$\s*$/,''):withoutPack).trim();
  const known=aliases.filter(a=>a.supplier===normalize(supplier)&&a.label===normalize(label)&&(unitsPerPack===null||a.unitsPerPack===unitsPerPack)&&products.some(p=>p.id===a.productId&&p.active));
  const exact=products.filter(p=>p.active&&normalize(`${p.name} ${p.variant}`)===normalize(label));
  const productId=known.length===1?known[0].productId:known.length===0&&exact.length===1?exact[0].id:null;
  if(unitsPerPack===null&&known.length===1)unitsPerPack=known[0].unitsPerPack;
  const packConflict=known.length===0&&aliases.some(a=>a.supplier===normalize(supplier)&&a.label===normalize(label)&&a.unitsPerPack!==unitsPerPack);
  const safe=!packConflict&&!!productId&&!!unitsPerPack&&packCost!==null&&packCost>=100&&packMatches.length<=1&&label.length<=120&&!/\b(?:c\/u|efectivo)\b|\d{4,}/i.test(label);
  let price:number|null=null;if(unitsPerPack&&packCost!==null)try{price=suggestedPrice(packCost,unitsPerPack);}catch{/* keep for manual review */}
  return {id:crypto.randomUUID(),original,label:label.length<=120?label:'',unitsPerPack,packCost,productId,confirmed:safe&&price!==null,price,selected:safe&&price!==null&&products.find(p=>p.id===productId)?.price!==price};
 });
 for(const row of rows)if(rows.filter(r=>normalize(r.label)===normalize(row.label)&&r.unitsPerPack===row.unitsPerPack||row.productId!==null&&r.productId===row.productId).length>1){row.confirmed=false;row.selected=false;}
 const list={id:crypto.randomUUID(),version:1,supplier,original,rows,importedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};validateSupplierList(list);return list;
}
export function validateSuppliers(data:{supplierLists:SupplierList[];supplierAliases:SupplierAlias[];products:Product[]}){
 check(new Set(data.supplierLists.map(l=>l.id)).size===data.supplierLists.length);check(new Set(data.supplierAliases.map(a=>a.id)).size===data.supplierAliases.length);
 const keys=new Set<string>();for(const a of data.supplierAliases){validateAlias(a);check(data.products.some(p=>p.id===a.productId));const key=JSON.stringify([a.supplier,a.label,a.unitsPerPack]);check(!keys.has(key));keys.add(key);}
 for(const l of data.supplierLists){validateSupplierList(l);l.rows.forEach(r=>{if(r.productId)check(data.products.some(p=>p.id===r.productId));});}
}
