import {applyCommand} from '../dist/command-domain.js';
import {chromium} from 'playwright';
import {chromiumPath} from './browser-runtime.mjs';
import {createServer} from 'node:https';
import {readFile,mkdir,writeFile,mkdtemp} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {resolve,join,extname} from 'node:path';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {X509Certificate,createHash} from 'node:crypto';
import {readBackup,DATA_KEYS,emptyData} from '../dist/local-data.js';
import {readWorkspaceBackup} from '../dist/workspace-store.js';
import {applyOperation} from '../dist/operations.js';
const artifacts=resolve(process.env.MORA_EXPERIENCE_OUTPUT||(process.env.MORA_QA_OUTPUT||'artifacts/browser')+'/experience');await mkdir(artifacts,{recursive:true});
const scratch=await mkdtemp(join(tmpdir(),'mora-https-'));
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-keyout',join(scratch,'key.pem'),'-out',join(scratch,'cert.pem'),'-days','2','-nodes','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});
const tls={key:await readFile(join(scratch,'key.pem')),cert:await readFile(join(scratch,'cert.pem'))};
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const servers=[];
async function serve(){
  let update=false;
  const server=createServer(tls,async(req,res)=>{
    try{
      const path=new URL(req.url,'https://localhost').pathname;
      if(path==='/legacy.html'){res.setHeader('Content-Type','text/html');res.end('<button id="write">Escritor antiguo simulado</button><script>document.querySelector("button").onclick=()=>localStorage.setItem("mora.local.v1",JSON.stringify({legacy:true,at:Date.now()}))</script>');return;}
      if(path==='/favicon.ico'){res.writeHead(204);res.end();return;}
      const name=decodeURIComponent(path.replace(/^\/mora-vineria\//,''))||'index.html';
      const file=resolve(root,name);if(!file.startsWith(root+'/'))throw Error('Invalid path');
      let bytes=name==='runtime-config.js'?Buffer.from('export const runtimeConfig={enabled:false};'):await readFile(file);if(name==='sw.js'&&update)bytes=Buffer.from(bytes.toString().replace(/const CACHE='[^']+'/,"const CACHE='mora-shell-qa-update'"));
      res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(bytes);
    }catch{res.writeHead(404);res.end('Not found');}
  });server.listen(0,'127.0.0.1');await once(server,'listening');servers.push(server);
  return {origin:'https://127.0.0.1:'+server.address().port,setUpdate:()=>{update=true;}};
}
const origin=await serve(),destination=await serve();
const fixturePin=createHash('sha256').update(new X509Certificate(tls.cert).publicKey.export({type:'spki',format:'der'})).digest('base64');
const browser=await chromium.launch({executablePath:await chromiumPath(),args:['--no-zygote','--disable-dev-shm-usage','--ignore-certificate-errors-spki-list='+fixturePin],headless:true});
const results=[],errors=[];
const business=d=>Object.fromEntries(DATA_KEYS.filter(k=>k!=='workState').map(k=>[k,d[k]]));
const fixture=resolve('verificacion/recuperacion-json-v29/Mora-QA-restauracion-v28.json'),input=readBackup(await readFile(fixture,'utf8'));
async function check(name,fn){if(process.env.MORA_EXPERIENCE_ONLY&&!name.includes(process.env.MORA_EXPERIENCE_ONLY))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name);}catch(e){results.push({name,status:'failed',error:e.stack});console.error('FAIL',name,e.message);const failedPage=browser.contexts().at(-1)?.pages().at(-1);if(failedPage){console.error('FAILED_SCREEN',await failedPage.locator('body').innerText());await failedPage.screenshot({path:join(artifacts,name+'-failure.png')});}throw e;}}
async function context(width=390){const c=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,ignoreHTTPSErrors:true,acceptDownloads:true});await c.addInitScript(()=>{navigator.serviceWorker?.addEventListener('controllerchange',()=>console.log('SW_CONTROLLER',navigator.serviceWorker.controller?.scriptURL));});return c;}
async function open(ctx,host=origin){const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('SW_'))console.log(m.text());});await page.goto(host.origin+'/mora-vineria/');await page.locator('h1').waitFor();return page;}
async function click(page,selector){await page.locator(selector).first().click();await page.waitForTimeout(80);}
async function more(page,target){await click(page,'[data-go="more"]');await click(page,'[data-go="'+target+'"]');}
async function data(page){await more(page,'data');}
async function choose(page,file){await click(page,'[data-go="restore"]');const chooser=page.waitForEvent('filechooser');await click(page,'[data-action="choose-restore"]');await (await chooser).setFiles(file);await page.getByText('Archivo validado',{exact:true}).waitFor();}
async function download(page,name){const pending=page.waitForEvent('download');await click(page,'[data-action="export-json"]');const file=await pending,path=join(artifacts,name);await file.saveAs(path);return (await readWorkspaceBackup(await readFile(path,'utf8'))).data;}
async function state(page){return page.evaluate(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('mora.workspace.rc2',1);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});const w=await new Promise((r,j)=>{const q=db.transaction('workspace').objectStore('workspace').get('current');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});db.close();return w.data;});}
// Input events queue durable writes. Reload only after the accepted draft has committed.
async function untilDraft(page,key,value){for(let n=0;n<200;n++){if((await state(page)).workState.workspaceDraft?.[key]===value)return;await page.waitForTimeout(25);}throw Error('Draft did not commit: '+key);}
async function dimensions(page){return page.evaluate(()=>({viewport:document.documentElement.clientWidth,content:document.documentElement.scrollWidth}));}
async function until(page,predicate){for(let n=0;n<160;n++){if(predicate(await state(page)))return;await page.waitForTimeout(25);}throw Error('The expected durable write did not finish');}
async function fresh(width=390){const ctx=await context(width),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();await page.locator('h1').waitFor();page.setDefaultTimeout(7000);return {ctx,page};}
async function screenshot(page,name){await page.screenshot({path:join(artifacts,name+'.png')});}
async function touchTargets(page){return page.locator('button,summary').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.getAttribute('aria-label')||e.innerText,w:r.width,h:r.height};}).filter(e=>e.w<43.9||e.h<43.9));}
async function enlargeText(page){await page.evaluate(()=>{const es=[...document.querySelectorAll('body *')].filter(e=>e.textContent.trim()&&!['SCRIPT','STYLE','svg','path'].includes(e.tagName));const sizes=es.map(e=>parseFloat(getComputedStyle(e).fontSize));es.forEach((e,i)=>e.style.fontSize=sizes[i]*2+'px');});}
try{
 for(const width of [360,390,430]){
  await check('experience-drafts-errors-and-payments-'+width,async()=>{
   const {ctx,page}=await fresh(width);await more(page,'catalog');await click(page,'[data-action="new-product"]');
   await page.locator('[name="name"]').fill('QA EXPERIENCIA '+width);await page.locator('[name="price"]').fill('4500');
   await until(page,d=>d.workState.savedForms?.['product:new']?.price==='4500');
   await click(page,'[data-action="back"]');await click(page,'[data-action="new-product"]');assert.equal(await page.locator('[name="name"]').inputValue(),'QA EXPERIENCIA '+width);
   await page.reload();await page.locator('[name="name"]').waitFor();assert.equal(await page.locator('[name="price"]').inputValue(),'4500');await screenshot(page,width+'-product-draft');
   await click(page,'[data-action="discard-form"]');assert.equal(await page.locator('[name="name"]').inputValue(),'QA EXPERIENCIA '+width);await click(page,'[data-action="discard-form"]');await click(page,'[data-action="new-product"]');assert.equal(await page.locator('[name="name"]').inputValue(),'');
   await page.locator('[name="name"]').fill('QA PRODUCTO '+width);await page.locator('[name="variety"]').fill('Sintético');await page.locator('[name="price"]').fill('4500');
   const beforeProduct=await state(page);await page.locator('[data-action="save-product"]').evaluate(b=>{b.click();b.click();});await until(page,d=>d.products.length===beforeProduct.products.length+1);await page.locator('.screen-product').waitFor();
   assert.equal((await state(page)).workState.newProduct,null);assert.equal((await state(page)).workState.savedForms?.['product:new'],undefined);
   await more(page,'inventory');await click(page,'[data-wf="count"][data-id="p1"]');await page.locator('[name="counted"]').fill('12');await page.locator('[name="reason"]').fill('Recuento sin confirmar');await until(page,d=>d.workState.savedForms?.['workspace:count:p1']?.reason==='Recuento sin confirmar');
   await click(page,'[data-action="back"]');await click(page,'[data-wf="count"][data-id="p1"]');assert.equal(await page.locator('[name="counted"]').inputValue(),'12');await page.reload();await page.locator('[name="counted"]').waitFor();assert.equal(await page.locator('[name="reason"]').inputValue(),'Recuento sin confirmar');await click(page,'[data-action="back"]');
   await click(page,'[data-go="sales"]');await click(page,'[data-go="debts"]');await click(page,'[data-wf="debt"]');await click(page,'[data-action="wf-debt-pay"]');await page.locator('[name="amount"]').fill('99999');await click(page,'[data-action="wf-save"]');
   assert.match(await page.locator('#mora-field-error').innerText(),/hasta/);assert.equal(await page.locator('[name="amount"]').getAttribute('aria-invalid'),'true');assert.equal(await page.locator('[name="amount"]').evaluate(e=>e===document.activeElement),true);assert.equal(await page.locator('[name="amount"]').inputValue(),'99999');
   await page.waitForTimeout(3400);assert.equal(await page.locator('#mora-field-error').isVisible(),true);await screenshot(page,width+'-abono-persistent-error');await page.locator('[name="amount"]').fill('99998');assert.equal(await page.locator('#mora-field-error').isVisible(),true);await page.locator('[name="amount"]').fill('500');assert.equal(await page.locator('#mora-field-error').count(),0);
   const beforePay=await state(page);await page.locator('[data-action="wf-save"]').evaluate(b=>{b.click();b.click();});await page.locator('.screen-debtDetail').waitFor();const afterPay=await state(page);assert.equal(afterPay.debtPayments.length,beforePay.debtPayments.length+1);assert.equal(afterPay.sales.length,beforePay.sales.length);assert.equal(afterPay.workState.savedForms?.['workspace:debt-payment:debt_qa_sale'],undefined);
   await click(page,'[data-go="sale"]');await click(page,'[data-add="p1"]');assert.match(await page.locator('#notice').innerText(),/agregado/);assert.ok(await page.locator('.feedback-change').count());assert.deepEqual(await touchTargets(page),[]);await screenshot(page,width+'-cart-added');
   await click(page,'[data-action="pay"]');await click(page,'[data-go="payOptions"]');await click(page,'[data-method="mixed"]');const confirm=page.locator('[data-action="confirm"]');assert.equal(await confirm.isEnabled(),false);assert.doesNotMatch(await page.locator('body').innerText(),/Listo para entregar|podés continuar|Efectivo completo/);
   await page.locator('#cash-share').fill('1000');await page.locator('#received').fill('500');assert.equal(await confirm.isEnabled(),false);assert.match(await page.locator('[data-payment-guidance]').innerText(),/Faltan/);await screenshot(page,width+'-mixed-incomplete');
   await page.locator('#received').fill('2000');assert.equal(await confirm.isEnabled(),true);assert.match(await page.locator('[data-payment-guidance]').innerText(),/por verificar/);await click(page,'[data-action="toggle-accreditation"]');assert.equal(await confirm.isEnabled(),true);assert.match(await page.locator('[data-payment-guidance]').innerText(),/marcada por vos/);await click(page,'[data-action="toggle-accreditation"]');
   await page.setViewportSize({width,height:480});await page.locator('#received').scrollIntoViewIfNeeded();await page.locator('#received').focus();const inputBox=await page.locator('#received').boundingBox(),dockBox=await page.locator('.dock').boundingBox();assert.ok(inputBox.y+inputBox.height<=dockBox.y+1,'cash input obscured by dock');await screenshot(page,width+'-short-checkout');await page.setViewportSize({width,height:844});
   if(width===390)await page.clock.setFixedTime(new Date('2026-11-01T08:30:00Z'));
   const beforeSale=await state(page);await confirm.evaluate(b=>{b.click();b.click();});await page.locator('.screen-done').waitFor();const afterSale=await state(page);assert.equal(afterSale.sales.length,beforeSale.sales.length+1);assert.match(await page.locator('.save-outcome').innerText(),/dispositivo/);assert.doesNotMatch(await page.locator('.save-outcome').innerText(),/negocio/);await screenshot(page,width+'-local-receipt');
   if(width===390){
    const afterMidnight=/1 de noviembre de 2026 · 05:30 · Jornada 31 de octubre de 2026/;
    assert.equal(afterSale.sales.at(-1).day,'2026-10-31');
    assert.match(await page.locator('.ticket-context').innerText(),afterMidnight);
    await page.getByRole('button',{name:'Volver al inicio'}).click();
    await click(page,'[data-go="cash"]');await click(page,'[data-go="moneyHistory"]');
    assert.match(await page.locator('.money-record').first().innerText(),afterMidnight);
   }
   await ctx.close();return {durableDrafts:true,explicitDiscard:true,cleanup:true,persistentAmountError:true,oneAbono:true,oneSale:true,mixedConsistent:true,targets:true,shortViewport:true};
  });
  await check('experience-large-text-and-reduced-motion-'+width,async()=>{
   const {ctx,page}=await fresh(width);await more(page,'reports');await enlargeText(page);await page.waitForTimeout(80);assert.deepEqual(await dimensions(page),{viewport:width,content:width});
   const periods=await page.locator('.report-periods button').evaluateAll(es=>es.map(e=>({t:e.innerText,l:e.getBoundingClientRect().left,r:e.getBoundingClientRect().right})));assert.ok(periods.every(e=>e.l>=0&&e.r<=width));await screenshot(page,width+'-report-text200');
   await page.reload();await page.locator('h1').waitFor();await more(page,'catalog');await click(page,'[data-action="new-product"]');await enlargeText(page);await page.locator('[name="price"]').fill('999999999');assert.deepEqual(await dimensions(page),{viewport:width,content:width});await page.locator('[data-action="save-product"]').scrollIntoViewIfNeeded();await screenshot(page,width+'-form-text200');
   await page.reload();await page.locator('h1').waitFor();await click(page,'[data-action="back"]');await page.emulateMedia({reducedMotion:'reduce'});await click(page,'[data-go="sale"]');await click(page,'[data-add="p1"]');assert.match(await page.locator('#notice').innerText(),/agregado/);assert.equal(await page.locator('.workbar-summary').evaluate(e=>getComputedStyle(e).animationName),'none');assert.equal(await page.locator('main').evaluate(e=>getComputedStyle(e).animationName),'none');assert.deepEqual(await touchTargets(page),[]);await screenshot(page,width+'-reduced-motion');
   await ctx.close();return {textEnlargement:'computed text sizes ×2, page scale unchanged',pageZoom:'separate test below',normalWidth:width,reducedMotion:true};
  });
 }

 await check('experience-related-drafts-and-long-amounts',async()=>{
  const {ctx,page}=await fresh();await more(page,'inventory');await click(page,'[data-wf="count"][data-id="p2"]');await page.locator('[name="counted"]').fill('1');await page.locator('[name="reason"]').fill('Conteo pendiente');await until(page,d=>d.workState.savedForms?.['workspace:count:p2']?.reason==='Conteo pendiente');await click(page,'[data-action="back"]');
  await click(page,'[data-go="cash"]');await click(page,'[data-action="register-money"]');await click(page,'[data-money-kind="expense"]');await page.locator('[name="amount"]').fill('1200');await page.locator('[name="note"]').fill('Gasto pendiente');await until(page,d=>d.workState.savedForms?.['money:expense']?.note==='Gasto pendiente');await click(page,'[data-action="back"]');await click(page,'[data-money-kind="contribution"]');assert.equal(await page.locator('[name="amount"]').inputValue(),'');await click(page,'[data-action="back"]');await click(page,'[data-money-kind="expense"]');assert.equal(await page.locator('[name="amount"]').inputValue(),'1200');
  await click(page,'[data-action="discard-form"]');await click(page,'[data-action="discard-form"]');await click(page,'[data-money-kind="expense"]');assert.equal(await page.locator('[name="amount"]').inputValue(),'');assert.ok((await state(page)).workState.savedForms['workspace:count:p2']);await click(page,'[data-action="back"]');
  await more(page,'inventory');await click(page,'[data-wf="count"][data-id="p2"]');await click(page,'[data-action="wf-save"]');await page.locator('.screen-stockOperation').waitFor();assert.equal((await state(page)).workState.savedForms?.['workspace:count:p2'],undefined);await click(page,'[data-action="wf-inventory"]');
  await more(page,'catalog');await click(page,'[data-product="p1"]');await click(page,'[data-action="area-menu"]');await click(page,'[data-product-command="edit"]');await page.locator('[name="price"]').fill('999999999');await click(page,'[data-action="save-product"]');await page.locator('.screen-product').waitFor();assert.equal((await state(page)).workState.savedForms?.['product:p1'],undefined);
  await click(page,'[data-go="sale"]');await click(page,'[data-add="p1"]');await click(page,'[data-action="pay"]');
  assert.match(await page.locator('.checkout-balance').textContent(),/999\.999\.999/);
  const quickAmount=page.getByRole('button',{name:'$1.000.000.000',exact:true});
  await enlargeText(page);
  for(const width of [430,390,360]){
   await page.setViewportSize({width,height:844});
   await quickAmount.scrollIntoViewIfNeeded();
   assert.deepEqual(await dimensions(page),{viewport:width,content:width});
   assert.equal(await quickAmount.evaluate(button=>button.scrollWidth<=button.clientWidth),true);
   await screenshot(page,width+'-long-amount-text200');
  }
  // Exercise wider font metrics independently of the system fonts on the runner.
  await page.addStyleTag({content:'.amount-btn { letter-spacing: 2px }'});
  assert.deepEqual(await dimensions(page),{viewport:360,content:360});
  assert.equal(await quickAmount.evaluate(button=>button.scrollWidth<=button.clientWidth),true);
  await ctx.close();return {moneyDraftsSeparate:true,discardDoesNotRemoveOtherTasks:true,countCompletionClean:true,longAmountWithoutHorizontalOverflow:true};
 });
 await check('experience-failed-save-no-false-success',async()=>{
  const {ctx,page}=await fresh();await more(page,'catalog');await click(page,'[data-action="new-product"]');await page.locator('[name="name"]').fill('QA FALLO');await page.locator('[name="variety"]').fill('Sintético');await page.locator('[name="price"]').fill('4500');await until(page,d=>d.workState.savedForms?.['product:new']?.price==='4500');const before=await state(page);
  // Fault only the final write of a synthetic product, after its prepared command.
  await page.evaluate(()=>{window.qaOriginalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(value?.data?.products?.some(p=>p.name==='QA FALLO'))throw new DOMException('Synthetic quota exhausted','QuotaExceededError');return window.qaOriginalPut.call(this,value,...args);};});
  await click(page,'[data-action="save-product"]');await page.getByText(/No se guardó el registro/).waitFor();assert.equal((await state(page)).products.length,before.products.length);assert.equal(await page.locator('.screen-done,.screen-product').count(),0);assert.equal(await page.locator('[data-action="save-product"]').isEnabled(),true);assert.equal(await page.locator('#app').getAttribute('aria-busy'),'false');await screenshot(page,'failed-save');await page.evaluate(()=>IDBObjectStore.prototype.put=window.qaOriginalPut);await ctx.close();return {fault:'synthetic final IndexedDB put throws QuotaExceededError',noFalseConfirmation:true,controlsReleased:true};
 });

 await check('experience-offline-pending-and-lost-response-recovery',async()=>{
  // All HTTP replies are local fixtures. No request reaches a real business.
  const ctx=await browser.newContext({viewport:{width:390,height:844},ignoreHTTPSErrors:true,serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  const url='https://mora-synthetic.supabase.co',remote=emptyData(),answers=new Map();let revision=0,networkReady=true,submitCount=0,lost=false;
  await ctx.route('**/runtime-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const runtimeConfig=${JSON.stringify({enabled:true,url,publishableKey:'sb_publishable_synthetic_fixture'})};`}));
  await ctx.route(url+'/**',async route=>{
   if(!networkReady){await route.abort();return;}const req=route.request(),path=new URL(req.url()).pathname;
   if(path.endsWith('/verify')){await route.fulfill({json:{access_token:'synthetic-only',refresh_token:'synthetic-only',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'synthetic-user'}}});return;}
   const body=req.postDataJSON(),command=body.command;
   if(body.action==='enroll'){await route.fulfill({json:{businessId:'synthetic-business',deviceId:command.deviceId,userId:'synthetic-user'}});return;}
   if(body.action==='read'){await route.fulfill({json:{snapshot:remote,revision}});return;}
   if(body.action==='result'){await route.fulfill({json:answers.get(command.id)||null});return;}
   if(body.action==='submit'){
    submitCount++;if(!answers.has(command.id)){const result=applyCommand(remote,command);answers.set(command.id,{...command,status:'confirmed',revision:++revision,result});}
    if(!lost){lost=true;await route.abort();return;}await route.fulfill({json:answers.get(command.id)});return;
   }
   throw Error('Unexpected synthetic action '+body.action);
  });
  await page.goto(origin.origin+'/mora-vineria/');await page.locator('[name="link"]').fill('a'.repeat(64));await click(page,'#auth-form button[type=submit]');await page.locator('[name="code"]').fill('b'.repeat(24));await click(page,'#auth-form button[type=submit]');await page.locator('.nav').waitFor();
  networkReady=false;await ctx.setOffline(true);await more(page,'catalog');await click(page,'[data-action="new-product"]');await page.locator('[name="name"]').fill('QA OFFLINE');await page.locator('[name="variety"]').fill('Sintético');await page.locator('[name="price"]').fill('4500');await click(page,'[data-action="save-product"]');await page.locator('.screen-product').waitFor();
  const readEnvelope=()=>page.evaluate(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('mora.workspace.rc2',1);q.onsuccess=()=>r(q.result);});const w=await new Promise(r=>{const q=db.transaction('workspace').objectStore('workspace').get('current');q.onsuccess=()=>r(q.result);});db.close();return w;});
  let local=await readEnvelope();assert.equal(local.jobs.length,1);assert.equal(local.jobs[0].localApplied,true);assert.notEqual(local.jobs[0].status,'confirmed');const id=local.jobs[0].id;assert.equal(local.data.products.length,1);assert.doesNotMatch(await page.locator('.sync-banner').innerText(),/Guardado en el negocio/);await screenshot(page,'offline-pending');
  networkReady=true;await ctx.setOffline(false);await page.waitForFunction(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('mora.workspace.rc2',1);q.onsuccess=()=>r(q.result);});const w=await new Promise(r=>{const q=db.transaction('workspace').objectStore('workspace').get('current');q.onsuccess=()=>r(q.result);});db.close();return w.jobs[0]?.status==='unknown';});
  await more(page,'status');await screenshot(page,'unknown-response');assert.doesNotMatch(await page.locator('.connection-view h2').innerText(),/Guardado en el negocio/);
  await click(page,'[data-action="sync-now"]');await page.getByRole('heading',{name:'Guardado en el negocio',exact:true}).waitFor();local=await readEnvelope();assert.equal(local.jobs[0].id,id);assert.equal(local.jobs[0].status,'confirmed');assert.equal(local.data.products.length,1);assert.equal(submitCount,1);await screenshot(page,'confirmed-synthetic-transport');await ctx.close();return {transport:'local synthetic interception, not hosted integration',offlinePending:true,lostResponse:true,sameId:true,submits:submitCount};
 });
 await check('experience-motion-and-page-zoom',async()=>{
  const {ctx,page}=await fresh();await click(page,'[data-go="sale"]');const target=page.locator('[data-add="p1"]');await target.scrollIntoViewIfNeeded();const box=await target.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await screenshot(page,'motion-0');await page.mouse.down();await screenshot(page,'motion-1');await page.mouse.up();await page.waitForTimeout(35);await screenshot(page,'motion-2');await page.waitForTimeout(100);await screenshot(page,'motion-3');await page.waitForTimeout(300);await screenshot(page,'motion-4');assert.equal((await state(page)).cart.p1,1);
  const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});const scale=await page.evaluate(()=>({pageScale:visualViewport.scale,layoutWidth:innerWidth}));assert.equal(scale.pageScale,2);assert.equal(scale.layoutWidth,390);await screenshot(page,'page-zoom200');await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});await ctx.close();return {capturedActualFrames:5,pageZoom:scale,textEnlargement:'tested independently at all widths'};
 });
 assert.deepEqual(errors,[]);await writeFile(join(artifacts,'results.json'),JSON.stringify({results,errors,source:'sites-next/dist',remote:'disabled except existing separate synthetic transport tests',androidPhysical:false},null,2));console.log('Experience QA passed:',results.length,'groups');
}finally{await browser.close();for(const server of servers)server.close();}
