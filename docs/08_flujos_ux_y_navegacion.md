# Propuesta UX 01 — Arquitectura de información y recorridos

**Fecha:** 9 de octubre de 2026.
**Estado:** propuesta de experiencia para validar con el usuario, **NO diseño aprobado ni implementación**.
**Fuentes:** `docs/00_producto_y_experiencia.md`, `docs/04_descubrimiento_operativo.md`, `docs/07_cierre_relevamiento_16_preguntas.md` y `docs/02_sincronizacion_y_offline.md`.

## Principio rector

Mora es una herramienta para atender en ventanilla, a menudo de noche y con sueño, no un sistema de oficina. La persona tiene que poder ver un precio o registrar una venta rápidamente, incluso con mala conexión; las situaciones poco frecuentes no deben molestar los recorridos cotidianos.

Prioridades comprobadas de Inicio: **ventas, ganancia estimada, reposición**. Stock, cobros, dinero y sincronización deben ser comprensibles sin lenguaje contable.

## Mapa de navegación propuesto (por validar)

**Barra inferior con 4 destinos:**
1. **Inicio:** resumen, acciones rápidas, avisos que requieren atención.
2. **Ventas:** búsqueda y selección veloz de productos, cantidades, carrito y cobro. Ver historial reciente y editar venta desde subpantalla.
3. **Productos:** consulta de precio/stock, búsqueda, filtro de categorías sencillo, ficha y comprobación de stock. Alta manual o escaneo opcional.
4. **Reportes:** resumen por jornada/semana/mes, comparaciones y señales útiles. Priorizar interpretación antes que exportación.

**Pantallas secundarias, no destinos principales:** Caja y cuentas, Movimientos, Fiados, Reposición semanal y extraordinaria, historial de operaciones, Reclamos al proveedor, Ajustes/Dispositivos/Recuperación. Acceso desde Inicio o los contextos correspondientes.

**Acción visible de alta frecuencia:** «Nueva venta», con prioridad en Inicio; al entrar a Ventas el flujo de venta debe quedar disponible de inmediato, sin una segunda pantalla introductoria.

**No aprobado:** navegación exacta ni estructura visual. Comparar con usuarios/prototipo antes de programar.

## Flujo 1. Venta ordinaria (principal)

1. **Entrada:** Inicio > «Nueva venta» o pestaña Ventas.
2. **Buscar o tocar producto:** nombre, marca o presentación; mostrar precio claramente, foto verificada si existe, stock discretamente. Poder agregar un producto de inmediato. Favorecer recientes/frecuentes sin exigir categorías.
3. **Cantidad:** 1 por defecto, controles +/− accesibles; poder sumar distintos productos sin reiniciar.
4. **Revisión de carrito:** cantidades editables y total siempre visible; edición excepcional del precio guardando original y efectivo.
5. **Cobro:** Efectivo y Transferencia prominentes; opciones secundarias Mixto y Fiado.
   - Efectivo: importe recibido opcional y vuelto calculado; permitir cobrar importe exacto con un toque.
   - Transferencia: **Brubank por defecto**, cuentas alternativas Naranja X/Mercado Pago; marcar acreditación manual después de comprobarla, nunca asumir verificación bancaria.
   - Mixto: especificar cada parte y cuenta receptora, asegurar que la suma coincida con el total.
   - Fiado: nombre, saldo adeudado; no exigir fecha de vencimiento ni tope; pagos posteriores separados de ventas.
6. **Confirmación:** guardar operación durable localmente primero; mostrar «Guardada en este equipo / Pendiente de enviar / Confirmada» según estado verdadero, sin obligar a esperar red para haber registrado una venta física.
7. **Salida:** volver a vender, Inicio o ver detalle. Si había stock insuficiente, abrir **revisión obligatoria posterior** con estado pendiente persistente; no bloquear venta física ni inventar unidades.

### Venta de madrugada y carga posterior

