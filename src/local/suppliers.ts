import {fail,signed} from '../domain/rules';
import {normalize,parseSupplierList,validateAlias,validateSupplierList,type SupplierList,type SupplierRow} from '../domain/suppliers';
import type {LocalDatabase} from './database';
export class SupplierService{
 constructor(private db:LocalDatabase){}
 async importList(original:string,supplier:string){return this.db.transaction('rw',this.db.products,this.db.supplierAliases,this.db.supplierLists,async()=>{const list=parseSupplierList(original,supplier,await this.db.products.toArray(),await this.db.supplierAliases.toArray());await this.db.supplierLists.add(list);return list;});}
 async revise(input:SupplierList,changedRow:SupplierRow,learn:boolean){
  const list=structuredClone(input),row=structuredClone(changedRow);list.rows=list.rows.map(r=>r.id===row.id?row:r);validateSupplierList(list);
  return this.db.transaction('rw',this.db.supplierLists,this.db.supplierAliases,this.db.products,async()=>{
   const old=await this.db.supplierLists.get(list.id);if(!old||old.version!==list.version)fail('VERSION_CONFLICT','La lista cambió en otra pantalla. Volvé a abrirla.');
   if(old.original!==list.original||old.importedAt!==list.importedAt||old.supplier!==list.supplier||!old.rows.some(r=>r.id===row.id&&r.original===row.original))fail('LIST_CONFLICT','El texto original de la lista se conserva sin cambios.');
   if(row.confirmed){const product=row.productId?await this.db.products.get(row.productId):null;if(!product?.active)fail('PRODUCT_INACTIVE','Elegí un producto activo.');if(list.rows.some(r=>r.id!==row.id&&r.confirmed&&r.productId===row.productId))fail('DUPLICATE_PRODUCT','Ese producto ya está confirmado en otra fila. Revisá la duplicación antes de aplicar precios.');}
   if(learn&&row.confirmed){const supplier=normalize(list.supplier),label=normalize(row.label),key:[string,string,number]=[supplier,label,row.unitsPerPack!];const oldAlias=await this.db.supplierAliases.where('[supplier+label+unitsPerPack]').equals(key).first();if(oldAlias&&oldAlias.productId!==row.productId)fail('ALIAS_CONFLICT','La etiqueta tiene otra equivalencia. Revocala y confirmá la nueva asociación.');if(!oldAlias){const alias={id:crypto.randomUUID(),version:1,supplier,label,unitsPerPack:row.unitsPerPack!,productId:row.productId!,updatedAt:new Date().toISOString()};validateAlias(alias);await this.db.supplierAliases.add(alias);}}
   const next={...list,version:signed(old.version+1),updatedAt:new Date().toISOString()};await this.db.supplierLists.put(next);return next;
  });
 }
 async revokeAlias(id:string,version:number){return this.db.transaction('rw',this.db.supplierAliases,async()=>{const old=await this.db.supplierAliases.get(id);if(!old||old.version!==version)fail('VERSION_CONFLICT','La equivalencia cambió. Volvé a abrirla.');await this.db.supplierAliases.delete(id);});}
}
