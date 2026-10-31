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
import {readBackup,DATA_KEYS} from '../dist/local-data.js';
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
      let bytes=await readFile(file);if(name==='sw.js'&&update)bytes=Buffer.from(bytes.toString().replace('mora-shell-rc1','mora-shell-qa-update'));
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
async function check(name,fn){try{const detail=await fn();results.push({name,status:'passed',detail});console.log('PASS',name);}catch(e){results.push({name,status:'failed',error:e.stack});console.error('FAIL',name,e.message);const failedPage=browser.contexts().at(-1)?.pages().at(-1);if(failedPage){console.error('FAILED_SCREEN',await failedPage.locator('body').innerText());await failedPage.screenshot({path:join(artifacts,name+'-failure.png')});}throw e;}}
async function context(width=390){const c=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,ignoreHTTPSErrors:true,acceptDownloads:true});await c.addInitScript(()=>{navigator.serviceWorker?.addEventListener('controllerchange',()=>console.log('SW_CONTROLLER',navigator.serviceWorker.controller?.scriptURL));});return c;}
async function open(ctx,host=origin){const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('SW_'))console.log(m.text());});await page.goto(host.origin+'/mora-vineria/');await page.locator('h1').waitFor();return page;}
async function click(page,selector){await page.locator(selector).first().click();}
async function more(page,target){await click(page,'[data-go="more"]');await click(page,'[data-go="'+target+'"]');}
async function data(page){await more(page,'data');}
async function choose(page,file){await click(page,'[data-go="restore"]');const chooser=page.waitForEvent('filechooser');await click(page,'[data-action="choose-restore"]');await (await chooser).setFiles(file);await page.getByText('Archivo validado',{exact:true}).waitFor();}
async function download(page,name){const pending=page.waitForEvent('download');await click(page,'[data-action="export-json"]');const file=await pending,path=join(artifacts,name);await file.saveAs(path);return readBackup(await readFile(path,'utf8'));}
async function state(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('mora.local.rc1')).data);}
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
      for(const target of ['home','sales','cash','catalog','inventory','orders','reports','settings','data']){
        if(['home','sales','cash'].includes(target))await click(page,'[data-go="'+target+'"]');else await more(page,target);
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
    await page.locator('[data-update-now]').click();await page.waitForLoadState('domcontentloaded');await page.locator('h1').waitFor();
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
    await click(page,'[data-action="home"]');await click(page,'[data-go="sales"]');await click(page,'[data-go="debts"]');await click(page,`[data-wf="debt"][data-id="${debt.id}"]`);
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
  await check('native-browser-quota-exhaustion-keeps-prior-snapshot',async()=>{
    const ctx=await context(),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();await page.locator('h1').waitFor();await click(page,'[data-go="sale"]');
    const before=await page.evaluate(()=>localStorage.getItem('mora.local.rc1'));
    const quota=await page.evaluate(()=>{let low=0,high=6000000,rejections=0;while(high-low>1){const size=Math.floor((low+high)/2);try{localStorage.setItem('qa-native-quota','Q'.repeat(size));low=size;}catch(e){if(e.name!=='QuotaExceededError')throw e;high=size;rejections++;}}return {storedCharacters:low,rejections};});
    assert.ok(quota.rejections>0);await click(page,'[data-add="p1"]');await page.getByText(/No se guardó la operación/).first().waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('mora.local.rc1')),before);await page.screenshot({path:join(artifacts,'native-quota-write-blocked.png')});
    await page.evaluate(()=>localStorage.removeItem('qa-native-quota'));await page.reload();await page.locator('h1').waitFor();assert.deepEqual(business(await state(page)),business(JSON.parse(before).data));await ctx.close();return {...quota,previousSnapshotPreserved:true,reopenAfterSpaceRecovered:true};
  });
  await check('reduced-height-checkout-focus-and-manifest-paths',async()=>{
    const ctx=await context(),page=await open(ctx);await data(page);await choose(page,fixture);await click(page,'[data-action="restore-json"]');await page.reload();await page.locator('h1').waitFor();
    await click(page,'[data-go="sale"]');await click(page,'[data-add="p1"]');await click(page,'[data-action="pay"]');await page.setViewportSize({width:390,height:500});await page.locator('#received').focus();await page.locator('#received').fill('3500');await page.locator('[data-action="confirm"]').scrollIntoViewIfNeeded();
    const rect=await page.locator('[data-action="confirm"]').boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=500);assert.ok(rect.height>=44);await page.screenshot({path:join(artifacts,'reduced-height-checkout.png')});
    const manifest=await page.evaluate(async()=>{const url=new URL(document.querySelector('link[rel="manifest"]').href),m=await(await fetch(url)).json();return {...m,resolvedStart:new URL(m.start_url,url).pathname,resolvedScope:new URL(m.scope,url).pathname};});assert.equal(manifest.resolvedStart,'/mora-vineria/');assert.equal(manifest.resolvedScope,'/mora-vineria/');assert.equal(manifest.display,'standalone');assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
    await ctx.close();return {simulatedKeyboard:'reduced viewport only, not a physical OS keyboard',confirmVisible:true,manifest};
  });
  await check('real-IndexedDB-candidate-atomic-resume-and-two-connections',async()=>{
    const ctx=await context(),page=await open(ctx);
    const detail=await page.evaluate(async()=>{
      const {openAtomicStore}=await import('./idb-store.js');
      const {emptyData,backupText}=await import('./local-data.js');
      const {seeds}=await import('./catalog-data.js');
      const a=await openAtomicStore({name:'qa-atomic'}),b=await openAtomicStore({name:'qa-atomic'});
      const data={...emptyData(),products:[{...seeds[0],stock:0}]};
      await a.importIntoEmpty(backupText(data));
      let duplicateBlocked=false;try{await b.importIntoEmpty(backupText(data));}catch{duplicateBlocked=true;}
      const revision=(await a.load()).revision;
      await a.prepare({id:'idb_expense',kind:'movement',payload:{kind:'expense',amount:100,account:'cash',note:'QA IDB'},at:'2026-10-31T12:00:00Z'},revision);
      let staleBlocked=false;try{await b.prepare({id:'stale',kind:'movement',payload:{kind:'expense',amount:999,account:'cash',note:'QA'},at:'2026-10-31T12:00:00Z'},revision);}catch{staleBlocked=true;}
      a.close();b.close();const reopened=await openAtomicStore({name:'qa-atomic'});
      const prepared=await reopened.load();await Promise.all(Array.from({length:100},()=>reopened.confirm('idb_expense',prepared.revision)));
      const result=await reopened.load();reopened.close();
      return {duplicateBlocked,staleBlocked,revision:result.revision,movements:result.data.ledger.length,amount:result.data.ledger[0].legs[0].amount,operations:result.data.operations.length};
    });
    assert.deepEqual(detail,{duplicateBlocked:true,staleBlocked:true,revision:3,movements:1,amount:-100,operations:1});await ctx.close();return {...detail,activeInApp:false};
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
