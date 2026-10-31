# PWA, instalación y PDF

## PWA comprobada automáticamente

Manifiesto relativo, `start_url`/`scope` para `/mora-vineria/`, iconos 180/192/512 y modo standalone. El service worker almacena recursos del shell; no copia datos de negocio ni credenciales. La prueba usa HTTPS local con un certificado descartable y confianza acotada a su clave pública; sesiones nuevas, sin datos ni credenciales del usuario.

Se comprobó control efectivo por service worker, reapertura offline, borrador conservado, nueva versión de worker, aviso accesible y actualización deliberada con recuperación del trabajo. Se corrigió que el primer worker recién instalado pudiera mostrar una actualización inexistente. El ensayo de actualización cambia la versión del worker manteniendo el mismo shell: demuestra la mecánica, no compatibilidad entre dos esquemas diferentes.

Dos pestañas reales, navegador sin Web Locks y traslado por subruta también están probados. La pérdida de exclusión bloquea edición. El estado de conexión no afirma respaldo remoto.

## PDF

`Mora-informe-mensual-QA-A4.pdf` fue producido por `page.pdf()` de Chromium sobre la vista mensual real y datos descartables. No es una captura renombrada. `pdfinfo` registra A4; se extrajo texto y se renderizaron todas sus páginas.

La primera generación reveló fondo oscuro de aplicación y bajo contraste. Se corrigió únicamente `@media print`: página clara, fondo transparente del contenido, sin sombras, navegación ni acciones, grupos y filas con saltos controlados. Se volvió a generar y verificar. El informe incluye octubre de 2026, ventas/cobros distintos, costo identificado y **ganancia total pendiente por costos faltantes**, meta y aclaración de información local.

La evidencia final, páginas renderizadas y salida `pdfinfo` están en la carpeta `evidencias/browser/` del paquete. El número final de páginas y comprobaciones de márgenes se registra en `pdf-verification.json`.

## Pendientes físicos

Instalar desde Chrome Android y Safari iOS; abrir desde icono, apagar datos/Wi-Fi, cerrar forzosamente, reabrir, volver a tener conexión y actualizar con trabajo preparado. Probar teclado del sistema, selector de archivos, zoom 200 %, áreas seguras, escaneo/cámara, impresión o guardado PDF del teléfono y comportamiento con almacenamiento del dispositivo casi lleno. No se marcó ninguna de esas pruebas como ejecutada por el usuario.
