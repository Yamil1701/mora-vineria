import {qrcode} from './vendor/qrcode-generator.js';

const validCode=/^[0-9a-f]{32}$/;
const normalizeCode=value=>String(value||'').trim().toLowerCase().replace(/[\s-]+/g,'');
const formatCode=value=>value.match(/.{1,8}/g).join(' ');
const linkedMessage='Celular vinculado. Ya podés abrir Mora.';
const errorText=error=>error?.name==='TypeError'||error?.name==='TimeoutError'
  ?'No pudimos conectarnos. Revisá internet y volvé a intentar.'
  :error?.message||'No pudimos completar la vinculación. Volvé a intentar.';

export function createDeviceDialogs({getPersistence,esc,onLinked}){
  let active=null,issuerInvite=null;
  const manage=(op,extra)=>getPersistence().manageDevices({op,...extra});
  const pair=(op,extra)=>getPersistence().pairDevice(op,extra);

  function open(title){
    if(active?.open)return null;
    const dialog=document.createElement('dialog');
    dialog.className='action-sheet device-sheet';
    dialog.setAttribute('aria-labelledby','device-sheet-title');
    dialog.innerHTML=`<div class="sheet-heading"><h2 id="device-sheet-title" tabindex="-1">${title}</h2><button type="button" class="icon-control" data-device-close aria-label="Cerrar">×</button></div><div data-device-content></div><p data-device-error class="field-error" role="alert" hidden></p>`;
    document.body.append(dialog);
    active=dialog;
    let timer,busy=false;
    const content=dialog.querySelector('[data-device-content]'),alert=dialog.querySelector('[data-device-error]');
    const error=message=>{alert.textContent=message;alert.hidden=!message;};
    const focus=selector=>dialog.querySelector(selector)?.focus();
    const later=fn=>{clearTimeout(timer);if(dialog.open)timer=setTimeout(fn,2200);};
    const run=async fn=>{
      if(busy||!dialog.open)return;
      busy=true;clearTimeout(timer);dialog.setAttribute('aria-busy','true');error('');
      try{await fn();}catch(e){if(dialog.open)error(errorText(e));}
      finally{busy=false;dialog.removeAttribute('aria-busy');}
    };
    dialog.addEventListener('close',()=>{clearTimeout(timer);dialog.remove();if(active===dialog)active=null;});
    dialog.querySelector('[data-device-close]').onclick=()=>dialog.close();
    dialog.showModal();
    focus('#device-sheet-title');
    return {dialog,content,error,run,focus,later};
  }

  function manager(){
    const sheet=open('Dispositivos');if(!sheet)return;
    const {dialog,content,run,focus,later}=sheet;
    let invite=issuerInvite,current='',armed=null;
    const show=(html,key,selector)=>{
      if(!dialog.open||key===current)return;
      current=key;content.innerHTML=html;if(selector)focus(selector);
    };
    const action=(op,label,style='secondary')=>`<button type="button" class="btn ${style}" data-device-action="${op}">${label}</button>`;
    async function list(){
      const result=await manage('list');
      if(!result.canAdmit){
        show('<p>Este celular está vinculado. El celular designado administra los accesos.</p>','readonly');
        return;
      }
      show(`<p>Desde este celular podés vincular otros equipos y quitarles acceso.</p>
        ${action('issue','Vincular otro celular','primary')}
        <ul class="device-list">${result.devices.map(d=>`<li><strong>${esc(d.label)}</strong>${d.principal
          ?'<small>Este celular · Puede admitir otros</small>'
          :`<button class="text-btn" type="button" data-device-revoke="${esc(d.id)}">Quitar acceso</button>`}</li>`).join('')}</ul>`,JSON.stringify(result),'[data-device-action="issue"]');
    }
    function status(result){
      const key=JSON.stringify(result);
      const exit=action('list','Volver a dispositivos');
      if(result.state==='expired'){
        invite=issuerInvite=null;show(`<p role="status">El código venció o se canceló. Podés generar otro.</p>${exit}`,key,'[data-device-action="list"]');return;
      }
      if(result.state==='linked'){
        invite=issuerInvite=null;show(`<p role="status"><strong>${esc(result.label)}</strong> quedó vinculado.</p>${exit}`,key,'[data-device-action="list"]');return;
      }
      const cancel=action('cancel','Cancelar vinculación');
      if(result.state==='requested'){
        show(`<p>¿Vincular <strong>${esc(result.label)}</strong>? Verificá que el otro celular muestre este número.</p>
          <output class="device-confirmation" aria-label="Número de confirmación">${esc(result.confirmation)}</output>
          <div class="device-actions">${action('approve','Admitir','primary')}${cancel}</div>`,key,'[data-device-action="approve"]');
      }else if(result.state==='approved'){
        show(`<p role="status">Acceso aprobado. Estamos esperando que el otro celular termine de vincularse.</p>${cancel}`,key);
      }else{
        const link=new URL('./',location.href);
        link.hash='vincular='+invite.code;
        const qr=qrcode(0,'M');qr.addData(link.href);qr.make();
        show(`<p>Escaneá el QR con la cámara del otro celular o ingresá el código manual. Dura cinco minutos.</p>
          <div class="device-qr" aria-hidden="true">${qr.createSvgTag({cellSize:4,margin:16,scalable:true})}</div>
          <label for="device-invite-code">Código de vinculación</label>
          <textarea id="device-invite-code" class="device-code" rows="2" readonly spellcheck="false">${formatCode(invite.code)}</textarea>
          <div class="device-actions">${action('copy','Copiar código')}${cancel}</div>`,key);
      }
      later(()=>run(check));
    }
    async function check(){
      try{status(await manage('status',{code:invite.code}));}
      catch(error){if(dialog.open)later(()=>run(check));throw error;}
    }
    content.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button)return;
      const {deviceAction,deviceRevoke}=button.dataset;
      if(deviceRevoke){
        armed=deviceRevoke;
        const name=button.closest('li').querySelector('strong').textContent;
        show(`<p>¿Quitar el acceso de <strong>${esc(name)}</strong> a este negocio?</p>
          <div class="device-actions">${action('revoke','Sí, quitar acceso','primary')}${exitList()}</div>`,'revoke:'+armed,'[data-device-action="list"]');
        return;
      }
      void run(async()=>{
        if(deviceAction==='list'){await list();return;}
        if(deviceAction==='issue'){
          invite=issuerInvite=await manage('issue');status({state:'waiting'});return;
        }
        if(deviceAction==='copy'){
          const field=content.querySelector('#device-invite-code');
          field.focus();field.select();
          try{await navigator.clipboard.writeText(field.value);button.textContent='Código copiado';}
          catch{/* The code stays selected for manual copy. */}
          later(()=>run(check));return;
        }
        if(deviceAction==='revoke'){await manage('revoke',{targetId:armed});await list();return;}
        if(invite&&['approve','cancel'].includes(deviceAction)){
          try{status(await manage(deviceAction,{code:invite.code}));}
          catch(error){if(dialog.open)later(()=>run(check));throw error;}
        }
      });
    });
    const exitList=()=>action('list','Volver');
    show('<p role="status">Comprobando el acceso…</p>','loading');
    void run(async()=>{try{if(invite)await check();else await list();}catch(error){if(!invite)show(action('list','Reintentar'),'retry');throw error;}});
  }

  function recipient(initialCode=''){
    const sheet=open('Vincular con otro celular');if(!sheet)return;
    const {dialog,content,run,focus,later}=sheet;
    let current='';
    const saved=()=>getPersistence().current().enrollment;
    const candidate=saved()?.kind==='pairing'?saved():null;
    function form(code='',label=''){
      current='form';
      content.innerHTML=`<p>Ingresá el código que aparece en el celular autorizado.</p>
        <form class="device-join-form">
          <label for="device-join-code">Código de vinculación</label>
          <input id="device-join-code" name="code" value="${esc(code)}" maxlength="48" autocomplete="off" autocapitalize="none" spellcheck="false" required>
          <label for="device-join-name">Nombre de este celular</label>
          <input id="device-join-name" name="label" value="${esc(label)}" maxlength="80" placeholder="Ej. Celular de Sofi" required>
          <button class="btn primary" type="submit">Pedir acceso</button>
        </form>`;
      focus(code?'#device-join-name':'#device-join-code');
    }
    async function update(result){
      if(result.state==='linked')onLinked();
      if(!dialog.open)return;
      if(result.state==='expired'){form();sheet.error('Este código ya no está disponible. Pedí uno nuevo en el otro celular.');return;}
      if(result.state==='linked'){
        current='linked';content.innerHTML=`<p role="status">${linkedMessage}</p><button type="button" class="btn primary" data-open-mora>Abrir Mora</button>`;
        focus('[data-open-mora]');return;
      }
      if(result.state==='approved'){await update(await pair('claim'));return;}
      if(result.state==='requested'&&current!=='requested'){
        current='requested';
        content.innerHTML=`<p role="status">Mostrá este número en el otro celular y pedí que toque <strong>Admitir</strong>.</p>
          <output class="device-confirmation" aria-label="Número de confirmación">${esc(result.confirmation)}</output>`;
      }
      later(()=>run(check));
    }
    async function check(){
      try{await update(await pair('status'));}
      catch(error){if(dialog.open)later(()=>run(check));throw error;}
    }
    content.addEventListener('click',e=>{if(e.target.closest('[data-open-mora]'))dialog.close();});
    content.addEventListener('submit',event=>{
      event.preventDefault();
      const fields=new FormData(event.target),code=normalizeCode(fields.get('code')),label=fields.get('label').trim();
      if(!validCode.test(code)){sheet.error('Revisá el código completo que muestra el otro celular.');focus('#device-join-code');return;}
      if(!label){sheet.error('Poné un nombre para reconocer este celular.');focus('#device-join-name');return;}
      void run(async()=>await update(await pair('request',{code,label})));
    });
    if(candidate&&(!initialCode||initialCode===candidate.code)){
      form(candidate.code,candidate.label);
      void run(check);
    }else form(initialCode);
  }

  function resume(){
    const persistence=getPersistence();
    if(!persistence?.needsLogin()||persistence.current().identity)return;
    const code=new URLSearchParams(location.hash.slice(1)).get('vincular');
    if(code!==null)history.replaceState(history.state,'',location.pathname+location.search);
    if(validCode.test(code||'')){
      active?.close();
      recipient(code);
    }
  }
  return {manager,recipient,resume};
}
