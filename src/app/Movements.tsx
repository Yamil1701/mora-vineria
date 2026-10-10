import {GlassPanel,MoraButton} from '../ui/components';
import {formatArs} from '../ui/format';
import {roundCost} from '../domain/rules';
import type {LocalService} from '../local/service';
import type {MovementKind} from './MovementForms';
type Snapshot=Awaited<ReturnType<LocalService['snapshot']>>;
export function Movements({view,busy,blocked,onOpen,onClose}:{view:Snapshot;busy:boolean;blocked:boolean;onOpen:(kind:MovementKind)=>void;onClose:()=>void}){
 const history=[...view.cashEntries.map(e=>({id:`cash:${e.id}`,at:e.registeredAt,type:'cash' as const,row:e})),...view.stockEntries.map(e=>({id:`stock:${e.id}`,at:e.registeredAt,type:'stock' as const,row:e}))].sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id));
 const [moneyRows,stockRows]=[history.filter(h=>h.type==='cash'),history.filter(h=>h.type==='stock')];
 const labels={sale:'Venta',purchase:'Compra de mercadería',expense:'Gasto puntual',contribution:'Aporte externo',opening:'Stock inicial',receipt:'Recepción',count:'Conteo y ajuste'};
 return <><header className="m2-head m2-subhead"><MoraButton variant="quiet" disabled={busy} onClick={onClose}>Volver a Inicio</MoraButton><h1>Movimientos</h1></header>
 <p className="m2-muted-light">Historial guardado en este equipo. Los importes son movimientos registrados, no un saldo real contado.</p>
 <div className="m2-movement-actions"><MoraButton disabled={blocked} onClick={()=>onOpen('expense')}>Registrar gasto</MoraButton><MoraButton variant="secondary" disabled={blocked} onClick={()=>onOpen('contribution')}>Registrar aporte</MoraButton><MoraButton variant="secondary" disabled={blocked||!view.products.length} onClick={()=>onOpen('count')}>Contar y ajustar stock</MoraButton></div>
 {[{title:'Movimientos de efectivo',rows:moneyRows},{title:'Movimientos de mercadería',rows:stockRows}].map(group=><GlassPanel key={group.title} className="m2-glass"><h2>{group.title}</h2>{!group.rows.length&&<p className="m2-muted-light">Todavía no hay movimientos.</p>}{group.rows.map(h=>{
 const money=view.movements.find(m=>m.commandId===h.row.commandId),count=view.stockCounts.find(c=>c.commandId===h.row.commandId);
 return <details className="m2-operation-history" key={h.id}><summary><span>{labels[h.row.reason]}{money?` · ${money.concept}`:h.type==='stock'?` · ${view.products.find(p=>p.id===h.row.productId)?.name??h.row.productId}`:''}</span><strong>{h.type==='cash'?formatArs(h.row.amount):`${h.row.delta>0?'+':''}${h.row.delta} un.`}</strong></summary>
 <p>{new Date(h.at).toLocaleString('es-AR',{timeZone:'America/Argentina/Salta'})}</p><p className="m2-note">Operación {h.row.commandId}</p>
 {money&&<p>Jornada {money.businessDate} · {money.note||'Sin nota'}</p>}
 {count&&<><p>Jornada {count.businessDate} · {count.reason} · {count.note}</p><p>Anterior {count.before} · Contado {count.counted} · Diferencia {count.delta}</p><p>Lotes: {count.lotUnitsBefore} → {count.counted} · Retiradas {count.removedUnits} · Añadidas {count.addedUnits}</p><p>Valor FIFO retirado: {count.cost===null?'No calculable':formatArs(roundCost(count.cost))}</p>{count.allocations.map(a=><p key={a.lotId}>{a.units} un. del lote {a.lotId.slice(0,8)} · {a.cost===null?'Costo desconocido':formatArs(roundCost(a.cost))}</p>)}{count.reviewIds.length>0&&<p className="m2-operation-error">Revisión de stock/costo pendiente. No se corrigieron ventas históricas.</p>}</>}
 </details>;})}</GlassPanel>)}
 </>;
}
