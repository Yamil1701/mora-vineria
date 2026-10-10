import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalDatabase } from './database';
import { draftLine, LocalService, productFields } from './service';
import { BACKUP_TABLES, backupDigest, backupFilename, canRestore, exportBackup, parseBackup, restoreBackup, type Backup } from './backup';
import { semantic } from './backup';
import type { Command } from '../domain/types';

const dbs: LocalDatabase[]=[];
function db() { const d=new LocalDatabase(`mora-v2:test:${crypto.randomUUID()}`); dbs.push(d); return d; }
afterEach(async()=>{for(const d of dbs.splice(0)){d.close();await Dexie.delete(d.name);}});
async function records(d:LocalDatabase) { return Object.fromEntries(await Promise.all(d.tables.map(async t=>[t.name,await t.toArray()]))); }
async function resign(b:Backup) { const {integrity:_,...payload}=b; b.integrity.digest=await backupDigest(payload); return JSON.stringify(b); }
async function fixture() {
  const source=db(), service=new LocalService(source), productId=crypto.randomUUID(), unknownId=crypto.randomUUID();
  await service.initialize();
  for(const [id,name] of [[productId,'Cerveza QA'],[unknownId,'Sin costo QA']]) await service.execute(await service.prepare({type:'CreateProduct',payload:{productId:id,fields:{...productFields(name,3500,24),category:'Cervezas'}}}));
  await service.execute(await service.prepare({type:'ReceivePurchase',payload:{receiptId:crypto.randomUUID(),lines:[{id:crypto.randomUUID(),productId,quantity:6,totalCost:125000,presentation:'fardo x6'}]}},{registeredAt:'2026-10-10T06:00:00Z'}));
  await service.execute(await service.prepare({type:'RecordOpeningStock',payload:{productId:unknownId,quantity:1,totalCost:null}}));
  const product=(await source.products.get(productId))!, unknown=(await source.products.get(unknownId))!;
  const first=await service.activeDraft();
  await service.saveDraft({...first,lines:[{...draftLine(product),quantity:3},{...draftLine(unknown),quantity:2}],received:20000});
  await service.checkoutDraft(first.id);
  await service.toggleFavorite(productId);
  const draft=await service.activeDraft(); await service.saveDraft({...draft,lines:[draftLine(product)],received:5000});
  // Real checkout freezes durable payload before storage failure.
  const fail=()=>{throw new Error('QA disk full');}; source.cashEntries.hook('creating',fail);
  await expect(service.checkoutDraft(draft.id)).rejects.toThrow('QA disk full'); source.cashEntries.hook('creating').unsubscribe(fail);
  const intent=await service.sealWrite({type:'ReceivePurchase',payload:{receiptId:crypto.randomUUID(),lines:[{id:crypto.randomUUID(),productId,quantity:2,totalCost:5000,presentation:'unidad'}]}});
  return {source,service,productId,draftId:draft.id,intent};
}

