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
const artifacts=resolve(process.env.MORA_QA_OUTPUT||'artifacts/browser');await mkdir(artifacts,{recursive:true});
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
async function check(name,fn){if(process.env.MORA_QA_ONLY&&!name.includes(process.env.MORA_QA_ONLY))return;try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name);}catch(e){results.push({name,status:'failed',error:e.stack});console.error('FAIL',name,e.message);const failedPage=browser.contexts().at(-1)?.pages().at(-1);if(failedPage){console.error('FAILED_SCREEN',await failedPage.locator('body').innerText());await failedPage.screenshot({path:join(artifacts,name+'-failure.png')});}throw e;}}
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
try{
  for(const width of [360,390,430]){
    await check('restore-scroll-and-main-screens-'+width,async()=>{
      const ctx=await context(width),page=await open(ctx);await data(page);await choose(page,fixture);
      const confirm=page.locator('[data-action="restore-json"]');await confirm.scrollIntoViewIfNeeded();assert.equal(await confirm.isEnabled(),true);
      await confirm.click();await page.getByText('Respaldo recuperado en este navegador.',{exact:true}).waitFor();
      const exported=await download(page,'before-'+width+'.json');assert.deepEqual(business(exported),business(input));
      await page.reload();await page.locator('h1').waitFor();await page.reload();await page.locator('h1').waitFor();
      await data(page);const after=await download(page,'after-'+width+'.json'),expected=structuredClone(input);applyOperation(expected,'qa_prepared_expense');
      assert.deepEqual(business(after),business(expected));assert.equal(after.ledger.filter(e=>e.source==='manual:qa_prepared_expense').length,1);
      const screens=[];
      for(const target of ['home','sales','cash','catalog','inventory','orders','debts','reports','settings','data']){
        if(['home','sales','cash'].includes(target))await click(page,'[data-go="'+target+'"]');else await more(page,target);
        if(target==='home')await page.getByRole('img',{name:'Mora.',exact:true}).evaluate(img=>img.decode());
        if(target==='sales')assert.equal(await page.locator('main [data-go="debts"]').count(),0);
        if(target==='reports'){await click(page,'[data-report="period"][data-period="month"]');await page.locator('#report-month').fill('2026-10');await page.locator('#report-month').blur();}
        const d=await dimensions(page);assert.equal(d.content,d.viewport,target);assert.equal(await page.locator('h1').count(),1);
        await page.screenshot({path:join(artifacts,`${width}-${target}.png`)});screens.push({target,...d});
      }
      await choose(page,fixture);assert.equal(await page.locator('[data-action="restore-json"]').isEnabled(),false);
      await page.locator('[data-action="restore-json"]').scrollIntoViewIfNeeded();
      const accessible=await page.locator('[data-action="choose-restore"]').last().evaluate(e=>{const r=e.getBoundingClientRect();return {height:r.height,width:r.width};});assert.ok(accessible.height>=44);
      await page.screenshot({path:join(artifacts,`${width}-restore-protected.png`)});
      await ctx.close();return {screens,exactJSON:true,preparedRecoveredOnce:true,occupiedRestoreBlocked:true};
    });
  }
  await check('two-real-HTTPS-tabs-and-noncooperating-legacy-key',async()=>{
    const ctx=await context(),one=await open(ctx);const initialRaw=await one.evaluate(()=>localStorage.getItem('mora.local.rc1'));const two=await open(ctx);
    await two.getByText(/Mora ya está abierta en otra pestaña/).waitFor();
    assert.equal(await two.evaluate(()=>localStorage.getItem('mora.local.rc1')),initialRaw);
    const legacy=await ctx.newPage();await legacy.goto(origin.origin+'/legacy.html');await legacy.locator('#write').click();
    assert.equal(await one.evaluate(()=>localStorage.getItem('mora.local.rc1')),initialRaw);
    assert.ok(await one.evaluate(()=>localStorage.getItem('mora.local.v1')));
    await two.screenshot({path:join(artifacts,'second-tab-blocked.png')});await one.close();await two.reload();await two.locator('h1').waitFor();
    assert.equal(await two.locator('.storage-error').count(),0);await ctx.close();return {actualTabs:2,legacyWriter:'simulation of uncooperating old key',releaseAndReload:true};
  });
  await check('Web-Locks-unavailable-never-writes',async()=>{
    const ctx=await context();await ctx.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined}));const page=await open(ctx);
    await page.getByText(/Este navegador no permite proteger/).waitFor();
    assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[]);
    await page.screenshot({path:join(artifacts,'unavailable-writer-blocked.png')});await ctx.close();
  });
  await check('real-cross-origin-download-import-and-duplicate-protection',async()=>{
    const ctx=await context(),from=await open(ctx);await data(from);await choose(from,fixture);await click(from,'[data-action="restore-json"]');
    const a=await download(from,'migration-source.json');const to=await open(ctx,destination);await data(to);
    await choose(to,join(artifacts,'migration-source.json'));await click(to,'[data-action="restore-json"]');const b=await download(to,'migration-destination.json');
    assert.deepEqual(business(a),business(b));assert.deepEqual(business(await state(from)),business(a));
    await choose(to,join(artifacts,'migration-source.json'));assert.equal(await to.locator('[data-action="restore-json"]').isEnabled(),false);
    await ctx.close();return {origins:2,businessKeys:DATA_KEYS.length-1,sourcePreserved:true};
  });
  await check('service-worker-offline-reopen-and-controlled-update-preserve-draft',async()=>{
    const ctx=await context(),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:15000});await page.reload();await page.locator('h1').waitFor();
    assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),true);
    await click(page,'[data-go="sale"]');await click(page,'[data-add="p1"]');
    const before=await state(page);assert.equal(before.cart.p1,1);
    await ctx.setOffline(true);await page.reload();await page.locator('h1').waitFor();assert.deepEqual(business(await state(page)),business(before));
    await page.screenshot({path:join(artifacts,'offline-reopened-draft.png')});await ctx.setOffline(false);
    origin.setUpdate();await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
    await page.locator('.mora-update-dialog').waitFor();assert.equal(await page.locator('#update-title').evaluate(e=>e===document.activeElement),true);
    await Promise.all([page.waitForEvent('load'),page.locator('[data-update-now]').click()]);await page.locator('h1').waitFor();
    assert.deepEqual(business(await state(page)),business(before));await page.screenshot({path:join(artifacts,'after-controlled-update.png')});await ctx.close();
    return {serviceWorkerControlled:true,offlineReload:true,update:'new worker with identical shell resources',draftPreserved:true};
  });
  for(const width of [360,390,430])await check('commerce-forms-and-real-effects-'+width,async()=>{
    const ctx=await context(width),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();await page.locator('h1').waitFor();
    const before=await state(page);
    async function cartToPay(){await click(page,'[data-go="sale"]');await click(page,'[data-add="p1"]');await click(page,'[data-action="cart"]');await click(page,'[data-action="pay"]');await page.waitForTimeout(700);}
    await cartToPay();await page.locator('#received').fill('5000');await page.screenshot({path:join(artifacts,`${width}-checkout.png`)});
    // Dispatch a real synchronous second activation after the first removed its button.
    await page.locator('[data-action="confirm"]').evaluate(b=>{b.click();b.click();});await page.getByText('Venta registrada',{exact:true}).waitFor();
    const cash=await state(page),cashSale=cash.sales.at(-1);assert.equal(cash.sales.length,before.sales.length+1);assert.equal(cash.products[0].stock,before.products[0].stock-1);assert.equal(cashSale.total,3500);assert.equal(cash.ledger.length,before.ledger.length+1);
    await page.screenshot({path:join(artifacts,`${width}-receipt.png`)});await click(page,'[data-action="home"]');
    await cartToPay();await click(page,'[data-method="transfer"]');await click(page,'[data-action="confirm"]');
    const transfer=await state(page);assert.equal(transfer.sales.length,cash.sales.length+1);assert.equal(transfer.ledger.length,cash.ledger.length);assert.equal(transfer.sales.at(-1).parts[0].verified,false);
    await click(page,'[data-action="home"]');await cartToPay();await click(page,'[data-go="payOptions"]');await click(page,'[data-wf="partial-credit"]');
    await page.locator('[name="amount"]').fill('1000');await page.locator('[name="customer"]').fill('QA TELÉFONO DESCARTABLE');await click(page,'[data-action="wf-save"]');
    await page.locator('#received').fill('2500');await click(page,'[data-action="confirm"]');
    const credit=await state(page),debt=credit.debts.at(-1);assert.equal(debt.amount,1000);assert.equal(credit.sales.length,before.sales.length+3);assert.equal(credit.products[0].stock,before.products[0].stock-3);
    await click(page,'[data-action="home"]');await more(page,'debts');await click(page,`[data-wf="debt"][data-id="${debt.id}"]`);
    for(const amount of ['400','600']){await click(page,'[data-action="wf-debt-pay"]');await page.locator('[name="amount"]').fill(amount);await page.screenshot({path:join(artifacts,`${width}-debt-payment.png`)});await click(page,'[data-action="wf-save"]');await page.locator('h1').waitFor();}
    const paid=await state(page);assert.equal(paid.debtPayments.filter(p=>p.debtId===debt.id).reduce((n,p)=>n+p.amount,0),1000);assert.equal(paid.sales.length,credit.sales.length);assert.equal(paid.products[0].stock,credit.products[0].stock);
    await click(page,'[data-go="sales"]');await click(page,`[data-sale="${cashSale.number}"]`);await click(page,`[data-correction="open"][data-sale-id="${cashSale.operationId||cashSale.id}"]`);
    await click(page,'[data-correction="type"][data-type="account"]');await page.locator('[name="account"]').selectOption('mp');await page.locator('[name="reason"]').fill('QA cuenta correcta');await page.locator('[name="occurredConfirmed"]').check();await click(page,'[data-correction="save"]');
    await page.getByText('Sin cambios en el dinero cobrado',{exact:true}).waitFor();await page.screenshot({path:join(artifacts,`${width}-correction-review.png`)});await click(page,'[data-correction="save"]');
    const corrected=await state(page);assert.equal(corrected.saleCorrections.length,paid.saleCorrections.length+1);assert.deepEqual(corrected.sales,paid.sales);assert.equal(corrected.products[0].stock,paid.products[0].stock);
    await click(page,'[data-correction="sale"]');await more(page,'inventory');await click(page,'[data-wf="count"][data-id="p1"]');await page.locator('[name="counted"]').fill(String(corrected.products[0].stock-1));await page.locator('[name="reason"]').fill('Rotura QA descartable');await page.locator('[name="reasonKind"]').selectOption('loss');
    await page.screenshot({path:join(artifacts,`${width}-inventory-count.png`)});await click(page,'[data-action="wf-save"]');const counted=await state(page);assert.equal(counted.inventoryAdjustments.length,corrected.inventoryAdjustments.length+1);assert.equal(counted.products[0].stock,corrected.products[0].stock-1);assert.equal(counted.ledger.length,corrected.ledger.length);
    await click(page,'[data-action="wf-inventory"]');await more(page,'orders');await click(page,'[data-supply-tab="receipts"]');await click(page,'[data-receipt="qa_receipt"]');await click(page,'[data-wf="receipt-pay"]');await page.locator('[name="amount"]').fill('1000');await page.locator('[name="paidConfirmed"]').check();await click(page,'[data-action="wf-save"]');
    const receiptPaid=await state(page);assert.equal(receiptPaid.receiptPayments.length,counted.receiptPayments.length+1);assert.deepEqual(receiptPaid.products,counted.products);assert.equal(receiptPaid.ledger.length,counted.ledger.length+1);
    await more(page,'reports');await click(page,'[data-report="period"][data-period="month"]');await page.locator('#report-month').fill('2026-10');await click(page,'[data-report="goal"]');await page.locator('[name="amount"]').fill('60000');await click(page,'[data-report="save-goal"]');const end=await state(page);assert.equal(end.monthlyGoals.filter(g=>g.month==='2026-10').at(-1).amount,60000);
    await data(page);const exported=await download(page,`commerce-${width}.json`);assert.deepEqual(business(exported),business(end));
    await ctx.close();return {newSales:3,unitsConsumed:4,newAbonos:2,accountCorrections:1,receiptPayments:1,goal:60000,backupExact:true};
  });
  for(const width of [360,390,430])await check('secondary-flows-errors-back-reload-and-layout-'+width,async()=>{
    const ctx=await context(width),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();await page.locator('h1').waitFor();
    const before=await state(page),screens=[];
    async function shot(name){assert.deepEqual(await dimensions(page),{viewport:width,content:width},name);assert.equal(await page.locator('h1').count(),1);await page.screenshot({path:join(artifacts,`${width}-polish-${name}.png`)});screens.push(name);}
    async function leave(){for(let n=0;n<6&&!await page.locator('.nav').count();n++){await click(page,'[data-action="back"]');}}
    await more(page,'inventory');await click(page,'[data-wf="count"][data-id="p1"]');await page.locator('[name="reason"]').fill('Conteo sintético');await click(page,'[data-action="wf-save"]');assert.equal(await page.locator('[name="counted"]').evaluate(e=>e.validity.valueMissing),true);assert.equal((await state(page)).inventoryAdjustments.length,before.inventoryAdjustments.length);
    await page.locator('[name="counted"]').fill('9');await untilDraft(page,'counted','9');await page.reload();await page.locator('[name="counted"]').waitFor();assert.equal(await page.locator('[name="counted"]').inputValue(),'9');assert.equal(await page.locator('[name="reason"]').inputValue(),'Conteo sintético');await shot('count');
    await page.setViewportSize({width,height:460});await page.locator('[name="reason"]').focus();await page.locator('[data-action="wf-save"]').scrollIntoViewIfNeeded();let box=await page.locator('[data-action="wf-save"]').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=460&&box.height>=44);await shot('reduced-height');await page.setViewportSize({width,height:844});await leave();assert.equal((await state(page)).inventoryAdjustments.length,before.inventoryAdjustments.length);
    await click(page,'[data-action="wf-opening"]');await shot('opening');await leave();
    await click(page,'[data-go="reviews"]');await page.locator('[data-wf="review"]').first().click();await shot('review-difference');await leave();
    await more(page,'debts');await page.locator('[data-wf="debt"]').first().click();await shot('debt-detail');await click(page,'[data-action="wf-debt-pay"]');await page.locator('[name="amount"]').fill('999999');await page.locator('[name="method"]').selectOption('mixed');await page.locator('[name="cashShare"]').fill('100');await page.locator('[name="transferVerified"]').check();await click(page,'[data-action="wf-save"]');assert.equal((await state(page)).debtPayments.length,before.debtPayments.length);assert.equal(await page.locator('[name="amount"]').inputValue(),'999999');
    await page.locator('[name="amount"]').fill('1000');await shot('abono-mixed');await untilDraft(page,'amount','1000');await page.reload();await page.locator('[name="amount"]').waitFor();assert.equal(await page.locator('[name="amount"]').inputValue(),'1000');await leave();assert.equal((await state(page)).debtPayments.length,before.debtPayments.length);
    await more(page,'orders');await click(page,'[data-supply-tab="receipts"]');await click(page,'[data-receipt="qa_receipt"]');await click(page,'[data-wf="receipt-pay"]');await shot('receipt-payment');await leave();assert.equal((await state(page)).receiptPayments.length,before.receiptPayments.length);
    await click(page,'[data-go="sales"]');await click(page,'[data-go="history"]');await click(page,'[data-sale="001"]');await click(page,'[data-correction="open"]');await shot('correction-choice');await click(page,'[data-correction="type"][data-type="commercial"]');await shot('correction-form');await page.locator('[name="reason"]').fill('Sólo revisar, sin guardar');await page.locator('[name="occurredConfirmed"]').check();await click(page,'[data-correction="save"]');await shot('correction-review');await click(page,'[data-action="back"]');assert.equal(await page.locator('[name="reason"]').inputValue(),'Sólo revisar, sin guardar');assert.equal((await state(page)).saleCorrections.length,before.saleCorrections.length);await leave();
    await click(page,'[data-go="cash"]');await click(page,'[data-go="moneyHistory"]');await page.locator('.history-filters summary').click();await page.locator('#workflow-money-from').fill('2026-11-02');await page.locator('#workflow-money-to').fill('2026-10-01');await shot('money-filter-error');await click(page,'[data-wf="clear-money-filters"]');assert.ok(await page.locator('.money-record').count());
    await more(page,'reports');await click(page,'[data-report="period"][data-period="month"]');await page.locator('#report-month').fill('2026-10');await shot('report');await page.locator('summary').filter({hasText:'Cómo se compone'}).click();await shot('report-breakdown');
    await more(page,'settings');await click(page,'[data-go="status"]');await ctx.setOffline(true);await page.reload();await page.locator('h1').waitFor();await shot('status-offline');await ctx.setOffline(false);await click(page,'[data-action="sync-now"]');await shot('status');
    assert.equal((await state(page)).sales.length,before.sales.length);await ctx.close();return {screens,emptyCountRejected:true,cancelDidNotWrite:true,draftsRestored:true,keyboard:'reduced viewport, physical keyboard pending'};
  });
  for(const width of [360,390,430])await check('synthetic-transport-access-enrollment-and-revocation-ui-'+width,async()=>{
    // Local transport fixture only. No session or request reaches Supabase.
    const ctx=await browser.newContext({viewport:{width,height:844},ignoreHTTPSErrors:true,serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
    const url='https://dedcvvgiuxpwdzqqdifn.supabase.co';let verifyCount=0,enrollCount=0,readCode=null,release;
    await ctx.route('**/runtime-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const runtimeConfig=${JSON.stringify({enabled:true,url,publishableKey:'sb_publishable_synthetic_fixture'})};`}));
    await ctx.route(url+'/**',async route=>{const req=route.request(),path=new URL(req.url()).pathname;
      if(path.endsWith('/verify')){verifyCount++;if(verifyCount===1){await new Promise(r=>{release=r;});await route.fulfill({status:403,json:{error_code:'otp_expired'}});return;}await route.fulfill({json:{access_token:'synthetic-ui-only',refresh_token:'synthetic-ui-only',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'synthetic-user'}}});return;}
      const body=req.postDataJSON();if(body.action==='enroll'){enrollCount++;if(body.command.code!=='y'.repeat(24)){await route.fulfill({status:422,json:{code:'REJECTED',message:'El código no está disponible. Revisalo y volvé a intentar.'}});return;}await route.fulfill({json:{businessId:'synthetic-business',deviceId:body.command.deviceId,userId:'synthetic-user'}});return;}
      if(body.action==='read'){await route.fulfill(readCode?{status:readCode==='FORBIDDEN'?403:401,json:{code:readCode,message:'Synthetic denied'}}:{json:{snapshot:emptyData(),revision:0}});return;}
      await route.fulfill({status:204,body:''});
    });
    await page.goto(origin.origin+'/mora-vineria/');await page.locator('[name="link"]').fill('a'.repeat(64));await page.locator('#auth-form button[type=submit]').click();await page.getByText('Comprobando…',{exact:true}).waitFor();assert.equal(await page.locator('#auth-form button').isDisabled(),true);await page.screenshot({path:join(artifacts,`${width}-polish-auth-waiting.png`)});release();await page.getByText(/El enlace venció/).waitFor();assert.equal(await page.locator('[name="link"]').inputValue(),'a'.repeat(64));await page.screenshot({path:join(artifacts,`${width}-polish-auth-error.png`)});
    await click(page,'#auth-form button[type=submit]');await page.getByRole('heading',{name:'Vincular este teléfono'}).waitFor();await page.screenshot({path:join(artifacts,`${width}-polish-enrollment.png`)});await page.locator('[name="code"]').fill('x'.repeat(24));await page.locator('[name="label"]').fill('Teléfono de prueba');await click(page,'#auth-form button[type=submit]');await page.getByText(/El código no está disponible/).waitFor();await page.locator('[name="code"]').fill('y'.repeat(24));await click(page,'#auth-form button[type=submit]');await page.locator('.nav').waitFor();assert.equal(verifyCount,2);assert.equal(enrollCount,2);
    await more(page,'settings');await click(page,'[data-go="status"]');readCode='FORBIDDEN';await click(page,'[data-action="sync-now"]');await page.getByText('Acceso no autorizado',{exact:true}).waitFor();await page.screenshot({path:join(artifacts,`${width}-polish-revoked.png`)});assert.equal((await state(page)).sales.length,0);
    readCode='UNAUTHENTICATED';await click(page,'[data-action="sync-now"]');await page.getByRole('heading',{name:'Volvé a entrar',exact:true}).waitFor();readCode=null;await click(page,'[data-action="sync-now"]');await page.getByText('Guardado en el negocio',{exact:true}).waitFor();assert.deepEqual(await dimensions(page),{viewport:width,content:width});await ctx.close();return {transport:'synthetic local interception; not hosted acceptance',verifyAttempts:verifyCount,enrollments:enrollCount,forbiddenThenExpiredThenRecovered:true};
  });
  await check('designated-phone-admission-and-revocation',async()=>{
    const {admissionFixture,endpoint}=await import('../tests/device-admission-fixture.mjs');
    const fixture=await admissionFixture(origin.origin);
    const contexts=[];
    let offline=false;
    async function phone(width){
      const ctx=await browser.newContext({viewport:{width,height:844},ignoreHTTPSErrors:true,serviceWorkers:'block'});
      contexts.push(ctx);
      await ctx.route('**/runtime-config.js',route=>route.fulfill({contentType:'text/javascript',body:`export const runtimeConfig=${JSON.stringify({enabled:true,url:endpoint,publishableKey:'sb_publishable_synthetic_fixture'})};`}));
      await ctx.route(endpoint+'/**',async route=>{
        const request=route.request();
        if(new URL(request.url()).pathname.endsWith('/verify')){await route.fulfill({json:fixture.session()});return;}
        const data=request.postDataJSON();
        if(offline&&data?.action==='pair-device'&&data.command.op==='status'){await route.abort('internetdisconnected');return;}
        const response=await fixture.handler(new Request(request.url(),{method:request.method(),headers:request.headers(),body:request.postData()??undefined}));
        await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
      });
      return open(ctx);
    }
    try{
      const owner=await phone(360),target=await phone(390);
      await owner.locator('[name="link"]').fill('a'.repeat(64));
      await click(owner,'#auth-form button[type=submit]');
      await owner.locator('[name="code"]').fill(fixture.loginCode);
      await owner.locator('[name="label"]').fill('Celular de Yamil');
      await click(owner,'#auth-form button[type=submit]');
      await more(owner,'settings');
      await click(owner,'[data-action="manage-devices"]');
      await owner.getByText('Este celular · Puede admitir otros').waitFor();
      await owner.getByRole('button',{name:'Vincular otro celular'}).click();
      const code=await owner.getByLabel('Código de vinculación').inputValue();
      assert.match(code,/^[a-f0-9]{8}( [a-f0-9]{8}){3}$/);
      await owner.locator('.device-qr svg path').waitFor();
      assert.deepEqual(await dimensions(owner),{viewport:360,content:360});
      await owner.screenshot({path:join(artifacts,'admission-owner-qr.png')});
      await target.getByRole('button',{name:'Vincular con otro celular'}).click();
      await target.getByLabel('Código de vinculación').fill('0'.repeat(32));
      await target.getByLabel('Nombre de este celular').fill('Celular de Sofi');
      await target.getByRole('button',{name:'Pedir acceso'}).click();
      await target.getByRole('alert').filter({hasText:'Este código ya no está disponible'}).waitFor();
      await target.getByRole('button',{name:'Cerrar',exact:true}).click();
      // The QR uses this fragment. It is stripped from the address after being read.
      await target.goto(origin.origin+'/mora-vineria/#vincular='+code.replaceAll(' ',''));
      await target.getByRole('dialog').waitFor();
      await target.locator('#device-join-code[value="'+code.replaceAll(' ','')+'"]').waitFor({timeout:6000});
      assert.equal(new URL(target.url()).hash,'');
      await target.getByLabel('Código de vinculación').fill(code);
      await target.getByLabel('Nombre de este celular').fill('Celular de Sofi');
      await target.getByRole('button',{name:'Pedir acceso'}).click();
      const confirmation=await target.getByLabel('Número de confirmación').textContent({timeout:8000});
      assert.match(confirmation,/^\d{4}$/);
      await owner.getByRole('button',{name:'Admitir',exact:true}).waitFor();
      assert.equal(await owner.getByLabel('Número de confirmación').textContent(),confirmation);
      offline=true;
      await owner.getByRole('button',{name:'Admitir',exact:true}).click();
      await target.getByRole('alert').filter({hasText:'Revisá internet'}).waitFor();
      await target.reload();
      await target.getByRole('button',{name:'Vincular con otro celular'}).click();
      offline=false;
      await target.getByRole('button',{name:'Abrir Mora'}).click();
      await owner.getByText('quedó vinculado.').waitFor();
      await owner.getByRole('button',{name:'Volver a dispositivos'}).click();
      await more(target,'settings');
      await click(target,'[data-action="manage-devices"]');
      await target.getByText('El celular designado administra los accesos.').waitFor();
      assert.equal(await target.getByRole('button',{name:'Vincular otro celular'}).count(),0);
      await owner.getByRole('button',{name:'Quitar acceso',exact:true}).click();
      await owner.getByRole('button',{name:'Sí, quitar acceso'}).click();
      await owner.getByRole('button',{name:'Vincular otro celular'}).waitFor();
      await target.getByRole('button',{name:'Cerrar',exact:true}).click();
      await click(target,'[data-go="status"]');
      await click(target,'[data-action="sync-now"]');
      await target.getByText('Acceso no autorizado',{exact:true}).waitFor();
      return {designatedPhoneOnly:true,comparisonCode:true,recoversAfterNetworkLoss:true,revoke:true,transport:'local HTTPS, PGlite, synthetic Auth'};
    }catch(error){
      for(const [index,ctx] of contexts.entries()){const page=ctx.pages()[0];await page?.screenshot({path:join(artifacts,'admission-failure-'+index+'.png')});}
      throw error;
    }finally{
      await Promise.all(contexts.map(context=>context.close()));
      await fixture.pg.close();
    }
  });
  await check('injected-IndexedDB-quota-failure-keeps-prior-snapshot',async()=>{
    const ctx=await context(),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();await page.locator('h1').waitFor();
    const before=await state(page),cdp=await ctx.newCDPSession(page);await more(page,'orders');await click(page,'[data-action="area-menu"]');await click(page,'[data-supply-command="paste"]');await page.evaluate(()=>{window.qaOriginalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Synthetic quota exhausted','QuotaExceededError');};});
    await page.locator('[name="source"]').fill('Q'.repeat(100000));await page.getByText(/No se guardó la operación/).first().waitFor();
    assert.deepEqual(business(await state(page)),business(before));await page.screenshot({path:join(artifacts,'native-quota-write-blocked.png')});
    await page.evaluate(()=>{IDBObjectStore.prototype.put=window.qaOriginalPut;});await page.reload();await page.locator('h1').waitFor();assert.deepEqual(business(await state(page)),business(before));await ctx.close();return {quotaSource:'injected IndexedDB put error; actual disk exhaustion not reproduced',previousSnapshotPreserved:true,reopenAfterSpaceRecovered:true};
  });
  await check('reduced-height-checkout-focus-and-manifest-paths',async()=>{
    const ctx=await context(),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();await page.locator('h1').waitFor();
    await click(page,'[data-go="sale"]');await click(page,'[data-add="p1"]');await click(page,'[data-action="pay"]');await page.setViewportSize({width:390,height:500});await page.locator('#received').focus();await page.locator('#received').fill('3500');await page.locator('[data-action="confirm"]').scrollIntoViewIfNeeded();
    const rect=await page.locator('[data-action="confirm"]').boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=500);assert.ok(rect.height>=44);await page.screenshot({path:join(artifacts,'reduced-height-checkout.png')});
    const manifest=await page.evaluate(async()=>{const url=new URL(document.querySelector('link[rel="manifest"]').href),m=await(await fetch(url)).json();return {...m,resolvedStart:new URL(m.start_url,url).pathname,resolvedScope:new URL(m.scope,url).pathname};});assert.equal(manifest.resolvedStart,'/mora-vineria/');assert.equal(manifest.resolvedScope,'/mora-vineria/');assert.equal(manifest.display,'standalone');assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
    await ctx.close();return {simulatedKeyboard:'reduced viewport only, not a physical OS keyboard',confirmVisible:true,manifest};
  });
  await check('active-IndexedDB-resume-and-two-connections',async()=>{
    const ctx=await context(),page=await open(ctx);
    const detail=await page.evaluate(async()=>{
      const {openWorkspaceStore}=await import('./workspace-store.js');
      const a=await openWorkspaceStore({name:'qa-workspace'}),b=await openWorkspaceStore({name:'qa-workspace'});await a.load();await b.load();
      const command={id:'idb_expense',kind:'movement',payload:{kind:'expense',amount:100,account:'cash',note:'QA IDB'},at:'2026-10-31T12:00:00Z'};
      await a.stage(command);a.close();b.close();const reopened=await openWorkspaceStore({name:'qa-workspace'});await reopened.load();
      for(let i=0;i<100;i++)await reopened.stage(command);
      const result=reopened.current();reopened.close();
      return {movements:result.data.ledger.length,amount:result.data.ledger[0].legs[0].amount,operations:result.data.operations.length,jobs:result.jobs.length};
    });
    assert.deepEqual(detail,{movements:1,amount:-100,operations:1,jobs:1});await ctx.close();return {...detail,activeInApp:true};
  });
  await check('incompatible-IndexedDB-raw-copy-preserves-source-and-redacts-access',async()=>{
    const ctx=await context(),first=await open(ctx);await data(first);await choose(first,fixture);await click(first,'[data-action="restore-json"]');const original=await state(first);await first.close();
    const setup=await ctx.newPage();await setup.goto(origin.origin+'/legacy.html');await setup.evaluate(async()=>{const db=await new Promise((r,j)=>{const q=indexedDB.open('mora.workspace.rc2');q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});await new Promise((r,j)=>{const tx=db.transaction('workspace','readwrite'),t=tx.objectStore('workspace'),q=t.get('current');q.onsuccess=()=>{const w=q.result;w.version=99;w.session={access_token:'RECOVERY_PRIVATE_AUTH'};w.identity={deviceKey:'RECOVERY_PRIVATE_DEVICE'};t.put(w,'current');};tx.oncomplete=r;tx.onabort=()=>j(tx.error);});db.close();});await setup.close();
    const page=await open(ctx);await data(page);await page.getByText('No pudimos leer el resumen',{exact:true}).waitFor();const pending=page.waitForEvent('download');await click(page,'[data-action="export-raw"]');const file=await pending,path=join(artifacts,'incompatible-workspace-for-assistance.json');await file.saveAs(path);const raw=await readFile(path,'utf8');assert.doesNotMatch(raw,/RECOVERY_PRIVATE/);const copy=JSON.parse(raw);assert.equal(copy.needsAssistance,true);assert.equal(copy.workspace.version,99);assert.deepEqual(copy.workspace.data,original);assert.deepEqual(await state(page),original);await assert.rejects(readWorkspaceBackup(raw));await page.screenshot({path:join(artifacts,'incompatible-workspace-recovery.png')});await ctx.close();return {readOnly:true,accessCredentialsExcluded:true,requiresAssistance:true};
  });
  await check('native-A4-PDF-generated-by-Chromium',async()=>{
    const ctx=await context(430),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');
    await more(page,'reports');await click(page,'[data-report="period"][data-period="month"]');await page.locator('#report-month').fill('2026-10');
    await click(page,'[data-report="print-view"]');await page.locator('.monthly-print').waitFor();
    assert.match(await page.locator('.monthly-print').innerText(),/Octubre de 2026/);
    await page.pdf({path:join(artifacts,'Mora-informe-mensual-QA-A4.pdf'),format:'A4',preferCSSPageSize:true,printBackground:true});
    await page.screenshot({path:join(artifacts,'monthly-print-screen.png')});await ctx.close();return {file:'Mora-informe-mensual-QA-A4.pdf',nativePrintEngine:true};
  });
  assert.deepEqual(errors,[]);
}catch(error){process.exitCode=1;console.error(error.stack);}finally{
  await writeFile(join(artifacts,'results.json'),JSON.stringify({browser:await browser.version(),environment:'Isolated local HTTPS fixture certificate; desktop emulation, not physical phones',results,applicationErrors:errors},null,2));
  await browser.close();await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));
}
