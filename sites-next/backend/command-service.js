// Trusted server boundary. No browser-supplied snapshot is accepted here.
// The caller must supply an identity verified by Auth, never one from the JSON body.
import {validateData} from '../dist/local-data.js';
import {prepareOperation,applyOperation,canonical,businessDay} from '../dist/operations.js';
import {writeProduct,setProductActive} from '../dist/product-model.js';
import {createPurchaseOrder,markOrderSent,closePurchaseOrder} from '../dist/purchase-orders.js';
import {accounts} from '../dist/money-model.js';

export class CommandError extends Error{
  constructor(code,message){super(message);this.code=code;}
}
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const id=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
const allowed=new Set(['sale','opening','debt-payment','movement','receive','verify-transfer','resolve-stock','correction-review','inventory-adjustment','receipt-payment','sale-correction','monthly-goal','product-write','product-active','order-create','order-sent','order-close','reference','check']);
export function validateRequest(input,actor){
  if(!uuid(actor?.userId))throw new CommandError('FORBIDDEN','Acceso no autorizado.');
  if(!input||!uuid(input.businessId)||!uuid(input.deviceId)||!id(input.id)||!allowed.has(input.kind)||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0)throw new CommandError('REJECTED','Identidad o versión inválidas.');
  if(typeof input.at!=='string'||!/^\d{4}-\d\d-\d\dT/.test(input.at)||!Number.isFinite(Date.parse(input.at)))throw new CommandError('REJECTED','Fecha inválida.');
  if(!input.payload||typeof input.payload!=='object'||Array.isArray(input.payload)||canonical(input.payload).length>200000)throw new CommandError('REJECTED','Contenido inválido.');
  // Whitelist the envelope, including its sealed physical timestamp.
  return structuredClone(Object.fromEntries(['businessId','deviceId','id','kind','payload','expectedRevision','at'].map(k=>[k,input[k]])));
}
export async function requestDigest(request){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(request)));
  return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function execute(data,r){
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
  if(kind==='reference'||kind==='check'){
    if(!accounts.some(a=>a.id===p.account)||!Number.isSafeInteger(p.amount))throw Error('Cuenta o importe inválidos.');
    const seq=data.ledger.length;
    if(kind==='reference'){const ref={account:p.account,amount:p.amount,seq,at,day};data.references[p.account]=ref;data.referenceLog.push(ref);return {account:p.account};}
    const ref=data.references[p.account],expected=ref?ref.amount+data.ledger.filter(e=>e.seq>ref.seq).flatMap(e=>e.legs).filter(l=>l.account===p.account).reduce((n,l)=>n+l.amount,0):null;
    data.checks.push({account:p.account,amount:p.amount,expected,difference:expected===null?null:p.amount-expected,at,day});return {account:p.account};
  }
  const previous=data.operations.find(o=>o.id===id);if(previous&&previous.at!==at)throw Error('La fecha no coincide con la preparación original.');
  prepareOperation(data,{id,kind,payload:p,at});return applyOperation(data,id);
}
export function createCommandService({repository,now=()=>new Date().toISOString()}){
  return {
    async result(actor,input){const r=validateRequest(input,actor);return repository.lookup({...actor,businessId:r.businessId,deviceId:r.deviceId},r);},
    async submit(actor,input){
      const r=validateRequest(input,actor),context={userId:actor.userId,businessId:r.businessId,deviceId:r.deviceId};
      // lookup also checks current membership and revocation, even for a replay.
      const prior=await repository.lookup(context,r);if(prior)return prior;
      const current=await repository.read(context);
      if(current.revision!==r.expectedRevision)throw new CommandError('CONFLICT','Los datos cambiaron. Conservamos el registro para revisar.');
      let next,result;
      try{next=validateData(current.snapshot);result=execute(next,r);next=validateData(next);}catch(error){throw new CommandError('REJECTED',error.message);}
      const response={...r,status:'confirmed',revision:r.expectedRevision+1,result,confirmedAt:now()};
      // The repository must atomically recheck access/revision and commit facts + result.
      return repository.commit(context,r,await requestDigest(r),next,response);
    }
  };
}
