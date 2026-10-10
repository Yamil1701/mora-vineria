import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Command, FormOperation, Product } from '../domain/types';
import { commandHash, rational } from '../domain/rules';
import { LocalDatabase } from './database';
import { LocalService, productFields } from './service';

let db: LocalDatabase, service: LocalService;
const id = () => crypto.randomUUID();
beforeEach(() => { db = new LocalDatabase(`mora-v2:test:${id()}`); service = new LocalService(db); });
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });
async function product(): Promise<Product> {
  const productId = id();
  await service.execute(await service.prepare({ type: 'CreateProduct', payload: { productId, fields: productFields('QA', 3500) } }));
  return (await db.products.get(productId))!;
}
function receipt(p: Product): FormOperation {
  return { type: 'ReceivePurchase', payload: { receiptId: id(), lines: [{ id: id(), productId: p.id, quantity: 6, totalCost: 125000, presentation: 'fardo x6' }] } };
}
function restart() { const name = db.name; db.close(); db = new LocalDatabase(name); service = new LocalService(db); }
async function assertOneReceipt(commandId: string) {
  expect(await db.receipts.count()).toBe(1); expect(await db.lots.count()).toBe(1);
  expect(await db.stockEntries.count()).toBe(1); expect(await db.cashEntries.count()).toBe(1);
  expect((await db.stockEntries.toArray())[0].delta).toBe(6);
  expect((await db.cashEntries.toArray())[0].amount).toBe(-125000);
  expect(await db.commands.count()).toBe(2); expect(await db.results.count()).toBe(2); expect(await db.outbox.count()).toBe(2);
  expect((await db.metadata.get('installation'))!.sequence).toBe('2');
  expect((await db.writeIntents.get('form'))!.command.id).toBe(commandId);
  expect((await db.writeIntents.get('form'))!.status).toBe('confirmed');
}

