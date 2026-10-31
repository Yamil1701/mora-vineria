// Acceptance belongs to the exact quantity and recorded availability, not to a product forever.
export function cartShortages(data){
  return Object.entries(data.cart).flatMap(([id,qty])=>{
    const product=data.products.find(p=>p.id===id);
    return product&&qty>product.stock?[{id,qty,stock:product.stock,missing:qty-Math.max(0,product.stock)}]:[];
  });
}
export const shortageKey=row=>`${row.qty}:${row.stock}:${row.missing}`;
export function shortagesAccepted(data){return cartShortages(data).every(row=>data.shortageAccepted?.[row.id]===shortageKey(row));}
export function acceptShortages(data){data.shortageAccepted=Object.fromEntries(cartShortages(data).map(row=>[row.id,shortageKey(row)]));}
