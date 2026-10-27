import { expect, type Page } from '@playwright/test';
/** Exercise visible navigation; concentrated sales intentionally have no dock. */
export async function area(page:Page,name:string){
 await expect(page.locator(".mv-global-header")).toBeVisible();
 await expect(page.locator(".mv-global-header button:disabled")).toHaveCount(0);
 for(let i=0;i<20&&!await page.getByRole('navigation',{name:'Navegación principal'}).isVisible();i++){
  const finish=page.getByRole('button',{name:'Volver a Inicio',exact:true});
  if(await finish.isVisible())await finish.click();else await page.getByRole('button',{name:/^Volver a /}).first().click();
 }
 if(['Productos','Inventario','Reposición','Reportes','Configuración'].includes(name))await page.getByRole('button',{name:'Más',exact:true}).click();
 await page.getByRole('button',{name,exact:true}).click();
}
export async function newSale(page:Page){if(await page.getByRole('heading',{name:'Nueva venta',exact:true}).isVisible())return;await area(page,'Nueva venta');await expect(page.getByRole('heading',{name:'Nueva venta',exact:true})).toBeVisible();}
export async function backup(page:Page){await area(page,'Configuración');await page.getByRole('button',{name:'Backup y restauración',exact:true}).click();}
export async function receiveRow(page:Page,name:string,quantity:string,cost:string){
 await page.getByRole('combobox',{name:'Agregar producto',exact:true}).selectOption({label:name});await page.getByRole('button',{name:'Agregar a recepción',exact:true}).click();
 const row=page.locator('.mv-receipt-row').last();await row.getByLabel('Unidades recibidas',{exact:true}).fill(quantity);await row.getByLabel('Costo total $',{exact:true}).fill(cost);
}
