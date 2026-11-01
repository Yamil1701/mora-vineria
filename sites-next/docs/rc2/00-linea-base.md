# Integración RC2 · línea base verificada

PR #14 abierta, borrador y sin fusionar; HEAD remoto `fc20f44a2c17e6cd46faa6dc9eac766aa4d00e58`. Master conserva `296c2aa1a95273ccd86af784c14595af33573602`. Rama local de trabajo derivada: `work/mora-rc2-integracion`; tag recuperable `baseline-rc1-integracion-20261101`.

Proyecto autorizado: Mora Vinería `dedcvvgiuxpwdzqqdifn`, cuenta Yamil, Mora Vinería, región sa-east-1, ACTIVE_HEALTHY, PostgreSQL 17.6.1.141. Se cotejaron funciones, políticas e historial: RC1 ya está aplicado. Cinco tablas RC1 vacías; no se reaplicará la migración inicial.

Archivo `mora_legacy_archive`: sin USAGE para anon/authenticated/service_role. Cron antiguo desactivado. No participa en RC1. No se modifican ni importan sus registros.

La base de pruebas de código aprueba 49 entradas. Se inicia además el navegador basal sobre el commit actual. Documentos RC1 y contratos se conservan como historia; la preparación de Supabase del 31/10 prevalece sobre sus advertencias antiguas de infraestructura inexistente.

Mutaciones localizadas: operaciones del dominio (ventas, movimientos, recepciones, inventario, fiados, correcciones y metas) y escrituras directas de catálogo/presentaciones, listas/equivalencias/precios, pedidos, referencias y controles. Carrito, favoritos, borradores y navegación son estado del dispositivo. `commitData` y `render` todavía escriben síncronamente en localStorage. Se reemplazará esa frontera con persistencia durable; no basta importar el adaptador preparado.

El panel web requiere sesión. La conexión Supabase sí permite SQL y despliegue Edge. La provisión de pruebas se hará mediante Auth Admin desde servidor, sólo para identidades sintéticas; ninguna clave privilegiada se entrega al navegador.
