# Backup y restauración JSON local — PR #9

> **Evolución PR #10:** [10_movimientos.md](10_movimientos.md) amplía a formato 2, esquema 4 y 16 tablas (movements/stockCounts). Formato 1 publicado sigue importable: se valida íntegramente antes de migrarlo en memoria. El contrato siguiente documenta la versión original.

Fecha: 10/10/2026. Base: `master` 3757d07, con PR #6/#7/#8 fusionadas y QA móvil aprobado por el usuario. Esta entrega sigue siendo local: no conecta Supabase, no modifica V1 y no publica automáticamente.

## Alcance y política

Inicio → **Backup y restauración** abre un diálogo dentro de la App existente, con los mismos componentes, tema oscuro/fucsia y cuatro destinos inferiores. Exportar e importar funciona sin internet una vez disponible el shell PWA.

Se exportan **las 14 tablas actuales**, sin omisiones: metadata, products, lots, sales, receipts, stockEntries, cashEntries, drafts, commands, results, outbox, reviews, writeIntents y preferences. Categorías están dentro de cada producto; detalles/cobros de ventas están en la venta y caja; favoritos en preferences. No existen tablas independientes de configuración/categorías/cobros que deban inventarse. Todo persistente actual se incluye. Fotos verificadas y configuraciones adicionales aún no existen; los assets del shell no son datos de negocio y no se incluyen en el JSON.

**Restauración exclusivamente sobre espacio vacío.** No hay mezcla, sustitución de negocio existente, limpieza de datos ni importación de V1. Una instalación recién abierta genera metadata y un borrador vacío: se admite reemplazar solamente ese bootstrap sin actividad (sequence0, localOrder0, borrador versión1 sin líneas, recibido, consumo ni submission; favoritos vacíos). Productos, comandos, lotes, historial, borrador editado o confirmación pendiente bloquean la recuperación. No basta con borrar el carrito visualmente. Se vuelve a comprobar todo dentro de la transacción, aunque la vista previa hubiera indicado vacío.

Una futura sustitución de base no está implementada ni autorizada por esta PR. Requeriría exportar y verificar una copia independiente del estado anterior, garantizar que el usuario la conserve, consentimiento específico y ensayo de rollback/recuperación. La interfaz no ofrece un botón para borrar o reemplazar los registros existentes.

## Formato 1

```json
{
  "format": "mora-v2-local-backup",
  "formatVersion": 1,
  "schemaVersion": 3,
  "contractVersion": 1,
  "environment": "local-workspace",
  "createdAt": "2026-10-10T22:00:00.000Z",
  "rowCounts": { "metadata": 1, "products": 0 },
  "data": { "metadata": [], "products": [] },
  "integrity": { "algorithm": "SHA-256", "digest": "64 caracteres hexadecimales" }
}
```

El ejemplo abrevia tablas y **no es un archivo importable**. Un archivo válido incluye exactamente las 14 tablas/conteos y una instalación válida. Nombre descargable: `mora-vineria-backup-AAAA-MM-DD.json` (fecha UTC de creación). Límites iniciales: **20 MiB UTF-8 / 100.000 filas totales**, 100 líneas por comando/venta; los límites de enteros seguros y textos del dominio se conservan. No se añaden dependencias.

El digest cubre todo el documento salvo `integrity`: JSON canónico, claves de objetos ordenadas, arrays conservando orden, enteros seguros y racionales serializados como strings decimales. SHA-256 por Web Crypto. Alterar formato, fecha, conteos o datos sin recalcular digest falla. La importación además reconstruye en memoria los efectos de cada comando, por `localOrder`, usando los validadores y operaciones racionales/FIFO existentes, y compara las proyecciones exportadas: productos/versiones, lotes/cantidades/costos, recepciones, ventas/cobros/jornadas, stock/caja, revisiones, resultados y outbox. No recalcula ni sobrescribe los costos importados: rechaza una inconsistencia. Comandos y sus hashes, dependencias, scopes, secuencias y unicidad se comprueban; borradores, submissions y confirmaciones se vinculan a sus IDs originales.