describe('complete local backups',()=>{
  it('edited-then-emptied draft and a prepared product form block replacement',async()=>{
    const {source}=await fixture(), b=await exportBackup(source), target=db(),svc=new LocalService(target);
    await svc.initialize(); const draft=await svc.activeDraft(); await svc.saveDraft({...draft,lines:[]});
    expect(await canRestore(target)).toBe(false); const before=await records(target);
    await expect(restoreBackup(target,b,true)).rejects.toThrow('ya tiene datos'); expect(await records(target)).toEqual(before);
    const another=db(),service=new LocalService(another); await service.initialize();
    await service.sealWrite({type:'CreateProduct',payload:{productId:crypto.randomUUID(),fields:productFields('Preparado',100)}});
    expect(await canRestore(another)).toBe(false); await expect(restoreBackup(another,b,true)).rejects.toThrow('ya tiene datos');
  });
  it('rejects oversized files before parsing and row count limits before hashing',async()=>{
    await expect(parseBackup(' '.repeat(20*1024*1024+1))).rejects.toThrow('20 MB');
    const source=db(); await new LocalService(source).initialize(); const b=await exportBackup(source);
    b.data.reviews=Array(100001).fill(null); b.rowCounts.reviews=100001;
    await expect(parseBackup(JSON.stringify(b))).rejects.toThrow('demasiados registros');
  });

  it('exports every current table, exact rational FIFO, jornada, categories, preferences and prepared operations',async()=>{
    const {source}=await fixture(); const before=await records(source), b=await exportBackup(source);
    expect(b.data).toEqual(before); expect(Object.keys(b.data).sort()).toEqual([...BACKUP_TABLES].sort());
    expect(b.data.lots.find(l=>l.unitCost)?.unitCost).toEqual({numerator:'62500',denominator:'3'});
    expect(b.data.receipts[0].businessDate).toBe('2026-10-09');
    expect(b.data.sales[0].reviewIds).toHaveLength(2); expect(b.data.products[0].category).toBe('Cervezas');
    expect(b.data.drafts.find(d=>!d.consumedBy)?.submission).not.toBeNull(); expect(b.data.writeIntents[0].status).toBe('prepared');
    expect(await parseBackup(JSON.stringify(b))).toEqual(b); expect(backupFilename(b)).toMatch(/^mora-vineria-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(await records(source)).toEqual(before);
  });
  it('restores all historical rows faithfully, renews only installation identity, replays same pending IDs once and exports again',async()=>{
    const {source,productId,draftId,intent}=await fixture(); const b=await exportBackup(source), target=db(), service=new LocalService(target);
    await service.initialize(); await service.activeDraft(); await restoreBackup(target,b,true);
    for(const name of BACKUP_TABLES) if(name!=='metadata') expect(await target.table(name).toArray()).toEqual(b.data[name]);
    const meta=(await target.metadata.get('installation'))!;
    expect(meta).toEqual({...b.data.metadata[0],deviceId:meta.deviceId,sequence:'0'}); expect(meta.deviceId).not.toBe(b.data.metadata[0].deviceId);
    await Promise.all(Array.from({length:10},()=>service.confirmWrite(intent.command.id)));
    await service.acknowledgeWrite(intent.command.id);
    await Promise.all(Array.from({length:10},()=>service.checkoutDraft(draftId)));
    expect(await target.sales.count()).toBe(2); expect(await target.receipts.count()).toBe(2);
    expect(await target.stockEntries.count()).toBe(6); expect(await target.cashEntries.count()).toBe(4);
    const newCommands=(await target.commands.toArray()).filter(c=>c.deviceId===meta.deviceId);
    expect(newCommands.map(c=>c.deviceSeq).sort()).toEqual(['1','2']);
    const next=await exportBackup(target); await parseBackup(JSON.stringify(next));
    const third=db(); await restoreBackup(third,next,true);
    expect(await third.commands.toArray()).toEqual(next.data.commands); expect(await third.products.get(productId)).toEqual(await target.products.get(productId));
    expect(await source.sales.count()).toBe(1);
  });
  it('confirmed receipt recovery is preserved and a retry does not repeat stock or payment',async()=>{
    const {source,service,intent}=await fixture(); await service.confirmWrite(intent.command.id);
    const b=await exportBackup(source), target=db(); await restoreBackup(target,b,true);
    const before=await records(target); await new LocalService(target).confirmWrite(intent.command.id);
    expect(await records(target)).toEqual(before);
  });
  it('snapshot concurrent with business transaction includes either all effects or none',async()=>{
    const {source,service,intent}=await fixture(); const [b]=await Promise.all([exportBackup(source),service.confirmWrite(intent.command.id)]);
    const present=b.data.commands.some(c=>c.id===intent.command.id);
    expect(b.data.receipts.some(r=>r.commandId===intent.command.id)).toBe(present);
    expect(b.data.cashEntries.some(r=>r.commandId===intent.command.id)).toBe(present);
    expect(b.data.lots.some(r=>r.sourceCommand===intent.command.id)).toBe(present);
    expect(b.data.writeIntents[0].status).toBe(present?'confirmed':'prepared');
  });
  it('requires explicit consent, rejects second import and checks emptiness at commit after preview',async()=>{
    const {source}=await fixture(); const b=await exportBackup(source), target=db(), service=new LocalService(target);
    await service.initialize(); await service.activeDraft(); const before=await records(target);
    await expect(restoreBackup(target,b,false)).rejects.toThrow('Confirmá'); expect(await records(target)).toEqual(before);
    expect(await canRestore(target)).toBe(true);
    await service.saveDraft({...await service.activeDraft(),received:1});
    const changed=await records(target); await expect(restoreBackup(target,b,true)).rejects.toThrow('ya tiene datos'); expect(await records(target)).toEqual(changed);
    const fresh=db(); await restoreBackup(fresh,b,true); const restored=await records(fresh);
    await expect(restoreBackup(fresh,b,true)).rejects.toThrow('ya tiene datos'); expect(await records(fresh)).toEqual(restored);
  });
  it('rollback on final table storage failure preserves original pristine bootstrap; retry succeeds',async()=>{
    const {source}=await fixture(), b=await exportBackup(source), target=db(), service=new LocalService(target);
    await service.initialize(); await service.activeDraft(); const before=await records(target);
    const fail=()=>{throw new DOMException('QA quota','QuotaExceededError');}; target.preferences.hook('creating',fail);
    await expect(restoreBackup(target,b,true)).rejects.toThrow(); expect(await records(target)).toEqual(before);
    target.preferences.hook('creating').unsubscribe(fail); await restoreBackup(target,b,true); expect(await target.sales.count()).toBe(1);
  });
  it('concurrent restores and a competing writer cannot overwrite a committed dataset',async()=>{
    const {source}=await fixture(), b=await exportBackup(source), target=db();
    const outcomes=await Promise.allSettled([restoreBackup(target,b,true),restoreBackup(target,b,true)]);
    expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1); expect(await target.sales.count()).toBe(1);
    const other=db(), service=new LocalService(other); await service.initialize();
    await service.execute(await service.prepare({type:'CreateProduct',payload:{productId:crypto.randomUUID(),fields:productFields('Existing',1)}}));
    const before=await records(other); await expect(restoreBackup(other,b,true)).rejects.toThrow('ya tiene datos'); expect(await records(other)).toEqual(before);
  });
  it('rejects malformed, truncated, legacy, future, incomplete and changed-checksum JSON without writes',async()=>{
    const {source}=await fixture(), b=await exportBackup(source), before=await records(source);
    for(const value of ['{',JSON.stringify(b).slice(0,-2),'null','{}',JSON.stringify({...b,formatVersion:3}),JSON.stringify({...b,schemaVersion:5}),JSON.stringify({...b,format:'mora-v1-backup'})]) await expect(parseBackup(value)).rejects.toThrow();
    const modified=structuredClone(b); modified.data.products[0].price++;
    await expect(parseBackup(JSON.stringify(modified))).rejects.toThrow('integridad');
    const incomplete=structuredClone(b); delete (incomplete.data as Partial<Backup['data']>).lots;
    await expect(parseBackup(JSON.stringify(incomplete))).rejects.toThrow(); expect(await records(source)).toEqual(before);
  });
  it.each(['duplicate','relationship','rational','stock','cash','outbox','result','scope','sequence','journal','draft','intent','favorite','counts','extra'] as const)('rejects %s inconsistency even with recomputed checksum, and never alters destination',async(kind)=>{
    const {source}=await fixture(), b=await exportBackup(source), target=db(), svc=new LocalService(target); await svc.initialize(); const before=await records(target);
    switch(kind) {
      case 'duplicate': b.data.products.push(b.data.products[0]); b.rowCounts.products++; break;
      case 'relationship': b.data.lots[0].productId=crypto.randomUUID(); break;
      case 'rational': b.data.lots.find(l=>l.unitCost)!.unitCost!.denominator='0'; break;
      case 'stock': b.data.stockEntries[0].delta++; break;
      case 'cash': b.data.cashEntries[0].amount++; break;
      case 'outbox': b.data.outbox.pop(); b.rowCounts.outbox--; break;
      case 'result': b.data.results[0].entityId=crypto.randomUUID(); break;
      case 'scope': b.data.commands[0].businessId=crypto.randomUUID(); break;
      case 'sequence': b.data.metadata[0].sequence='0'; break;
      case 'journal': b.data.commands[0].hash='0'.repeat(64); break;
      case 'draft': b.data.drafts.find(d=>!d.consumedBy)!.submission!.id=crypto.randomUUID(); break;
      case 'intent': b.data.writeIntents[0].status='confirmed'; break;
      case 'favorite': b.data.preferences[0].productIds.push(crypto.randomUUID()); break;
      case 'counts': b.rowCounts.sales++; break;
      case 'extra': Object.assign(b.data.products[0],{unexpected:'secret'}); break;
    }
    const text=await resign(b); await expect(parseBackup(text)).rejects.toThrow(); await expect(restoreBackup(target,b,true)).rejects.toThrow(); expect(await records(target)).toEqual(before);
  });
  it('preserves direct sale commands without drafts and known zero cost',async()=>{
    const source=db(),svc=new LocalService(source),id=crypto.randomUUID(); await svc.initialize();
    await svc.execute(await svc.prepare({type:'CreateProduct',payload:{productId:id,fields:productFields('Free sample',100)}}));
    await svc.execute(await svc.prepare({type:'RecordOpeningStock',payload:{productId:id,quantity:2,totalCost:0,costReason:'Muestra'}}));
    const p=(await source.products.get(id))!;
    const c:Command=await svc.prepare({type:'RecordSale',payload:{saleId:crypto.randomUUID(),lines:[draftLine(p)],received:null,draftId:null,draftVersion:null}});
    await svc.execute(c); const b=await exportBackup(source); expect(b.data.sales[0].cost).toEqual({numerator:'0',denominator:'1'});
    expect(semantic(b.data.commands.find(x=>x.id===c.id)!)).toEqual(c); const target=db(); await restoreBackup(target,b,true);
    expect(await target.sales.toArray()).toEqual(b.data.sales);
  });
});
