/** Fixture exclusively for UI evaluation. Never send to Supabase or count as real stock. */
export type ProductCategory = 'Cervezas' | 'Gaseosas' | 'Vinos' | 'Energizantes' | 'Aperitivos';
export type DemoProduct = {
  id: string;
  name: string;
  detail: string;
  category: ProductCategory;
  price: number;
  stock: number;
  objective: number;
  glyph: string;
};
export type PaymentMethod = 'efectivo' | 'transferencia' | 'mixto' | 'fiado';
export type DemoSale = {
  id: string;
  total: number;
  createdAt: string;
  method: PaymentMethod;
  items: Record<string, number>;
};

export const demoProducts: readonly DemoProduct[] = [
  { id: 'corona', name: 'Corona 355 ml', detail: 'Cerveza · Corona', category: 'Cervezas', price: 4000, stock: 2, objective: 24, glyph: 'Co' },
  { id: 'coca', name: 'Coca-Cola 1,5 L', detail: 'Gaseosa · Coca-Cola', category: 'Gaseosas', price: 3500, stock: 5, objective: 16, glyph: 'Cc' },
  { id: 'stella', name: 'Stella Artois 355 ml', detail: 'Cerveza · Stella', category: 'Cervezas', price: 4000, stock: 4, objective: 24, glyph: 'St' },
  { id: 'fernet', name: 'Fernet Branca 750 ml', detail: 'Aperitivo · Fernet', category: 'Aperitivos', price: 11500, stock: 1, objective: 6, glyph: 'Fb' },
  { id: 'redbull', name: 'Red Bull 250 ml', detail: 'Energizante · Red Bull', category: 'Energizantes', price: 4200, stock: 3, objective: 24, glyph: 'Rb' },
  { id: 'trapiche', name: 'Trapiche Malbec 750 ml', detail: 'Vino · Trapiche', category: 'Vinos', price: 8500, stock: 7, objective: 12, glyph: 'Tr' },
  { id: 'heineken', name: 'Heineken 330 ml', detail: 'Cerveza · Heineken', category: 'Cervezas', price: 4000, stock: 8, objective: 24, glyph: 'He' },
];

/** Already represented in the fixture's stock values; do not subtract twice. */
export const demoStartingSales: readonly DemoSale[] = [
  { id: 'sim-1', total: 24000, method: 'efectivo', createdAt: 'demo', items: {} },
  { id: 'sim-2', total: 21500, method: 'transferencia', createdAt: 'demo', items: {} },
  { id: 'sim-3', total: 23000, method: 'mixto', createdAt: 'demo', items: {} },
];
