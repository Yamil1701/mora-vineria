import { canonical, commandHash, uuid, whole, businessDate, validateFields, validateLines, validateCommand, allocateFifo, rational, addCost, saleTotal, sum, roundCost } from '../domain/rules';
import type { Command, StoredCommand, Installation, Product, Lot, Sale, Receipt, Review, StockEntry, CashEntry, Draft, WriteIntent, LocalResult, OutboxEntry, ProductFields, SaleLine, PurchaseLine, Rational } from '../domain/types';
import { planCount } from '../domain/counts';
import { LocalDatabase } from './database';

export const BACKUP_TABLES = ['metadata', 'products', 'lots', 'sales', 'receipts', 'stockEntries', 'cashEntries', 'drafts', 'commands', 'results', 'outbox', 'reviews', 'writeIntents', 'preferences', 'movements', 'stockCounts'] as const;
const LEGACY_TABLES=BACKUP_TABLES.slice(0,14);
export type BackupData = { movements: import('../domain/types').MoneyMovement[]; stockCounts: import('../domain/types').StockCount[]; metadata: Installation[]; products: Product[]; lots: Lot[]; sales: Sale[]; receipts: Receipt[]; stockEntries: StockEntry[]; cashEntries: CashEntry[]; drafts: Draft[]; commands: StoredCommand[]; results: LocalResult[]; outbox: OutboxEntry[]; reviews: Review[]; writeIntents: WriteIntent[]; preferences: { key: 'favorites'; productIds: string[] }[] };
export type Backup = { format: 'mora-v2-local-backup'; formatVersion: 1 | 2; schemaVersion: 3 | 4; contractVersion: 1 | 2; environment: 'local-workspace'; createdAt: string; rowCounts: Record<string, number>; data: BackupData; integrity: { algorithm: 'SHA-256'; digest: string } };
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
const MAX_ROWS = 100000;
export class BackupError extends Error { constructor(message: string) { super(message); this.name = 'BackupError'; } }
function check(condition: unknown, message = 'El respaldo está incompleto o contiene datos inconsistentes.'): asserts condition { if (!condition) throw new BackupError(message); }
function keys(value: unknown, required: string[], optional: string[] = []): asserts value is Record<string, unknown> {
  check(value !== null && typeof value === 'object' && !Array.isArray(value));
  const found = Object.keys(value);
  check(required.every(k => Object.hasOwn(value, k)) && found.every(k => required.includes(k) || optional.includes(k)));
}
function equal(a: unknown, b: unknown) { check(canonical(a) === canonical(b)); }
function unique<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  const map = new Map<string, T>(); for (const row of rows) { const id = key(row); check(!map.has(id)); map.set(id, row); } return map;
}
function decimal(value: unknown): asserts value is string { check(typeof value === 'string' && /^(0|[1-9]\d{0,99})$/.test(value)); }
function date(value: unknown) { check(typeof value === 'string'); businessDate(value); }
function fields(f: ProductFields) { keys(f, ['name', 'variant', 'category', 'price', 'objective', 'active']); validateFields(f); }
function line(l: SaleLine) { keys(l, ['id', 'productId', 'name', 'quantity', 'referencePrice', 'unitPrice']); }
function purchase(l: PurchaseLine) { keys(l, ['id', 'productId', 'quantity', 'totalCost', 'presentation'], ['costReason']); if (l.costReason !== undefined) check(typeof l.costReason === 'string' && l.costReason.length <= 120); }
export function semantic(c: Command): Command { return { id: c.id, type: c.type, payload: c.payload, registeredAt: c.registeredAt, contractVersion: c.contractVersion, dependencies: c.dependencies } as Command; }
function command(c: Command, stored = false) {
  keys(c, ['id', 'type', 'payload', 'registeredAt', 'contractVersion', 'dependencies', ...(stored ? ['hash', 'deviceId', 'deviceSeq', 'businessId', 'datasetEpoch', 'localOrder'] : [])]);
  validateCommand(c); check(new Set(c.dependencies).size === c.dependencies.length);
  switch (c.type) {
    case 'RecordExpense': case 'RecordContribution': keys(c.payload,['movementId','amount','concept','note']); break;
    case 'RecordStockCount': keys(c.payload,['countId','productId','expectedStock','expectedStockCommandId','counted','reason','note']); break;
    case 'CreateProduct': keys(c.payload, ['productId', 'fields']); fields(c.payload.fields); break;
    case 'EditProduct': keys(c.payload, ['productId', 'expectedVersion', 'fields']); fields(c.payload.fields); break;
    case 'RecordOpeningStock': keys(c.payload, ['productId', 'quantity', 'totalCost'], ['costReason']); if (c.payload.costReason !== undefined) check(typeof c.payload.costReason === 'string' && c.payload.costReason.length <= 120); break;
    case 'ReceivePurchase': keys(c.payload, ['receiptId', 'lines']); c.payload.lines.forEach(purchase); break;
    case 'RecordSale': keys(c.payload, ['saleId', 'lines', 'received', 'draftId', 'draftVersion']); c.payload.lines.forEach(line); break;
  }
}
function body(b: Backup) { const { integrity: _integrity, ...payload } = b; return payload; }
export async function backupDigest(payload: unknown): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(payload)));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
async function read(db: LocalDatabase): Promise<BackupData> {
  check(db.tables.length === BACKUP_TABLES.length && db.tables.every(t => BACKUP_TABLES.includes(t.name as typeof BACKUP_TABLES[number])), 'Esta versión de la base necesita otro formato de respaldo.');
  return db.transaction('r', db.tables, async () => Object.fromEntries(await Promise.all(BACKUP_TABLES.map(async name => [name, await db.table(name).toArray()]))) as BackupData);
}
/** One consistent readonly IDB snapshot; hashing and verification run after the transaction. */
export async function exportBackup(db: LocalDatabase): Promise<Backup> {
  const data = await read(db);
  const payload = { format: 'mora-v2-local-backup' as const, formatVersion: 2 as const, schemaVersion: 4 as const, contractVersion: 2 as const, environment: 'local-workspace' as const, createdAt: new Date().toISOString(), rowCounts: Object.fromEntries(BACKUP_TABLES.map(n => [n, data[n].length])), data };
  const backup: Backup = { ...payload, integrity: { algorithm: 'SHA-256', digest: await backupDigest(payload) } };
  await validateBackup(backup); check(new TextEncoder().encode(JSON.stringify(backup)).byteLength <= MAX_BACKUP_BYTES, 'El respaldo supera el límite de 20 MB.');
  return backup;
}
export async function parseBackup(text: string): Promise<Backup> {
  check(new TextEncoder().encode(text).byteLength <= MAX_BACKUP_BYTES, 'El archivo supera el límite de 20 MB.');
  let value: unknown; try { value = JSON.parse(text); } catch { throw new BackupError('No se pudo leer el archivo JSON. Puede estar dañado o incompleto.'); }
  try { await validateBackup(value); } catch (e) { if (e instanceof BackupError) throw e; throw new BackupError('El respaldo contiene registros inválidos o relaciones inconsistentes.'); }
  return migrateBackup(value as Backup);
}
/** Full validation is read-only: no staging database, writes, network or execution of imported code. */
export async function validateBackup(value: unknown): Promise<void> {
  keys(value, ['format', 'formatVersion', 'schemaVersion', 'contractVersion', 'environment', 'createdAt', 'rowCounts', 'data', 'integrity']);
  const b = value as unknown as Backup;
  check(new TextEncoder().encode(JSON.stringify(b)).byteLength <= MAX_BACKUP_BYTES, 'El archivo supera el límite de 20 MB.');
  check(b.format === 'mora-v2-local-backup' && ((b.formatVersion === 1 && b.schemaVersion === 3 && b.contractVersion === 1) || (b.formatVersion === 2 && b.schemaVersion === 4 && b.contractVersion === 2)) && b.environment === 'local-workspace', 'Este archivo no es compatible con esta versión de Mora Vinería.');
  const tables=b.formatVersion===1?LEGACY_TABLES:BACKUP_TABLES;
  date(b.createdAt); keys(b.data, [...tables]); keys(b.rowCounts, [...tables]); keys(b.integrity, ['algorithm', 'digest']);
  check(b.integrity.algorithm === 'SHA-256' && /^[0-9a-f]{64}$/.test(b.integrity.digest));
  let count = 0;
  for (const name of tables) { check(Array.isArray(b.data[name])); count += b.data[name].length; check(count <= MAX_ROWS, 'El archivo contiene demasiados registros.'); equal(b.rowCounts[name], b.data[name].length); }
  check(b.integrity.digest === await backupDigest(body(b)), 'El respaldo fue alterado o está dañado. La verificación de integridad no coincide.');
  if(b.formatVersion===1) check(b.data.commands.every(c=>c.contractVersion===1));
  await validateData(b.formatVersion===1?{...b.data,movements:[],stockCounts:[]}:b.data,b.schemaVersion);
}

