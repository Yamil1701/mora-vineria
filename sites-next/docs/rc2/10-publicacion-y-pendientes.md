# Preparación para vista previa y publicación posterior

Esta misión no publicó una candidata, no fusionó PR #14, no cambió master y no sustituyó Sites v25 ni el borrador v29. No se migraron datos reales.

## Vista previa móvil pendiente

Elegir un alojamiento de desarrollo cuyo acceso y costo estén autorizados; no considerar privada una URL de Pages sólo porque no se comparte. Servir exactamente `sites-next/dist/` del SHA candidato, con HTTPS y rutas relativas, sin regenerar la interfaz mediante otra herramienta. Exponer sólo configuración publicable. Habilitar únicamente ese origen en la configuración Edge, desplegar desarrollo y repetir Auth, dos dispositivos y prueba de origen ajeno. Entregar al usuario enlaces privados de Auth y códigos de dispositivo por un canal seguro, en un negocio exclusivamente sintético. No incluirlos en el ZIP.

La conexión GitHub→Sites no es automática. No se comprobó un mecanismo bidireccional que mantenga una sola fuente entre ambos. Se conservó Sites v29 como referencia; un eventual traslado exige exportar/versionar el mismo árbol de `dist/` y verificar su procedencia. No abrir dos implementaciones distintas.

## Antes de autorizar producción

1. Resolver la recuperación asistida de copias con pendientes de otro dispositivo y documentar cómo se retiran o reasignan con evidencia los casos que bloquean la secuencia. No fusionar historias ni cambiar ID para hacer pasar un rechazo.
2. Revisar configuración global de Auth en el panel autorizado, avisos de contraseñas y anónimos, permisos y entorno productivo separado. Confirmar el estado del incidente PGRST303 o una alternativa probada del proveedor.
3. Ejecutar un ensayo alojado prolongado con volumen representativo para JSONB/proyecciones. Las comprobaciones actuales de integridad no son un ensayo de capacidad ilimitada.
4. Configurar/ejecutar el job alojado opcional de CI con fixtures sintéticos privados nuevos; el CI ordinario cubre Node/navegador local y no lo reemplaza.
5. Habilitar una vista previa aislada y realizar los 58 casos físicos, registrar fallos y repetir las correcciones pertinentes.
6. Acordar una ventana de migración real con copia externa, origen congelado, destino vacío, comparación de saldos/relaciones y reversión. Requiere autorización separada del usuario.
7. Preparar el origen productivo, Auth y negocio correctos sin copiar sesiones de QA ni su prueba del dispositivo. Generar nueva identidad de caché, ejecutar verificaciones y revisar el SHA exacto.
8. Sólo con autorización expresa: decidir merge, publicación y traslado real. Conservar respaldos y `mora_legacy_archive`.

El workflow antiguo de publicación se dispara por master o manualmente. Esta misión no lo invocó ni cambió master. El nuevo workflow de candidata no despliega, usa contents:read, dependencias fijadas y artefactos con retención de 90 días.