**El hash detecta corrupción, no autentica al autor ni cifra los datos.** Una persona puede fabricar un archivo consistente y recalcular hashes; importar únicamente una copia de confianza. La UI aclara esta limitación. El JSON contiene información comercial en texto legible, sin credenciales/tokens (el esquema local no contiene ninguno). No importa ni ejecuta HTML/scripts; React escapa textos. Formato remoto, cifrado con contraseña y firmas no están implementados.

## Consistencia, rollback e identidad

- Exportación: transacción Dexie `r` sobre todas las tablas, lectura coherente frente a otras pestañas. Hash y validación fuera de la transacción. Se espera la cola del efectivo recibido antes de exportar desde la UI. Un comando confirmado concurrentemente entra completo o queda totalmente fuera; puede quedar su preparación durable previa.
- Importación: tamaño/JSON/formato/tablas/conteos/hash/estructura/relaciones/invariantes se validan **sin escribir en ninguna base**, antes de mostrar vista previa. Esta detalla productos, ventas, movimientos, recepciones, revisiones, borradores, confirmaciones y fecha.
- Confirmación: checkbox explícito; botón deshabilitado hasta consentir. La función de restauración clona y revalida el archivo. En una única transacción `rw` sobre todas las tablas comprueba vacío, retira solamente el bootstrap permitido e inserta el conjunto. Si falla cualquier inserción o quota, rollback devuelve exactamente el estado anterior. No hay crypto, temporizadores o red dentro de `rw`.
- Identidad: businessId/datasetEpoch, IDs de comandos y entidades, deviceId/deviceSeq históricos, resultados, outbox, timestamps y FIFO se conservan. La instalación receptora recibe **nuevo deviceId**, sequence0 y `localOrder` continuado desde el backup; nuevas operaciones empiezan en secuencia1 para ese deviceId. Es la única diferencia intencional de metadata respecto del archivo. No se restaura ni suplanta una identidad autenticada: son identidades locales, sin servidor.
- Reintentos de confirmaciones/borradores usan los comandos originales, por lo que los resultados existentes no reaplican efectos. Outbox permanece `awaiting_backend`, attempts0; no existe emisor. Una segunda importación sobre un negocio restaurado se bloquea, sin efectos extra.
- La transacción de recuperación no crea registros adicionales. Al abrir una nueva venta o reiniciar, la App abre un borrador vacío solo si no existe uno activo, con su comportamiento habitual. No se cambia schema3 ni namespace, no se modifica el servicio de ventas/FIFO ni se crea una migración.

**Antes de activar sincronización futura:** estas bases locales no se deben enviar automáticamente. Se necesita un contrato explícito de enrolamiento/procedencia y conciliación con resultados remotos por ID/hash. La PR preserva la historia y separa secuencias nuevas; no decide recuperación de autoridad remota, epoch nuevo o mezcla de dos copias. Copiar por archivo no sincroniza dispositivos; después de la copia pueden divergir si se operan ambos. Eliminar la autoridad remota o sustituir negocio requiere otra aprobación.

## Descarga e importación en móviles

Preparar respaldo → **Descargar JSON**. El enlace Blob se activa mediante un segundo toque explícito, conservando el gesto de usuario para Safari; se mantiene disponible hasta cerrar/preparar otra copia y luego se libera su URL. No se afirma que el archivo esté guardado por solo generar el Blob: verificarlo en Descargas/Archivos. Si Safari muestra una vista del JSON, usar Compartir → Guardar en Archivos y comprobar nombre/contenido. La selección usa el selector nativo de archivos, `.json,application/json`, lectura `File.text()` y vista previa antes de escribir.

Durante preparación/validación/restauración se bloquean acciones y cierre del diálogo; no se permite activar una actualización PWA mientras esté abierto. El enlace identifica la copia del momento de preparación: nuevas ventas exigen preparar otra. No hay exportación periódica automática, envío a nube ni promesa de almacenamiento permanente del navegador.

## Guía de QA desde celular (después de publicación autorizada)

