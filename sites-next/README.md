# Mora Vinería · integración de desarrollo RC2

**Actualización 6/11/2026:** PR #14 fusionada en `c467275` y publicada para QA. Nueva revisión de pantallas en rama/PR separadas, sin reemplazar Pages: [decisiones, alcance y límites](docs/rc2/12-pulido-pantallas.md). Las notas siguientes conservan el cierre histórico de RC2 del 1/11.

Fuente única: `sites-next/`, basada en la dirección visual de Sites v29. La app activa usa IndexedDB y el servicio alojado del proyecto exclusivo Mora. Conserva ventas, stock, caja, fiados, reposición, reportes, metas y JSON; no usa la PWA histórica ni agrega proyecciones.

**No publicar ni fusionar.** PR #14 sigue borrador; master y Sites v25 se preservan y v29 sigue congelada. No se trasladaron datos reales. La candidata tiene límites técnicos y QA físico pendientes: no declararla producción ni completamente cerrada.

- [Contexto para continuar](docs/rc2/INSTRUCCIONES.md)
- [Resumen y pendientes exactos](docs/rc2/00-resumen-ejecutivo.md)
- [Implementación](docs/rc2/01-implementacion.md) y [matriz funcional](docs/rc2/02-matriz-funcional.md)
- [Seguridad](docs/rc2/03-seguridad-integridad.md) y [Supabase real](docs/rc2/04-supabase.md)
- [Migración y recuperación](docs/rc2/05-migracion-recuperacion.md)
- [PWA/PDF](docs/rc2/06-pwa-pdf.md), [pruebas](docs/rc2/07-resultados-pruebas.md) y [evidencia](docs/rc2/08-evidencias.md)
- [QA móvil: 58 casos físicos pendientes](docs/rc2/09-guion-qa-movil.md)
- [Preparación de vista previa/publicación posterior](docs/rc2/10-publicacion-y-pendientes.md)

Node >=22, desde `sites-next/`: `npm ci --no-audit --no-fund`, `npm run verify`, `npm test`, `npm run test:browser`. Si cambia un recurso servido: `npm run stamp` y luego verificar/probar. El CI rechaza una identidad de caché desactualizada.

El navegador local de QA sirve HTTPS aislado y desactiva sólo el transporte remoto en su configuración de fixture; la misma app usa el adaptador durable. No necesita datos reales ni sesión. Las pruebas alojadas son separadas y requieren fixtures sintéticos privados; no incluirlos en el repositorio. Consultar sus scripts de provisión/pruebas y el informe de Supabase. El job manual alojado de CI está preparado y requiere configuración pendiente.

`dist/` es estática, con configuración publicable de desarrollo y acceso inicial por Auth/vínculo. No abrirla como archivo ni asumir que una URL de Pages sería privada. No hay un traslado automático de cambios de GitHub a Sites.

Los documentos `docs/rc1/`, `docs/entregas-3-4/` y verificaciones anteriores son antecedentes. Sus afirmaciones de infraestructura no configurada o almacenamiento todavía localStorage fueron superadas por RC2; conservarlas como historia.
