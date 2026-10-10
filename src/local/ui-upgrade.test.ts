import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, expect, it } from 'vitest';
import { LocalDatabase } from './database';
import { draftLine, LocalService, productFields } from './service';
const names: string[] = [];
afterEach(async () => { for (const name of names.splice(0)) await Dexie.delete(name); });
function previous(name: string) {
  const db = new Dexie(name);
  db.version(1).stores({ metadata:'key',products:'id',lots:'id,productId,order,sourceCommand',sales:'id,&commandId,businessDate',receipts:'id,&commandId',stockEntries:'id,productId,commandId',cashEntries:'id,commandId',drafts:'id,&commandId',commands:'id,&[deviceId+deviceSeq],localOrder',results:'commandId',outbox:'commandId,status',reviews:'id,commandId,status' });
  db.version(2).stores({writeIntents:'id'});
  return db as LocalDatabase;
}
it('v2 upgrade preserves every business record, sealed receipt and draft byte for byte; recovery keeps original IDs', async () => {
  const name=`mora-v2:test:${crypto.randomUUID()}`; names.push(name);
  const old=previous(name), beforeService=new LocalService(old), productId=crypto.randomUUID();
  await beforeService.initialize(); await old.metadata.update('installation',{schemaVersion:2});
  await beforeService.execute(await beforeService.prepare({type:'CreateProduct',payload:{productId,fields:productFields('Producto QA',3500,24)}}));
  const product=(await old.products.get(productId))!;
  const purchase=await beforeService.sealWrite({type:'ReceivePurchase',payload:{receiptId:crypto.randomUUID(),lines:[{id:crypto.randomUUID(),productId,quantity:6,totalCost:125000,presentation:'fardo x6'}]}});
  await beforeService.confirmWrite(purchase.command.id); await beforeService.acknowledgeWrite(purchase.command.id);
  const draft=await beforeService.activeDraft(); await beforeService.saveDraft({...draft,lines:[draftLine(product)]}); await beforeService.checkoutDraft(draft.id);
  const next=await beforeService.activeDraft(); await beforeService.saveDraft({...next,lines:[draftLine(product)],received:5000});
  const pending=await beforeService.sealWrite({type:'ReceivePurchase',payload:{receiptId:crypto.randomUUID(),lines:[{id:crypto.randomUUID(),productId,quantity:2,totalCost:4000,presentation:'unidad'}]}});
  const original: Record<string, Record<string, unknown>[]> = Object.fromEntries(await Promise.all(old.tables.map(async t=>[t.name,await t.toArray()]))); old.close();
  const db=new LocalDatabase(name), service=new LocalService(db); await db.open();
  for (const [store,rows] of Object.entries(original)) expect(await db.table(store).toArray()).toEqual(store === 'metadata' ? rows.map(row=>({...row,schemaVersion:3})) : rows);
  expect(await db.preferences.count()).toBe(0); expect((await service.snapshot()).writeIntent?.command).toEqual(pending.command);
  await Promise.all(Array.from({length:20},()=>service.confirmWrite(pending.command.id)));
  expect(await db.receipts.count()).toBe(2); expect(await db.cashEntries.count()).toBe(3); expect(await db.sales.count()).toBe(1);
  await service.toggleFavorite(productId); const journal=await db.commands.toArray(); db.close();
  const reopened=new LocalDatabase(name); expect((await new LocalService(reopened).snapshot()).favorites).toEqual([productId]); expect(await reopened.commands.toArray()).toEqual(journal); reopened.close();
});
it('favorite updates from concurrent connections cannot discard each other or write business effects', async () => {
  const name=`mora-v2:test:${crypto.randomUUID()}`; names.push(name);
  const a=new LocalDatabase(name), b=new LocalDatabase(name), ids=[crypto.randomUUID(),crypto.randomUUID()];
  await Promise.all([new LocalService(a).toggleFavorite(ids[0]),new LocalService(b).toggleFavorite(ids[1])]);
  expect((await a.preferences.get('favorites'))?.productIds.sort()).toEqual(ids.sort()); expect(await a.commands.count()).toBe(0); expect(await a.outbox.count()).toBe(0); a.close(); b.close();
});

it('failed additive upgrade rolls back schema and metadata, allowing safe retry with original identities', async () => {
  const name=`mora-v2:test:${crypto.randomUUID()}`; names.push(name);
  const old=previous(name), identity={key:'installation',businessId:crypto.randomUUID(),datasetEpoch:crypto.randomUUID(),deviceId:crypto.randomUUID(),sequence:'12',localOrder:12,schemaVersion:2};
  await old.metadata.put(identity as import('../domain/types').Installation); old.close();
  const failed=new LocalDatabase(name);
  failed.metadata.hook('updating',()=>{throw new Error('QA migration failed');});
  try { await expect(failed.open()).rejects.toThrow('QA migration failed'); } finally { failed.close(); }
  const intact=previous(name); await intact.open(); expect(intact.verno).toBe(2); expect(await intact.metadata.get('installation')).toEqual(identity); intact.close();
  const retry=new LocalDatabase(name); await retry.open(); expect(await retry.metadata.get('installation')).toEqual({...identity,schemaVersion:3}); retry.close();
});
