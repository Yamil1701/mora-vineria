# Mora Vinería — reconstrucción

Nueva etapa de Mora Vinería. Este repositorio conserva su historia, pero la aplicación se diseñará e implementará nuevamente desde cero.

**Estado:** definición de producto y reglas; todavía no existe una nueva aplicación ejecutable en `master`.

## Archivo de la versión anterior

- Rama histórica: [`legacy/v1-final`](https://github.com/Yamil1701/mora-vineria/tree/legacy/v1-final).
- Último commit de la versión archivada: [`3a2d9ab`](https://github.com/Yamil1701/mora-vineria/commit/3a2d9ab149edfca11384d3269aeecfcbe5f171b6).
- Las ramas y etiquetas antiguas se conservan.
- El código y la documentación de la versión anterior no son instrucciones normativas para esta reconstrucción.

## Objetivo

Crear una aplicación para operar una vinería pequeña desde el celular: fácil de aprender, rápida para vender y fiable para resguardar datos. No reproducir la interfaz ni la complejidad anterior por inercia.

## Decisión técnica inicial

Se mantiene el enfoque PWA, mobile-first y local-first. **Supabase será el servidor central** para compartir datos entre dispositivos autorizados. **IndexedDB** permitirá trabajar sin red y registrar una cola durable de operaciones para conciliarlas con el servidor al recuperar conexión. Las decisiones técnicas y reglas críticas se deberán validar antes de codificar.

## Documentación

Leer [docs/README.md](docs/README.md) y [AGENTS.md](AGENTS.md).

## Precauciones

Este reinicio afecta solo al código del repositorio; **no elimina información de Supabase ni de IndexedDB**, y no equivale a una nueva publicación en GitHub Pages. No reutilizar ni limpiar datos remotos sin inventario, respaldo, validación y autorización explícita. No desplegar una versión nueva hasta aprobar pruebas operativas y de recuperación.
