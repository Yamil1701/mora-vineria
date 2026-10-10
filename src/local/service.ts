import { allocateFifo, businessDate, commandHash, fail, rational, saleTotal, signed, sum, text, uuid, roundCost, validateFields, validateLines, whole, addCost } from '../domain/rules';
import type { Command, CostedLine, Draft, Installation, LocalResult, Operation, Product, Rational, Sale, SaleLine } from '../domain/types';
import { LocalDatabase } from './database';
export class LocalService {
  constructor(public db: LocalDatabase) {}
  async initialize(): Promise<Installation> {
    const candidate: Installation = { key: 'installation', businessId: crypto.randomUUID(), datasetEpoch: crypto.randomUUID(), deviceId: crypto.randomUUID(), sequence: '0', localOrder: 0, schemaVersion: 1 };
    return this.db.transaction('rw', this.db.metadata, async () => {
      const existing = await this.db.metadata.get('installation');
      if (existing) return existing;
      await this.db.metadata.add(candidate); return candidate;
    });
  }
  async prepare(operation: Operation, options: { id?: string; registeredAt?: string } = {}): Promise<Command> {
    const ids = 'productId' in operation.payload ? [operation.payload.productId] : operation.payload.lines.map(l => l.productId);
    const products = await this.db.products.bulkGet(ids);
    return { ...structuredClone(operation), id: options.id ?? crypto.randomUUID(), registeredAt: options.registeredAt ?? new Date().toISOString(), contractVersion: 1,
      dependencies: [...new Set(products.filter((p): p is Product => !!p).map(p => p.lastCommandId))] };
  }
  /** Immutable command + all effects + result + outbox are committed together. No network or crypto in rw. */
  async execute(input: Command): Promise<LocalResult> {
    const c = structuredClone(input), hash = await commandHash(c);
    const reviewKeys = new Map(c.type === 'RecordSale' ? c.payload.lines.map(l => [l.id, { stock: crypto.randomUUID(), cost: crypto.randomUUID() }]) : []);
    await this.initialize();
    return this.db.transaction('rw', this.db.tables, async () => {
      const prior = await this.db.results.get(c.id);
      if (prior) { if (prior.hash !== hash) fail('IDEMPOTENCY_KEY_REUSED', 'Esta operación ya existe con otros datos.'); return prior; }
      const meta = (await this.db.metadata.get('installation'))!;
      for (const dependency of c.dependencies) if (!(await this.db.results.get(dependency))) fail('MISSING_DEPENDENCY', 'Hay una operación anterior que falta guardar.');
      const nextOrder = signed(meta.localOrder + 1), sequence = String(BigInt(meta.sequence) + 1n);
      const reviewIds: string[] = [];
      let entityId: string;
      const product = async (id: string): Promise<Product> => {
        const p = await this.db.products.get(id); if (!p) fail('PRODUCT_NOT_FOUND', 'El producto no existe en este espacio local.'); return p;
      };
      const stock = async (productId: string, delta: number, reason: 'opening' | 'receipt' | 'sale', id: string) => {
        signed(sum((await this.db.stockEntries.where('productId').equals(productId).toArray()).map(e => e.delta)) + delta);
        await this.db.stockEntries.add({ id, commandId: c.id, productId, delta, reason, registeredAt: c.registeredAt });
      };
      const cash = async (amount: number, reason: 'purchase' | 'sale') => {
        signed(sum((await this.db.cashEntries.toArray()).map(e => e.amount)) + amount);
        await this.db.cashEntries.add({ id: c.id, commandId: c.id, amount, reason, registeredAt: c.registeredAt });
      };
      switch (c.type) {
        case 'CreateProduct': {
          const { productId, fields } = c.payload; entityId = productId;
          if (await this.db.products.get(productId)) fail('PRODUCT_EXISTS', 'Este producto ya existe.');
          await this.db.products.add({ ...fields, name: fields.name.trim(), variant: fields.variant.trim(), category: fields.category.trim(), id: productId, version: 1, createdBy: c.id, lastCommandId: c.id }); break;
        }
        case 'EditProduct': {
          const { productId, expectedVersion, fields } = c.payload; entityId = productId;
          const p = await product(productId);
          if (p.version !== expectedVersion) fail('VERSION_CONFLICT', 'El producto cambió en otra pestaña. Volvé a abrirlo antes de editar.');
          await this.db.products.put({ ...p, ...fields, name: fields.name.trim(), variant: fields.variant.trim(), category: fields.category.trim(), version: signed(p.version + 1), lastCommandId: c.id }); break;
        }
        case 'RecordOpeningStock': {
          const { productId, quantity, totalCost } = c.payload; entityId = c.id; await product(productId);
          if (await this.db.stockEntries.where('productId').equals(productId).count()) fail('OPENING_ALREADY_EXISTS', 'La carga inicial solo se admite antes de cualquier movimiento de este producto.');
          await this.db.lots.add({ id: c.id, productId, quantity, available: quantity, unitCost: totalCost === null ? null : rational(BigInt(totalCost), BigInt(quantity)), order: nextOrder, sourceCommand: c.id, registeredAt: c.registeredAt });
          await stock(productId, quantity, 'opening', c.id); break;
        }
        case 'ReceivePurchase': {
          const { receiptId, lines } = c.payload; entityId = receiptId;
          if (await this.db.receipts.get(receiptId)) fail('RECEIPT_EXISTS', 'Esta recepción ya fue registrada.');
          for (const line of lines) {
            await product(line.productId);
            await this.db.lots.add({ id: line.id, productId: line.productId, quantity: line.quantity, available: line.quantity, unitCost: rational(BigInt(line.totalCost), BigInt(line.quantity)), order: nextOrder, sourceCommand: c.id, registeredAt: c.registeredAt });
            await stock(line.productId, line.quantity, 'receipt', line.id);
          }
          const total = sum(lines.map(l => l.totalCost));
          await cash(-total, 'purchase');
          await this.db.receipts.add({ id: receiptId, commandId: c.id, lines, total, registeredAt: c.registeredAt, businessDate: businessDate(c.registeredAt) }); break;
        }
        case 'RecordSale': {
          const { saleId, lines, received, draftId, draftVersion } = c.payload; entityId = saleId;
          if (await this.db.sales.get(saleId)) fail('SALE_EXISTS', 'Esta venta ya fue registrada.');
          if (draftId !== null) {
            const draft = await this.db.drafts.get(draftId);
            if (!draft || draft.version !== draftVersion || draft.consumedBy || draft.commandId !== c.id || !draft.submission || JSON.stringify(draft.submission) !== JSON.stringify(c)) fail('DRAFT_CONFLICT', 'El borrador cambió. Revisalo antes de cobrar.');
          }
          const costed: CostedLine[] = []; let cost: Rational | null = rational(0n);
          for (const line of lines) {
            await product(line.productId); // inactivation after draft does not erase a physical sale
            const allocation = allocateFifo(await this.db.lots.where('productId').equals(line.productId).toArray(), line.quantity);
            await this.db.lots.bulkPut(allocation.updates);
            await stock(line.productId, -line.quantity, 'sale', line.id);
            const current = sum((await this.db.stockEntries.where('productId').equals(line.productId).toArray()).map(e => e.delta));
            if (allocation.missingUnits || current < 0) {
              const id = reviewKeys.get(line.id)!.stock; reviewIds.push(id);
              await this.db.reviews.add({ id, commandId: c.id, productId: line.productId, kind: 'stock_difference', detail: `Stock registrado ${current}; ${allocation.missingUnits} unidades sin lote asignado.`, status: 'open' });
            }
            if (allocation.cost === null) {
              const id = reviewKeys.get(line.id)!.cost; reviewIds.push(id);
              await this.db.reviews.add({ id, commandId: c.id, productId: line.productId, kind: 'unknown_cost', detail: 'El costo no se puede calcular completamente. No se asumió costo cero.', status: 'open' });
            }
            costed.push({ ...line, allocations: allocation.allocations, missingUnits: allocation.missingUnits, cost: allocation.cost });
            cost = cost === null || allocation.cost === null ? null : addCost(cost, allocation.cost);
          }
          const total = saleTotal(lines);
          const history = await this.db.sales.toArray();
          sum([...history.map(s => s.total), total]);
          if (cost !== null) {
            const historicalCost = history.reduce((value, s) => s.cost === null ? value : addCost(value, s.cost), rational(0n));
            roundCost(addCost(historicalCost, cost));
          }
          await cash(total, 'sale');
          const sale: Sale = { id: saleId, commandId: c.id, registeredAt: c.registeredAt, businessDate: businessDate(c.registeredAt), lines: costed, total, received, change: received === null ? null : received - total, cost, status: 'local_only', reviewIds };
          await this.db.sales.add(sale);
          if (draftId !== null) await this.db.drafts.update(draftId, { consumedBy: c.id });
          break;
        }
      }
      const result: LocalResult = { commandId: c.id, hash, entityId, status: 'local_only', reviewIds };
      await this.db.commands.add({ ...c, hash, deviceId: meta.deviceId, deviceSeq: sequence, businessId: meta.businessId, datasetEpoch: meta.datasetEpoch, localOrder: nextOrder });
      await this.db.results.add(result);
      await this.db.outbox.add({ commandId: c.id, status: 'awaiting_backend', deviceSeq: sequence, attempts: 0 });
      await this.db.metadata.put({ ...meta, sequence, localOrder: nextOrder });
      return result;
    });
  }
  async newDraft(): Promise<Draft> {
    const draft: Draft = { id: crypto.randomUUID(), commandId: crypto.randomUUID(), saleId: crypto.randomUUID(), version: 1, lines: [], received: null, consumedBy: null, submission: null, updatedAt: new Date().toISOString() };
    await this.db.drafts.add(draft); return draft;
  }
  async activeDraft(): Promise<Draft> {
    const candidate: Draft = { id: crypto.randomUUID(), commandId: crypto.randomUUID(), saleId: crypto.randomUUID(), version: 1, lines: [], received: null, consumedBy: null, submission: null, updatedAt: new Date().toISOString() };
    return this.db.transaction('rw', this.db.drafts, async () => {
      const existing = (await this.db.drafts.toArray()).find(d => !d.consumedBy);
      if (existing) return existing;
      await this.db.drafts.add(candidate); return candidate;
    });
  }
  async saveDraft(input: Draft): Promise<Draft> {
    const d = structuredClone(input); uuid(d.id); whole(d.version, 'Versión', true);
    if (d.lines.length) validateLines(d.lines);
    if (d.received !== null) whole(d.received, 'Recibido');
    const now = new Date().toISOString();
    return this.db.transaction('rw', this.db.drafts, async () => {
      const stored = await this.db.drafts.get(d.id);
      if (!stored || stored.version !== d.version || stored.consumedBy || stored.submission) fail('DRAFT_CONFLICT', 'El borrador cambió o ya se cobró. Volvé a abrirlo.');
      const next = { ...stored, lines: d.lines, received: d.received, version: signed(stored.version + 1), updatedAt: now };
      await this.db.drafts.put(next); return next;
    });
  }
  /** Freeze the exact command first; a reload after an uncertain outcome retries that same ID/hash. */
  async checkoutDraft(id: string): Promise<LocalResult> {
    const draft = await this.db.drafts.get(id); if (!draft) fail('DRAFT_NOT_FOUND', 'No se encontró la venta en preparación.');
    if (draft.consumedBy) {
      const result = await this.db.results.get(draft.consumedBy);
      if (!result) fail('INCOMPLETE_LOCAL_DATA', 'Falta el resultado de una venta guardada. Conservá los datos para revisarlos.');
      return result;
    }
    const candidate = draft.submission ?? await this.prepare({ type: 'RecordSale', payload: { saleId: draft.saleId, lines: draft.lines, received: draft.received, draftId: draft.id, draftVersion: draft.version } }, { id: draft.commandId });
    // Validate before sealing, so a short payment remains editable.
    await commandHash(candidate);
    const sealed = await this.db.transaction('rw', this.db.drafts, async () => {
      const current = (await this.db.drafts.get(id))!;
      if (current.consumedBy || current.submission) return current;
      if (current.version !== draft.version) fail('DRAFT_CONFLICT', 'El borrador cambió antes de confirmar.');
      const next = { ...current, submission: candidate }; await this.db.drafts.put(next); return next;
    });
    if (sealed.consumedBy) return (await this.db.results.get(sealed.consumedBy))!;
    return this.execute(sealed.submission!);
  }
  async reopenDraft(id: string): Promise<void> {
    await this.db.transaction('rw', this.db.drafts, this.db.commands, async () => {
      const d = await this.db.drafts.get(id);
      if (!d || d.consumedBy || await this.db.commands.get(d.commandId)) fail('DRAFT_CONFLICT', 'La venta ya se guardó y no se puede reabrir.');
      await this.db.drafts.update(id, { submission: null });
    });
  }
  async snapshot() {
    return this.db.transaction('r', this.db.tables, async () => ({
      products: await this.db.products.toArray(), lots: await this.db.lots.toArray(), sales: await this.db.sales.toArray(), receipts: await this.db.receipts.toArray(),
      stockEntries: await this.db.stockEntries.toArray(), cashEntries: await this.db.cashEntries.toArray(), drafts: await this.db.drafts.toArray(),
      pending: await this.db.outbox.count(), reviews: await this.db.reviews.toArray(),
    }));
  }
}
export function productFields(name: string, price: number, objective: number | null = null) {
  const fields = { name: text(name, 'Nombre', true), variant: '', category: '', price, objective, active: true }; validateFields(fields); return fields;
}
export function draftLine(product: Product): SaleLine {
  return { id: crypto.randomUUID(), productId: product.id, name: product.name, quantity: 1, referencePrice: product.price, unitPrice: product.price };
}
