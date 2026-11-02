# Matriz funcional RC2

«Integrado» describe la ruta técnica activa en desarrollo. QA físico y aceptación del usuario: pendientes en todas las filas. Las pruebas exactas se consultan en los JSON y el informe 07; no toda variante visual tiene una prueba alojada individual.

| Familia | Interfaz y persistencia | Servidor | Comprobación y límites |
|---|---|---|---|
| Acceso / dispositivo | Activos, enlace privado y vínculo simple | Auth real, membresía, prueba de dispositivo, revocación | Acceso y vínculo desde navegador alojado; no administración de cuentas nueva |
| Inicio / navegación | Identidad v29 conservada | Lectura inicial y estado confirmado | 360/390/430 px; aceptación física pendiente |
| Productos | Alta, edición, desactivación por comandos | Validación, historial y precio versionado | API alojada; formas/catálogos en navegador local |
| Favoritos / carrito / filtros | Locales y durables | No se envían como hechos comerciales | Precios históricos/carrito congelado; borradores recuperables |
| Ventas / cobros | Comando durable antes del envío | Venta, FIFO, cobros y deuda indivisibles | API y UI alojadas; respuesta perdida y dos dispositivos probados |
| Transferencias pendientes | Se conservan sin sumarlas a cobros | Verificación explícita sin venta nueva | API alojada y navegador local |
| Fiados / abonos | Misma ruta de comandos | Saldo validado sobre revisión actual | Carrera real evita sobreabono; un abono conflictivo queda para atención |
| Inventario / roturas | Stock inicial, conteo y resolución existentes | Historia/motivo, costos desconocidos | API alojada y local; no reasignación silenciosa de FIFO |
| Reposición | Pedidos, envío, recepción y pagos existentes | Pedido no incrementa stock; pagos relacionados | Entrega parcial/pago posterior y cierre alojados |
| Listas / equivalencias / precios | Familias conectadas; selección de filas local | Lista/equivalencia/precios aplicados por comando | API alojada; no se ampliaron recorridos comerciales |
| Caja | Gastos, aportes, retiros, traspasos, referencias y controles | Validaciones de cuentas y conservación del total | API alojada y navegación/formas locales |
| Correcciones | Original conservado, efecto antes de confirmar | Tipos deterministas; lo ambiguo queda en revisión | Precio/cuenta y devolución/cantidad según resultados alojados |
| Reportes / metas | Lectura del estado disponible; meta por comando | Meta mensual compartida | Costos desconocidos nunca cero; cortes Salta probados en dominio |
| IndexedDB | Adaptador activo, esquema de espacio v1 / dominio v5 | Independiente de Supabase | Atomicidad, dos conexiones, cierre y errores de escritura |
| Offline | Preparación y efectos locales con evidencia | Reintento o revisión al volver | No implica guardar remoto; la primera autenticación/vinculación requiere red |
| Backup JSON | Esencial, copia completa con pendientes | Importación inicial explícita sólo a negocio vacío | v3/v4/v5; copia con pendientes ajenos no se envía automáticamente |
| Restauración divergente | Bloqueo conservador | No mezcla dos historias | Recuperación asistida de pendientes ajenos todavía pendiente |
| PWA | Manifest, recursos, caché y actualización controlada | Sin sincronización oculta por service worker | HTTPS emulado; instalación física pendiente |
| PDF | Impresión del navegador conservada | No se agregó librería pesada | PDF A4 real de 3 páginas revisado |
| Vista previa para teléfono | Procedimiento preparado | Origen todavía no habilitado | No desplegada; publicación de producción no autorizada |
| Proyecciones | Excluidas | Excluidas | Sin módulo nuevo |
