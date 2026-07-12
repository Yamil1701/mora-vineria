# 0006 — Sincronización offline con Supabase

- Estado: aceptada
- Fecha: 2026-07-12
- Versión objetivo: `v0.2.0`

## Contexto

`v0.1.1` funciona localmente en un solo dispositivo. La operación real suele tener una sola persona vendiendo, pero distintas personas usan sus propios celulares. Se necesita compartir productos, ventas, movimientos y reportes sin exigir conexión permanente.

## Decisión

Mora Vinería evoluciona a una arquitectura local-first sincronizada:

- Dexie continúa como base inmediata y permite operar sin conexión.
- Supabase PostgreSQL es la fuente remota compartida.
- Cada escritura local genera una operación idempotente en una cola de salida.
- Al recuperar conexión, las operaciones se envían y luego se descargan cambios incrementales.
- Realtime despierta la sincronización, pero no reemplaza el cursor ni el proceso de recuperación.
- Las operaciones reales nunca se descartan silenciosamente.

Existe un único dispositivo principal. Puede emparejar, revocar y transferir el control a dispositivos con nombre propio. Los dispositivos vinculados funcionan en modo Operación o Consulta. Supabase Auth usa identidades anónimas internas; no representan usuarios, empleados ni responsables humanos.

El emparejamiento usa códigos aleatorios de un solo uso y vencimiento breve. El negocio dispone de un código de recuperación rotatorio que debe guardarse fuera del dispositivo principal.

## Conflictos de stock

Si una venta offline supera el stock remoto disponible:

1. la venta se conserva porque ocurrió realmente;
2. el stock disponible remoto no se vuelve negativo;
3. se registra una diferencia de stock pendiente;
4. el dispositivo principal debe conciliarla explícitamente.

No se aplica “última escritura gana” a ventas, movimientos, anulaciones ni stock.

## Seguridad

- La PWA utiliza únicamente URL y publishable key.
- Las claves `secret` y `service_role` nunca llegan al navegador.
- Todas las tablas remotas usan RLS.
- Las escrituras sensibles se ejecutan mediante funciones PostgreSQL transaccionales.
- Un dispositivo revocado deja de satisfacer las políticas aunque conserve una sesión local.

## Backup y migración

El backup JSON continúa siendo una salida independiente. La metadata de sesión, códigos, cola transitoria y credenciales no se exportan. La primera carga remota será una migración explícita desde el dispositivo principal y no una mezcla automática de copias.

Agregar tablas locales de sincronización incrementa la versión Dexie, pero no cambia por sí mismo el contrato del backup operativo v1 porque esas tablas son metadata específica del dispositivo.

## Consecuencias

La decisión 0001 sigue vigente respecto de PWA, GitHub Pages y prioridad local, pero queda superada en su prohibición de backend y sincronización. La decisión 0003 queda superada en la copia entre dispositivos: JSON continúa como respaldo, mientras Supabase pasa a ser el mecanismo normal de sincronización.
