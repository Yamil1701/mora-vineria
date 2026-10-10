import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function stores(page:Page) {
  return page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('mora-v2:local-workspace:v1:this-browser');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    try { const names=Array.from(db.objectStoreNames),tx=db.transaction(names); return Object.fromEntries(await Promise.all(names.map(async name=>[name,await new Promise<unknown[]>((resolve,reject)=>{const r=tx.objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);})]))); }finally{db.close();}
  });
}
async function fixture(page:Page) {
  await page.goto('./');
  await page.getByRole('button',{name:'Productos',exact:true}).click();
  await page.getByRole('button',{name:'Agregar producto',exact:true}).click();
  await page.getByLabel('Nombre',{exact:true}).fill('Cerveza backup QA');
  await page.getByLabel('Precio $',{exact:true}).fill('3500');
  await page.getByLabel('Objetivo de unidades').fill('24');
  await page.getByLabel('Categoría (opcional)').fill('Cervezas');
  await page.getByRole('button',{name:'Guardar producto',exact:true}).click();
  await page.getByRole('button',{name:'Cerrar confirmación',exact:true}).click();
  await page.getByRole('button',{name:'Marcar favorito',exact:true}).click();
  await page.getByRole('button',{name:'Registrar compra',exact:true}).click();
  await page.getByLabel('Unidades individuales').fill('6');
  await page.getByLabel('Costo total de estas unidades $').fill('125000');
  await page.getByLabel('Recibí estas unidades y pagué este total en efectivo').check();
  await page.getByRole('button',{name:'Guardar recepción y pago',exact:true}).click();
  await page.getByRole('button',{name:'Cerrar confirmación',exact:true}).click();
  await page.getByRole('button',{name:'Ventas',exact:true}).click();
  await page.getByRole('button',{name:'Agregar Cerveza backup QA',exact:true}).click();
  await page.getByRole('button',{name:'Cobrar',exact:true}).click();
  await page.getByRole('button',{name:'Guardar venta en efectivo',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Venta guardada',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Nueva venta',exact:true}).click();
  await page.getByRole('button',{name:'Agregar Cerveza backup QA',exact:true}).click();
  await page.getByRole('button',{name:'Cobrar',exact:true}).click();
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('5000');
  await expect(page.locator('.m2-cash-row')).toContainText('1.500');
  await page.getByRole('button',{name:'Inicio',exact:true}).click();
}
async function open(page:Page) { await page.getByRole('button',{name:'Backup y restauración',exact:true}).click(); await expect(page.getByRole('dialog',{name:'Backup y restauración'})).toBeVisible(); }
async function download(page:Page) {
  await page.getByRole('button',{name:'Preparar respaldo',exact:true}).click();
  const pending=page.waitForEvent('download'); await page.getByRole('link',{name:'Descargar JSON',exact:true}).click();
  const file=await pending; expect(file.suggestedFilename()).toMatch(/^mora-vineria-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path=await file.path(); expect(path).toBeTruthy(); return readFile(path!);
}

test('download, verified preview, explicit restore offline into a new profile, exact records and persistent FIFO',async({page,browser})=>{
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await fixture(page); await open(page); const buffer=await download(page), backup=JSON.parse(buffer.toString());
  expect(backup.data.sales).toHaveLength(1); expect(backup.data.sales[0].cost).toEqual({numerator:'62500',denominator:'3'});
  expect(backup.data.drafts.find((d:{consumedBy:string|null})=>!d.consumedBy).received).toBe(5000);
  const before=await stores(page);
  await page.getByLabel('Elegir respaldo JSON').setInputFiles({name:'valid.json',mimeType:'application/json',buffer});
  await expect(page.getByRole('region',{name:'Vista previa del respaldo'})).toContainText('Respaldo verificado');
  await expect(page.getByRole('alert')).toContainText('ya tiene datos'); await expect(page.getByRole('button',{name:'Restaurar respaldo',exact:true})).toHaveCount(0);
  expect(await stores(page)).toEqual(before);
  await page.getByLabel('Elegir respaldo JSON').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{')});
  await expect(page.getByRole('alert')).toContainText('JSON'); await expect(page.getByRole('region',{name:'Vista previa del respaldo'})).toHaveCount(0); expect(await stores(page)).toEqual(before);
  const target=await browser.newContext({viewport:{width:390,height:844},baseURL:test.info().project.use.baseURL});
  try {
    const restored=await target.newPage(); restored.on('pageerror',e=>errors.push(e.message));restored.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await restored.goto('./'); await expect(restored).toHaveTitle(/Mora/); await restored.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await target.setOffline(true); await open(restored);
    await restored.getByLabel('Elegir respaldo JSON').setInputFiles({name:'valid.json',mimeType:'application/json',buffer});
    const preview=restored.getByRole('region',{name:'Vista previa del respaldo'}); await expect(preview).toContainText('Respaldo verificado');
    await expect(restored.getByRole('button',{name:'Restaurar respaldo',exact:true})).toBeDisabled();
    for(const width of [360,390,430,1280]) {
      await restored.setViewportSize({width,height:844});
      expect(await restored.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const layout=await restored.getByRole('dialog').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));
      // Chromium may round dialog border/scroll metrics by one CSS pixel.
      expect(layout.scroll).toBeLessThanOrEqual(layout.client+1);
    }
    await restored.setViewportSize({width:390,height:844});
    await restored.getByLabel('Confirmo recuperar este respaldo en este espacio vacío.').check();
    await restored.screenshot({path:'/tmp/mora-backup-preview.png',fullPage:false});
    await restored.getByRole('button',{name:'Restaurar respaldo',exact:true}).click();
    await expect(restored.getByRole('status').filter({hasText:'Datos recuperados'})).toBeVisible();
    const after=await stores(restored);
    for(const name of Object.keys(backup.data)) if(name!=='metadata') expect(after[name]).toEqual(backup.data[name]);
    await restored.getByRole('button',{name:'Cerrar',exact:true}).click();
    await restored.reload(); await expect(restored.getByText('Sin conexión · guardado en este equipo · Sin sincronización',{exact:true})).toBeVisible();
    await restored.getByRole('button',{name:'Productos',exact:true}).click(); await expect(restored.locator('.m2-stockpill')).toHaveText('5 un.');
    await restored.getByRole('button',{name:'Ventas',exact:true}).click(); await restored.getByRole('button',{name:'Cobrar',exact:true}).click();
    await expect(restored.getByLabel('Efectivo recibido $ (opcional)')).toHaveValue('5000');
    await restored.getByRole('button',{name:'Guardar venta en efectivo',exact:true}).click();
    await expect(restored.getByRole('heading',{name:'Venta guardada',exact:true})).toBeVisible();
    expect((await stores(restored)).sales).toHaveLength(2);
    await restored.getByRole('button',{name:'Inicio',exact:true}).click(); await open(restored); const again=JSON.parse((await download(restored)).toString());
    expect(again.data.commands.filter((c:{deviceId:string})=>c.deviceId===again.data.metadata[0].deviceId)).toHaveLength(1);
    expect(errors).toEqual([]);
  } finally { await target.close(); }
});

test('native storage failure rolls restoration back, then retry imports all records once',async({page,browser})=>{
  await fixture(page); await open(page); const buffer=await download(page),context=await browser.newContext({baseURL:test.info().project.use.baseURL});
  try {
    const target=await context.newPage(); await target.goto('./'); await open(target);
    const before=await stores(target);
    await target.getByLabel('Elegir respaldo JSON').setInputFiles({name:'valid.json',mimeType:'application/json',buffer});
    await target.getByLabel('Confirmo recuperar este respaldo en este espacio vacío.').check();
    await target.evaluate(()=>{const original=IDBObjectStore.prototype.add; IDBObjectStore.prototype.add=function(...args:Parameters<IDBObjectStore['add']>){if(this.name==='preferences'){IDBObjectStore.prototype.add=original;throw new DOMException('QA disk full','QuotaExceededError');}return original.apply(this,args);};});
    await target.getByRole('button',{name:'Restaurar respaldo',exact:true}).click(); await expect(target.getByRole('alert')).toContainText('No queda espacio');
    expect(await stores(target)).toEqual(before);
    await target.getByRole('button',{name:'Restaurar respaldo',exact:true}).click(); await expect(target.getByRole('status').filter({hasText:'Datos recuperados'})).toBeVisible();
    const after=await stores(target); expect(after.sales).toHaveLength(1);expect(after.receipts).toHaveLength(1); expect(after.commands).toHaveLength(3);
  }finally{await context.close();}
});