async function validateData(d: BackupData, schemaVersion:number) {
  check(d.metadata.length === 1); const meta = d.metadata[0];
  keys(meta, ['key', 'businessId', 'datasetEpoch', 'deviceId', 'sequence', 'localOrder', 'schemaVersion']);
  check(meta.key === 'installation' && meta.schemaVersion === schemaVersion); uuid(meta.businessId); uuid(meta.datasetEpoch); uuid(meta.deviceId); decimal(meta.sequence); whole(meta.localOrder);
  const commands = unique(d.commands, c => c.id), sales = unique(d.sales, s => s.commandId), reviews = unique(d.reviews, r => uuid(r.id));
  for (const [name, key] of [['movements','id'],['stockCounts','id'],['products','id'],['lots','id'],['sales','id'],['receipts','id'],['stockEntries','id'],['cashEntries','id'],['drafts','id'],['results','commandId'],['outbox','commandId']] as const) unique(d[name] as {id?:string;commandId?:string}[], r => uuid(r[key]!));
  const expected = { movements: [] as BackupData['movements'], stockCounts: [] as BackupData['stockCounts'], products: new Map<string, Product>(), lots: new Map<string, Lot>(), sales: [] as Sale[], receipts: [] as Receipt[], stockEntries: [] as StockEntry[], cashEntries: [] as CashEntry[], results: [] as LocalResult[], outbox: [] as OutboxEntry[], reviews: [] as Review[] };
  const seen = new Set<string>(), sequences = new Map<string, bigint>(), stocks = new Map<string, number>(), stockCommands=new Map<string,string>(); let order = 0, cashTotal = 0, historicalCost = rational(0n);
  const stock = (id: string) => stocks.get(id) ?? 0;
  for (const c of [...d.commands].sort((a, b) => a.localOrder - b.localOrder)) {
    command(c, true); uuid(c.deviceId); decimal(c.deviceSeq); check(c.businessId === meta.businessId && c.datasetEpoch === meta.datasetEpoch);
    check(c.localOrder === ++order && BigInt(c.deviceSeq) === (sequences.get(c.deviceId) ?? 0n) + 1n); sequences.set(c.deviceId, BigInt(c.deviceSeq));
    check(c.dependencies.every(id => seen.has(id))); check(c.hash === await commandHash(semantic(c)));
    let entityId: string; const reviewIds: string[] = [];
    const product = (id: string) => { const p = expected.products.get(id); check(p); return p; };
    const entry = (id: string, productId: string, delta: number, reason: StockEntry['reason']) => { expected.stockEntries.push({id,commandId:c.id,productId,delta,reason,registeredAt:c.registeredAt}); stocks.set(productId,sum([stock(productId),delta])); stockCommands.set(productId,c.id); };
    const cash = (amount: number, reason: CashEntry['reason']) => { expected.cashEntries.push({id:c.id,commandId:c.id,amount,reason,registeredAt:c.registeredAt}); cashTotal=sum([cashTotal,amount]); };
    const addLot = (id: string, productId: string, quantity: number, totalCost: number | null) => { product(productId); check(!expected.lots.has(id)); expected.lots.set(id,{id,productId,quantity,available:quantity,unitCost:totalCost === null ? null : rational(BigInt(totalCost),BigInt(quantity)),order,sourceCommand:c.id,registeredAt:c.registeredAt}); };
    switch(c.type) {
      case 'RecordExpense': case 'RecordContribution': {
        const {movementId,amount,concept,note}=c.payload; entityId=movementId; const kind=c.type==='RecordExpense'?'expense':'contribution';
        cash(kind==='expense'?-amount:amount,kind); expected.movements.push({id:movementId,commandId:c.id,kind,amount,concept:concept.trim(),note:note.trim(),registeredAt:c.registeredAt,businessDate:businessDate(c.registeredAt)}); break;
      }
      case 'RecordStockCount': {
        const {countId,productId,expectedStock,expectedStockCommandId,counted,reason,note}=c.payload; entityId=countId; product(productId);
        check(expectedStock===stock(productId) && expectedStockCommandId===(stockCommands.get(productId)??null));
        const plan=planCount([...expected.lots.values()].filter(l=>l.productId===productId),expectedStock,counted);
        plan.updates.forEach(l=>expected.lots.set(l.id,l));
        if(plan.addedUnits) addLot(countId,productId,plan.addedUnits,null);
        entry(countId,productId,plan.delta,'count');
        const original=d.stockCounts.find(r=>r.commandId===c.id); check(original); let reviewIndex=0;
        const addReview=(kind:Review['kind'],detail:string)=>{const id=original.reviewIds[reviewIndex++];check(reviews.has(id));reviewIds.push(id);expected.reviews.push({id,commandId:c.id,productId,kind,detail,status:'open'});};
        if(plan.inconsistent) addReview('stock_difference','El conteo reconcilió stock y lotes actuales; las diferencias históricas siguen pendientes.');
        if(plan.cost===null) addReview('unknown_cost','El ajuste tiene costo desconocido. No se modificaron costos de ventas anteriores.');
        const {updates:_updates,inconsistent:_inconsistent,...effects}=plan;
        expected.stockCounts.push({id:countId,commandId:c.id,productId,before:expectedStock,counted,...effects,reason:reason.trim(),note:note.trim(),registeredAt:c.registeredAt,businessDate:businessDate(c.registeredAt),reviewIds}); break;
      }
      case 'CreateProduct': {
        const {productId,fields:f}=c.payload; check(!expected.products.has(productId)); entityId=productId;
        expected.products.set(productId,{...f,name:f.name.trim(),variant:f.variant.trim(),category:f.category.trim(),id:productId,version:1,createdBy:c.id,lastCommandId:c.id}); break;
      }
      case 'EditProduct': {
        const {productId,fields:f,expectedVersion}=c.payload; const p=product(productId); check(p.version===expectedVersion); entityId=productId;
        expected.products.set(productId,{...p,...f,name:f.name.trim(),variant:f.variant.trim(),category:f.category.trim(),version:p.version+1,lastCommandId:c.id}); break;
      }
      case 'RecordOpeningStock': {
        const {productId,quantity,totalCost}=c.payload; check(!expected.stockEntries.some(e=>e.productId===productId)); entityId=c.id;
        addLot(c.id,productId,quantity,totalCost); entry(c.id,productId,quantity,'opening'); break;
      }
      case 'ReceivePurchase': {
        const {receiptId,lines}=c.payload; entityId=receiptId; const total=sum(lines.map(l=>l.totalCost));
        for(const l of lines) { addLot(l.id,l.productId,l.quantity,l.totalCost); entry(l.id,l.productId,l.quantity,'receipt'); }
        cash(-total,'purchase'); expected.receipts.push({id:receiptId,commandId:c.id,lines,total,registeredAt:c.registeredAt,businessDate:businessDate(c.registeredAt)}); break;
      }
      case 'RecordSale': {
        const original=sales.get(c.id); check(original); entityId=c.payload.saleId;
        let cost: Rational | null=rational(0n); let reviewIndex=0;
        const lines=c.payload.lines.map(l=>{
          product(l.productId); const fifo=allocateFifo([...expected.lots.values()].filter(lot=>lot.productId===l.productId),l.quantity);
          fifo.updates.forEach(lot=>expected.lots.set(lot.id,lot)); entry(l.id,l.productId,-l.quantity,'sale');
          const addReview=(kind:Review['kind'],detail:string)=>{const id=original.reviewIds[reviewIndex++]; const r=reviews.get(id); check(r); reviewIds.push(id); expected.reviews.push({id,commandId:c.id,productId:l.productId,kind,detail,status:'open'});};
          if(fifo.missingUnits || stock(l.productId)<0) addReview('stock_difference',`Stock registrado ${stock(l.productId)}; ${fifo.missingUnits} unidades sin lote asignado.`);
          if(fifo.cost===null) addReview('unknown_cost','El costo no se puede calcular completamente. No se asumió costo cero.');
          cost=cost===null || fifo.cost===null ? null : addCost(cost,fifo.cost);
          return {...l,allocations:fifo.allocations,missingUnits:fifo.missingUnits,cost:fifo.cost};
        });
        const total=saleTotal(c.payload.lines),received=c.payload.received; cash(total,'sale');
        if(cost!==null) { historicalCost=addCost(historicalCost,cost); roundCost(historicalCost); }
        expected.sales.push({id:entityId,commandId:c.id,registeredAt:c.registeredAt,businessDate:businessDate(c.registeredAt),lines,total,received,change:received===null?null:received-total,cost,status:'local_only',reviewIds}); break;
      }
    }
    expected.results.push({commandId:c.id,hash:c.hash,entityId,status:'local_only',reviewIds}); expected.outbox.push({commandId:c.id,status:'awaiting_backend',deviceSeq:c.deviceSeq,attempts:0}); seen.add(c.id);
  }
  check(meta.localOrder===order && BigInt(meta.sequence)===(sequences.get(meta.deviceId) ?? 0n));
  const sorted=(rows: unknown[], key:string)=>[...rows].sort((a,b)=>String((a as Record<string,unknown>)[key]).localeCompare(String((b as Record<string,unknown>)[key])));
  for(const name of ['movements','stockCounts','products','lots','sales','receipts','stockEntries','cashEntries','results','outbox','reviews'] as const) {
    const rows=expected[name] instanceof Map ? [...expected[name].values()] : expected[name];
    equal(sorted(d[name],name==='results'||name==='outbox'?'commandId':'id'),sorted(rows as unknown[],name==='results'||name==='outbox'?'commandId':'id'));
  }
  sum(d.sales.map(s=>s.total));
  // Drafts and confirmation slots are durable preparation, not applied journal effects.
  unique(d.drafts,r=>uuid(r.commandId)); unique(d.drafts,r=>uuid(r.saleId)); check(d.drafts.filter(r=>!r.consumedBy).length<=1);
  for(const r of d.drafts) {
    keys(r,['id','commandId','saleId','version','lines','received','consumedBy','submission','updatedAt']); whole(r.version,'Versión',true); date(r.updatedAt); check(Array.isArray(r.lines)&&r.lines.length<=100);
    r.lines.forEach(line); if(r.lines.length) validateLines(r.lines); r.lines.forEach(l=>check(expected.products.has(l.productId))); if(r.received!==null) whole(r.received);
    const stored=commands.get(r.commandId);
    if(r.submission===null) check(r.consumedBy===null);
    if(r.submission!==null) { command(r.submission); check(r.submission.type==='RecordSale'); const c=r.submission;
      equal(c.payload,{saleId:r.saleId,lines:r.lines,received:r.received,draftId:r.id,draftVersion:r.version}); check(c.id===r.commandId); check(c.dependencies.every(id=>commands.has(id)));
    }
    if(r.consumedBy!==null) { check(r.consumedBy===r.commandId && stored?.type==='RecordSale' && r.submission); equal(r.submission,semantic(stored)); }
    else check(!stored);
  }
  for(const c of d.commands) if(c.type==='RecordSale' && c.payload.draftId!==null) check(d.drafts.some(r=>r.id===c.payload.draftId && r.consumedBy===c.id));
  check(d.writeIntents.length<=1);
  for(const i of d.writeIntents) {
    keys(i,['id','command','status']); check(i.id==='form'&&(i.status==='prepared'||i.status==='confirmed')); command(i.command); check(i.command.type!=='RecordSale');
    check(!d.drafts.some(r=>r.commandId===i.command.id));
    const payload=i.command.payload;
    if(i.command.type==='CreateProduct') { if(i.status==='prepared') check(!expected.products.has(i.command.payload.productId)); }
    else if('productId' in payload) check(expected.products.has(payload.productId));
    else if(i.command.type==='ReceivePurchase') i.command.payload.lines.forEach(l=>check(expected.products.has(l.productId)));
    check(i.command.dependencies.every(id=>commands.has(id))); const stored=commands.get(i.command.id);
    if(i.status==='confirmed') { check(stored); equal(i.command,semantic(stored)); } else check(!stored);
  }
  check(d.preferences.length<=1); for(const p of d.preferences) { keys(p,['key','productIds']); check(p.key==='favorites'&&Array.isArray(p.productIds)); check(new Set(p.productIds).size===p.productIds.length); p.productIds.forEach(id=>check(expected.products.has(uuid(id)))); }
}