describe('durable form confirmation and recovery', () => {
  it('recovers a sealed receipt before execution with every ID, timestamp, dependency and cost unchanged', async () => {
    const p = await product(), intent = await service.sealWrite(receipt(p));
    expect(intent.status).toBe('prepared'); expect(await db.receipts.count()).toBe(0);
    restart(); expect((await service.snapshot()).writeIntent).toEqual(intent);
    const first = await service.confirmWrite(intent.command.id);
    restart(); expect(await service.confirmWrite(intent.command.id)).toEqual(first);
    const stored = (await db.commands.get(intent.command.id))!;
    expect(stored).toMatchObject(intent.command); await assertOneReceipt(intent.command.id);
  });
  it('100 concurrent retries across two connections recover one receipt, lot, stock, payment and sequence', async () => {
    const p = await product(), intent = await service.sealWrite(receipt(p));
    restart(); const other = new LocalDatabase(db.name), second = new LocalService(other);
    try {
      const results = await Promise.all(Array.from({ length: 100 }, (_, i) => (i % 2 ? service : second).confirmWrite(intent.command.id)));
      expect(results.every(r => r.hash === results[0].hash)).toBe(true);
      await assertOneReceipt(intent.command.id);
    } finally { other.close(); }
  });
  for (const stage of ['lots', 'stockEntries', 'cashEntries', 'receipts', 'commands', 'results', 'outbox', 'metadata', 'writeIntents'] as const) {
    it(`rolls back receipt effects on ${stage} failure, then closes/reopens and retries the original command`, async () => {
      const p = await product(), intent = await service.sealWrite(receipt(p));
      const before = await service.snapshot(), meta = await db.metadata.get('installation');
      const spy = vi.spyOn(db[stage], stage === 'metadata' || stage === 'writeIntents' ? 'put' : 'add')
        .mockRejectedValueOnce(new DOMException('disk quota', 'QuotaExceededError'));
      await expect(service.confirmWrite(intent.command.id)).rejects.toThrow(); spy.mockRestore();
      expect(await service.snapshot()).toEqual(before); expect(await db.metadata.get('installation')).toEqual(meta);
      restart(); expect((await service.snapshot()).writeIntent).toEqual(intent);
      await service.confirmWrite(intent.command.id); await assertOneReceipt(intent.command.id);
    });
  }
  it('never applies effects when sealing fails, and keeps existing records after restart', async () => {
    const p = await product();
    const spy = vi.spyOn(db.writeIntents, 'add').mockRejectedValueOnce(new DOMException('disk', 'QuotaExceededError'));
    await expect(service.sealWrite(receipt(p))).rejects.toThrow(); spy.mockRestore(); restart();
    expect(await db.receipts.count()).toBe(0); expect(await db.cashEntries.count()).toBe(0);
    expect(await db.lots.count()).toBe(0); expect(await db.stockEntries.count()).toBe(0);
    expect((await service.snapshot()).writeIntent).toBeNull(); expect(await db.products.count()).toBe(1);
  });
  it('a lost UI acknowledgment after successful commit recovers confirmed and replays without effects', async () => {
    const p = await product(), intent = await service.sealWrite(receipt(p));
    const execute = service.execute.bind(service);
    vi.spyOn(service, 'execute').mockImplementationOnce(async (command, intentId) => { await execute(command, intentId); throw new Error('page closed before success reached UI'); });
    await expect(service.confirmWrite(intent.command.id)).rejects.toThrow(); restart();
    await assertOneReceipt(intent.command.id); await service.confirmWrite(intent.command.id); await assertOneReceipt(intent.command.id);
    await expect(service.sealWrite(receipt(p))).rejects.toMatchObject({ code: 'WRITE_IN_PROGRESS' });
  });
  it('failed acknowledgment remains confirmed after restart; explicit close retains journal and permits a separate receipt', async () => {
    const p = await product(), intent = await service.sealWrite(receipt(p)); await service.confirmWrite(intent.command.id);
    const spy = vi.spyOn(db.writeIntents, 'delete').mockRejectedValueOnce(new Error('disk'));
    await expect(service.acknowledgeWrite(intent.command.id)).rejects.toThrow(); spy.mockRestore(); restart();
    await assertOneReceipt(intent.command.id); await service.acknowledgeWrite(intent.command.id);
    expect((await service.snapshot()).writeIntent).toBeNull(); expect(await db.commands.get(intent.command.id)).toBeDefined();
    await expect(service.confirmWrite(intent.command.id)).rejects.toMatchObject({ code: 'WRITE_CONFLICT' });
    const next = await service.sealWrite(receipt(p)); expect(next.command.id).not.toBe(intent.command.id);
    await service.confirmWrite(next.command.id); expect(await db.receipts.count()).toBe(2);
  });
  it('never reapplies a confirmed receipt if its retained result is missing', async () => {
    const p = await product(), intent = await service.sealWrite(receipt(p)); await service.confirmWrite(intent.command.id);
    await db.results.delete(intent.command.id); restart(); const before = await service.snapshot();
    await expect(service.confirmWrite(intent.command.id)).rejects.toMatchObject({ code: 'INCOMPLETE_LOCAL_DATA' });
    await expect(service.acknowledgeWrite(intent.command.id)).rejects.toMatchObject({ code: 'WRITE_CONFLICT' });
    expect(await service.snapshot()).toEqual(before); expect(await db.cashEntries.count()).toBe(1);
  });
  it('does not accept changed payload or another operation while confirmation is pending', async () => {
    const p = await product(), intent = await service.sealWrite(receipt(p)), changed = structuredClone(intent.command);
    if (changed.type !== 'ReceivePurchase') throw new Error(); changed.payload.lines[0].quantity = 7;
    await expect(service.execute(changed)).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    await expect(service.sealWrite(receipt(p))).rejects.toMatchObject({ code: 'WRITE_IN_PROGRESS' });
    await expect(service.acknowledgeWrite(intent.command.id)).rejects.toMatchObject({ code: 'WRITE_CONFLICT' });
    expect(await db.receipts.count()).toBe(0); expect((await db.writeIntents.get('form'))!.command).toEqual(intent.command);
  });
  it('concurrent seals elect one durable operation instead of creating multiple receipts', async () => {
    const p = await product(), other = new LocalDatabase(db.name), second = new LocalService(other);
    try {
      const seals = await Promise.allSettled([service.sealWrite(receipt(p)), second.sealWrite(receipt(p))]);
      expect(seals.filter(r => r.status === 'fulfilled')).toHaveLength(1);
      const intent = (await db.writeIntents.get('form'))!; await service.confirmWrite(intent.command.id); await assertOneReceipt(intent.command.id);
    } finally { other.close(); }
  });
  it('reopening pending data invalidates stale execution; committed receipts cannot be reopened', async () => {
    const p = await product(), operation = receipt(p), intent = await service.sealWrite(operation);
    expect(await service.reopenWrite(intent.command.id)).toEqual(operation);
    await expect(service.execute(intent.command, intent.command.id)).rejects.toMatchObject({ code: 'WRITE_CONFLICT' });
    expect(await db.receipts.count()).toBe(0);
    const next = await service.sealWrite(operation); await service.confirmWrite(next.command.id);
    await expect(service.reopenWrite(next.command.id)).rejects.toMatchObject({ code: 'WRITE_CONFLICT' });
  });
  it('opening stock also recovers the original attempt and never adds payment or duplicate opening', async () => {
    const p = await product(), intent = await service.sealWrite({ type: 'RecordOpeningStock', payload: { productId: p.id, quantity: 2, totalCost: null } });
    const spy = vi.spyOn(db.stockEntries, 'add').mockRejectedValueOnce(new Error('disk'));
    await expect(service.confirmWrite(intent.command.id)).rejects.toThrow(); spy.mockRestore(); restart();
    await service.confirmWrite(intent.command.id); restart(); await service.confirmWrite(intent.command.id);
    expect(await db.lots.count()).toBe(1); expect(await db.stockEntries.count()).toBe(1); expect(await db.cashEntries.count()).toBe(0);
  });
  it('product creation and CAS editing recover without duplicate catalog or version increments', async () => {
    const productId = id(), creation = await service.sealWrite({ type: 'CreateProduct', payload: { productId, fields: productFields('QA', 3500) } });
    restart(); await service.confirmWrite(creation.command.id); restart(); await service.confirmWrite(creation.command.id);
    expect(await db.products.count()).toBe(1); await service.acknowledgeWrite(creation.command.id);
    const edit = await service.sealWrite({ type: 'EditProduct', payload: { productId, expectedVersion: 1, fields: productFields('Editado', 4000) } });
    const spy = vi.spyOn(db.products, 'put').mockRejectedValueOnce(new Error('disk'));
    await expect(service.confirmWrite(edit.command.id)).rejects.toThrow(); spy.mockRestore(); restart();
    await service.confirmWrite(edit.command.id); restart(); await service.confirmWrite(edit.command.id);
    expect((await db.products.get(productId))!.version).toBe(2); expect(await db.products.count()).toBe(1);
  });
  it('upgrade from schema 1 adds recovery without deleting existing records or changing IDs', async () => {
    const name = db.name; db.close();
    const old = new Dexie(name);
    old.version(1).stores({ metadata: 'key', products: 'id', lots: 'id,productId,order,sourceCommand', sales: 'id,&commandId,businessDate', receipts: 'id,&commandId', stockEntries: 'id,productId,commandId', cashEntries: 'id,commandId', drafts: 'id,&commandId', commands: 'id,&[deviceId+deviceSeq],localOrder', results: 'commandId', outbox: 'commandId,status', reviews: 'id,commandId,status' });
    const installation = { key: 'installation', businessId: id(), datasetEpoch: id(), deviceId: id(), sequence: '2', localOrder: 2, schemaVersion: 1 };
    const oldProduct: Product = { ...productFields('Anterior', 3000), id: id(), version: 1, createdBy: id(), lastCommandId: id() };
    await old.table('metadata').add(installation); await old.table('products').add(oldProduct);
    const created: Command = { type: 'CreateProduct', payload: { productId: oldProduct.id, fields: productFields('Anterior', 3000) }, id: oldProduct.createdBy, dependencies: [], contractVersion: 1, registeredAt: '2026-10-10T06:00:00Z' };
    oldProduct.lastCommandId = created.id; await old.table('products').put(oldProduct);
    const line = { id: id(), productId: oldProduct.id, quantity: 6, totalCost: 125000, presentation: 'fardo x6' };
    const received: Command = { type: 'ReceivePurchase', payload: { receiptId: id(), lines: [line] }, id: id(), dependencies: [created.id], contractVersion: 1, registeredAt: created.registeredAt };
    for (const [index, command] of [created, received].entries()) {
      const hash = await commandHash(command), deviceSeq = String(index + 1);
      await old.table('commands').add({ ...command, hash, deviceId: installation.deviceId, businessId: installation.businessId, datasetEpoch: installation.datasetEpoch, deviceSeq, localOrder: index + 1 });
      await old.table('results').add({ commandId: command.id, hash, entityId: command.type === 'CreateProduct' ? oldProduct.id : received.payload.receiptId, status: 'local_only', reviewIds: [] });
      await old.table('outbox').add({ commandId: command.id, status: 'awaiting_backend', deviceSeq, attempts: 0 });
    }
    await old.table('receipts').add({ id: received.payload.receiptId, commandId: received.id, lines: [line], total: 125000, registeredAt: received.registeredAt, businessDate: '2026-10-09' });
    await old.table('lots').add({ id: line.id, productId: oldProduct.id, quantity: 6, available: 6, unitCost: rational(125000n, 6n), order: 2, sourceCommand: received.id, registeredAt: received.registeredAt });
    await old.table('stockEntries').add({ id: line.id, commandId: received.id, productId: oldProduct.id, delta: 6, reason: 'receipt', registeredAt: received.registeredAt });
    await old.table('cashEntries').add({ id: received.id, commandId: received.id, amount: -125000, reason: 'purchase', registeredAt: received.registeredAt });
    await old.table('drafts').add({ id: id(), commandId: id(), saleId: id(), version: 1, lines: [], received: null, consumedBy: null, submission: null, updatedAt: received.registeredAt });
    const preserved = Object.fromEntries(await Promise.all(old.tables.map(async table => [table.name, await table.toArray()])));
    old.close(); db = new LocalDatabase(name); service = new LocalService(db); await db.open();
    for (const [table, records] of Object.entries(preserved)) if (table !== 'metadata') expect(await db.table(table).toArray()).toEqual(records);
    expect(await db.metadata.get('installation')).toEqual({ ...installation, schemaVersion: 3 });
    expect((await service.snapshot()).writeIntent).toBeNull(); expect(db.verno).toBe(3);
  });
});
