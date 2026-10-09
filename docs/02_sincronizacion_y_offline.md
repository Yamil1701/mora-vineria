# Sincronización con Supabase y modo sin conexión

## Requisito aprobado

Supabase funciona como servidor central y fuente de verdad de la información compartida. Cada dispositivo autorizado debe recibir los cambios confirmados del negocio cuando tiene conexión. Sin internet, la aplicación debe continuar trabajando con datos locales y sincronizar de forma segura al recuperar la conexión.

**Sincronización no es backup:** se mantiene un mecanismo de copia/exportación y restauración probado por separado.

## Arquitectura conceptual (propuesta, no implementación)

- **Cliente:** PWA + IndexedDB/Dexie para lectura veloz, borradores, datos consultables, transacciones locales y cola persistente de operaciones.
- **Servidor:** Supabase/Postgres valida y confirma operaciones de negocio de forma atómica; tiene autoridad compartida sobre stock, ventas y dinero.
- **Identidad:** autorización por negocio y dispositivo, revocación, permisos mínimos y RLS. El navegador jamás contiene `service_role` ni claves secretas.
- **Transporte:** envío/reintentos seguros, lectura incremental de cambios, y Realtime como aviso para actualizar (no como único mecanismo de entrega).

## Ciclo esperado

1. Dispositivo autorizado abre la app: muestra su estado local y verifica sesión, conectividad y permisos.
2. Recupera de Supabase cambios posteriores a su cursor/revisión y actualiza su base local, sin pisar operaciones pendientes.
3. Cada acción se registra primero en una transacción local junto con una operación única e inmutable en una outbox.
4. Si hay conexión, se envía la operación; si no, permanece pendiente y visible de forma discreta.
5. El servidor valida contra el estado **actual** dentro de una transacción, aplica la operación una sola vez y devuelve acuse/revisión o conflicto explícito.
6. El cliente registra el acuse, incorpora la versión oficial y concilia diferencias. En reintentos o reconexiones, la misma operación no se duplica.
7. Al recibir avisos Realtime, volver a primer plano, reabrir o reconectarse, solicita cambios incrementales y reintenta pendientes. Debe existir reconciliación periódica porque los avisos pueden perderse.

## Garantías y límites

- La escritura local y la anotación en la cola deben ser atómicas.
- IDs únicos de operación, secuencia/cursor durable, validación por servidor, reglas de idempotencia y pruebas ante cortes/reintentos.
- No asumir orden global de acciones de equipos desconectados ni reemplazar todo el inventario mediante snapshots locales.
- **No se puede garantizar simultáneamente aceptar ventas offline en varios teléfonos y evitar cualquier sobreventa real** sin límites adicionales (reservas, cupos o conciliación posterior). Resolver esta política con el usuario antes de desarrollar ventas.
- Una operación local pendiente no debe aparecer como confirmada globalmente.
- Conflictos de stock, ediciones concurrentes, saldos, anulaciones y revocaciones requieren políticas específicas; conservar el registro y facilitar solución, nunca borrarlo silenciosamente.
- Los cambios recibidos del servidor deben respetar versiones/revisiones, sin sobrescribir la cola de pendientes.
- Una conexión de red por sí sola no garantiza estar al día: mostrar sincronizado solamente después de completar envío/recepción y confirmar el estado.
- Restaurar un backup no debe sobreescribir directamente el servidor compartido ni duplicar transacciones.

## Casos de prueba obligatorios

- Dos teléfonos vendiendo el último producto en paralelo, online y offline.
- Operación recibida por el servidor pero desconexión antes del acuse; reintento sin duplicar.
- N operaciones locales, cierre de la PWA y posterior reconexión.
- Un equipo modifica el precio mientras otro prepara una venta.
- Reposición y anulación simultáneas; cambios de dinero concurrentes.
- Nuevo dispositivo que descarga un estado completo y luego incrementos.
- Revocación y recuperación con operaciones locales pendientes.
- Pérdida de eventos Realtime y recuperación mediante lectura incremental.
- Restauración de backup sin corrupción ni duplicados.

## Pendiente de diseño

Modelo de operaciones, orden de procesamiento, reglas exactas de conflicto, permisos y dispositivos, onboarding, migración remota, métricas de sincronización y contratos transaccionales. No tocar el esquema Supabase anterior todavía.
