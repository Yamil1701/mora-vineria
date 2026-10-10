# Recuperación independiente de sincronización

**Implementación local posterior (PR #9):** [09_backup_json.md](09_backup_json.md) implementa copia integral y restauración vacía sin servidor. El cifrado, staging remoto y procedimientos de autoridad siguientes siguen como propuestas.

Diseño propuesto. No se exportó/importó negocio real ni se accedió a recursos Supabase.

## Qué proteger

Servidor contiene operaciones confirmadas y resultados idempotentes; dispositivo contiene borradores y operaciones que todavía **solo existen allí**. Sincronización propaga errores/borrados y no reemplaza backup. No prometer recuperar pendientes de un teléfono destruido sin copia externa.

Propuesta operativa: exportación cifrada independiente diaria o al cerrar atención, con última fecha visible; conservar 7 diarios + 4 semanales fuera del teléfono/proyecto. Objetivo inicial a validar: RPO confirmado <=24h, RTO <=2h para dataset de prueba10.000 operaciones. Pendientes solo protegidos hasta última copia local; exportación antes de perder equipo reduce riesgo, no garantiza recuperación cero pérdida. No asumir backups/PITR disponibles en plan Supabase actual.

## Paquete versionado

Manifest `format='mora-v2-backup'`, formatVersion, domainSchemaVersion, contractVersions, businessId, environment, datasetEpoch, snapshotRevision, exportedAt, rowCounts, fileHashes, provenance. Contenido: snapshot consistente confirmado en R, audit/asignaciones/ledgers, resultados idempotentes (IDs+hash+resultado), tombstones, revisiones pendientes; sección local separada con comandos completos/payloads/versiones/dependencias y borradores de instalación. Fotos opcionales con hash/licencia, nunca requisito para recuperar venta.

Nunca incluir JWT/refresh tokens, passwords, claves privilegiadas, secretos de invitación o recuperación. Dos archivos posibles: recuperación comercial y paquete local pendiente. Ambos versionados y con límites de tamaño/filas, hashes SHA-256 del contenido canónico. Cifrado propuesto AES-GCM con clave de contraseña derivada mediante KDF, salt e IV aleatorios; parámetros y biblioteca revisados antes de implementar. Hash solo detecta corrupción; procedencia debe verificarse con sesión y revisión humana. No ejecutar contenido ni abrir HTML importado; no descomprimir sin límites.

## Restauración en equipo nuevo con servidor disponible

1. Enrolar sesión nueva desde equipo autorizado o recuperar acceso por canal del titular; jamás restaurar sesión desde archivo.
2. Descargar snapshot actual y deltas; validar business/epoch/versiones. Archivo local puede abrirse en staging de solo lectura sin tocar base activa.
3. Validar hashes, IDs únicos, FKs, cantidades y balances/asignaciones, manifest y límites; archivo truncado/esquema futuro falla sin modificar base.
4. Para cada comando pendiente original, consultar resultado remoto por ID/hash. Si ya se confirmó, adoptar resultado y no reenviar. Si no se conoce, revisión del equipo habilitado antes de importación/reenvío con **ID original** y procedencia.
5. Instalar pendientes aprobados y borradores localmente mediante commit único; antes/durante fallo conserva staging/base actual. Aplicar cambios remotos sin sobreescribir pendientes nuevos. Repetir misma importación deja mismos efectos.

Un archivo viejo no sobreescribe catálogo/ventas nuevos. Secuencia de instalación restaurada **no autoriza suplantación**: dispositivo nuevo obtiene identidad distinta, importación auditada conserva identidad del hecho original y contexto del aprobador. El endpoint de recuperación verifica que un ID ya aplicado no se aplique otra vez aunque cambie dispositivo aprobador.

## Pérdida/corrupción de autoridad remota

Restaurar servidor exige autorización específica; esta PR no la concede. Preparar instancia/dataset aislado, nunca ejecutar `reset` sobre V1/producción. Cargar backup en staging privado, validar consistencia y reconstrucción de todas las proyecciones; preservar command IDs/hashes/resultados. Comparar con otras exportaciones/equipos por ID para recuperar confirmados posteriores al corte, detectar hashes divergentes, no sumar snapshots.

Emitir epoch nuevo para cambio de autoridad restaurada y reautorizar equipos. Epoch viejo no puede escribir directamente: reconciliar IDs que ya existen y admitir pendientes nuevos solo tras revisión. Snapshot nuevo sustituye base oficial local, no borra outbox vieja; queda en cuarentena hasta conciliación. Publicar nuevo destino/activar solo tras autorización y prueba de restauración, conservando respaldo previo intacto.

## Pérdida de todos los equipos autorizados

Recomendar canal separado del titular con autenticación fuerte/credencial de recuperación de un solo uso guardada fuera de teléfonos. Define custodio y procedimiento de cambio antes de producción. Recuperación otorga **acceso**, no restaura datos por sí sola. Emitir nuevo acceso online, revocar sesiones/equipos perdidos e invitaciones, audit de recuperación; descargar snapshot o seguir restore aislado. No enviar service_role al usuario ni guardarla en cliente. Alternativa soporte manual verificado, más lento; no autoenrolar por nombre de negocio.

## Ensayo obligatorio

Con dataset sintético: exportar, perder perfil/IndexedDB del dispositivo de prueba, enrolar equipo nuevo, restaurar y comparar hashes normalizados de ventas/stock/caja/deudas/costos/audit; reenviar100 veces un comando ya confirmado, confirmar que nada cambia. Después corromper archivo, cambiar business/epoch, simular corte durante staging y hacer doble importación. Guardar informe medible y duración. Probar recuperación sin servidor y sin teléfonos aparte. Ningún éxito del diseño sustituye este ensayo real.
