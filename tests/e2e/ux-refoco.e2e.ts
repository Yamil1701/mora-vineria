import { test, expect } from '@playwright/test';

test('inicio prioriza decisiones reales y la navegación conserva cuatro destinos', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Mora Vinería', exact: true })).toBeVisible();
  await expect(page.getByText('Resumen de hoy', { exact: true })).toBeVisible();
  await expect(page.getByText('Ventas de hoy', { exact: true })).toBeVisible();
  await expect(page.getByText('Ganancia estimada', { exact: true })).toBeVisible();
  await expect(page.getByText('Para reponer', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Movimientos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Backup y restauración', exact: true })).toBeVisible();
  await expect(page.locator('.m2-demo-flag')).toHaveCount(0);
  await expect(page.locator('nav[aria-label="Navegación principal"] button')).toHaveCount(4);
  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  const disclosure = page.locator('.m2-report-disclosure').first();
  await expect(disclosure).not.toHaveAttribute('open', '');
  await disclosure.locator('summary').click();
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(disclosure.locator('.m2-money-summary')).toBeVisible();
  for (const width of [360,390,430]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('movimientos conserva acceso a gastos y conteos sin imponer ambos historiales abiertos', async ({page}) => {
  await page.goto('./');
  await page.getByRole('button', {name:'Movimientos', exact:true}).click();
  await expect(page.getByRole('heading', {name:'Movimientos', exact:true})).toBeVisible();
  await expect(page.getByRole('button', {name:'Registrar gasto',exact:true})).toBeVisible();
  await expect(page.getByRole('button', {name:'Registrar aporte',exact:true})).toBeVisible();
  await expect(page.getByRole('button', {name:'Contar y ajustar stock',exact:true})).toBeVisible();
  const groups=page.locator('.m2-movement-group');
  await expect(groups).toHaveCount(2);
  await expect(groups.first()).toHaveAttribute('open','');
  await expect(groups.last()).not.toHaveAttribute('open','');
  await groups.last().locator('summary').click();
  await expect(groups.last()).toHaveAttribute('open','');
});
