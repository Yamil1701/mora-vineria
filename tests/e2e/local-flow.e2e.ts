import { test, expect, type Page } from '@playwright/test';
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
}
async function openCash(page: Page, name = 'Cerveza QA') {
  await page.getByRole('button', { name: 'Ventas', exact: true }).click();
  await page.getByRole('button', { name: `Agregar ${name}`, exact: true }).click();
  await expect(page.getByText('Venta en preparación', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
}
async function storeCount(page: Page, store: string): Promise<number> {
  return page.evaluate(async storeName => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('mora-v2:local-workspace:v1:this-browser'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try { return await new Promise<number>((resolve, reject) => { const request = db.transaction(storeName).objectStore(storeName).count(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
    finally { db.close(); }
  }, store);
}

test('demo stays in memory; local FIFO cash flow survives reload and shows responsive content', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('./'); await expect(page.getByText('DEMOSTRACIÓN', { exact: false })).toBeVisible();
  expect((await page.evaluate(() => indexedDB.databases())).some(d => d.name?.startsWith('mora-v2:'))).toBe(false);
  await page.goto(local); await expect(page.getByText('Modo local · Registros aislados')).toBeVisible();
  await addProduct(page);
  await page.getByRole('button', { name: 'Stock inicial', exact: true }).click();
  await page.getByLabel('Unidades individuales').fill('2'); await page.getByLabel('Costo total de estas unidades $').fill('4000');
  await page.getByLabel('Comprobé las unidades físicas').check(); await page.getByRole('button', { name: 'Guardar stock inicial', exact: true }).click();
  await expect(page.getByText('Unidades y costo guardados en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recibir mercadería', exact: true }).click();
  await page.getByLabel('Unidades individuales').fill('3'); await page.getByLabel('Costo total de estas unidades $').fill('7500');
  await page.getByLabel('Recibí estas unidades y pagué este total en efectivo').check();
  await page.getByRole('button', { name: 'Guardar recepción y pago', exact: true }).click();
  await expect(page.getByText('Unidades y costo guardados en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ventas', exact: true }).click(); await page.getByRole('button', { name: 'Agregar Cerveza QA', exact: true }).click();
  await expect(page.getByText('Venta en preparación')).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Ventas', exact: true }).click();
  await expect(page.getByText('Venta en preparación')).toBeVisible();
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Agregar una unidad de Cerveza QA', exact: true }).click(); await expect(page.getByLabel(`${i + 2} unidades`, { exact: true })).toBeVisible(); }
  await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
  await page.getByLabel('Efectivo recibido $ (opcional)').pressSequentially('20000', { delay: 5 });
  await expect(page.getByText('Vuelto:', { exact: false })).toContainText('6.000');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByText('Venta guardada en este equipo.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reportes', exact: true }).click(); await page.getByText(/Venta ·/).click();
  await expect(page.getByText('Costo:', { exact: false })).toContainText('9.000');
  expect(await storeCount(page, 'sales')).toBe(1); expect(await storeCount(page, 'outbox')).toBe(4);
  await page.reload(); await page.getByRole('button', { name: 'Productos', exact: true }).click();
  await expect(page.getByText('1 un. registradas · objetivo 24')).toBeVisible();
  for (const width of [360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.goto('./'); await expect(page.getByText('DEMOSTRACIÓN', { exact: false })).toBeVisible(); expect(await storeCount(page, 'sales')).toBe(1); expect(errors).toEqual([]);
});

test('short cash keeps draft editable; no-stock physical sale is saved with unknown cost', async ({ page }) => {
  await page.goto(local); await addProduct(page); await openCash(page);
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('1000');
  await expect(page.getByText('Vuelto:', { exact: false })).toContainText('—');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('no alcanza'); expect(await storeCount(page, 'sales')).toBe(0);
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('5000');
  await expect(page.getByText('Vuelto:', { exact: false })).toContainText('1.500');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByText('Venta guardada en este equipo. Hay stock o costo para revisar.')).toBeVisible();
  await page.getByRole('button', { name: 'Reportes', exact: true }).click(); await page.getByText(/Venta ·/).click();
  await expect(page.getByText('Costo: No calculable', { exact: true })).toBeVisible(); expect(await storeCount(page, 'reviews')).toBe(2);
  await page.getByRole('button', { name: 'Productos', exact: true }).click(); await expect(page.getByText('-1 un. registradas · objetivo 24')).toBeVisible();
});

test('installed shell reloads offline with persistent draft and preserves manual edits', async ({ page, context }) => {
  await page.goto(local); await addProduct(page);
  await page.getByRole('button', { name: 'Editar', exact: true }).click(); await page.getByLabel('Precio $', { exact: true }).fill('4000');
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click(); await expect(page.getByText('Producto guardado en este equipo.', { exact: true })).toBeVisible();
  await openCash(page);
  await page.getByLabel('Efectivo recibido $ (opcional)').fill('5000'); await expect(page.getByText('Vuelto:', { exact: false })).toContainText('1.000');
  // Wait for active SW and precached shell before making this isolated browser offline.
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload(); await page.getByRole('button', { name: 'Ventas', exact: true }).click(); await expect(page.getByText('Venta en preparación')).toBeVisible();
  await context.setOffline(true); await page.reload(); await page.getByRole('button', { name: 'Ventas', exact: true }).click();
  await expect(page.getByText('Venta en preparación')).toBeVisible(); await page.getByRole('button', { name: 'Cobrar', exact: true }).click();
  await expect(page.getByLabel('Efectivo recibido $ (opcional)')).toHaveValue('5000');
  await page.getByRole('button', { name: 'Guardar venta en efectivo', exact: true }).click();
  await expect(page.getByText('Venta guardada en este equipo. Hay stock o costo para revisar.')).toBeVisible(); expect(await storeCount(page, 'sales')).toBe(1);
});