La venta se atribuye a **hora de carga**, no se pide recordar hora real; jornada interna 08:00–07:59. Guardar tanto marca temporal local original como marca de aceptación remota. Si hay incertidumbre de hora del dispositivo, exponerla como riesgo; no reescribir silenciosamente jornada.

### Corrección directa

Desde detalle de venta: «Corregir», editar cantidades/productos/precio/pago según permisos; UX simple, pero en datos conservar operación previa y correcciones trazables que reviertan/ajusten FIFO, stock, cuentas y deuda de modo atómico. No mostrar borrado definitivo como gesto trivial.

### Fiado / abonos

Desde «Fiados» o detalle de venta: saldo por nombre, registrar abono total o parcial sin generar otra venta. Mantener deuda restante, cuenta de entrada y trazabilidad.

## Flujo 2. Productos y primera carga

1. Vista lista consultable, búsqueda inmediata, categoría simple opcional y foto confiable.
2. «Agregar producto»: dos opciones equivalentes **Escanear código** (hipótesis por testear) y **Cargar manualmente**.
3. Datos mínimos: nombre, marca o variante, volumen/presentación de venta por unidad, precio público, categoría si ayuda, stock objetivo manual.
4. Stock inicial: capturar cantidad física y costo conocido para crear lote de apertura de V2. **Sin costo real no inventar ganancia FIFO definitiva.**
5. Foto: obtenida de fuente verificada o subida y saneada; placeholder digno si no se conoce imagen exacta.
6. Producto con historial: no eliminar irreversible; ocultar o desactivar según reglas validadas.
7. «Comprobar stock»: cantidad registrada vs contada y ajuste con causa, protegiendo operaciones pendientes de otros equipos.

## Flujo 3. Reposición semanal

1. Acceso desde aviso «Para reponer» o sección Productos.
2. Lista sugerida según **objetivo manual por producto − stock conocido**, con cambio manual. Ver presentaciones habituales del proveedor (fardos/cajas) y equivalencia en unidades.
3. Permitir preparar pedido y copiar mensaje para WhatsApp, **sin requerir automatizar WhatsApp**.
4. Guardar pedido enviado/pendiente, sin sumar unidades ni restar caja.
5. Al recibir jueves/viernes: confirmar cantidades reales, ajustar faltantes ocasionales; **entonces** incrementar lotes FIFO y descontar dinero en efectivo pagado al proveedor.
6. Reconocer lista irregular de precios mediante texto pegado y equivalencias recordadas, con vista previa y confirmación humana; función avanzada a validar, no dependencia del primer recorrido.

### Urgencias y reclamos

- «Compra extraordinaria» simple para cerveza de fin de semana: comercio minorista externo, costo unitario generalmente superior, retiro/transporte a cargo del local, stock al recibir. No cambiar precio de venta automáticamente.
- Reclamo por mercadería defectuosa recibida: baja de disponibilidad y reposición posterior sin doble compra pagada.
- Botella rota/faltante real: ajustar unidades e identificar pérdida según costo correspondiente.

## Flujo 4. Dinero y controles

- Acceso «Caja y cuentas» desde Inicio. Mostrar por separado **saldo esperado** y **saldo real informado** de efectivo y Brubank, con diferencia legible; cuentas alternativas muestran **movimientos atribuibles a Mora**, no saldo personal completo.
- Transferencias entre cuentas del negocio o cambio Brubank por efectivo no son ventas ni ingresos.
- «Movimiento» secundario para extracción/ahorro (sale del negocio), aporte externo, gasto excepcional, transferencia entre cuentas y ajuste con motivo manual.
- Separar métricas: **Ventas** (importe de operaciones), **Ganancia bruta estimada FIFO** (ventas menos costo asignado) y **Disponible** (dinero en caja/cuentas). Los fiados requieren distinguir ventas de cobros.
- La ganancia puede ser **provisional** si hay ventas offline o faltantes de lotes sin costo verificable; no mostrar falsa precisión.

## Flujo 5. Reportes

