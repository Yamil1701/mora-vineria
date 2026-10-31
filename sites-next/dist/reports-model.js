import {monthLabel} from './display-dates.js';
import {effectiveSale,saleKey,debtRemaining,receiptRemaining,monthlyGoal} from './business-read.js';
import {businessDay} from './operations.js';
const addDays=(day,n)=>{const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+n);return date.toISOString().slice(0,10);};
const validDay=v=>{if(!/^\d{4}-\d\d-\d\d$/.test(v))return false;const t=new Date(v+'T12:00:00Z');return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===v;};
export function reportRange({period='today',month,from,to,now=new Date().toISOString()}={}){
  const today=businessDay(now);
  if(period==='today')return {from:today,to:today,label:'Ventas de hoy'};
  if(period==='week'){const weekday=new Date(today+'T12:00:00Z').getUTCDay();return {from:addDays(today,-((weekday+6)%7)),to:today,label:'Esta semana'};}
  if(period==='month'){const m=month||today.slice(0,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(m))throw Error('Elegí un mes válido.');const [y,n]=m.split('-').map(Number);return {from:m+'-01',to:new Date(Date.UTC(y,n,0,12)).toISOString().slice(0,10),label:monthLabel(m)};}
  if(period==='range'&&validDay(from)&&validDay(to)&&from<=to)return {from,to,label:'Período elegido'};
  throw Error('Revisá las fechas del período.');
}
export function buildReport(d,options={}){
  const range=reportRange(options),within=day=>day>=range.from&&day<=range.to;
  const sales=d.sales.filter(s=>within(s.day)).map(s=>effectiveSale(d,saleKey(s))),ledger=d.ledger.filter(e=>within(e.day)),receipts=d.receipts.filter(r=>within(r.day));
  let sold=0,units=0,costKnown=0,unknownUnits=0,coveredRevenue=0,transferPending=0,debtPending=0;
  const products=new Map(),unresolved=[];
  for(const s of sales){sold+=s.total;units+=s.count;transferPending+=s.parts.filter(p=>!p.verified).reduce((n,p)=>n+p.amount,0);const debt=d.debts.find(v=>v.saleNumber===s.number);if(debt)debtPending+=debtRemaining(d,debt.id);
    for(const i of s.items){const review=d.stockReviews.find(v=>v.saleId===s.originalId&&v.productId===i.id),resolution=review&&d.stockResolutions.find(v=>v.reviewId===review.id),unknown=resolution?0:(i.unknownQty||0),known=(i.knownCostTotal??i.costTotal??0)+(resolution?.totalCost||0);costKnown+=known;unknownUnits+=unknown;coveredRevenue+=i.price*(i.qty-unknown)*(s.subtotal?s.total/s.subtotal:0);if(unknown)unresolved.push({saleNumber:s.number,productId:i.id,name:i.name,qty:unknown});const old=products.get(i.id)||{id:i.id,name:i.name,variety:i.variety,size:i.size,qty:0,sold:0};old.qty+=i.qty;old.sold+=i.price*i.qty;products.set(i.id,old);}
  }
  const money={cash:0,transfer:0,collected:0,expenses:0,purchases:0,contributions:0,withdrawals:0,net:0};
  for(const e of ledger)for(const l of e.legs){money.net+=l.amount;if(['sale','debt-payment','sale-correction'].includes(e.kind)){money.collected+=l.amount;money[l.account==='cash'?'cash':'transfer']+=l.amount;}if(e.kind==='expense')money.expenses-=l.amount;if(['purchase','purchase-payment'].includes(e.kind))money.purchases-=l.amount;if(e.kind==='contribution')money.contributions+=l.amount;if(e.kind==='withdrawal')money.withdrawals-=l.amount;}
  const month=range.from.slice(0,7),goal=monthlyGoal(d,month);
  const saleIds=new Set(sales.map(s=>s.originalId)),laterCorrections=d.saleCorrections.filter(c=>c.status==='applied'&&saleIds.has(c.saleId)&&c.day>range.to);
  return {laterCorrections,range,sales:sales.length,sold,units,average:sales.length?sold/sales.length:null,money,transferPending,debtPending,pending:transferPending+debtPending,costKnown,unknownUnits,coveredUnits:units-unknownUnits,costComplete:unknownUnits===0,gross:unknownUnits?null:sold-costKnown,coveredGross:coveredRevenue-costKnown,products:[...products.values()].sort((a,b)=>b.qty-a.qty||a.name.localeCompare(b.name)),unresolved,received:receipts.reduce((n,r)=>n+r.total,0),receiptPending:receipts.reduce((n,r)=>n+receiptRemaining(d,r),0),corrections:d.saleCorrections.filter(c=>within(c.day)),goal,goalProgress:goal?sold/goal:null};
}
