
import {monthLabel,dateLabel,rangeLabel} from './display-dates.js';
import {buildReport} from './reports-model.js';
import {monthlyGoal} from './business-read.js';

const weekday=new Intl.DateTimeFormat('es-AR',{weekday:'short',timeZone:'UTC'});
const shortDate=new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'short',timeZone:'UTC'});
const parseDay=day=>new Date(day+'T12:00:00Z');

function reportBars(report,money,esc){
  const start=parseDay(report.range.from),end=parseDay(report.range.to);
  const days=Math.round((end-start)/86400000)+1;
  if(days<2||!report.sales)return '';
  const width=Math.ceil(days/7);
  const bars=Array.from({length:Math.ceil(days/width)},(_,index)=>{
    const date=new Date(start.getTime()+index*width*86400000);
    return {label:(width===1?weekday:shortDate).format(date).replace(/\./g,''),amount:0};
  });
  for(const [day,amount] of report.soldByDay){
    const index=Math.floor((parseDay(day)-start)/86400000/width);
    bars[index].amount+=amount;
  }
  const max=Math.max(1,...bars.map(bar=>bar.amount));
  return `<div class="mora-report-chart" role="img" aria-label="${esc('Importe vendido '+(width===1?'por día':'por tramo del período')+'. '+bars.map(bar=>bar.label+' '+money(bar.amount)).join(', '))}">${bars.map(bar=>`<div><span class="mora-report-bar-track"><span style="--bar:${Math.max(0,bar.amount)/max*100}%"></span></span><small>${esc(bar.label)}</small></div>`).join('')}</div>`;
}

