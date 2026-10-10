import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalDatabase } from './database';
import { draftLine, LocalService, productFields } from './service';
import type { Command, Product, SaleLine } from '../domain/types';
import { rational } from '../domain/rules';
let db: LocalDatabase, service: LocalService;
const id = () => crypto.randomUUID();
const time = '2026-10-10T06:00:00Z';
async function create(price = 3500): Promise<Product> {
  const productId = id(); await service.execute(await service.prepare({ type: 'CreateProduct', payload: { productId, fields: productFields('Cerveza', price, 24) } }));
  return (await db.products.get(productId))!;
}
async function receive(p: Product, quantity: number, totalCost: number) {
  const c = await service.prepare({ type: 'ReceivePurchase', payload: { receiptId: id(), lines: [{ id: id(), productId: p.id, quantity, totalCost, presentation: 'fardo' }] } }); await service.execute(c); return c;
}
async function sale(p: Product, quantity = 1, price = p.price): Promise<Command> {
  const line: SaleLine = { ...draftLine(p), quantity, unitPrice: price };
  return service.prepare({ type: 'RecordSale', payload: { saleId: id(), lines: [line], received: price * quantity, draftId: null, draftVersion: null } }, { registeredAt: time });
}
beforeEach(() => { db = new LocalDatabase(`mora-v2:test:${id()}`); service = new LocalService(db); });
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });
describe('Dexie transactional local core', () => {
  it('starts empty with stable installation and independent namespace', async () => {
    const [a, b] = await Promise.all([service.initialize(), service.initialize()]); expect(a).toEqual(b);
    expect((await service.snapshot()).products).toEqual([]); expect(await db.outbox.count()).toBe(0);
    expect(() => new LocalDatabase('mora-v1')).toThrow();
  });
  it('product CAS edit does not erase history or change charged prices', async () => {
    const p = await create(); await receive(p, 2, 4000); await service.execute(await sale(p));
    const edit = await service.prepare({ type: 'EditProduct', payload: { productId: p.id, expectedVersion: 1, fields: { ...productFields('Cerveza nueva', 4000), active: false } } });
    await service.execute(edit); expect((await db.sales.toArray())[0].lines[0].unitPrice).toBe(3500);
    const stale = await service.prepare({ type: 'EditProduct', payload: { ...edit.payload as {productId: string; expectedVersion: number; fields: ReturnType<typeof productFields>}, expectedVersion: 1 } });
    await expect(service.execute(stale)).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(await db.sales.count()).toBe(1); expect((await db.products.get(p.id))!.active).toBe(false);
  });
  it('opening stock is unknown or exact, creates no cash and cannot run twice', async () => {
    const p = await create(); const c = await service.prepare({ type: 'RecordOpeningStock', payload: { productId: p.id, quantity: 2, totalCost: null } });
    await service.execute(c); expect(await db.cashEntries.count()).toBe(0);
    await service.execute(await sale(p)); expect((await db.sales.toArray())[0].cost).toBeNull();
    const again = await service.prepare({ type: 'RecordOpeningStock', payload: { productId: p.id, quantity: 1, totalCost: 2000 } });
    await expect(service.execute(again)).rejects.toMatchObject({ code: 'OPENING_ALREADY_EXISTS' });
  });
  it('partial receipts and cash sale cross FIFO; jornada and change persist', async () => {
    const p = await create(4000); await receive(p, 2, 4000); await receive(p, 3, 7500);
    const c = await sale(p, 4); if (c.type !== 'RecordSale') throw new Error(); c.payload.received = 20000;
    await service.execute(c); const s = (await db.sales.toArray())[0];
    expect(s.cost).toEqual(rational(9000n)); expect(s.total).toBe(16000); expect(s.change).toBe(4000); expect(s.businessDate).toBe('2026-10-09');
    expect((await db.stockEntries.toArray()).reduce((a, e) => a + e.delta, 0)).toBe(1);
    expect((await db.cashEntries.toArray()).reduce((a, e) => a + e.amount, 0)).toBe(4500);
    expect(await db.receipts.count()).toBe(2); expect((await db.products.get(p.id))!.price).toBe(4000);
  });
  it('100 concurrent retries across two connections produce one sale/effect and stable result', async () => {
    const p = await create(); await receive(p, 1, 2000); const c = await sale(p);
    const db2 = new LocalDatabase(db.name), service2 = new LocalService(db2);
    try {
      const results = await Promise.all(Array.from({ length: 100 }, (_, i) => (i % 2 ? service : service2).execute(c)));
      expect(results.every(r => r.hash === results[0].hash)).toBe(true); expect(await db.sales.count()).toBe(1);
      expect(await db.stockEntries.count()).toBe(2); expect(await db.cashEntries.count()).toBe(2); expect(await db.outbox.count()).toBe(3);
      const changed = structuredClone(c); if (changed.type === 'RecordSale') changed.payload.lines[0].unitPrice = 3000;
      await expect(service.execute(changed)).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    } finally { db2.close(); }
  });
  it('two physical sales exceeding recorded stock both persist with explicit cost review', async () => {
    const p = await create(); await receive(p, 1, 2000);
    const [a, b] = await Promise.all([sale(p), sale(p)]); await Promise.all([service.execute(a), service.execute(b)]);
    expect(await db.sales.count()).toBe(2); expect((await db.lots.toArray())[0].available).toBe(0);
    expect((await db.sales.toArray()).filter(s => s.cost === null)).toHaveLength(1);
    expect((await db.stockEntries.toArray()).reduce((s, e) => s + e.delta, 0)).toBe(-1);
    expect(await db.reviews.count()).toBe(2);
  });
  it('reopening IndexedDB recovers drafts, payloads, journal, results and unsent outbox', async () => {
    const p = await create(); await receive(p, 2, 4000);
    let d = await service.newDraft(); d = await service.saveDraft({ ...d, lines: [draftLine(p)], received: 5000 });
    const name = db.name; db.close(); db = new LocalDatabase(name); service = new LocalService(db);
    expect((await db.drafts.get(d.id))!.lines).toEqual(d.lines);
    await service.checkoutDraft(d.id); const result = await service.checkoutDraft(d.id);
    db.close(); db = new LocalDatabase(name); service = new LocalService(db);
    expect(await db.sales.count()).toBe(1); expect(await db.outbox.count()).toBe(3);
    expect(await service.checkoutDraft(d.id)).toEqual(result); expect((await db.sales.toArray())[0].received).toBe(5000);
  });
  it('two checkouts of the same draft share frozen command; no duplicate from double-click', async () => {
    const p = await create(); let d = await service.newDraft(); d = await service.saveDraft({ ...d, lines: [draftLine(p)] });
    const r = await Promise.all([service.checkoutDraft(d.id), service.checkoutDraft(d.id)]);
    expect(r[0]).toEqual(r[1]); expect(await db.sales.count()).toBe(1);
    await expect(service.saveDraft(d)).rejects.toMatchObject({ code: 'DRAFT_CONFLICT' });
  });
  for (const stage of ['lots', 'stockEntries', 'cashEntries', 'sales', 'commands', 'results', 'outbox', 'metadata'] as const) {
    it(`rolls back all sale effects when ${stage} write fails, then retries frozen draft`, async () => {
      const p = await create(); await receive(p, 2, 4000);
      let d = await service.newDraft(); d = await service.saveDraft({ ...d, lines: [draftLine(p)] });
      const before = await service.snapshot(), originalMeta = await db.metadata.get('installation');
      // For lots use bulkPut; metadata put includes initialize's get-only path after first setup.
      const table = db[stage]; const method = stage === 'lots' ? 'bulkPut' : stage === 'metadata' ? 'put' : 'add';
      const spy = vi.spyOn(table, method).mockRejectedValueOnce(new DOMException('storage full', 'QuotaExceededError'));
      await expect(service.checkoutDraft(d.id)).rejects.toThrow(); spy.mockRestore();
      const after = await service.snapshot();
      expect(after.lots).toEqual(before.lots); expect(after.stockEntries).toEqual(before.stockEntries); expect(after.cashEntries).toEqual(before.cashEntries);
      expect(after.sales).toEqual(before.sales); expect(after.pending).toBe(before.pending); expect(after.reviews).toEqual(before.reviews);
      expect(await db.metadata.get('installation')).toEqual(originalMeta); expect((await db.drafts.get(d.id))!.consumedBy).toBeNull();
      expect((await db.drafts.get(d.id))!.submission).not.toBeNull();
      await service.checkoutDraft(d.id); expect(await db.sales.count()).toBe(1);
    });
  }
  it('recovery after failure can reopen uncommitted draft; committed cannot reopen', async () => {
    const p = await create(); let d = await service.newDraft(); d = await service.saveDraft({ ...d, lines: [draftLine(p)] });
    const spy = vi.spyOn(db.outbox, 'add').mockRejectedValueOnce(new Error('disk'));
    await expect(service.checkoutDraft(d.id)).rejects.toThrow(); spy.mockRestore(); await service.reopenDraft(d.id);
    expect((await db.drafts.get(d.id))!.submission).toBeNull(); await service.checkoutDraft(d.id);
    await expect(service.reopenDraft(d.id)).rejects.toThrow();
  });
  it('short cash, missing product, empty sale and missing dependency have no business effects', async () => {
    const p = await create(), c = await sale(p); if (c.type !== 'RecordSale') throw new Error();
    const before = await service.snapshot(); c.payload.received = 1; await expect(service.execute(c)).rejects.toThrow();
    c.payload.received = 3500; c.payload.lines[0].productId = id(); await expect(service.execute(c)).rejects.toThrow();
    c.payload.lines[0].productId = p.id; c.dependencies = [id()]; await expect(service.execute(c)).rejects.toThrow();
    expect(await service.snapshot()).toEqual(before);
  });
  it('concurrent draft edits use version checks and do not lose saved edits', async () => {
    const p = await create(), d = await service.newDraft();
    const edits = await Promise.allSettled([service.saveDraft({ ...d, lines: [draftLine(p)] }), service.saveDraft({ ...d, received: 5000 })]);
    expect(edits.filter(r => r.status === 'fulfilled')).toHaveLength(1); expect((await db.drafts.get(d.id))!.version).toBe(2);
  });
  it('new receipt never silently costs an earlier unallocated sale', async () => {
    const p = await create(); await service.execute(await sale(p)); await receive(p, 3, 6000);
    expect((await db.sales.toArray())[0].cost).toBeNull(); expect(await db.reviews.count()).toBe(2);
  });
  it('50 offline sales recover unchanged with durable outbox and unique device sequence', async () => {
    const p = await create(); await receive(p, 50, 100000);
    for (let i = 0; i < 50; i++) await service.execute(await sale(p));
    const original = await db.commands.toArray(), name = db.name;
    db.close(); db = new LocalDatabase(name); service = new LocalService(db);
    expect(await db.sales.count()).toBe(50); expect(await db.outbox.count()).toBe(52);
    expect(await db.commands.toArray()).toEqual(original);
    expect(new Set(original.map(c => c.deviceSeq)).size).toBe(52);
    expect((await db.lots.toArray())[0].available).toBe(0);
  });
  it('a receipt is idempotent, does not double pay, and its failure rolls back lot and stock', async () => {
    const p = await create(); const command = await service.prepare({ type: 'ReceivePurchase', payload: { receiptId: id(), lines: [{ id: id(), productId: p.id, quantity: 6, totalCost: 125000, presentation: 'fardo x6' }] } });
    const spy = vi.spyOn(db.cashEntries, 'add').mockRejectedValueOnce(new Error('disk'));
    await expect(service.execute(command)).rejects.toThrow(); spy.mockRestore();
    expect(await db.lots.count()).toBe(0); expect(await db.stockEntries.count()).toBe(0); expect(await db.receipts.count()).toBe(0);
    await service.execute(command); await service.execute(command);
    expect(await db.receipts.count()).toBe(1); expect(await db.cashEntries.count()).toBe(1);
    expect((await db.lots.toArray())[0].unitCost).toEqual(rational(125000n, 6n));
  });
  it('multiple lines of the same product consume updated lots and preserve coverage', async () => {
    const p = await create(); await receive(p, 2, 4000);
    const a = draftLine(p), b = draftLine(p);
    const c = await service.prepare({ type: 'RecordSale', payload: { saleId: id(), lines: [a, b], received: null, draftId: null, draftVersion: null } });
    await service.execute(c);
    expect((await db.sales.toArray())[0].cost).toEqual(rational(4000n)); expect((await db.lots.toArray())[0].available).toBe(0);
  });

});
