import type { DemoProduct, DemoSale } from './demo-data';

export type Cart = Record<string, number>;

export function updateQuantity(cart: Cart, id: string, quantity: number): Cart {
  if (!Number.isSafeInteger(quantity) || quantity < 0) return cart;
  const next = { ...cart };
  if (quantity === 0) delete next[id];
  else next[id] = quantity;
  return next;
}

export function getCartLines(cart: Cart, products: readonly DemoProduct[]) {
  return products.flatMap(product => {
    const quantity = cart[product.id] ?? 0;
    return quantity > 0 ? [{ product, quantity, lineTotal: product.price * quantity }] : [];
  });
}

export function cartTotal(cart: Cart, products: readonly DemoProduct[]): number {
  return getCartLines(cart, products).reduce((total, line) => total + line.lineTotal, 0);
}

export function cartCount(cart: Cart, products: readonly DemoProduct[]): number {
  return getCartLines(cart, products).reduce((count, line) => count + line.quantity, 0);
}

export function currentStock(product: DemoProduct, sales: readonly DemoSale[]): number {
  const soldInSession = sales.reduce((count, sale) => count + (sale.items[product.id] ?? 0), 0);
  return product.stock - soldInSession;
}

export function demoSalesTotal(sales: readonly DemoSale[]): number {
  return sales.reduce((total, sale) => total + sale.total, 0);
}

/** UI hint only. The actual stock threshold policy is not yet approved. */
export function needsReplenishment(product: DemoProduct, sales: readonly DemoSale[]): boolean {
  return currentStock(product, sales) < product.objective;
}

export function parseWholePesos(value: string): number | null {
  if (!/^\d{1,10}$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}