export function createReportsUI(env,workspace){
  const {state,esc,money,icon,go,render,doc,formData}=env;
  const options=()=>({period:state.reportPeriod,month:state.reportMonth,from:state.reportFrom,to:state.reportTo});
  const val=v=>esc(v??'');
  const rows=items=>`<dl class="workflow-summary">${items.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
  const details=(title,html,expanded=false)=>`<details class="workflow-disclosure report-disclosure" ${expanded?'open':''}><summary>${title}${icon('chevron')}</summary><div>${html}</div></details>`;
  const changeRows=corrections=>corrections.map(c=>`<button class="text-btn" data-correction="detail" data-id="${esc(c.id)}">${esc(c.reason)} · ${dateLabel(c.day)}${icon('chevron')}</button>`).join('');
  const salesText=r=>`${r.sales} ${r.sales===1?'venta':'ventas'} · ${r.units} ${r.units===1?'unidad':'unidades'}`;
  const costMessage=r=>r.costComplete?'Ventas menos el costo de lo vendido, antes de gastos.':`${r.unknownUnits} ${r.unknownUnits===1?'unidad con costo pendiente':'unidades con costo pendiente'}. La ganancia total queda pendiente.`;
  function breakdown(r,expanded){
    const costs=r.unresolved.map(u=>`<button class="text-btn" data-sale="${esc(u.saleNumber)}">Venta ${esc(u.saleNumber)} · ${esc(u.name)} · ${u.qty} un. sin costo${icon('chevron')}</button>`).join('');
    return `<section class="report-block"><h2>Ventas y cobros</h2>${rows([['Cobrado en el período',money(r.money.collected)],['Fiado pendiente actual',money(r.debtPending)],['Transferencias por verificar',money(r.transferPending)]])}
      <p class="caption">Los pendientes de estas ventas pueden cambiar con abonos y verificaciones posteriores.</p>
      ${details('Cómo se compone lo cobrado',rows([['Efectivo',money(r.money.cash)],['Transferencias',money(r.money.transfer)],['Ticket promedio',r.average===null?'Sin ventas':money(r.average)]])+'<p class="caption">Incluye abonos y correcciones de dinero de estas fechas.</p>',expanded)}</section>
      <section class="report-block"><h2>Costos y ganancia</h2>${rows([[r.costComplete?'Ganancia estimada':'Ganancia de ventas con costo',money(r.costComplete?r.gross:r.coveredGross)],['Unidades con costo',r.coveredUnits+' de '+r.units],['Costo identificado',money(r.costKnown)]])}<p class="caption">${costMessage(r)}</p>${costs}</section>
      <section class="report-block"><h2>Dinero registrado</h2>${rows([['Variación de dinero',money(r.money.net)],['Gastos pagados',money(r.money.expenses)],['Mercadería pagada',money(r.money.purchases)]])}<p class="caption">La variación corresponde a los movimientos registrados, separados de la ganancia y el saldo bancario.</p>
      ${details('Aportes, retiros y mercadería',rows([['Aportes',money(r.money.contributions)],['Retiros',money(r.money.withdrawals)],['Mercadería recibida',money(r.received)],['Pendiente actual de esas recepciones',money(r.receiptPending)]]),expanded)}</section>
      ${details('Productos vendidos · '+r.products.length,r.products.length?r.products.map(p=>`<div class="report-product"><span><strong>${esc(p.name)}</strong><small>${esc(p.variety+' · '+p.size)}</small></span><b>${p.qty} un.</b></div>`).join(''):'<p class="caption">Sin ventas en el período.</p>',expanded)}
      ${r.laterCorrections.length?`<section class="report-block"><h2>Cambios posteriores al período</h2><p class="caption">Estos cambios ya están reflejados en las ventas de estas fechas.</p>${changeRows(r.laterCorrections)}</section>`:''}
      ${details('Correcciones registradas · '+r.corrections.length,`<p class="caption">${r.corrections.filter(c=>c.status==='applied').length} aplicadas · ${r.corrections.filter(c=>c.status==='review').length} pendientes. El importe comercial corresponde a la jornada de la venta. El dinero corresponde al día del cobro o devolución.</p>${changeRows(r.corrections)}`,expanded)}`;
  }
  function hero(r,chart=false){
    return `<section class="report-hero mora-panel"><span>${icon('chart')} Vendido</span><h2 class="num">${money(r.sold)}</h2><p>${salesText(r)}</p>${chart?reportBars(r,money,esc):''}</section>`;
  }
  function body(r,expanded=false){return hero(r)+breakdown(r,expanded);}
  function reports(){
    let r;
    try{r=buildReport(state,options());}catch(error){return selector()+`<p class="error" role="alert">${esc(error.message)}</p>`;}
    const tile=(label,amount,glyph,tone)=>`<div class="mora-panel mora-report-tile"><span>${icon(glyph)}${label}</span><strong class="num ${tone}">${money(amount)}</strong></div>`;
    return `${selector()}<p class="mora-report-dates">${icon('clock')}${rangeLabel(r.range.from,r.range.to)}</p>${hero(r,true)}
      <div class="mora-report-pair">${tile('Cobrado',r.money.collected,'wallet','')}${tile('Fiado pendiente',r.debtPending,'clock',r.debtPending?'mora-warn':'')}</div>
      ${r.transferPending?`<p class="mora-note mora-warn">Transferencias por verificar <strong>${money(r.transferPending)}</strong></p>`:''}
      <section class="mora-panel mora-report-profit"><span>${r.costComplete?'Ganancia estimada':'Ganancia de ventas con costo'}</span><strong class="num">${money(r.costComplete?r.gross:r.coveredGross)}</strong><p class="caption">${costMessage(r)}</p></section>
      ${state.reportPeriod==='month'?goalSummary(r):''}
      ${details('Ver desglose',breakdown(r,false))}
      <button class="menu-row mora-panel mora-report-print" data-report="print-view">${icon('list')}<span class="grow"><strong>Informe mensual</strong><span class="meta">Vista para imprimir</span></span>${icon('chevron')}</button>`;
  }
  function goalSummary(r){
    return `<section class="mora-panel mora-report-goal"><h2>Meta de ventas del mes</h2>${r.goal?`<p class="report-result"><strong>${money(r.goal)}</strong><span>${Math.round(r.goalProgress*100)} % alcanzado · ${r.sold>=r.goal?'Meta alcanzada':'Faltan '+money(r.goal-r.sold)}</span></p><progress class="goal-progress" aria-label="Avance de la meta" max="100" value="${Math.min(100,r.goalProgress*100)}"></progress>`:'<p class="caption">Todavía no definiste una meta para este mes.</p>'}<button class="text-btn" data-report="goal">${r.goal?'Cambiar meta':'Definir meta'}${icon('chevron')}</button></section>`;
  }
  function selector(){
    return `<div class="report-periods" role="group" aria-label="Período del reporte">${[['today','Hoy'],['week','Semana'],['month','Mes'],['range','Fechas']].map(([k,t])=>`<button data-report="period" data-period="${k}" aria-pressed="${state.reportPeriod===k}">${t}</button>`).join('')}</div>${state.reportPeriod==='month'?`<label class="report-date">Mes<input id="report-month" type="month" value="${val(state.reportMonth)}"></label>`:state.reportPeriod==='range'?`<div class="report-range"><label>Desde<input id="report-from" type="date" value="${val(state.reportFrom)}"></label><label>Hasta<input id="report-to" type="date" value="${val(state.reportTo)}"></label></div>`:''}`;
  }
  function goal(){
    return `<p class="caption">${monthLabel(state.reportMonth)}</p><form id="report-goal-form" class="product-form workflow-form"><label>Meta mensual ($)<input class="mora-amount" name="amount" type="number" inputmode="numeric" min="1" step="1" value="${val(state.workspaceDraft.amount)}"></label><p class="caption">Dejá el importe vacío para quitar la meta de este mes. El historial de cambios se conserva.</p></form>`;
  }
  function print(){
    const r=buildReport(state,{period:'month',month:state.reportMonth});
    return `<article class="monthly-print"><header class="print-heading"><img class="mora-logo-full report-brand-dark" src="assets/brand/mora-vineria.svg" alt="Mora Vinería"><img class="mora-logo-full report-brand-light" src="assets/brand/mora-vineria-light.svg" alt="Mora Vinería"><h1>Informe mensual · ${monthLabel(state.reportMonth)}</h1><p>Registro interno · sin validez fiscal</p></header>${body(r,true)}${rows([['Meta mensual',r.goal?money(r.goal):'Sin definir'],['Avance',r.goal?Math.round(r.goalProgress*100)+' %':'—'],['Falta para la meta',r.goal?money(Math.max(0,r.goal-r.sold)):'—']])}<footer>Generado ${new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Salta',dateStyle:'long',timeStyle:'short'}).format(new Date())}. Información local de este dispositivo.</footer></article>`;
  }
  async function click(b){
    const a=b.dataset.report;
    if(!a)return false;
    if(a==='period'){state.reportPeriod=b.dataset.period;render();doc.querySelector('[data-period="'+b.dataset.period+'"]')?.focus({preventScroll:true});}
    if(a==='goal')workspace.start('monthly-goal',{amount:monthlyGoal(state,state.reportMonth)??''},'reportGoal',state.reportMonth);
    if(a==='save-goal'){
      const f=doc.querySelector('#report-goal-form');
      if(!f.reportValidity())return true;
      const amount=String(formData(f).get('amount')||'').trim();
      await workspace.run('monthly-goal',{month:state.reportMonth,amount:amount?Number(amount):null});
    }
    if(a==='print-view')go('reportPrint');
    if(a==='print')env.print();
    return true;
  }
  function change(e){
    const key={'report-month':'reportMonth','report-from':'reportFrom','report-to':'reportTo'}[e.target.id];
    if(key){if(key==='reportMonth'&&!e.target.value){e.target.value=state[key];return;}state[key]=e.target.value;render();}
    if(e.target.closest?.('#report-goal-form'))state.workspaceDraft.amount=e.target.value;
  }
  function dock(){
    if(state.page==='reportGoal')return '<div class="dock"><button class="btn primary" data-report="save-goal">Guardar meta</button></div>';
    if(state.page==='reportPrint')return '<div class="dock"><button class="btn primary" data-report="print">Imprimir o guardar PDF</button></div>';
    return '';
  }
  return {screens:{reports,reportGoal:goal,reportPrint:print},click,change,dock,body};
}
