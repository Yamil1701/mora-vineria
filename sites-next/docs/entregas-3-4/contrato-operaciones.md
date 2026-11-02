# Mora · contrato de operaciones de Entregas 3 y 4

30 de octubre de 2026. Fuente vigente: nueva Mora de Sites, basada en v26 `bea955a878433b1f94cbb27af6d9388751d9537f`. Aplicación local en borrador. Este documento describe código existente y distingue la preparación remota aún incompleta.

## Modelo y almacenamiento

El almacenamiento mantiene una instantánea en `mora.local.v1`, esquema 5. Un guardado incluye hechos, efectos, comandos, resultados y trabajo aceptado. No hay servidor activo ni consulta bancaria. La demo permanece separada en memoria.

| Entidad | Identidad y relaciones | Regla principal |
| --- | --- | --- |
| Productos | `id`; historial de cambios; `priceVersion` | Precio entero positivo; stock puede ser negativo; variedad y volumen distinguen el SKU |
| Carrito | Producto → cantidad y precio original/aplicado | Precio fijo desde la incorporación; un cambio del catálogo no repricia la venta abierta |
| Operaciones | `id`, tipo, payload canónico, fecha, jornada, estado, resultado | Identidad creada antes de confirmar; mismo ID con otro contenido se rechaza |
| Venta y líneas | ID del comando, número local, producto, cantidad, precio, asignaciones | Registro original conservado; cobros, fiado y costos separados |
| Lotes | Recepción, apertura, ajuste o devolución de corrección | Cantidad/remaining y costo conocido o explícitamente pendiente |
| Apertura | Comando + líneas de productos sin movimientos previos | Existencia inicial, sin recepción ficticia ni dinero |
| Ajustes físicos | Producto, stock esperado, conteo, motivo, asignaciones, offset | Conteo o pérdida; comparación contra estado revisado; sin ventas ni dinero |
| Revisiones/resoluciones | Venta/producto → diferencia → evidencia | La compra posterior no costea la venta anterior; resolución explícita y trazable |
| Fiados | Venta → deuda original, cliente | Importe inicial conservado; ajustes y abonos son hechos separados |
| Abonos | Comando → deuda → partes y movimientos | Positivo, no mayor al saldo; transferencia comprobada manualmente |
| Recepciones | ID, proveedor, líneas/costos reales, pedido opcional | Una entrada de mercadería; pago original opcional, conservado |
| Pagos posteriores | Comando → recepción → cuenta/movimiento | Positivo, hasta lo pendiente; no vuelve a ingresar stock |
| Correcciones | Venta → revisión aplicada o pendiente; before/after | Motivo, fecha, efectos de stock/dinero/deuda; no borra la venta original |
| Movimientos | Secuencia local y origen único, piernas por cuenta | Cobro, abono, gasto, aporte, retiro, traspaso, mercadería o corrección |
| Referencias/controles | Cuenta, importe, fecha, secuencia observada | Una referencia no es un ingreso; el control no ajusta dinero automáticamente |
| Metas | Comando, mes, importe o retiro de meta | Historial conservado; última meta del mes vigente |
| Trabajo en preparación | Rutas, filtros, carrito y borradores aceptados | Se recupera tras recargar; un editor modal todavía no aceptado no se promete durable |
| Listas/pedidos/equivalencias | Identidades existentes de Sites | Conservados; esta misión no amplía su funcionamiento |

Los IDs y números locales no se suponen globalmente únicos entre distintos orígenes web. La preparación de migración añade un namespace del origen y conserva las identidades existentes.

## Confirmaciones y recuperación local

1. Crear/reutilizar el ID de la operación y sellar su contenido.
2. Guardar el comando preparado y su borrador.
3. Ejecutar reglas sobre una copia separada.
4. Validar relaciones y guardar efectos + resultado en la misma instantánea.
5. Mostrar éxito después del guardado. Una recuperación usa el mismo ID.

Un fallo del dominio no deja efectos parciales. Una respuesta perdida después de escribir se recupera recargando el resultado persistido. No se crea otro ID para adivinar si se guardó. Un comando ya confirmado devuelve su resultado. Un ID con contenido distinto se rechaza.

El snapshot es una escritura local, no una transacción distribuida. `createLocalStore` detecta una versión ajena antes del siguiente guardado. Además, los escritores v27 solicitan un Web Lock exclusivo **antes** de cargar, migrar o guardar; una segunda pestaña participante queda bloqueada. El mecanismo se probó con un administrador de locks simulado. La vista HTTP de QA no ofrece esa API y no demuestra una carrera real entre pestañas. Navegadores sin Web Locks conservan la detección de estado ajeno y muestran la recomendación de una sola pestaña. Una pestaña antigua v25/v26 no participa en el lock. No se afirma CAS general de localStorage ni seguridad entre dispositivos.