- Selección simple: Hoy, Semana, Mes; detalle bajo demanda.
- Mostrar evolución de ventas y ganancia bruta estimada, fuentes de cobro, productos vendidos y faltantes frecuentes; metas opcionales si se justifican.
- Usar frases cortas y conclusiones verificables, no pronósticos basados en un historial muy corto.
- Sin PDF mensual obligatorio al inicio; posibilidad futura de exportar si existe uso real.

## Flujo 6. Sincronización y acceso

- 3–4 dispositivos con idénticas capacidades funcionales; un dispositivo autorizado puede habilitar otro con **verificación segura**. Pantalla de dispositivos y revocación en Ajustes, accesible para todos autorizados.
- Estado pequeño pero visible: «Al día», «Sin conexión · guardado aquí», «X pendientes», «Revisar diferencia». No confundir guardado local con confirmado en Supabase.
- Si dos celulares offline venden más unidades que las que figuraban, **conservar todas las ventas reales**, pero mantener discrepancia explícita que requiere recuento; no inventar reposición, costo FIFO ni ajustar silenciosamente a cero.
- Ventas con FIFO calculado offline pueden tener ganancia **provisional** hasta conciliación oficial. Definir contrato de orden de operaciones y auditoría en arquitectura.
- Actualizaciones de la PWA no pueden interrumpir borradores, datos pendientes o ventas.

## Primer inicio desde cero

- V2 arranca con dataset comercial **nuevo y vacío**, sin restaurar automáticamente V1 ni borrar la V1.
- Primero habilitar primer dispositivo por flujo seguro de arranque (pendiente técnico), luego agregar categorías simples, productos, cantidades físicas iniciales y costos de apertura documentados.
- Estado vacío debe orientar («Agregá tu primer producto») y ofrecer formas rápidas de cargar, sin mostrar importes simulados como reales.
- Recuperación y copia verificable necesarias aunque JSON/PDF antiguos no se usaran. Proponer implementación discreta y probar restauración antes de publicar.

## Estados de interfaz que requieren prototipos

- Catálogo vacío, sin resultados, con fotos faltantes, internet intermitente, borrador de venta, transferencia aún no acreditada, pago mixto incompleto, cliente fiado, venta confirmada, sincronización pendiente.
- Stock cero pero unidad física presente, ajuste obligatorio posterior, recuento en conflicto, lote de costo desconocido, reporte de ganancia provisional.
- Pedido enviado pero no recibido, recepción parcial, proveedor reemplaza producto sin cargo, cero ventas en período y múltiples dispositivos.

## Criterios de validación UX

- Una venta de 1 producto puede terminarse con pocas interacciones y sin pasar por menús de administración.
- Venta multiproducto en el **mismo flujo**; cantidad corregible sin rehacer carrito.
- Usuario distingue con precisión confirmado del banco (manual), guardado local, sincronizado y pendiente de revisión.
- Correcciones y fiados son accesibles sin contaminar el flujo más común.
- Reposición sugerida nunca compra ni modifica stock sin recepción.
- En pantallas nocturnas: tipografía legible, contraste suficiente, botones grandes, blancos táctiles cómodos, navegación y acciones alcanzables con una mano.
- Confirmar en prototipos con 5 escenarios representativos antes de codificar: efectivo con vuelto, transferencia manual, fiado/abono, venta offline con faltante, reposición con FIFO.

## Propuesta visual para explorar (NO aprobada)

**«Nocturna cálida»:** fondo carbón cálido, superficie chocolate/granate muy tenue, acento mora/guinda moderado, tipografía clara, números grandes y jerarquía generosa, tarjetas discretas. Evitar neón, degradados omnipresentes, mini-tableros KPI estilo ERP y pantallas saturadas.

Priorizar una sola acción primaria por contexto. En Inicio, 3 mensajes antes de cualquier gráfico: ventas, ganancia estimada, falta reponer. En Ventas, rapidez y foco en selección/cobro.

**Siguiente paso:** revisar un prototipo móvil que represente Inicio, Venta, Productos y Reposición; comparar otras variantes visuales si la dirección no convence. Recién al aprobar recorridos/identidad, definir tokens y componentes y luego implementar.
