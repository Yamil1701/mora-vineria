import { stockAlert } from '../domain/stock';
import { businessDate, addCost, profit, rational, roundCost, sum } from '../domain/rules';
import type { Product, Sale, StockEntry } from '../domain/types';
export type Period = 'Hoy' | 'Semana' | 'Mes';
export type SortOrder = 'nombre' | 'precioAsc' | 'precioDesc' | 'stock';
/** View projections only. FIFO and transactional business effects stay in LocalService. */
export function stockMap(entries: StockEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of entries) totals.set(e.productId, sum([totals.get(e.productId) ?? 0, e.delta]));
  return totals;
}
export function catalog(products: Product[], stock: (id: string) => number, query: string, category: string, lowOnly: boolean, sort: SortOrder) {
  const search = query.trim().toLocaleLowerCase('es-AR');
  return products.filter(p => (category === 'Todos' || p.category === category) && `${p.name} ${p.variant} ${p.category}`.toLocaleLowerCase('es-AR').includes(search) && (!lowOnly || stockAlert(stock(p.id), p.objective).needsReplenishment)).sort((a, b) => sort === 'precioAsc' ? a.price - b.price : sort === 'precioDesc' ? b.price - a.price : sort === 'stock' ? stock(a.id) - stock(b.id) : a.name.localeCompare(b.name, 'es-AR'));
}
function shift(day: string, offset: number) { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); }
export function report(all: Sale[], today: string, period: Period) {
  const start = period === 'Hoy' ? today : period === 'Semana' ? shift(today, -6) : `${today.slice(0, 7)}-01`;
  const sales = all.filter(s => s.businessDate >= start && s.businessDate <= today);
  const costed = sales.filter(s => s.cost !== null);
  const knownProfit = roundCost(costed.reduce((n, s) => addCost(n, profit(s.total, s.cost!)), rational(0n)));
  const days = [];
  for (let day = start; day <= today; day = shift(day, 1)) days.push({ day, total: sum(sales.filter(s => s.businessDate === day).map(s => s.total)) });
  const top = new Map<string, { id: string; name: string; units: number; total: number }>();
  for (const s of sales) for (const l of s.lines) {
    const prior = top.get(l.productId);
    top.set(l.productId, { id: l.productId, name: l.name, units: sum([prior?.units ?? 0, l.quantity]), total: sum([prior?.total ?? 0, l.quantity * l.unitPrice]) });
  }
  return { sales, total: sum(sales.map(s => s.total)), gain: costed.length === sales.length ? knownProfit : null, knownProfit, coverage: `${costed.length} de ${sales.length} ventas con costo completo`, days, top: [...top.values()].sort((a, b) => b.units - a.units), start };
}

/** Cash flows and commercial performance have separate origins; purchases are not expensed twice. */
export function movementReport(allSales:Sale[],cashEntries:import('../domain/types').CashEntry[],counts:import('../domain/types').StockCount[],today:string,period:Period){
 const base=report(allSales,today,period),inPeriod=(date:string)=>date>=base.start&&date<=today;
 const cash=cashEntries.filter(e=>inPeriod(businessDate(e.registeredAt)));
 const expense=sum(cash.filter(e=>e.reason==='expense').map(e=>-e.amount)),contribution=sum(cash.filter(e=>e.reason==='contribution').map(e=>e.amount)),purchases=sum(cash.filter(e=>e.reason==='purchase').map(e=>-e.amount));
 const costed=base.sales.filter(s=>s.cost!==null),soldCost=costed.reduce((n,s)=>addCost(n,s.cost!),rational(0n));
 const decreases=counts.filter(c=>inPeriod(c.businessDate)&&c.removedUnits>0),knownDecreases=decreases.filter(c=>c.cost!==null);
 const removedCost=knownDecreases.reduce((n,c)=>addCost(n,c.cost!),rational(0n)),complete=costed.length===base.sales.length&&knownDecreases.length===decreases.length;
 const net=complete?roundCost(profit(sum([base.total,-expense]),addCost(soldCost,removedCost))):null;
 return {expense,contribution,purchases,variation:sum(cash.map(e=>e.amount)),soldCost:costed.length===base.sales.length?roundCost(soldCost):null,knownSoldCost:roundCost(soldCost),removedCost:knownDecreases.length===decreases.length?roundCost(removedCost):null,unknownDecreases:decreases.length-knownDecreases.length,net};
}
