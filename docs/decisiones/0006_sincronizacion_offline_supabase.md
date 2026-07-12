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
- El ciclo normal es automático: arranque, regreso al primer plano, recuperación de red, cambio local, aviso Realtime y recuperación periódica ejecutan `pull → push → pull` sin exigir una acción humana.
- “Sincronizar ahora” es una salida secundaria de diagnóstico, no parte del trabajo cotidiano.

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

## Backup y puesta en marcha

El backup JSON continúa siendo una salida independiente. La metadata de sesión, códigos, cola transitoria y credenciales no se exportan. Como la aplicación todavía no contiene datos operativos reales, la primera puesta en marcha remota será limpia y no requiere importar ni fusionar copias heredadas. Si esto cambiara antes del despliegue, se deberá diseñar una migración explícita desde el dispositivo principal.

El dispositivo principal inicializa una sola vez el catálogo remoto con su copia local. Los demás dispositivos reemplazan sus categorías y productos temporales por ese snapshot antes de comenzar el pull incremental. Las ediciones consecutivas aún no enviadas se compactan por entidad y conservan el mismo punto de partida remoto.

Categorías y productos usan versión optimista. Un cambio obsoleto no sobrescribe silenciosamente otro: crea un conflicto y el principal decide entre la versión compartida y el cambio pendiente. Esta decisión explícita es la única intervención esperada fuera de fallos persistentes.

Agregar tablas locales de sincronización lleva Dexie a v3, pero no cambia por sí mismo el contrato del backup operativo v1 porque esas tablas son metadata específica del dispositivo.

## Consecuencias

La decisión 0001 sigue vigente respecto de PWA, GitHub Pages y prioridad local, pero queda superada en su prohibición de backend y sincronización. La decisión 0003 queda superada en la copia entre dispositivos: JSON continúa como respaldo, mientras Supabase pasa a ser el mecanismo normal de sincronización.
