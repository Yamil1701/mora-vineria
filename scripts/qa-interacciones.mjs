import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Todas las escrituras de este protocolo ocurren en IndexedDB del contexto localhost ficticio.
export async function verificarInteracciones({ page, context, visitar, sembrar, tablas, out, modo, actualizarBuild }) {
  const resultados=[];
  const registrar=(caso)=>{resultados.push({caso,estado:'aprobado'});console.log(`QA: ${caso}`);};
  const boton=(name,scope=page)=>scope.getByRole('button',{name,exact:true});
  const esperar=async(check)=>{for(let i=0;i<50;i++){if(await check())return;await page.waitForTimeout(100);}assert.fail('La operación no terminó');};
  const dialogo=()=>page.getByRole('alertdialog');
  const confirmar=async(name)=>{await dialogo().waitFor();assert.equal(await dialogo().count(),1);await boton(name,dialogo()).click();};
  const leer=async(tabla)=>(await tablas([tabla]))[tabla];
  const stock=async(id)=>(await leer('productos')).find(p=>p.id===id).stockActual;
  const totalDinero=async()=> (await leer('movimientosTesoreria')).reduce((s,m)=>s+(m.direccion==='entrada'?m.monto:-m.monto),0);
  await sembrar();
  await page.setViewportSize({width:375,height:900});
  await visitar('ventas/nueva');
  assert.equal(await boton('Ver más productos').count(),1);
  await boton('Ver más productos').click();
  await page.getByLabel('Buscar producto',{exact:true}).fill('selección 29');
  await page.getByRole('button',{name:/Vino selección 29/}).click();
  await page.reload();await page.getByRole('dialog').waitFor();
  assert.match(await page.getByRole('dialog').innerText(),/Vino selección 29/);
  registrar('Catálogo completo, búsqueda fuera de las primeras 24 filas y recuperación de borrador');
  await boton('Revisar y cobrar').click();
  await page.setViewportSize({width:375,height:480});await page.locator('#paga-con').fill('30000');
  await boton('Confirmar venta').scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:resolve(out,'cobro-viewport-reducido.png')});
  await page.setViewportSize({width:375,height:900});
  registrar('Cobro con viewport reducido, total y vuelto accesibles');
  await boton('Confirmar venta').evaluate(b=>{b.click();b.click();});
  await confirmar('Guardar venta');
  await esperar(async()=> (await leer('ventas')).length===21);
  assert.equal(await stock('qa-producto-29'),40);
  const contado=(await leer('ventas')).find(v=>!v.id.startsWith('qa-'));
  const cobrosContado=(await leer('cobrosVentas')).filter(c=>c.ventaId===contado.id);
  assert.equal(cobrosContado.length,1);assert.equal(cobrosContado[0].monto,19500);
  registrar('Venta al contado sin duplicación, stock y cobro exactos');

  await visitar('ventas/nueva');
  await page.getByLabel('Buscar producto',{exact:true}).fill('selección 28');
  await page.getByRole('button',{name:/Vino selección 28/}).click();
  await page.getByRole('button',{name:/Carrito · 1/}).click();
  await boton('Revisar y cobrar').click();
  await boton('Otras formas de cobro').click();await boton('Pago combinado').click();
  await page.locator('#monto-pago-principal').fill('9000');
  await boton('Confirmar venta').click();await confirmar('Guardar venta');
  await esperar(async()=> (await leer('ventas')).length===22);
  const combinado=(await leer('ventas')).find(v=>!v.id.startsWith('qa-')&&v.id!==contado.id);
  const cobrosCombinados=(await leer('cobrosVentas')).filter(c=>c.ventaId===combinado.id);
  assert.equal(cobrosCombinados.length,2);assert.equal(cobrosCombinados.reduce((s,c)=>s+c.monto,0),19000);
  assert.deepEqual(cobrosCombinados.map(c=>c.medioPago).sort(),['efectivo','transferencia']);
  registrar('Pago combinado conserva dos cobros y cuentas diferentes');

  await visitar('ventas/nueva');
  await page.getByLabel('Buscar producto',{exact:true}).fill('selección 27');
  await page.getByRole('button',{name:/Vino selección 27/}).click();
  await page.getByRole('button',{name:/Carrito · 1/}).click();await boton('Revisar y cobrar').click();
  await boton('Otras formas de cobro').click();await boton('Fiado').click();
  await page.locator('#cliente-fiado-nombre').fill('Cliente ficticio QA');
  await page.locator('#monto-cobrado-inicial').fill('1000');
  await boton('Confirmar venta').click();await confirmar('Guardar venta');
  await esperar(async()=> (await leer('ventas')).length===23);
  const fiado=(await leer('ventas')).find(v=>v.clienteFiadoNombre==='Cliente ficticio QA');
  assert.equal(fiado.total,18500);assert.equal((await leer('cobrosVentas')).filter(c=>c.ventaId===fiado.id)[0].monto,1000);
  await visitar(`ventas/${fiado.id}`);await boton('Registrar pago').click();
  await page.locator('#importe-cobro').fill('500');await boton('Registrar cobro').evaluate(b=>{b.click();b.click();});
  await confirmar('Registrar cobro');
  await esperar(async()=> (await leer('cobrosVentas')).filter(c=>c.ventaId===fiado.id).length===2);
  registrar('Fiado parcial y cobro posterior sin duplicación');

  await visitar(`ventas/${contado.id}`);await boton('Anular venta').click();
  await page.locator('#motivo-anulacion-venta').fill('Anulación ficticia QA');await boton('Anular').last().click();await confirmar('Anular venta');
  await esperar(async()=> (await leer('ventas')).find(v=>v.id===contado.id).estado==='anulada');
  assert.equal(await stock('qa-producto-29'),41);
  assert.ok((await leer('cobrosVentas')).filter(c=>c.ventaId===contado.id).every(c=>c.estado==='anulado'));
  registrar('Anulación conserva historial y revierte stock/cobro');

  const saldoAntes=await totalDinero(),stockAntes=await stock('qa-producto-3');
  await visitar('movimientos/qa-movimiento-0');
  await boton('Confirmar recibido').evaluate(b=>{b.click();b.click();});await confirmar('Confirmar recibido');
  await esperar(async()=> (await leer('movimientos')).find(m=>m.id==='qa-movimiento-0').estado==='activo');
  assert.equal(await stock('qa-producto-3'),stockAntes+6);assert.equal(await totalDinero(),saldoAntes-21600);
  await boton('Anular movimiento').click();await page.locator('#motivo-anulacion').fill('Anulación ficticia QA');
  await boton('Anular').click();await confirmar('Anular movimiento');
  await esperar(async()=> (await leer('movimientos')).find(m=>m.id==='qa-movimiento-0').estado==='anulado');
  assert.equal(await stock('qa-producto-3'),stockAntes);assert.equal(await totalDinero(),saldoAntes);
  registrar('Reposición pendiente confirmada una vez y reversión exacta de stock/dinero');

  await visitar('tesoreria/operacion');await page.locator('#monto-operacion').fill('1000');
  await page.getByRole('button',{name:/^Tesorería: salir/}).click();
  await dialogo().waitFor();assert.match(await dialogo().innerText(),/Salir sin guardar/);await boton('Cancelar',dialogo()).click();
  assert.equal(await page.locator('#monto-operacion').inputValue(),'1000');
  const dineroTransferencia=await totalDinero(),ledgerAntes=(await leer('movimientosTesoreria')).length;
  await boton('Registrar').evaluate(b=>{b.click();b.click();});await confirmar('Registrar');
  await esperar(async()=> (await leer('movimientosTesoreria')).length===ledgerAntes+2);
  assert.equal(await totalDinero(),dineroTransferencia);
  await boton('Aceptar',page.getByRole('dialog')).click();
  registrar('Formulario conserva cambios al cancelar salida y transferencia mantiene total disponible');

  await visitar('tesoreria/cuentas/nueva');await page.locator('#nombre-cuenta').fill('Cuenta ficticia QA');await page.locator('#saldo-cuenta').fill('0');
  await boton('Agregar cuenta').click();await esperar(async()=> (await leer('cuentasTesoreria')).length===3);
  await visitar('tesoreria/operacion');await boton('Retiro').click();await page.locator('#monto-operacion').fill('500');await page.locator('#registrado-por').fill('Persona QA');await page.locator('#destinatario-operacion').fill('Destino ficticio');
  const antesRetiro=await totalDinero(),movimientosAntes=(await leer('movimientos')).length;
  await boton('Registrar').click();await confirmar('Registrar');await esperar(async()=> await totalDinero()===antesRetiro-500);
  assert.equal((await leer('movimientos')).length,movimientosAntes);registrar('Cuenta adicional y retiro trazable separado de gastos');

  await visitar('tesoreria/conteo');await page.getByLabel('Otro importe',{exact:true}).fill('500000');
  await boton('Guardar conteo').evaluate(b=>{b.click();b.click();});await confirmar('Guardar conteo');
  await esperar(async()=> (await leer('conteosCaja')).length===1);
  const caja=(await leer('movimientosTesoreria')).filter(m=>m.cuentaId==='qa-caja').reduce((s,m)=>s+(m.direccion==='entrada'?m.monto:-m.monto),0);
  assert.equal(caja,500000);registrar('Conteo con ajuste trazable y sin duplicación');

  await visitar('reportes');await boton('Mes').click();await boton('Cobros').click();
  await boton('Elegir período').click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(await page.getByRole('dialog').count(),0);
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(()=>document.activeElement instanceof HTMLButtonElement||document.activeElement instanceof HTMLAnchorElement));
  registrar('Reportes, selector de período, cierre con Escape y navegación por teclado');

  await visitar('configuracion/exportaciones');const csvPromesa=page.waitForEvent('download');await boton('Exportar productos').click();
  const csv=await csvPromesa;const csvPath=resolve(out,'productos-ficticios.csv');await csv.saveAs(csvPath);
  assert.match(await readFile(csvPath,'utf8'),/Vino selección 29/);registrar('CSV descargado con catálogo completo');

  await visitar('configuracion/respaldos');const configuracionAntes=(await leer('configuracion'))[0];
  const backupPromesa=page.waitForEvent('download');await boton('Descargar respaldo JSON').click();
  const backup=await backupPromesa;const backupPath=resolve(out,'respaldo-ficticio.json');await backup.saveAs(backupPath);
  const respaldo=JSON.parse(await readFile(backupPath,'utf8'));assert.equal(respaldo.schemaVersion,6);
  const datosAntes=await tablas(['productos','ventas','cobrosVentas','movimientosTesoreria']);
  await page.locator('input[type=file]').setInputFiles(backupPath);await boton('Restaurar').click();await confirmar('Restaurar copia');
  await esperar(async()=> (await page.locator('main').innerText()).includes('Copia restaurada.'));
  const configuracionDespues=(await leer('configuracion'))[0];assert.equal(configuracionDespues.deviceId,configuracionAntes.deviceId);assert.equal(configuracionDespues.deviceRole,configuracionAntes.deviceRole);
  assert.deepEqual(JSON.parse(JSON.stringify(await tablas(Object.keys(datosAntes)))),JSON.parse(JSON.stringify(datosAntes)));
  registrar('Respaldo JSON v6 y restauración exacta preservan identidad/modo');

  await visitar('reportes/pdf-mensual');await page.waitForTimeout(300);await page.evaluate(()=>{window.print=()=>{window.moraQaPrintInvocado=true;};});await boton('Imprimir o guardar PDF').click();assert.equal(await page.evaluate(()=>window.moraQaPrintInvocado),true);await page.emulateMedia({media:'print'});
  await page.pdf({path:resolve(out,'reporte-ficticio.pdf'),format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});
  registrar('Reporte mensual renderizado a PDF A4');
  if(modo==='build'){
    await visitar('');await page.evaluate(async()=>{await navigator.serviceWorker.ready});
    await page.reload();await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>Boolean(navigator.serviceWorker.controller)));
    await context.setOffline(true);await visitar('productos');assert.match(await page.locator('main').innerText(),/Vino selección/);
    await context.setOffline(false);registrar('PWA servida por service worker y consulta sin conexión');
    const antesActualizar=JSON.parse(JSON.stringify(await tablas(['productos','ventas','cobrosVentas','movimientosTesoreria'])));
    await actualizarBuild();await page.evaluate(async()=>{const registro=await navigator.serviceWorker.getRegistration();await registro.update();});
    await page.getByRole('heading',{name:'Hay una versión nueva'}).waitFor({timeout:20000});
    await boton('Actualizar ahora').click();await page.waitForLoadState('load');
    await esperar(async()=>await page.getByRole('heading',{name:'Productos',exact:true}).count()===1);
    assert.deepEqual(JSON.parse(JSON.stringify(await tablas(Object.keys(antesActualizar)))),antesActualizar);
    registrar('Actualización PWA con confirmación conserva todos los datos locales');

  }
  await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('mora-vineria');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});const tx=db.transaction('configuracion','readwrite');const store=tx.objectStore('configuracion');const get=store.getAll();get.onsuccess=()=>get.result.forEach(c=>store.put({...c,deviceRole:'consulta'}));await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();});
  await visitar('');assert.equal(await page.getByRole('link',{name:/Nueva venta/}).count(),0);
  await visitar('tesoreria/operacion');await page.locator('#monto-operacion').fill('1000');assert.equal(await boton('Registrar').isDisabled(),true);
  await visitar('ventas/qa-venta-0');assert.equal(await boton('Registrar pago').count(),0);assert.equal(await boton('Anular venta').count(),0);
  registrar('Modo consulta oculta operaciones y bloquea escritura por URL directa');
  await writeFile(resolve(out,'interacciones.json'),JSON.stringify({resultados},null,2));
  return resultados;
}
