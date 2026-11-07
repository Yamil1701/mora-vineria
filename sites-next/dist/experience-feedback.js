import {paymentValid,paymentCashDue} from './money-model.js';
import {money} from './ui-format.js';

// One presentation state for the button, change panel and payment guidance.
// A pending transfer remains permitted by the existing business rules.
export function paymentFeedback({method,total,share,received,customer='',transferVerified=false,allowed=true,blockedMessage=''}){
  const part=paymentCashDue(method,total,share);
  const splitValid=method!=='mixed'||Number.isSafeInteger(part)&&part>0&&part<total;
  const cashValid=splitValid&&(['cash','mixed'].includes(method)?(part===0||received!=='')&&Number(received)>=part:true);
  const canConfirm=allowed&&paymentValid({method,total,share,received,customer});
  let message=blockedMessage;
  if(!message&&!splitValid)message='Indicá la parte en efectivo, mayor a $0 y menor al total.';
  if(!message&&!cashValid)message=received?`Faltan ${money(part-Number(received))} para completar el efectivo.`:'Ingresá el monto recibido.';
  if(!message&&method==='credit'&&!customer.trim())message='Completá el nombre del cliente.';
  if(!message&&!canConfirm)message='Revisá los datos del cobro para continuar.';
  if(canConfirm)message=method==='credit'?'Fiado listo para registrar':method==='cash'?'Efectivo completo':transferVerified?'Acreditación marcada por vos':'Transferencia por verificar';
  return {canConfirm,splitValid,cashReady:canConfirm&&cashValid,transferPending:['mixed','transfer'].includes(method)&&!transferVerified,message};
}

// Errors stay in the form. Toasts are reserved for supplementary feedback.
export function createFormFeedback({doc,page}){
  let issue=null;
  function clear(){
    const field=issue?.field&&doc.querySelector(`[name="${issue.field}"],#${issue.field}`);
    field?.removeAttribute?.('aria-invalid');
    const described=(field?.getAttribute?.('aria-describedby')||'').split(' ').filter(id=>id&&id!=='mora-field-error');
    if(field){if(described.length)field.setAttribute('aria-describedby',described.join(' '));else field.removeAttribute?.('aria-describedby');}
    doc.querySelector('#mora-field-error')?.remove?.();
    issue=null;
  }
  function restore(focus=false){
    if(!issue||issue.page!==page())return;
    const form=doc.querySelector('#'+issue.form),field=issue.field&&(form?.elements?.namedItem(issue.field)||doc.querySelector('#'+issue.field));
    if(!form)return;
    let error=doc.querySelector('#mora-field-error');
    if(!error){error=doc.createElement?.('p');if(!error)return;error.id='mora-field-error';error.className='error field-error';error.setAttribute('role','alert');error.tabIndex=-1;(field?.closest?.('label')||field||form).insertAdjacentElement?.(field?'afterend':'beforeend',error);}
    error.textContent=issue.message;
    if(field){field.setAttribute('aria-invalid','true');const ids=new Set((field.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));ids.add(error.id);field.setAttribute('aria-describedby',[...ids].join(' '));}
    if(focus){(field||error).focus?.({preventScroll:false});error.scrollIntoView?.({block:'nearest',behavior:'auto'});}
  }
  return {
    show(message,field=null){clear();const form=doc.querySelector('main form');if(!form){return false;}issue={page:page(),form:form.id,field,message};restore(true);return true;},
    edited(target){if(issue&&target?.closest?.('#'+issue.form)&&(!issue.field||target.name===issue.field||target.id===issue.field)&&target.checkValidity?.())clear();},
    leave(){clear();},restore:()=>restore(false),clear
  };
}

export function animateFeedback(node){
  if(!node?.classList)return;
  node.classList.remove('feedback-change');
  // Feedback is tied to a real UI update; reduced motion keeps the text response.
  void node.offsetWidth;node.classList.add('feedback-change');
}

export function groupDisplayAmounts(doc){
  // Keep each thousands group readable when a primary amount must use two lines.
  // The text/copy value is unchanged, including its sign and decimal fraction.
  for(const node of doc.querySelectorAll?.('.checkout-balance>strong,.ticket-amount,.document-total,.day-amount,.cash-big-number,.report-hero>h2')||[]){
    const value=node.textContent;
    if(!/^[+−]?\$[\d.,]+$/.test(value))continue;
    node.innerHTML=value.split(/(?=\.\d{3})/).map(part=>`<span class="amount-group">${part}</span>`).join('<wbr>');
  }
}

export function installKeyboardTracking({view=window,doc=document}={}){
  const viewport=view.visualViewport;if(!viewport)return;
  const sync=()=>{
    const editing=/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement?.tagName||'');
    const inset=editing?Math.max(0,view.innerHeight-viewport.height-viewport.offsetTop):0;
    const open=inset>120;
    doc.documentElement.style.setProperty('--keyboard-inset',open?inset+'px':'0px');
    doc.body.classList.toggle('keyboard-open',open);
  };
  viewport.addEventListener('resize',sync);viewport.addEventListener('scroll',sync);
  doc.addEventListener('focusin',sync);doc.addEventListener('focusout',()=>view.requestAnimationFrame(sync));
  sync();
}
