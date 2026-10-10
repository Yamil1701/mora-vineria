import { test, expect, type Page } from '@playwright/test';
import { previousDataset } from '../fixtures/previous-local';
const local = './?mode=local';
async function addProduct(page: Page, name = 'Cerveza QA') {
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await page.getByRole('button', { name: 'Agregar producto', exact: true }).click();
  await page.getByLabel('Nombre', { exact: true }).fill(name);
  await page.getByLabel('Presentación / variante').fill('355 ml');
  await page.getByLabel('Precio $', { exact: true }).fill('3500');
  await page.getByLabel('Objetivo de unidades').fill('24');
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
  await expect(page.getByText('Producto guardado en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar confirmación', exact: true }).click();
}
async function openCash(page: Page, name = 'Cerveza QA') {
  await page.getByRole('button', { name: 'Ventas', exact: true }).click();
  await page.getByRole('button', { name: `Agregar ${name}`, exact: true }).click();
  await expect(page.getByText('Venta en preparación', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
}
async function storeCount(page: Page, store: string): Promise<number> {
  return page.evaluate(async storeName => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('mora-v2:local-workspace:v1:this-browser'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try { return await new Promise<number>((resolve, reject) => { const request = db.transaction(storeName).objectStore(storeName).count(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
    finally { db.close(); }
  }, store);
}

test('single real UI and legacy link share persistent FIFO cash flow and responsive content', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('./'); await expect(page.getByText('Guardado en este equipo · Sin sincronización', { exact: true })).toBeVisible();
  expect(await storeCount(page, 'products')).toBe(0);
  await page.goto(local); await expect(page.getByText('Guardado en este equipo · Sin sincronización', { exact: true })).toBeVisible();
  await addProduct(page);
  await page.getByRole('button', { name: 'Stock inicial', exact: true }).click();
  await page.getByLabel('Unidades individuales').fill('2'); await page.getByLabel('Costo total de estas unidades $').fill('4000');
  await page.getByLabel('Comprobé las unidades físicas').check(); await page.getByRole('button', { name: 'Guardar stock inicial', exact: true }).click();
  await expect(page.getByText('Unidades y costo guardados en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar confirmación', exact: true }).click();
  await page.getByRole('button', { name: 'Recibir mercadería', exact: true }).click();
  await page.getByLabel('Unidades individuales').fill('3'); await page.getByLabel('Costo total de estas unidades $').fill('7500');
  await page.getByLabel('Recibí estas unidades y pagué este total en efectivo').check();
  await page.getByRole('button', { name: 'Guardar recepción y pago', exact: true }).click();
  await expect(page.getByText('Unidades y costo guardados en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar confirmación', exact: true }).click();
  await page.getByRole('button', { name: 'Ventas', exact: true }).click(); await page.getByRole('button', { name: 'Agregar Cerveza QA', exact: true }).click();
  await expect(page.getByText('Venta en preparación')).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Ventas', exact: true }).click();
  await expect(page.getByText('Venta en preparación')).toBeVisible();
  await page.getByRole('button', { name: /^Ver carrito:/ }).click();
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Agregar una unidad de Cerveza QA', exact: true }).click(); await expect(page.getByLabel(`${i + 2} unidades`, { exact: true })).toBeVisible(); }
  await page.getByRole('button', { name: 'Continuar al cobro', exact: false }).click();
  await page.getByLabel('Efectivo recibido $ (opcional)').pressSequentially('20000', { delay: 5 });
  await expect(page.locator('.m2-cash-row')).toContainText('6.000');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByText('Venta guardada en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reportes', exact: true }).click(); await page.locator('summary').filter({hasText:/Venta ·/}).click();
  await expect(page.getByText('Costo:', { exact: false })).toContainText('9.000');
  await expect(page.locator('.m2-report-metrics')).toContainText('5.000');
  await page.screenshot({path:'/tmp/mora-integrada-reportes-con-ventas.png',fullPage:true});
  expect(await storeCount(page, 'sales')).toBe(1); expect(await storeCount(page, 'outbox')).toBe(4);
  await page.reload(); await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await page.getByRole('button', { name: 'Ver Cerveza QA', exact: true }).click();
  await expect(page.locator('.m2-product-detail').getByText('1 un. registradas · objetivo 24', {exact:true})).toBeVisible();
  for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto('./'); await expect(page.getByText('Guardado en este equipo · Sin sincronización', { exact: true })).toBeVisible(); expect(await storeCount(page, 'sales')).toBe(1); expect(errors).toEqual([]);
});

test('short cash keeps draft editable; no-stock physical sale is saved with unknown cost', async ({ page }) => {
  await page.goto(local); await addProduct(page); await openCash(page);
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('1000');
  await expect(page.locator('.m2-cash-row')).toContainText('—');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('no alcanza'); expect(await storeCount(page, 'sales')).toBe(0);
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('5000');
  await expect(page.locator('.m2-cash-row')).toContainText('1.500');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByText('Venta guardada en este equipo. Hay stock o costo para revisar.')).toBeVisible();
  await page.getByRole('button', { name: 'Reportes', exact: true }).click(); await page.locator('summary').filter({hasText:/Venta ·/}).click();
  await expect(page.getByText('Costo: No calculable', { exact: true })).toBeVisible(); expect(await storeCount(page, 'reviews')).toBe(2);
  await page.getByRole('button', { name: 'Productos', exact: true }).click(); await page.getByRole('button', { name: 'Ver Cerveza QA', exact: true }).click(); await expect(page.locator('.m2-product-detail').getByText('-1 un. registradas · objetivo 24', {exact:true})).toBeVisible();
});

test('installed shell reloads offline with persistent draft and preserves manual edits', async ({ page, context }) => {
  await page.goto(local); await addProduct(page);
  await page.getByRole('button', { name: 'Editar', exact: true }).click(); await page.getByLabel('Precio $', { exact: true }).fill('4000');
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click(); await expect(page.getByText('Producto guardado en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar confirmación', exact: true }).click();
  await openCash(page);
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('5000'); await expect(page.locator('.m2-cash-row')).toContainText('1.000');
  // Wait for active SW and precached shell before making this isolated browser offline.
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); await page.getByRole('button', { name: 'Ventas', exact: true }).click(); await expect(page.getByText('Venta en preparación')).toBeVisible();
  await context.setOffline(true); await page.reload(); await page.getByRole('button', { name: 'Ventas', exact: true }).click();
  await expect(page.getByText('Venta en preparación')).toBeVisible(); await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
  await expect(page.getByLabel('Efectivo recibido $ (opcional)')).toHaveValue('5000');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByText('Venta guardada en este equipo. Hay stock o costo para revisar.')).toBeVisible(); expect(await storeCount(page, 'sales')).toBe(1);
});

async function readReceiptRecovery(page: Page): Promise<Record<string, unknown[]>> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const r = indexedDB.open('mora-v2:local-workspace:v1:this-browser'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    try {
      const names = ['writeIntents', 'receipts', 'lots', 'stockEntries', 'cashEntries', 'commands', 'results', 'outbox', 'metadata'];
      const tx = db.transaction(names);
      return Object.fromEntries(await Promise.all(names.map(async name => [name, await new Promise<unknown[]>((resolve, reject) => { const r = tx.objectStore(name).getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); })])));
    } finally { db.close(); }
  });
}
async function fillReceipt(page: Page) {
  await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await page.getByRole('button', { name: 'Ver Cerveza QA', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
  await page.getByLabel('Unidades individuales').fill('6');
  await page.getByLabel('Presentación de compra (opcional)').fill('fardo x6');
  await page.getByLabel('Costo total de estas unidades $').fill('125000');
  await page.getByLabel('Recibí estas unidades y pagué este total en efectivo').check();
}

test('receipt storage failure survives reload and closed page; two tabs retry the same sealed operation', async ({ page, context }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(local); await addProduct(page); await fillReceipt(page);
  // Real IDB transaction: fail at the cash write, after lot/stock writes, forcing rollback.
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args: Parameters<IDBObjectStore['add']>) {
      if (this.name === 'cashEntries') { IDBObjectStore.prototype.add = original; throw new DOMException('QA disk full', 'QuotaExceededError'); }
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Guardar recepción y pago', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recepción pendiente de confirmar', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('No queda espacio');
  const pending = await readReceiptRecovery(page);
  expect(pending.receipts).toHaveLength(0); expect(pending.lots).toHaveLength(0); expect(pending.cashEntries).toHaveLength(0); expect(pending.stockEntries).toHaveLength(0);
  await page.reload(); await expect(page.getByRole('heading', { name: 'Recepción pendiente de confirmar', exact: true })).toBeVisible();
  expect((await readReceiptRecovery(page)).writeIntents).toEqual(pending.writeIntents);
  await page.close(); const reopened = await context.newPage(), second = await context.newPage();
  await reopened.goto(local); await second.goto(local);
  for (const tab of [reopened, second]) await expect(tab.getByRole('button', { name: 'Reintentar confirmación', exact: true })).toBeVisible();
  await Promise.all([reopened, second].map(tab => tab.evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Reintentar confirmación');
    if (!button) throw new Error('Missing retry'); button.click();
  })));
  await expect(reopened.getByRole('heading', { name: 'Recepción confirmada en este equipo', exact: true })).toBeVisible();
  await expect(second.getByRole('heading', { name: 'Recepción confirmada en este equipo', exact: true })).toBeVisible();
  const confirmed = await readReceiptRecovery(reopened);
  for (const name of ['receipts', 'lots', 'stockEntries', 'cashEntries']) expect(confirmed[name]).toHaveLength(1);
  expect(confirmed.commands).toHaveLength(2); expect(confirmed.outbox).toHaveLength(2);
  expect(confirmed.writeIntents).toEqual(pending.writeIntents.map(intent => ({ ...(intent as object), status: 'confirmed' })));
  await reopened.reload(); await reopened.getByRole('button', { name: 'Productos', exact: true }).click(); await reopened.getByRole('button', { name: 'Ver Cerveza QA', exact: true }).click();
  await expect(reopened.getByRole('button', { name: 'Recibir mercadería', exact: true })).toBeDisabled();
  await reopened.setViewportSize({ width: 360, height: 844 });
  expect(await reopened.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await reopened.screenshot({ path: '/tmp/mora-receipt-confirmed.png', fullPage: false });
  await reopened.getByRole('button', { name: 'Cerrar confirmación', exact: true }).click();
  await expect(reopened.getByRole('button', { name: 'Recibir mercadería', exact: true })).toBeEnabled();
  expect((await readReceiptRecovery(reopened)).receipts).toHaveLength(1); expect(errors).toEqual([]);
});

test('reload immediately after receipt transaction commit recovers confirmed without duplicating payment', async ({ page }) => {
  await page.goto(local); await addProduct(page); await fillReceipt(page);
  // Close the UI outcome window on native transaction completion; no production fault switches.
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      const value = args[0];
      if (this.name === 'writeIntents' && value.status === 'confirmed' && value.command.type === 'ReceivePurchase') {
        IDBObjectStore.prototype.put = original;
        this.transaction.addEventListener('complete', () => location.reload(), { once: true });
      }
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Guardar recepción y pago', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recepción confirmada en este equipo', exact: true })).toBeVisible();
  await expect(page.getByText('Ya guardada en este equipo. Sus efectos no se vuelven a aplicar.', { exact: true })).toBeVisible();
  const result = await readReceiptRecovery(page);
  for (const name of ['receipts', 'lots', 'stockEntries', 'cashEntries']) expect(result[name]).toHaveLength(1);
  expect(result.commands).toHaveLength(2); expect(result.outbox).toHaveLength(2);
  await page.reload(); expect(await readReceiptRecovery(page)).toEqual(result);
});

