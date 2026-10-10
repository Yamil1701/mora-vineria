import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import type { LocalDatabase } from '../../src/local/database';
import { draftLine, LocalService, productFields } from '../../src/local/service';
/** Synthetic data produced through real services over the PR#7 schema. Never opens user DB. */
export async function previousDataset() {
  const db = new Dexie(`mora-v2:test:${crypto.randomUUID()}`);
  db.version(2).stores({ metadata:'key',products:'id',lots:'id,productId,order,sourceCommand',sales:'id,&commandId,businessDate',receipts:'id,&commandId',stockEntries:'id,productId,commandId',cashEntries:'id,commandId',drafts:'id,&commandId',commands:'id,&[deviceId+deviceSeq],localOrder',results:'commandId',outbox:'commandId,status',reviews:'id,commandId,status',writeIntents:'id' });
  try {
    const service=new LocalService(db as LocalDatabase), productId=crypto.randomUUID();
    await service.initialize(); await db.table('metadata').update('installation',{schemaVersion:2});
    await service.execute(await service.prepare({type:'CreateProduct',payload:{productId,fields:productFields('Producto anterior QA',3500,24)}}));
    const product=await db.table('products').get(productId);
    const receipt=await service.sealWrite({type:'ReceivePurchase',payload:{receiptId:crypto.randomUUID(),lines:[{id:crypto.randomUUID(),productId,quantity:6,totalCost:12000,presentation:'fardo x6'}]}});
    await service.confirmWrite(receipt.command.id); await service.acknowledgeWrite(receipt.command.id);
    const first=await service.activeDraft(); await service.saveDraft({...first,lines:[draftLine(product)]}); await service.checkoutDraft(first.id);
    const draft=await service.activeDraft(); await service.saveDraft({...draft,lines:[draftLine(product)],received:5000});
    const intent=await service.sealWrite({type:'ReceivePurchase',payload:{receiptId:crypto.randomUUID(),lines:[{id:crypto.randomUUID(),productId,quantity:2,totalCost:5000,presentation:'unidad'}]}});
    const stores=await Promise.all(db.tables.map(async t=>({name:t.name,keyPath:t.schema.primKey.keyPath,indexes:t.schema.indexes.map(i=>({name:i.name,keyPath:i.keyPath!,unique:i.unique,multiEntry:i.multi})),rows:await t.toArray()})));
    return {stores,productId,commandId:intent.command.id};
  } finally { await db.delete(); }
}
