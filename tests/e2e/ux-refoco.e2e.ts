import {test,expect} from '@playwright/test';
import {area,newSale} from './navigation';
test('cinco accesos, Más raíz, rutas profundas y regreso con filtros',async({page})=>{
 await page.goto('./');await expect(page.getByRole('heading',{name:'Resumen de hoy',exact:true})).toBeVisible();
 await expect(page.locator('nav[aria-label="Navegación principal"] button')).toHaveCount(5);
 await expect(page.locator('.mv-wordmark')).toHaveText('Mora');
 await area(page,'Productos');await page.getByLabel('Buscar producto').fill('consulta retenida');
 await page.getByRole('button',{name:'Datos y respaldo',exact:true}).click();await page.getByRole('button',{name:'Volver a Productos',exact:true}).click();await expect(page.getByLabel('Buscar producto')).toHaveValue('consulta retenida');
 await area(page,'Inventario');await page.getByRole('button',{name:'Más',exact:true}).click();await expect(page.getByRole('heading',{name:'Más',exact:true})).toBeVisible();
 await area(page,'Ventas');await expect(page.getByRole('heading',{name:'Historial local',exact:true})).toBeVisible();
 await newSale(page);await expect(page.getByRole('navigation')).toHaveCount(0);await page.getByRole('button',{name:'Volver a Ventas',exact:true}).click();
 for(const width of [360,390,430]){await page.setViewportSize({width,height:844});for(const name of ['Inicio','Ventas','Caja','Productos','Inventario','Reposición','Reportes','Configuración']){await area(page,name);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name).toBe(true);}}
 const deep=await page.context().newPage();await deep.goto('./#inventario');await deep.getByRole('button',{name:'Volver a Más',exact:true}).click();await expect(deep.getByRole('heading',{name:'Más',exact:true})).toBeVisible();await deep.close();
});
test('Caja registra dinero e Inventario ofrece conteos por producto',async({page})=>{
 await page.goto('./');await area(page,'Caja');await page.getByRole('button',{name:'Registrar',exact:true}).click();await expect(page.getByRole('button',{name:'Registrar gasto',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Registrar aporte',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Contar y ajustar stock',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Cuentas',exact:true}).click();await expect(page.getByText('No informado',{exact:true})).toBeVisible();
});
