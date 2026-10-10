import 'fake-indexeddb/auto';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {LocalDatabase} from './database';
import {LocalService,productFields,draftLine} from './service';
import {BACKUP_TABLES,backupDigest,exportBackup,parseBackup,restoreBackup} from './backup';
import {rational,sum} from '../domain/rules';
import type {Command,FormOperation} from '../domain/types';
let db:LocalDatabase,s:LocalService,p:string;
const id=()=>crypto.randomUUID();
beforeEach(async()=>{db=new LocalDatabase(`mora-v2:test:${id()}`);s=new LocalService(db);p=id();await s.execute(await s.prepare({type:'CreateProduct',payload:{productId:p,fields:productFields('QA',3500)}}));});
afterEach(async()=>{vi.useRealTimers();vi.restoreAllMocks();await db.delete();});
async function receive(q=6,cost=125000){await s.execute(await s.prepare({type:'ReceivePurchase',payload:{receiptId:id(),lines:[{id:id(),productId:p,quantity:q,totalCost:cost,presentation:''}]}}));}
async function sell(q:number){const product=(await db.products.get(p))!;await s.execute(await s.prepare({type:'RecordSale',payload:{saleId:id(),lines:[{...draftLine(product),quantity:q}],received:null,draftId:null,draftVersion:null}}));}
async function count(q:number){const b=await s.stockBaseline(p);return s.prepare({type:'RecordStockCount',payload:{countId:id(),productId:p,expectedStock:b.stock,expectedStockCommandId:b.commandId,counted:q,reason:'Conteo físico',note:''}});}
async function money(type:'RecordExpense'|'RecordContribution',amount=1000,time='2026-10-10T10:59:59Z'){return s.prepare({type,payload:{movementId:id(),amount,concept:'QA',note:'nota'}},{registeredAt:time});}
it('expense/contribution keep cash separate from sales, costs and jornada boundary',async()=>{
 await s.execute(await money('RecordExpense')); await s.execute(await money('RecordContribution',5000,'2026-10-10T11:00:00Z'));
 expect((await db.movements.toArray()).map(m=>m.businessDate).sort()).toEqual(['2026-10-09','2026-10-10']);expect(sum((await db.cashEntries.toArray()).map(e=>e.amount))).toBe(4000);expect(await db.sales.count()).toBe(0);expect(await db.lots.count()).toBe(0);
});
it('FIFO count decrease spans lots exactly, leaves historic sales unchanged; surplus stays unknown',async()=>{
 await receive();await receive(2,4000);await sell(1);const sale=await db.sales.toArray();await s.execute(await count(1));const c=(await db.stockCounts.toArray())[0];
 expect(c.before).toBe(7);expect(c.delta).toBe(-6);expect(c.cost).toEqual(rational(318500n,3n));expect(c.allocations.map(a=>a.units)).toEqual([5,1]);expect(await db.sales.toArray()).toEqual(sale);
 await s.execute(await count(3));expect(sum((await db.lots.toArray()).map(l=>l.available))).toBe(3);expect((await db.lots.toArray()).filter(l=>l.unitCost===null)).toHaveLength(1);expect(await db.reviews.count()).toBe(1);
 await sell(3);expect((await db.sales.toArray()).find(x=>x.id!==sale[0].id)!.cost).toBeNull();
});
it('negative stock and later receipt reconcile current lots without assigning old missing costs',async()=>{
 await sell(3);const original=await db.sales.toArray();await receive(5,5000);expect((await s.stockBaseline(p)).stock).toBe(2);await s.execute(await count(2));
 expect(sum((await db.lots.toArray()).map(l=>l.available))).toBe(2);expect((await db.stockCounts.toArray())[0]).toMatchObject({delta:0,removedUnits:3,cost:null});expect(await db.sales.toArray()).toEqual(original);
});
it('count zero/no difference remain auditable, no cash effect',async()=>{await receive(2,4000);const cash=await db.cashEntries.toArray();await s.execute(await count(2));await s.execute(await count(0));expect(await db.stockCounts.count()).toBe(2);expect(await db.cashEntries.toArray()).toEqual(cash);expect((await s.stockBaseline(p)).stock).toBe(0);expect(sum((await db.lots.toArray()).map(l=>l.available))).toBe(0);});
it('stale count rejects even when sale and receipt return stock to same number',async()=>{await receive(2,4000);const c=await count(1);await sell(1);await receive(1,2000);const before=await s.snapshot();await expect(s.execute(c)).rejects.toMatchObject({code:'COUNT_CONFLICT'});expect(await s.snapshot()).toEqual(before);});
it('competing counts serialize across connections and one is rejected',async()=>{await receive();const a=await count(4),b=await count(3);const other=new LocalDatabase(db.name);try{const results=await Promise.allSettled([s.execute(a),new LocalService(other).execute(b)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await db.stockCounts.count()).toBe(1);}finally{other.close();}});
for(const type of ['RecordExpense','RecordContribution','RecordStockCount'] as const) it(`durable ${type} survives restart and 20 retries across connections`,async()=>{
 const operation=type==='RecordStockCount'?await count(2):await money(type);const {type:t,payload}=operation;const intent=await s.sealWrite({type:t,payload} as Exclude<Command,{type:'RecordSale'}>);const name=db.name;db.close();db=new LocalDatabase(name);s=new LocalService(db);const other=new LocalDatabase(name);
 try{await Promise.all(Array.from({length:20},(_,i)=>(i%2?s:new LocalService(other)).confirmWrite(intent.command.id)));expect(await db.commands.count()).toBe(2);expect((await db.metadata.get('installation'))!.sequence).toBe('2');expect((await db.writeIntents.get('form'))!.status).toBe('confirmed');const saved=type==='RecordStockCount'?(await db.stockCounts.toArray())[0]:(await db.movements.toArray())[0];expect(saved.registeredAt).toBe(intent.command.registeredAt);}finally{other.close();}
});
for(const table of ['stockCounts','reviews','outbox','metadata'] as const) it(`count ${table} storage failure rolls back and original intent retries`,async()=>{
 const c=await count(2),intent=await s.sealWrite(c as FormOperation);const before=await s.snapshot();const spy=vi.spyOn(db[table],table==='metadata'?'put':'add').mockRejectedValueOnce(new DOMException('full','QuotaExceededError'));await expect(s.confirmWrite(intent.command.id)).rejects.toThrow();spy.mockRestore();expect(await s.snapshot()).toEqual(before);await s.confirmWrite(intent.command.id);expect(await db.stockCounts.count()).toBe(1);
});
it('expense storage failure rolls back cash; retry uses exact original ID/time',async()=>{const c=await money('RecordExpense'),intent=await s.sealWrite(c as FormOperation);const before=await s.snapshot();vi.spyOn(db.movements,'add').mockRejectedValueOnce(new DOMException('full','QuotaExceededError'));await expect(s.confirmWrite(intent.command.id)).rejects.toThrow();vi.restoreAllMocks();expect(await s.snapshot()).toEqual(before);await s.confirmWrite(intent.command.id);expect((await db.movements.toArray())[0].commandId).toBe(intent.command.id);});
it('strict validation rejects decimals, negative physical count, blank concepts, unsafe amounts',async()=>{
 for(const value of [0,-1,1.5,Number.MAX_SAFE_INTEGER+1]) await expect(s.execute(await money('RecordExpense',value))).rejects.toThrow();
 const c=await count(-1);await expect(s.execute(c)).rejects.toThrow();const m=await money('RecordContribution');if(m.type==='RecordContribution')m.payload.concept=' ';await expect(s.execute(m)).rejects.toThrow();expect(await db.movements.count()).toBe(0);
});
it('format 2 restores all new records and durable pending count, retries once',async()=>{
 await receive();await s.execute(await money('RecordExpense'));await s.execute(await money('RecordContribution'));await s.execute(await count(2));const pending=await s.sealWrite(await count(4) as FormOperation);const b=await exportBackup(db);expect(b.formatVersion).toBe(2);const target=new LocalDatabase(`mora-v2:test:${id()}`);
 try{await restoreBackup(target,await parseBackup(JSON.stringify(b)),true);for(const n of BACKUP_TABLES)if(n!=='metadata')expect(await target.table(n).toArray()).toEqual(b.data[n]);const receiver=new LocalService(target);await receiver.confirmWrite(pending.command.id);await receiver.confirmWrite(pending.command.id);expect(await target.stockCounts.count()).toBe(2);await exportBackup(target);}finally{await target.delete();}
});
it('published format 1 verifies original checksum before migration, preserves command bytes',async()=>{
 await receive();await sell(1);const current=await exportBackup(db);const {movements:_m,stockCounts:_s,...data}=current.data;data.metadata=data.metadata.map(m=>({...m,schemaVersion:3}));const {movements:_mc,stockCounts:_sc,...rowCounts}=current.rowCounts;const {integrity:_i,...rest}=current;const payload={...rest,formatVersion:1,schemaVersion:3,contractVersion:1,data,rowCounts};const old={...payload,integrity:{algorithm:'SHA-256',digest:await backupDigest(payload)}};
 const upgraded=await parseBackup(JSON.stringify(old));expect(upgraded.data.commands).toEqual(current.data.commands);expect(upgraded.schemaVersion).toBe(4);const target=new LocalDatabase(`mora-v2:test:${id()}`);try{await restoreBackup(target,upgraded,true);expect(await target.sales.toArray()).toEqual(current.data.sales);}finally{await target.delete();}
 old.data.products[0].price++;await expect(parseBackup(JSON.stringify(old))).rejects.toThrow('alterado');
});
it('resigned tampering with movement, count/FIFO, review or ledger is rejected',async()=>{await receive();await s.execute(await money('RecordExpense'));await s.execute(await count(8));const original=await exportBackup(db);for(const mutate of [(b:typeof original)=>{b.data.movements[0].amount++;},(b:typeof original)=>{b.data.stockCounts[0].counted++;},(b:typeof original)=>{b.data.reviews=[];b.rowCounts.reviews=0;}]){const b=structuredClone(original);mutate(b);const {integrity:_i,...payload}=b;b.integrity.digest=await backupDigest(payload);await expect(parseBackup(JSON.stringify(b))).rejects.toThrow();}});
it('report separates gross profit, expenses, contributions, purchases and FIFO losses exactly',async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-10T15:00:00Z'));
 const {movementReport}=await import('../app/projections');await receive(6,12000);await sell(2);await s.execute(await money('RecordExpense',1000,new Date().toISOString()));await s.execute(await money('RecordContribution',5000,new Date().toISOString()));await s.execute(await count(3));
 const view=await s.snapshot(),today=new Date().toISOString();const {businessDate}=await import('../domain/rules');
 const r=movementReport(view.sales,view.cashEntries,view.stockCounts,businessDate(today),'Mes');
 expect(r).toMatchObject({expense:1000,contribution:5000,purchases:12000,variation:-1000,soldCost:4000,removedCost:2000,net:0});
 await s.execute(await count(5));await sell(5);const after=await s.snapshot();expect(movementReport(after.sales,after.cashEntries,after.stockCounts,businessDate(today),'Mes').net).toBeNull();
 expect(movementReport(view.sales,view.cashEntries,view.stockCounts,'2026-09-01','Hoy')).toMatchObject({expense:0,contribution:0,purchases:0,variation:0,net:0});
});
it('unmodified PR9 export fixture restores draft/favorites/pending receipt with original IDs',async()=>{
 const {readFileSync}=await import('node:fs');const original=JSON.parse(readFileSync('tests/fixtures/pr9-backup.json','utf8'));const parsed=await parseBackup(JSON.stringify(original));const target=new LocalDatabase(`mora-v2:test:${id()}`);
 try{await restoreBackup(target,parsed,true);for(const n of Object.keys(original.data))if(n!=='metadata')expect(await target.table(n).toArray()).toEqual(original.data[n]);const r=new LocalService(target),intent=original.data.writeIntents[0];await r.confirmWrite(intent.command.id);await r.confirmWrite(intent.command.id);expect(await target.receipts.count()).toBe(2);expect((await target.metadata.get('installation'))!.sequence).toBe('1');await exportBackup(target);}finally{await target.delete();}
});
it('PR9 schema upgrade and failed upgrade preserve all rows; new commands keep legacy hashes',async()=>{
 const {readFileSync}=await import('node:fs');const {default:Dexie}=await import('dexie');const original=JSON.parse(readFileSync('tests/fixtures/pr9-backup.json','utf8'));
 const stores={metadata:'key',products:'id',lots:'id,productId,order,sourceCommand',sales:'id,&commandId,businessDate',receipts:'id,&commandId',stockEntries:'id,productId,commandId',cashEntries:'id,commandId',drafts:'id,&commandId',commands:'id,&[deviceId+deviceSeq],localOrder',results:'commandId',outbox:'commandId,status',reviews:'id,commandId,status',writeIntents:'id',preferences:'key'};
 const name=`mora-v2:test:${id()}`,old=new Dexie(name);old.version(3).stores(stores);for(const n of Object.keys(stores))await old.table(n).bulkAdd(original.data[n]);old.close();
 const failed=new LocalDatabase(name);failed.version(4).upgrade(async()=>{throw new Error('QA failed upgrade');});await expect(failed.open()).rejects.toThrow();failed.close();
 const check=new Dexie(name);check.version(3).stores(stores);for(const n of Object.keys(stores))expect(await check.table(n).toArray()).toEqual(original.data[n]);check.close();
 const upgraded=new LocalDatabase(name);try{await upgraded.open();for(const n of Object.keys(stores))expect(await upgraded.table(n).toArray()).toEqual(n==='metadata'?original.data[n].map((m:object)=>({...m,schemaVersion:4})):original.data[n]);expect(await upgraded.movements.count()).toBe(0);await exportBackup(upgraded);}finally{await upgraded.delete();}
});
it('same-kind money aggregate overflow is rejected even when cash was offset by external funds',async()=>{
 await s.execute(await money('RecordContribution',Number.MAX_SAFE_INTEGER));await s.execute(await money('RecordExpense',Number.MAX_SAFE_INTEGER));const before=await s.snapshot();await expect(s.execute(await money('RecordExpense',1))).rejects.toMatchObject({code:'OVERFLOW'});expect(await s.snapshot()).toEqual(before);await exportBackup(db);
});
it('pending count may keep a stale real baseline, but forged baseline references cannot restore',async()=>{
 await receive();const intent=await s.sealWrite(await count(4) as FormOperation);await sell(1);const original=await exportBackup(db);const valid=await parseBackup(JSON.stringify(original));expect(valid.data.writeIntents[0].command.id).toBe(intent.command.id);
 for(const reference of [id(),null]){const b=structuredClone(original);const c=b.data.writeIntents[0].command;if(c.type!=='RecordStockCount')throw new Error();c.payload.expectedStockCommandId=reference;const {integrity:_i,...payload}=b;b.integrity.digest=await backupDigest(payload);await expect(parseBackup(JSON.stringify(b))).rejects.toThrow();}
});