Los cambios nuevos de precio incrementan `priceVersion`: edición de producto, lista del proveedor y adopción manual del sugerido. El editor y la propuesta conservan la versión esperada. Se rechaza una edición antigua incluso si el precio cambió y luego volvió al mismo valor. Los registros anteriores sin versión parten de cero.

## Venta, faltante y costo

La venta admite efectivo, transferencia confirmada o pendiente, mixto, fiado completo y una parte fiada. La deuda exige nombre; lo cobrado y lo fiado suman el total. El efectivo se registra neto del vuelto. Una transferencia pendiente no genera dinero hasta que se comprueba; verificarla no crea otra venta.

La aceptación de faltante se vincula al producto, cantidad, stock observado y unidades faltantes. Cambiar cantidad o disponibilidad invalida la aceptación. La venta física conserva stock negativo y una revisión si faltan existencias/lotes o costos.

FIFO consume lotes por antigüedad. Los costos de packs conservan fracciones exactas: $17.500/12 no se redondea a un costo entero. `null` identifica costo desconocido; no equivale a cero. Las asignaciones históricas no se recostean con una compra posterior.

## Aperturas, conteos y resolución

La apertura sólo admite productos sin lotes ni ventas anteriores. Cada línea incorpora unidades y costo total positivo conocido o `null`.

El conteo compara stock esperado con actual. Una disminución consume lotes sin dinero ni venta; una pérdida debe disminuir unidades. Un aumento que elimina stock negativo primero regulariza ese déficit y sólo crea lotes por las unidades físicas adicionales. Ejemplo: de −1 a 3 → offset 1 y lote de 3, no lote de 4.

Una resolución conserva evidencia y costo identificado como hecho separado. No cambia el costo original de la línea. El ajuste de stock de una resolución no puede superar las unidades sin lote aún no regularizadas por resoluciones/conteos; para otro cambio físico se utiliza Contar. Los reportes pueden incorporar el costo identificado y siguen conservando el hecho histórico original.

## Fiados y pagos de mercadería

Saldo de fiado = importe original + ajustes de deuda − abonos. No se admiten abonos excesivos ni negativos. Las partes del abono suman su importe; cada parte comprobada genera una sola entrada en su cuenta. Ni venta ni stock vuelven a afectarse.

Pagado de recepción = pago original, si existió, + pagos posteriores. Cada pago posterior exige confirmar que ocurrió, tiene cuenta e importe real y no supera el pendiente. No reescribe `receipt.paid`, no crea otra recepción y no se registra como gasto genérico adicional.

## Correcciones reales y límites

Se corrigen cantidad, producto y precio mediante una operación comercial nueva. Se comprueba la revisión efectiva de la venta, se muestra antes/después y se exige indicar si la diferencia ya fue cobrada/devuelta o modifica el fiado.

Las unidades devueltas ingresan en **lotes nuevos**, en la fecha de corrección, con una referencia al lote de origen y costo racional exacto. No se aumenta remaining de lotes viejos ni se reescriben asignaciones originales. Las unidades agregadas consumen el FIFO disponible actual. El costo efectivo corregido se calcula a partir de sus asignaciones, conservando el original.

La diferencia comercial completa puede ir a dinero real o a deuda. Una reducción de deuda no puede exceder el saldo; una diferencia adicional puede crear un fiado vinculado con base original cero y un ajuste respaldado por la corrección. No se inventa una devolución para cerrar una diferencia. Un reparto más complejo puede requerir registros separados y revisión.

Corregir cuenta/medio de un cobro confirmado crea dos piernas compensatorias de atribución; no significa un traspaso bancario ni otro cobro. Cobro adicional y devolución registran dinero real explícito, con cuenta, importe y confirmación; una devolución no supera lo confirmado neto.

Quedan pendientes, sin efectos físicos ni monetarios: cambios de cantidades/productos con unidades históricas sin lote/costo; aumentos sin stock identificado suficiente; y cambios comerciales de importe mientras exista transferencia pendiente. Una resolución de costo para reportes no reconstruye por sí sola un FIFO faltante. Son correcciones complejas parciales, no capacidades terminadas.

Las validaciones relacionan comandos, revisiones before/after, asignaciones y lotes devueltos, movimientos y ajustes de deuda. La vista efectiva se usa en detalle, listados, Inicio y reportes. La fecha de la corrección se conserva.

## Cuentas, reportes y fechas

