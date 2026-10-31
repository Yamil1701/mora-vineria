import {readBackup,validateData,DATA_KEYS} from './local-data.js';
import {canonical} from './operations.js';
import {debtRemaining,saleKey} from './business-read.js';
import {accounts} from './money-model.js';
export function migrationFacts(data){const d=validateData(data);return {counts:Object.fromEntries(DATA_KEYS.filter(k=>Array.isArray(d[k])).map(k=>[k,d[k].length])),stock:d.products.map(p=>[p.id,p.stock]).sort(),lots:d.lots.map(l=>[l.id,l.qty,l.remaining,l.costBasis||null,l.totalCost??null]).sort(),money:accounts.map(a=>[a.id,d.ledger.reduce((n,e)=>n+e.legs.filter(l=>l.account===a.id).reduce((s,l)=>s+l.amount,0),0)]),debts:d.debts.map(v=>[v.id,debtRemaining(d,v.id)]).sort(),operations:d.operations.map(o=>[o.id,o.kind,o.status,o.result]).sort()};}
export async function prepareMigration(raw,{sourceNamespace,digest=async text=>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');}}={}){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sourceNamespace||''))throw Error('Definí una identidad de origen antes de preparar la migración.');
  const data=readBackup(raw),content=canonical(data),sourceDigest=await digest(content);
  return {format:'mora-migration-plan',version:1,sourceNamespace,sourceDigest,sourceSchema:JSON.parse(raw).version,targetStatus:'staged-only',facts:migrationFacts(data),identityMap:DATA_KEYS.filter(k=>Array.isArray(data[k])).flatMap(entity=>data[entity].filter(v=>v&&typeof v==='object').map((v,index)=>({entity,sourceId:String(v.id||(entity==='sales'?saleKey(v):entity==='ledger'?v.seq:'index_'+index)),sourceNamespace}))),data};
}
export function verifyMigration(plan,restored){const valid=validateData(restored);if(canonical(migrationFacts(valid))!==canonical(plan.facts)||canonical(valid)!==canonical(plan.data))throw Error('La migración no conserva exactamente las relaciones y los hechos del origen.');return true;}
