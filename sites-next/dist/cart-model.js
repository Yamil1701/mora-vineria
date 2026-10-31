// A catalogue price is selected once; costs never take part in this model.
export function freezeCartPrices(data) {
  data.cartPrices ||= {};
  for (const id of Object.keys(data.cart)) {
    if (!data.cartPrices[id]) {
      const price = data.products.find(p => p.id === id)?.price;
      data.cartPrices[id] = {catalogPriceAtAdd: price, appliedUnitPrice: price};
    }
  }
  for (const id of Object.keys(data.cartPrices)) if (!data.cart[id]) delete data.cartPrices[id];
  return data.cartPrices;
}
export const cartPrice = (data, id) => freezeCartPrices(data)[id]?.appliedUnitPrice;
export const cartTotal = data => Object.entries(data.cart).reduce((n, [id, qty]) => n + qty * cartPrice(data, id), 0);
export function setCartPrice(data, id, price) {
  if (!data.cart[id] || !Number.isSafeInteger(price) || price < 1 || price > 999999999) throw Error('Revisá el precio de esta venta.');
  freezeCartPrices(data)[id].appliedUnitPrice = price;
}
export const productIdentity = p => [p.variety, p.size].filter(Boolean).join(' · ');
export const productSearch = p => `${p.name} ${p.variety} ${p.size} ${p.barcode || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