**No borrar ni usar para fixtures el navegador habitual del negocio.** Usar otro navegador/perfil normal vacío o un teléfono de prueba; los contextos privados son temporales y pueden borrar datos al cerrarse, por lo que no sirven para comprobar conservación a largo plazo.

1. En un **navegador de prueba A**, cargar «Cerveza QA», precio3500, objetivo24 y categoríaCervezas. Registrar compra6 unidades, costo total125000; cerrar confirmación. Marcar favorito.
2. Vender3 unidades en efectivo: venta10500; costo FIFO exacto62500, stock3. Dejar después otra venta de1 unidad como borrador, con recibido5000. No confirmar esta segunda venta todavía.
3. Inicio → Backup y restauración → Preparar respaldo → Descargar JSON. Verificar archivo en Descargas/Archivos, extensión y tamaño no nulo; conservarlo fuera del navegador (idealmente otra ubicación/dispositivo).
4. En un **navegador/perfil de prueba B nuevo y vacío**, abrir la misma App → Backup y restauración → Elegir respaldo JSON. Verificar fecha, 1 producto y 1 venta en la vista previa. Marcar confirmación explícita → Restaurar respaldo.
5. Cerrar diálogo. Verificar producto/categoría/favorito, stock3, venta10500, costo62500 y borrador con recibido5000. Cerrar/reabrir B: debe conservar todo. Terminar el borrador: se registra exactamente una venta nueva y stock2; reabrir no debe crear otra.
6. Con shell ya cargado en B, modo avión → recargar/reabrir. Revisar productos, ventas y stock. Preparar/descargar e importar archivos sigue funcionando sin red; abrir un navegador nunca antes cargado sí necesita recibir primero la App.
7. Intentar importar el mismo archivo sobre B con datos: debe explicar conflicto y no ofrecer sustitución. Elegir un archivo dañado en A/B: error sin cambios. **No se pide borrar datos para continuar.**

## Pruebas y límites

Pruebas automatizadas usan exclusivamente namespace `mora-v2:test:<uuid>` y contextos temporales de navegador. Cubren exportación de todas las tablas, equivalencia salvo nueva identidad, racionales/jornada, recuperación de recepción preparada/confirmada y venta sellada, diez reintentos sin duplicados, secuencias tras sucesivas copias, snapshot concurrente, consentimientos, base existente/alterada después de vista previa, dos restauraciones concurrentes, corrupción/incompatibilidad, FK/duplicados/efectos inconsistentes incluso con digest recalculado, límites y fallo de la última tabla con rollback.

Playwright cubre descarga real y lectura del archivo, vista previa, rechazo sin cambios, importación offline a otro perfil, comparación de todas las tablas, persistencia al recargar, FIFO/borrador posterior y fallo nativo de IndexedDB con reintento. Chromium ejecuta todos los recorridos; WebKit móvil ejecuta los de backup. UI se comprueba en 360/390/430/1280px; se tolera solamente el redondeo de 1px de métricas de borde del diálogo en Chromium, sin contenido fuera de la pantalla.

Pendiente: prueba en Android y Safari/iOS físicos (selector/Descargas/Compartir, instalación y almacenamiento disponible), rendimiento de bases grandes y recuperación con archivo cercano a límites. Lectura JSON/snapshot/reconstrucción ocurre en memoria y puede consumir tiempo/memoria; los límites evitan tamaños ilimitados, no garantizan rendimiento en todos los teléfonos. El respaldo solo contiene lo guardado hasta su creación; operaciones posteriores o borrado del perfil sin copia externa siguen siendo irrecuperables. Hash no demuestra procedencia. No se implementa sustitución de un dataset existente.

Validación local final: TypeScript sin errores, Vitest **119/119** (26 pruebas nuevas de backup), contratos de arquitectura **14/14**, Playwright **13/13** (11 Chromium, 2 WebKit móvil) y compilación Vite/PWA correcta. Se ejecutaron navegadores reales; el contenedor necesitó binarios/librerías de navegador temporales fuera del repositorio, sin omitir pruebas. CI instala Chromium/WebKit con sus dependencias oficiales. El servicio, esquema Dexie, reglas/tipos del dominio, dependencias y workflow de despliegue permanecen sin cambios.
