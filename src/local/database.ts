import Dexie, { type Table } from 'dexie';
import type { CashEntry, Draft, Installation, LocalResult, Lot, OutboxEntry, Product, Receipt, Review, Sale, StockEntry, StoredCommand, WriteIntent } from '../domain/types';
export const LOCAL_DB_NAME = 'mora-v2:local-workspace:v1:this-browser';
/** Local-only namespace. Never opens V1, demo fixtures, or an official server cache. */
export class LocalDatabase extends Dexie {
  writeIntents!: Table<WriteIntent, string>;
  metadata!: Table<Installation, string>;
  products!: Table<Product, string>;
  lots!: Table<Lot, string>;
  sales!: Table<Sale, string>;
  receipts!: Table<Receipt, string>;
  stockEntries!: Table<StockEntry, string>;
  cashEntries!: Table<CashEntry, string>;
  drafts!: Table<Draft, string>;
  commands!: Table<StoredCommand, string>;
  results!: Table<LocalResult, string>;
  outbox!: Table<OutboxEntry, string>;
  reviews!: Table<Review, string>;
  constructor(name = LOCAL_DB_NAME) {
    if (!name.startsWith('mora-v2:')) throw new Error('Local database requires isolated V2 namespace');
    super(name);
    this.version(1).stores({
      metadata: 'key', products: 'id', lots: 'id,productId,order,sourceCommand', sales: 'id,&commandId,businessDate',
      receipts: 'id,&commandId', stockEntries: 'id,productId,commandId', cashEntries: 'id,commandId',
      drafts: 'id,&commandId', commands: 'id,&[deviceId+deviceSeq],localOrder', results: 'commandId',
      outbox: 'commandId,status', reviews: 'id,commandId,status',
    });
    this.version(2).stores({ writeIntents: 'id' }).upgrade(async tx => {
      await tx.table('metadata').toCollection().modify({ schemaVersion: 2 });
    });
  }
}