Cuentas locales: efectivo, Brubank, Mercado Pago y Naranja X. El saldo sin referencia sigue siendo desconocido; la variación registrada no se presenta como saldo bancario. Un traspaso conserva suma cero. Aportes y retiros se separan de ventas y gastos.

Jornada: 08:00–07:59 en Salta, equivalente al corte 11:00 UTC. Semana: lunes hasta la jornada actual. Mes: calendario por jornadas; rango: límites inclusivos.

Los importes comerciales efectivos se atribuyen a la jornada **original de venta**; cobros, abonos, devoluciones, pagos y correcciones de cuenta se consultan por su fecha real. Las correcciones registradas en el período se explicitan. Esta política debe revisarse antes de usar informes como cierres inmutables de períodos.

Los pendientes mostrados son saldos actuales de ventas/recepciones del período, no una reconstrucción contable del saldo al último segundo del período. Cobrado usa movimientos de dinero; vendido usa ventas efectivas. Costo identificado incluye resoluciones explícitas. Si falta costo, se identifica venta/unidades y no se ofrece ganancia total. Con costo completo se muestra ventas menos costo vendido, **antes de gastos**, que se presentan aparte.

La meta muestra importe, vendido, porcentaje y diferencia restante. El informe mensual utiliza el mismo selector/cálculos, fecha de emisión, advertencia interna y CSS A4. La acción utiliza `window.print()`; la obtención física de PDF no quedó verificada en este entorno.

## JSON y cambio de origen

Respaldo v5 con entidades nuevas, comandos preparados/confirmados/fallidos, resultados, borradores, relaciones y checksum FNV-1a32 para corrupción accidental. No es firma ni autenticación. Se leen versiones 1–4 mediante migración explícita de campos faltantes; no se fabrican cobros ni costos. Se conserva el snapshot original antes de cambiar esquema (`before-v4` y `before-v5`, según corresponda).

La restauración sólo admite un destino vacío, con validación y confirmación; no fusiona historiales. Se conserva la copia previa a restaurar. La importación repetida sobre destino ocupado se rechaza. No se borra el origen.

`migration-plan.js` prepara, sin enviar, namespace, SHA-256 del contenido canónico validado, mapa de identidades y manifest de conteos, stock, lotes, dinero, deuda y comandos. La verificación exige igualdad completa antes/después. IDs originales y operaciones pendientes se conservan. El fixture v3 migra a v5 y mantiene digest de contenido normalizado. La importación productiva y el traslado real a otro origen no fueron ejecutados.

## Preparación remota: estado exacto

No existe conexión de esta app con Supabase. El único proyecto listado fue «Chofer Utilities», inactivo y ajeno a Mora; no se tocaron sus tablas/datos ni se ejecutó SQL.

`remote-queue.js` es un adaptador aislado no importado por la app. Guarda identidad antes de enviar; consulta resultados con el mismo ID; distingue guardado local, esperando servidor, resultado desconocido, confirmado remoto y atención requerida; conserva evidencia física ante conflicto. Verifica ID, negocio, dispositivo, tipo, payload y revisión del resultado antes de declararlo confirmado. Sus pruebas usan un transporte simulado.

El SQL candidato `backend/migrations/001_dev_foundation.sql` requiere un ambiente Mora dev explícito. Define negocios, membresías, dispositivos revocables, comandos únicos por negocio/ID, metas e identidades/lotes de preparación de migración. Contiene grants/RLS y una RPC con bloqueo de revisión y efecto+resultado indivisibles **sólo para metas mensuales**. Otros comandos se rechazan. No fue aplicado, analizado por Postgres ni probado con JWT reales.

Falta implementar y verificar en servidor: productos/versiones de precio; ventas/líneas; recepciones/líneas; lotes/asignaciones racionales; revisiones/resoluciones; inventario; deudas/abonos; cobros/pagos/piernas; correcciones; referencias/controles. Cada hecho debe incluir negocio, identidad de origen y comando; las escrituras sólo deben pasar por transacciones autorizadas. No aceptar un snapshot arbitrario del cliente como sustituto de estas reglas.

Gate remoto pendiente: permisos cruzados entre negocios/usuarios, dispositivos revocados, carreras del mismo comando y de comandos distintos, rollback intermedio, respuesta perdida tras commit, deuda concurrente, stock/costo compartidos, importación duplicada y paridad completa con las reglas locales. El SQL preparado no acredita integración.

Fuentes oficiales: [funciones Supabase](https://supabase.com/docs/guides/database/functions), [seguridad de API](https://supabase.com/docs/guides/api/securing-your-api), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Web Locks W3C](https://www.w3.org/TR/web-locks/).
