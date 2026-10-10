export type Rational = { numerator: string; denominator: string };
export type ProductFields = { name: string; variant: string; category: string; price: number; objective: number | null; active: boolean };
export type Product = ProductFields & { id: string; version: number; createdBy: string; lastCommandId: string };
export type SaleLine = { id: string; productId: string; name: string; quantity: number; referencePrice: number; unitPrice: number };
export type PurchaseLine = { id: string; productId: string; quantity: number; totalCost: number; presentation: string; costReason?: string };
export type Lot = { id: string; productId: string; quantity: number; available: number; unitCost: Rational | null; order: number; sourceCommand: string; registeredAt: string };
export type Allocation = { lotId: string; units: number; cost: Rational | null };
export type CostedLine = SaleLine & { allocations: Allocation[]; missingUnits: number; cost: Rational | null };
export type Sale = { id: string; commandId: string; registeredAt: string; businessDate: string; lines: CostedLine[]; total: number; received: number | null; change: number | null; cost: Rational | null; status: 'local_only'; reviewIds: string[] };
export type Review = { id: string; commandId: string; productId: string; kind: 'stock_difference' | 'unknown_cost'; detail: string; status: 'open' };
export type StockEntry = { id: string; commandId: string; productId: string; delta: number; reason: 'opening' | 'receipt' | 'sale' | 'count'; registeredAt: string };
export type CashEntry = { id: string; commandId: string; amount: number; reason: 'purchase' | 'sale' | 'expense' | 'contribution'; registeredAt: string };
export type Receipt = { id: string; commandId: string; lines: PurchaseLine[]; total: number; registeredAt: string; businessDate: string };
export type MoneyMovement = { id: string; commandId: string; kind: 'expense' | 'contribution'; amount: number; concept: string; note: string; registeredAt: string; businessDate: string };
export type StockCount = { id: string; commandId: string; productId: string; before: number; counted: number; delta: number; lotUnitsBefore: number; addedUnits: number; removedUnits: number; allocations: Allocation[]; cost: Rational | null; reason: string; note: string; registeredAt: string; businessDate: string; reviewIds: string[] };
export type Operation =
  | { type: 'RecordExpense' | 'RecordContribution'; payload: { movementId: string; amount: number; concept: string; note: string } }
  | { type: 'RecordStockCount'; payload: { countId: string; productId: string; expectedStock: number; expectedStockCommandId: string | null; counted: number; reason: string; note: string } }
  | { type: 'CreateProduct'; payload: { productId: string; fields: ProductFields } }
  | { type: 'EditProduct'; payload: { productId: string; expectedVersion: number; fields: ProductFields } }
  | { type: 'RecordOpeningStock'; payload: { productId: string; quantity: number; totalCost: number | null; costReason?: string } }
  | { type: 'ReceivePurchase'; payload: { receiptId: string; lines: PurchaseLine[] } }
  | { type: 'RecordSale'; payload: { saleId: string; lines: SaleLine[]; received: number | null; draftId: string | null; draftVersion: number | null } };
export type Command = Operation & { id: string; registeredAt: string; contractVersion: 1 | 2; dependencies: string[] };
export type StoredCommand = Command & { hash: string; deviceId: string; deviceSeq: string; businessId: string; datasetEpoch: string; localOrder: number };
export type LocalResult = { commandId: string; hash: string; entityId: string; status: 'local_only'; reviewIds: string[] };
export type OutboxEntry = { commandId: string; status: 'awaiting_backend'; deviceSeq: string; attempts: 0 };
export type Draft = { id: string; commandId: string; saleId: string; version: number; lines: SaleLine[]; received: number | null; consumedBy: string | null; submission: Command | null; updatedAt: string };
export type Installation = { key: 'installation'; businessId: string; datasetEpoch: string; deviceId: string; sequence: string; localOrder: number; schemaVersion: 1 | 2 | 3 | 4 };

/** One durable confirmation slot for non-sale forms; closed only by explicit acknowledgment. */
export type FormOperation = Exclude<Operation, { type: 'RecordSale' }>;
export type WriteIntent = { id: 'form'; command: Command; status: 'prepared' | 'confirmed' };