async function emptyWithinTransaction(db: LocalDatabase): Promise<boolean> {
  for(const name of BACKUP_TABLES) {
    const rows=await db.table(name).toArray();
    if(name==='metadata') { if(rows.length>1 || rows.some(r=>r.key!=='installation'||r.sequence!=='0'||r.localOrder!==0)) return false; }
    else if(name==='drafts') { if(rows.length>1 || rows.some(r=>r.version!==1||r.lines.length||r.received!==null||r.consumedBy!==null||r.submission!==null)) return false; }
    else if(name==='preferences') { if(rows.length>1 || rows.some(r=>r.key!=='favorites'||r.productIds.length)) return false; }
    else if(rows.length) return false;
  }
  return true;
}
export async function canRestore(db: LocalDatabase) { return db.transaction('r',db.tables,()=>emptyWithinTransaction(db)); }
/** Validate again, then recheck emptiness and install the whole snapshot under one write lock. */
export async function restoreBackup(db: LocalDatabase, input: Backup, confirmed: boolean): Promise<void> {
  check(confirmed,'Confirmá explícitamente la recuperación antes de continuar.');
  const source=structuredClone(input); await validateBackup(source); const b=await migrateBackup(source);
  const meta:Installation={...b.data.metadata[0],deviceId:crypto.randomUUID(),sequence:'0'};
  await db.transaction('rw',db.tables,async()=>{
    check(await emptyWithinTransaction(db),'Este equipo ya tiene datos o una operación pendiente. Conservá su respaldo y usá un navegador o perfil vacío; no se reemplazó ningún registro.');
    // Only pristine bootstrap metadata/empty draft/preferences may be replaced.
    for(const name of ['metadata','drafts','preferences']) await db.table(name).clear();
    for(const name of BACKUP_TABLES) await db.table(name).bulkAdd(name==='metadata'?[meta]:b.data[name]);
  });
}
/** Validate the original envelope/hash first; upgrade only an isolated in-memory copy. */
export async function migrateBackup(source: Backup): Promise<Backup> {
  if(source.formatVersion===2) return source;
  const data={...structuredClone(source.data),movements:[],stockCounts:[]}; data.metadata=data.metadata.map(m=>({...m,schemaVersion:4}));
  const payload={...body(source),formatVersion:2 as const,schemaVersion:4 as const,contractVersion:2 as const,data,rowCounts:Object.fromEntries(BACKUP_TABLES.map(n=>[n,data[n].length]))};
  return {...payload,integrity:{algorithm:'SHA-256',digest:await backupDigest(payload)}};
}
export function backupFilename(b: Backup) { return `mora-vineria-backup-${b.createdAt.slice(0,10)}.json`; }
export function backupSummary(b: Backup) { return { products:b.data.products.length,sales:b.data.sales.length,movements:b.data.stockEntries.length+b.data.cashEntries.length,receipts:b.data.receipts.length,reviews:b.data.reviews.length,drafts:b.data.drafts.filter(d=>!d.consumedBy).length,confirmations:b.data.writeIntents.length }; }
