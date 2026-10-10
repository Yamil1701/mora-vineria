import { allocateFifo, rational, signed, sum } from './rules';
import type { Lot } from './types';
/** Reconciles present lot availability; historical sale allocations are never touched. */
export function planCount(lots: Lot[], before: number, counted: number) {
  const lotUnitsBefore=sum(lots.map(l=>l.available));
  const removedUnits=Math.max(0,signed(lotUnitsBefore-counted)), addedUnits=Math.max(0,signed(counted-lotUnitsBefore));
  const fifo=removedUnits ? allocateFifo(lots,removedUnits) : {allocations:[],updates:[],cost:rational(0n)};
  const inconsistent=lotUnitsBefore!==Math.max(0,before);
  return {delta:signed(counted-before),lotUnitsBefore,removedUnits,addedUnits,allocations:fifo.allocations,updates:fifo.updates,cost:inconsistent || addedUnits>0 ? null : fifo.cost,inconsistent};
}
