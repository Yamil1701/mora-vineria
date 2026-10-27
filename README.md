# Mora Vinería — reconstrucción

Aplicación móvil local de Mora Vinería. Este repositorio conserva la historia de V1 y la reconstrucción funcional de V2.

**Estado de esta rama (27/10/2026):** implementación local real sobre `master`, lista para revisión por PR, sin publicación. Navegación unificada, productos/ventas en efectivo/FIFO, Caja e Inventario, listas de proveedor con equivalencias y precios revisados, pedidos con entregas parciales, metas e informe imprimible. Esquema 6 y backup 4 compatible con respaldos anteriores. [Entrega, pruebas, capturas y pendientes](docs/implementacion-v2/entrega.md).

## Archivo de la versión anterior

- Rama histórica: [`legacy/v1-final`](https://github.com/Yamil1701/mora-vineria/tree/legacy/v1-final).
- Último commit de la versión archivada: [`3a2d9ab`](https://github.com/Yamil1701/mora-vineria/commit/3a2d9ab149edfca11384d3269aeecfcbe5f171b6).
- Las ramas y etiquetas antiguas se conservan.
- El código y la documentación de la versión anterior no son instrucciones normativas para esta reconstrucción.

## Objetivo

Crear una aplicación para operar una vinería pequeña desde el celular: fácil de aprender, rápida para vender y fiable para resguardar datos. No reproducir la interfaz ni la complejidad anterior por inercia.

## Decisión técnica inicial (histórica, sustituida para esta misión)

La propuesta inicial mantenía el enfoque PWA, mobile-first y local-first. **Supabase se proponía como servidor central** para compartir datos entre dispositivos autorizados. **IndexedDB** permitirá trabajar sin red y registrar una cola durable de operaciones para conciliarlas con el servidor al recuperar conexión. Las decisiones técnicas y reglas críticas se deberán validar antes de codificar.

La implementación vigente funciona sólo con IndexedDB/Dexie, PWA y backup JSON; no incluye servidor ni sincronización.

## Documentación

Leer [docs/README.md](docs/README.md) y [AGENTS.md](AGENTS.md).

## Precauciones

Este reinicio afecta solo al código del repositorio; **no elimina información de Supabase ni de IndexedDB**, y no equivale a una nueva publicación en GitHub Pages. No reutilizar ni limpiar datos remotos sin inventario, respaldo, validación y autorización explícita. No desplegar una versión nueva hasta aprobar pruebas operativas y de recuperación.

## Verificación local

`npm ci`, `npm run typecheck`, `npm test`, `node --test tests/architecture/contract.cases.mjs`, `npm run build`. Para navegador: `npx playwright install --with-deps chromium webkit` y `npm run test:e2e`. CI de PR verifica Chromium y los recorridos de backup y movimientos en WebKit móvil.
