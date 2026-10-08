// Datos completamente ficticios. Solo los consume qa-browser.mjs en localhost aislado.
export function crearFixtures() {
  const fecha = '2026-10-07T23:00:00.000Z';
  const marcas = ['Malbec reserva', 'Cabernet Sauvignon', 'Fernet 750 ml', 'Coca-Cola 1,5 L', 'Cerveza rubia', 'Espumante extra brut'];
  const base = { createdAt: fecha, updatedAt: fecha };
  const categorias = ['Vinos', 'Bebidas', 'Snacks'].map((nombre, i) => ({id:`qa-cat-${i}`,nombre,activa:true,...base}));
  const productos = Array.from({length:32},(_,i)=>({id:`qa-producto-${i}`,nombre:marcas[i] ?? `Vino selección ${String(i).padStart(2,'0')}`,categoriaId:categorias[i%3].id,precioVenta:5000+i*500,costoCompra:3000+i*200,stockActual:i===2?0:i===0?2:i===1?1:12+i,stockObjetivo:24,estado:'activo',marca:'Bodega de prueba',presentacion:i%3===0?'750 ml':'Unidad',modoCompraHabitual:i%4===0?'pack':'unidad',nombrePack:i%4===0?'Caja':undefined,unidadesPorPack:i%4===0?6:undefined,...base}));
  const ventas=[],detalleVentas=[],cobrosVentas=[],movimientosTesoreria=[],movimientos=[],detalleReposiciones=[];
  const cuentasTesoreria=[{id:'qa-caja',nombre:'Caja',tipo:'efectivo',estado:'activa',esPredeterminada:true,fondoCambioObjetivo:50000,...base},{id:'qa-banco',nombre:'Brubank',tipo:'digital',estado:'activa',esPredeterminada:true,...base}];
  for (const [i, cuenta] of cuentasTesoreria.entries()) movimientosTesoreria.push({id:`qa-inicial-${i}`,cuentaId:cuenta.id,fechaHoraReal:fecha,fechaJornada:'2026-10-07',tipo:'saldo_inicial',direccion:'entrada',monto:i?87900:156600,descripcion:'Saldo inicial ficticio',createdAt:fecha});
  for(let i=0;i<20;i++){
    const producto=productos[3+i%20],fiado=i%6===0;
    const fechaJornada=`2026-10-${String(7-i%4).padStart(2,'0')}`,fechaHoraReal=`${fechaJornada}T${String(18+i%5).padStart(2,'0')}:00:00.000Z`;
    const id=`qa-venta-${i}`, monto=fiado?1000:producto.precioVenta;
    ventas.push({id,fechaHoraReal,fechaJornada,total:producto.precioVenta,condicionPago:fiado?'fiado':'contado',clienteFiadoNombre:fiado?'Cliente de prueba':undefined,estado:'activa',medioPago:'efectivo',dispositivoResponsableNombre:'Celular de prueba',...base});
    detalleVentas.push({id:`qa-detalle-${i}`,ventaId:id,productoId:producto.id,cantidad:1,precioUnitarioAplicado:producto.precioVenta,costoUnitarioAlMomento:producto.costoCompra,subtotal:producto.precioVenta});
    cobrosVentas.push({id:`qa-cobro-${i}`,ventaId:id,fechaHoraReal,fechaJornada,monto,medioPago:'efectivo',cuentaTesoreriaId:'qa-caja',estado:'activo',...base});
    movimientosTesoreria.push({id:`qa-dinero-${i}`,cuentaId:'qa-caja',fechaHoraReal,fechaJornada,tipo:'cobro_venta',direccion:'entrada',monto,descripcion:'Cobro de venta',referenciaTipo:'cobro_venta',referenciaId:`qa-cobro-${i}`,createdAt:fechaHoraReal});
    const pendiente=i%3===0;
    movimientos.push({id:`qa-movimiento-${i}`,fechaHoraReal,fechaJornada,tipo:'reposicion',descripcion:`Reposición ${producto.nombre}`,monto:producto.costoCompra*6,medioPago:'efectivo',cuentaTesoreriaId:'qa-caja',estado:pendiente?'pendiente':'activo',confirmadoAt:pendiente?null:fechaHoraReal,...base});
    detalleReposiciones.push({id:`qa-reposicion-${i}`,movimientoId:`qa-movimiento-${i}`,productoId:producto.id,cantidad:6,costoUnitario:producto.costoCompra,subtotal:producto.costoCompra*6});
    if(!pendiente) movimientosTesoreria.push({id:`qa-pago-${i}`,cuentaId:'qa-caja',fechaHoraReal,fechaJornada,tipo:'reposicion',direccion:'salida',monto:producto.costoCompra*6,descripcion:`Reposición ${producto.nombre}`,referenciaTipo:'movimiento',referenciaId:`qa-movimiento-${i}`,createdAt:fechaHoraReal});
  }
  // Garantiza saldo positivo aun con un historial amplio de compras ficticias.
  movimientosTesoreria[0].monto=900000;
  return {categorias,productos,ventas,detalleVentas,cobrosVentas,movimientos,detalleReposiciones,cuentasTesoreria,movimientosTesoreria,metasMensuales:[{id:'2026-10',mes:'2026-10',metaVentas:1500000,...base}]};
}
