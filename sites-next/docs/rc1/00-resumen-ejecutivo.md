# Mora · candidata técnica RC1 · 31 de octubre de 2026

Esta entrega prepara una candidata para revisión técnica y QA masivo. **No reúne todavía las condiciones para operar con una base compartida ni para autorizar producción.** La interfaz activa sigue guardando en el dispositivo. El servicio remoto nuevo tiene pruebas locales con PostgreSQL, pero no está desplegado ni conectado a las pantallas.

Se conservaron el diseño v29, los cuatro bloques aprobados y los recorridos existentes. No se incorporaron proyecciones, otro framework ni componentes de la PWA descartada.

Se corrigieron escritura sin protección, separación de versiones locales, lenguaje, períodos, aviso de correcciones posteriores, compatibilidad de costos con JSONB, instalación inicial offline, navegación inmediata después de guardar y estilos de impresión. Se prepararon un servicio de comandos, migración SQL y un adaptador IndexedDB con pruebas. Los dos adaptadores experimentales continúan desactivados en la interfaz.

## Lo que falta para autorizar publicación

1. Proyecto **Mora dev dedicado**, autorizado y vacío. El único proyecto visible fue Chofer Utilities; no se utilizó.
2. Aplicar y revisar SQL en ese proyecto; configurar Auth, dos usuarios de prueba y dispositivos; verificar JWT, RLS y permisos reales por HTTP. Probar carreras en conexiones independientes y revocación durante operaciones. Deno/Edge no fue desplegado ni certificado.
3. Integrar todas las escrituras de pantalla con el adaptador remoto, incluyendo catálogo/listas/pedidos, lectura inicial y resultado remoto. Cubrir recuperación y respaldo de preparaciones remotas. No activar el adaptador parcial como si ya fuera sincronización.
4. Integrar asíncronamente el almacenamiento definitivo. IndexedDB está probado como candidato, pero localStorage sigue activo y requiere Web Locks. No hay garantía de persistencia ante borrado del navegador.
5. Preparar importación inicial al negocio remoto con manifiesto, revisión, recuperación de resultados e identidad de importación. La migración probada ahora es JSON local entre dos orígenes; no se migraron datos reales.
6. Ejecutar el guion móvil en Android y, de ser posible, iOS: instalación, teclado, zoom, escaneo, cierre forzado, red y actualización físicos. Confirmar comodidad y resultados con el usuario. Todos esos casos siguen **QA físico pendiente**.
7. Resolver decisiones señaladas: aceptación de reportes comerciales históricos que incorporan correcciones posteriores y presentación definitiva de revisiones ambiguas. La RC avisa los efectos; no se inventó un cierre inmutable.
8. Revisar CI y evidencias de esta rama, decidir el alojamiento candidato y realizar una transferencia verificable del artefacto elegido. GitHub no actualiza Sites automáticamente.
9. Sólo después del QA y de una autorización expresa: planificar publicación y traslado de datos reales. Mantener origen y copias hasta autorización de retiro.

## Protecciones de esta misión

PR #14 conservada abierta y en borrador; master no sustituido; Sites v29 congelada; v25 pública conservada. No se fusionó, publicó, desplegó Pages, aplicó SQL remoto, eliminó respaldo ni trasladó datos reales. Los datasets y sesiones utilizados son sintéticos.

Los resultados detallados y sus límites están en `07-resultados-pruebas.md`. Una prueba local de PostgreSQL no equivale a una prueba remota de Supabase. La emulación de Chromium no equivale al teléfono del usuario.
