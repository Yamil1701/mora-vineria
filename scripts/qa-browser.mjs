import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { build, createServer, preview } from 'vite';
import { crearFixtures } from './qa-fixtures.mjs';
import { verificarInteracciones } from './qa-interacciones.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.MORA_PLAYWRIGHT_MODULE ?? 'playwright');
// Este runner nunca recibe credenciales de producción ni navega fuera de localhost.
process.env.VITE_SYNC_ENABLED='false';
process.env.VITE_SUPABASE_URL='';
process.env.VITE_SUPABASE_PUBLISHABLE_KEY='';
process.env.VITE_TURNSTILE_SITE_KEY='';
const out=resolve(process.env.MORA_QA_OUTPUT ?? '/tmp/mora-qa-resultados');
await mkdir(out,{recursive:true});
const modo=process.env.MORA_QA_MODE ?? 'dev';
const quick=process.env.MORA_QA_QUICK==='true';
const rutasElegidas=process.env.MORA_QA_ROUTES ? JSON.parse(process.env.MORA_QA_ROUTES) : null;
const temasElegidos=process.env.MORA_QA_THEMES ? JSON.parse(process.env.MORA_QA_THEMES) : null;
const anchosElegidos=process.env.MORA_QA_WIDTHS ? JSON.parse(process.env.MORA_QA_WIDTHS) : null;
const soloInteracciones=process.env.MORA_QA_INTERACTIONS==='true';
let server;
if(modo==='build'){
  await build({build:{outDir:resolve(out,'build'),emptyOutDir:true}});
  server=await preview({build:{outDir:resolve(out,'build')},preview:{host:'127.0.0.1',port:5173,strictPort:true}});
}else {server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});await server.listen();}
const browser=await chromium.launch({headless:true,...(process.env.MORA_CHROME_PATH?{executablePath:process.env.MORA_CHROME_PATH,args:['--no-sandbox','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
const context=await browser.newContext({viewport:{width:375,height:900},timezoneId:'America/Argentina/Buenos_Aires',reducedMotion:'reduce',acceptDownloads:true});
const page=await context.newPage();
const errores=[];
page.on('pageerror',error=>errores.push(error.message));
page.on('console',msg=>{if(msg.type()==='error')errores.push(msg.text());});
await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
await page.clock.setFixedTime(new Date('2026-10-08T01:00:00.000Z'));
const base='http://127.0.0.1:5173/mora-vineria/';
const resultados=[];
async function visitar(ruta){
  await page.goto(base+ruta,{waitUntil:"domcontentloaded"});
  await page.locator('main h1').first().waitFor();
  await page.waitForTimeout(90);
  assert.equal(await page.title(),'Mora Vinería');
}
async function tablas(nombres){return page.evaluate(async(nombres)=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('mora-vineria');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const resultado={};for(const nombre of nombres)resultado[nombre]=await new Promise((resolve,reject)=>{const r=db.transaction(nombre).objectStore(nombre).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close();return resultado;
},nombres);}
async function sembrar(){await page.evaluate(async(datos)=>{
  if(location.hostname!=='127.0.0.1')throw new Error('Fixtures solo para localhost');
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('mora-vineria');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const tx=db.transaction(Object.keys(datos),'readwrite');for(const [tabla,filas]of Object.entries(datos)){const store=tx.objectStore(tabla);store.clear();for(const fila of filas)store.put(fila)}await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
  const prefs=JSON.parse(localStorage.getItem('mora-vineria-ui')??'{"state":{}}');prefs.state.ultimoPdfMensualAtendido='2026-09';localStorage.setItem('mora-vineria-ui',JSON.stringify(prefs));
},crearFixtures());}
async function tema(valor){await page.evaluate(valor=>{const prefs=JSON.parse(localStorage.getItem('mora-vineria-ui')??'{"state":{}}');prefs.state.tema=valor;localStorage.setItem('mora-vineria-ui',JSON.stringify(prefs));},valor);}
async function inspeccionar(ruta,ancho,tema,estado,capturar){
  await page.setViewportSize({width:ancho,height:900});
  await visitar(ruta);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const blanco=!(await page.locator('main').innerText()).trim();
  const overlay=await page.locator('vite-error-overlay').count();
  const recortados=await page.locator('input,select,textarea').evaluateAll(nodos=>nodos.filter(n=>n.getBoundingClientRect().width>0&&(n.getBoundingClientRect().right>innerWidth+1||n.getBoundingClientRect().left< -1)).map(n=>n.id||n.getAttribute('aria-label')||n.tagName));
  const desbordados=overflow?await page.locator('main *').evaluateAll(n=>n.filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,clase:e.className,texto:e.textContent?.slice(0,60)}))):[];
  const fila={desbordados,ruta:ruta||'inicio',ancho,tema,estado,overflow,blanco,overlay,recortados};resultados.push(fila);
  if(capturar)await page.screenshot({path:resolve(out,`${estado}-${tema}-${ancho}-${(ruta||'inicio').replaceAll('/','_').replaceAll('?','_')}.png`),fullPage:true});
}
const principales=['','ventas','productos','movimientos','tesoreria','reportes','proyecciones','mas'];
const otras=['ventas/nueva','productos/nuevo','productos/categorias','productos/qa-producto-0','productos/qa-producto-0/editar','ventas/qa-venta-0','movimientos/nuevo?tipo=reposicion','movimientos/nuevo?tipo=otro','movimientos/qa-movimiento-0','movimientos/qa-movimiento-0/editar','tesoreria/configurar','tesoreria/cuentas/nueva','tesoreria/operacion','tesoreria/conteo','reportes/pdf-mensual','configuracion','configuracion/dispositivo','configuracion/respaldos','configuracion/exportaciones','configuracion/sincronizacion','configuracion/sincronizacion/activar','configuracion/sincronizacion/vincular','configuracion/sincronizacion/recuperar','configuracion/sincronizacion/generar'];
try{
  await visitar('');
  for(const estado of (soloInteracciones?[]:quick?['poblado']:['vacio','poblado'])){
    if(estado==='poblado')await sembrar();
    for(const color of(temasElegidos??(quick?['oscuro']:['oscuro','claro']))){
      await tema(color);
      for(const ancho of(anchosElegidos??(quick?[375,1440]:[320,375,430,768,1024,1440]))){
        console.log(`Revisando ${estado}/${color}/${ancho}`);
        for(const ruta of(rutasElegidas??(quick?principales:[...principales,...otras]))){
          const capturar=process.env.MORA_QA_CAPTURE==='final' ? (ancho===375&&color==='oscuro'&&estado==='poblado')||(principales.includes(ruta)&&((ancho===1440&&estado==='poblado')||(ancho===375&&estado==='vacio'))) : (quick||ancho===375||ancho===1440)&&(principales.includes(ruta)||estado==='poblado'&&color==='oscuro');
          await inspeccionar(ruta,ancho,color,estado,capturar);
        }
      }
    }
  }
  if(process.env.MORA_QA_PRINT==='true'){await visitar('reportes/pdf-mensual');await page.emulateMedia({media:'print'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');await page.pdf({path:resolve(out,'reporte-ficticio.pdf'),format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});}
  if(process.env.MORA_AXE_SOURCE){
    const axe=await readFile(process.env.MORA_AXE_SOURCE,'utf8');const accesibilidad=[];
    for(const color of ['oscuro','claro']){await tema(color);for(const ruta of [...principales,'ventas/nueva','productos/nuevo','tesoreria/operacion','tesoreria/conteo']){
      await visitar(ruta);await page.addScriptTag({content:axe});
      const resultado=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>v.id)}});
      accesibilidad.push({ruta:ruta||'inicio',tema:color,...resultado});
    }}
    await writeFile(resolve(out,'accesibilidad.json'),JSON.stringify(accesibilidad,null,2));
    const violaciones=accesibilidad.filter(r=>r.violations.length);console.log(JSON.stringify({accesibilidad:accesibilidad.length,violaciones},null,2));assert.equal(violaciones.length,0,'Violaciones automáticas de accesibilidad');
  }
  if(soloInteracciones)await verificarInteracciones({page,context,visitar,sembrar,tablas,out,modo,actualizarBuild: async () => { await build({define:{__APP_VERSION__:JSON.stringify("1.0.0-QA-actualizacion")},build:{outDir:resolve(out,"build"),emptyOutDir:false}}); }});
  await writeFile(resolve(out,soloInteracciones?'consola-interacciones.json':'responsive.json'),JSON.stringify({resultados,errores},null,2));
  const problemas=resultados.filter(r=>r.overflow||r.blanco||r.overlay||r.recortados.length);
  console.log(JSON.stringify({pantallas:resultados.length,problemas,errores,evidencia:out},null,2));
  assert.equal(problemas.length,0,'Problemas de layout');
  assert.equal(errores.length,0,'Errores de consola');
}finally{await browser.close();if(server.close)await server.close();else await new Promise(resolve=>server.httpServer.close(resolve));}