test('approved surfaces, favorites, search, categories, optional cart and accessible forms at 360/390/430', async ({page}) => {
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  await page.goto('./');
  await page.getByRole('button',{name:'Productos',exact:true}).click();
  await page.getByRole('button',{name:'Agregar producto',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Agregar producto',exact:true}); await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Nombre',{exact:true})).toBeFocused();
  await page.keyboard.press('Shift+Tab'); expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog'))).toBe(true);
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(page.getByRole('button',{name:'Agregar producto',exact:true})).toBeFocused();
  await addProduct(page,'Cerveza móvil');
  await page.getByRole('button',{name:'Editar',exact:true}).click(); await page.getByLabel('Categoría (opcional)').fill('Cervezas');
  await page.getByRole('button',{name:'Guardar producto',exact:true}).click(); await page.getByRole('button',{name:'Cerrar confirmación',exact:true}).click();
  await page.getByRole('button',{name:'Stock inicial',exact:true}).click(); await page.getByLabel('Unidades individuales').fill('10'); await page.getByLabel('Costo total de estas unidades $').fill('20000'); await page.getByLabel('Comprobé las unidades físicas').check(); await page.getByRole('button',{name:'Guardar stock inicial',exact:true}).click(); await page.getByRole('button',{name:'Cerrar confirmación',exact:true}).click();
  await page.getByRole('button',{name:'Marcar favorito',exact:true}).click(); await expect(page.getByRole('button',{name:'Quitar favorito',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.reload(); await page.getByRole('button',{name:'Ventas',exact:true}).click(); await expect(page.getByRole('button',{name:'Agregar favorito Cerveza móvil',exact:true})).toBeVisible();
  await page.getByLabel('Buscar producto',{exact:true}).fill('no existe'); await expect(page.getByText('Sin productos disponibles',{exact:true})).toBeVisible(); await page.getByLabel('Buscar producto',{exact:true}).fill('');
  await page.getByRole('button',{name:'Cervezas',exact:true}).click(); await expect(page.getByRole('button',{name:'Cervezas',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Todos',exact:true}).click(); await page.getByRole('button',{name:'Agregar favorito Cerveza móvil',exact:true}).click(); await expect(page.getByText('Venta en preparación',{exact:false})).toBeVisible();
  for(const width of [360,390,430]) {
    await page.setViewportSize({width,height:844});
    await page.getByRole('button',{name:'Inicio',exact:true}).click(); expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({path:`/tmp/mora-integrada-inicio-${width}.png`});
    await page.getByRole('button',{name:'Ventas',exact:true}).click(); expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({path:`/tmp/mora-integrada-ventas-${width}.png`});
    const background=await page.evaluate(()=>getComputedStyle(document.body,'::before').backgroundImage); expect(background).toContain('fondo-nocturno-fucsia');
    await page.getByRole('button',{name:/^Ver carrito:/}).click(); await expect(page.getByRole('heading',{name:'Carrito',exact:true})).toBeVisible(); expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({path:`/tmp/mora-integrada-carrito-${width}.png`});
    await page.getByRole('button',{name:'Continuar al cobro',exact:false}).click(); await expect(page.getByRole('button',{name:'Transferencia',exact:false})).toBeDisabled(); const saveBox=await page.getByRole('button',{name:'Guardar venta en efectivo',exact:true}).boundingBox(), navBox=await page.getByRole('navigation',{name:'Navegación principal'}).boundingBox(); expect(saveBox!.y+saveBox!.height).toBeLessThanOrEqual(navBox!.y); expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({path:`/tmp/mora-integrada-cobro-${width}.png`});
    await page.getByRole('button',{name:'Productos',exact:true}).click(); expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({path:`/tmp/mora-integrada-productos-${width}.png`});
    await page.getByRole('button',{name:'Reportes',exact:true}).click(); await page.getByRole('button',{name:'Semana',exact:true}).click(); await expect(page.getByText('Sin ventas en este período.',{exact:true})).toBeVisible(); expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({path:`/tmp/mora-integrada-reportes-${width}.png`});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button',{name:'Ventas',exact:true}).click(); await page.getByRole('button',{name:'Cobrar',exact:true}).click();
  await page.getByRole('button',{name:'Guardar venta en efectivo',exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
  await expect(page.getByRole('heading',{name:'Venta guardada',exact:true})).toBeVisible(); expect(await storeCount(page,'sales')).toBe(1);
  await page.getByRole('button',{name:'Nueva venta',exact:true}).click(); await expect(page.getByRole('heading',{name:'Nueva venta',exact:true})).toBeVisible(); await expect(page.getByRole('region',{name:'Resumen del carrito'})).not.toBeVisible();
  await page.getByRole('button',{name:'Historial de ventas',exact:true}).click(); await expect(page.locator('summary').filter({hasText:/Venta ·/})).toHaveCount(1); expect(errors).toEqual([]);
});

test('native IndexedDB upgrade keeps complete previous dataset and resumes same receipt and sale draft', async ({page}) => {
  const fixture=await previousDataset();
  await page.route('**/mora-vineria/qa-seed',route=>route.fulfill({contentType:'text/html',body:'<title>Isolated QA context</title>'}));
  await page.goto('./qa-seed');
  await page.evaluate(async stores=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('mora-v2:local-workspace:v1:this-browser',20);request.onupgradeneeded=()=>{for(const s of stores){const store=request.result.createObjectStore(s.name,{keyPath:s.keyPath});for(const i of s.indexes) store.createIndex(i.name,i.keyPath,{unique:i.unique,multiEntry:i.multiEntry});}};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction(stores.map(s=>s.name),'readwrite');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);for(const s of stores)for(const row of s.rows)tx.objectStore(s.name).add(row);}); db.close();
  },fixture.stores);
  await page.goto('./'); await expect(page.getByRole('heading',{name:'Recepción pendiente de confirmar',exact:true})).toBeVisible();
  const unchanged=await page.evaluate(async names=>{const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open('mora-v2:local-workspace:v1:this-browser');r.onsuccess=()=>resolve(r.result);});try{const tx=db.transaction(names);return await Promise.all(names.map(name=>new Promise<unknown[]>(resolve=>{const r=tx.objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);})));}finally{db.close();}},fixture.stores.map(s=>s.name));
  fixture.stores.forEach((s,i)=>expect(unchanged[i]).toEqual(s.name==='metadata'?s.rows.map(row=>({...row,schemaVersion:3})):s.rows));
  await page.getByRole('button',{name:'Reintentar confirmación',exact:true}).click(); await expect(page.getByRole('heading',{name:'Recepción confirmada en este equipo',exact:true})).toBeVisible();
  const recovery=await readReceiptRecovery(page); expect(recovery.receipts).toHaveLength(2); expect((recovery.writeIntents[0] as {command:{id:string}}).command.id).toBe(fixture.commandId);
  await page.getByRole('button',{name:'Cerrar confirmación',exact:true}).click();
  await page.getByRole('button',{name:'Ventas',exact:true}).click(); await page.getByRole('button',{name:'Cobrar',exact:true}).click(); await expect(page.getByLabel('Efectivo recibido $ (opcional)')).toHaveValue('5000');
  await page.getByRole('button',{name:'Guardar venta en efectivo',exact:true}).click(); await expect(page.getByRole('heading',{name:'Venta guardada',exact:true})).toBeVisible(); expect(await storeCount(page,'sales')).toBe(2);
});

test('cash commit failure seals stable sale payload; reload retry and double tap apply only once', async ({page}) => {
  await page.goto('./'); await addProduct(page); await openCash(page);
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('5000'); await expect(page.locator('.m2-cash-row')).toContainText('1.500');
  await page.evaluate(()=>{const original=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args:Parameters<IDBObjectStore['add']>){if(this.name==='cashEntries'){IDBObjectStore.prototype.add=original;throw new DOMException('QA storage full','QuotaExceededError');}return original.apply(this,args);};});
  await page.getByRole('button',{name:'Guardar venta en efectivo',exact:true}).click(); await expect(page.getByRole('alert')).toContainText('No queda espacio'); expect(await storeCount(page,'sales')).toBe(0);
  const sealed=await page.evaluate(async()=>{const db=await new Promise<IDBDatabase>(resolve=>{const r=indexedDB.open('mora-v2:local-workspace:v1:this-browser');r.onsuccess=()=>resolve(r.result);});try{return await new Promise<{submission:{id:string,payload:unknown}}[]>(resolve=>{const r=db.transaction('drafts').objectStore('drafts').getAll();r.onsuccess=()=>resolve(r.result);});}finally{db.close();}});
  await page.reload(); await page.getByRole('button',{name:'Ventas',exact:true}).click(); await expect(page.getByText(/Confirmación pendiente: reintentá/)).toBeVisible(); await expect(page.getByRole('button',{name:'Agregar Cerveza QA',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Cobrar',exact:true}).click(); await expect(page.getByText(/La confirmación quedó preparada/)).toBeVisible();
  await page.getByRole('button',{name:'Guardar venta en efectivo',exact:true}).evaluate((b:HTMLButtonElement)=>{b.click();b.click();}); await expect(page.getByRole('heading',{name:'Venta guardada',exact:true})).toBeVisible();
  const result=await readReceiptRecovery(page); expect(result.cashEntries).toHaveLength(1); expect(result.commands).toHaveLength(2); expect((result.commands as {id:string,payload:unknown}[]).find(c=>c.id===sealed[0].submission.id)?.payload).toEqual(sealed[0].submission.payload);
  await page.reload(); expect(await storeCount(page,'sales')).toBe(1); expect(await storeCount(page,'cashEntries')).toBe(1);
});

test('percentage alerts agree across home, product and sale catalogs, filters and reloads', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('./'); await expect(page).toHaveTitle(/Mora/);
  await addProduct(page);
  await page.getByRole('button', { name: 'Stock inicial', exact: true }).click();
  await page.getByLabel('Unidades individuales').fill('23');
  await page.getByLabel('Costo total de estas unidades $').fill('46000');
  await page.getByLabel('Comprobé las unidades físicas').check();
  await page.getByRole('button', { name: 'Guardar stock inicial', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar confirmación', exact: true }).click();

  async function verifyStock(quantity: number, alerts: boolean) {
    await page.getByRole('button', { name: 'Inicio', exact: true }).click();
    const rows = page.locator('.m2-replenish-row');
    await expect(rows).toHaveCount(alerts ? 1 : 0);
    if (alerts) await expect(rows).toContainText(`${quantity} un.`);
    else await expect(page.getByText('Sin productos con stock bajo.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ver todos', exact: false }).click();
    await expect(page.locator('.m2-catalog-row')).toHaveCount(alerts ? 1 : 0);
    await page.getByRole('button', { name: 'Productos', exact: true }).click();
    await expect(page.locator('.m2-stockpill')).toHaveText(`${quantity} un.`);
    await expect(page.locator('.m2-catalog-row--low')).toHaveCount(alerts ? 1 : 0);
    await expect(page.locator('.m2-stockpill--low')).toHaveCount(alerts ? 1 : 0);
    await page.getByRole('button', { name: 'Ventas', exact: true }).click();
    await expect(page.locator('.m2-catalog-row--low')).toHaveCount(alerts ? 1 : 0);
  }
  async function sell(units: number) {
    await page.getByRole('button', { name: 'Ventas', exact: true }).click();
    for (let i = 1; i <= units; i++) {
      await page.getByRole('button', { name: 'Agregar Cerveza QA', exact: true }).click();
      await expect(page.getByRole('button', { name: new RegExp(`^Ver carrito: ${i} unidades,`) })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Venta guardada', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Nueva venta', exact: true }).click();
  }
  await verifyStock(23, false);
  await sell(18); await verifyStock(5, false);
  await sell(1); await verifyStock(4, true);
  await page.reload(); await verifyStock(4, true);
  await sell(2); await verifyStock(2, true);
  await sell(3); await verifyStock(-1, true);
  // Alert reads and navigation must not change ledger/FIFO/payment records.
  const before = await readReceiptRecovery(page);
  for (const objective of ['0', '']) {
    await page.getByRole('button', { name: 'Productos', exact: true }).click();
    await page.getByRole('button', { name: 'Ver Cerveza QA', exact: true }).click();
    await page.getByRole('button', { name: 'Editar', exact: true }).click();
    await page.getByLabel('Objetivo de unidades').fill(objective);
    await page.getByRole('button', { name: 'Guardar producto', exact: true }).click();
    await page.getByRole('button', { name: 'Cerrar confirmación', exact: true }).click();
    await verifyStock(-1, false);
  }
  const after = await readReceiptRecovery(page);
  for (const name of ['lots', 'stockEntries', 'cashEntries', 'receipts']) expect(after[name]).toEqual(before[name]);
  expect(await storeCount(page, 'sales')).toBe(4);
  expect(errors).toEqual([]);
});
