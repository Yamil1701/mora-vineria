# Seguridad, RLS y dispositivos

Propuesta de acceso, no configuración ejecutada. Mismos permisos funcionales en todos los equipos. Autorización es por negocio/instalación; no identifica automáticamente a la persona que operó.

## Identidad verificable

Recomendar identidad Supabase Auth distinta por instalación; onboarding con sesión Auth aún no autorizada (posible anonymous sign-in, a validar en entorno aislado). Ser `authenticated` o poseer publishable key **no** da acceso al negocio. Si no se habilita anonymous Auth, alternativa es identidad por invitación con proveedor soportado: mantener el mismo contrato de membresía. No forzar correo personal como decisión del usuario.

`devices` vincula UUID instalación, `auth.uid()` y `session_id` de JWT validado contra sesión activa; membresía vigente en BD, nunca `user_metadata`. Recuperación de sesión válida puede renovar JWT conservando session_id; nuevo login/session requiere rebinding online seguro, no adoptar UUID enviado desde otro navegador. Copiar solo device_id no autoriza nada. Hash/version de autorización reside en servidor, no es un secreto en cliente.

Un atacante con JWT/refresh token robados puede suplantar esa sesión: binding de sesión reduce alcance pero no prueba posesión física. Bloqueo de pantalla, revocación, sesión de duración acotada y autorización fresca para enrolar/revocar mitigan; no prometer hardware attestation PWA. Clave WebCrypto no exportable como mejora futura no protege contra XSS que invoca operaciones.

## Invitación por cualquier equipo autorizado

1. Equipo nuevo establece sesión Auth sin membresía, genera instalación y desafío aleatorio, muestra solicitud/QR de enrolamiento sin datos de negocio.
2. Equipo habilitado, **online**, presenta verificación fresca de credencial de autorización y solicita invitación servidor, vinculada a negocio y desafío del nuevo equipo. Propuesta: token aleatorio256 bits, hash en BD, TTL10 minutos, uso único, límites por sesión/IP, intentos acotados. Evitar credenciales en querystring o logs; QR puede contener fragmento y transferir token por cuerpo HTTPS.
3. Nuevo equipo presenta token con su sesión. Queda pendiente, todavía sin poder leer negocio. Equipo habilitado compara código/desafío mostrado **en ambos teléfonos** y aprueba sesión exacta.
4. Servidor bloquea invitación + reloj negocio, verifica autorizador/sesión aún activos y TTL; consume token y crea membresía atómicamente. Dos usos concurrentes: uno gana, otro rechazo; nunca habilitar dos equipos con un token.
5. Snapshot autorizado; equipo nuevo no declara «Al día» antes de completar bootstrap. Todos pueden habilitar/revocar igual; no límite automático de4 como regla de negocio.

La verificación fresca propuesta dura5 minutos y se valida por desafío servidor, ligada a sesión/acción; un PIN local o token JWT viejo no basta. El mecanismo de credencial (por ejemplo WebAuthn o canal de autenticación fuerte soportado) debe implementarse y probarse antes de habilitar invitaciones. Una sesión Auth anónima por sí sola no ofrece ese step-up: puede servir al equipo nuevo no autorizado, pero no habilitar otros hasta registrar/verificar credencial segura. No asumir disponibilidad productiva de passkeys beta ni presentar este mecanismo como ya cerrado.

El primer equipo no puede autoaprobarse. Bootstrap exige titular autenticado por canal de recuperación/administración explícito y autorización para crear dataset remoto vacío. No automatizar desde esta PR.

## RLS mínima y superficie API

Tablas base/ledgers/control en esquema privado no expuesto; RLS activada como defensa adicional. Exponer solo RPC/proyecciones necesarias en schema API/public. `anon` no puede acceder a datos ni invocar negocio; `authenticated` sin membresía tampoco. Si se usa Auth anónimo, sigue siendo authenticated pero sin permiso hasta aprobación.

Predicado conceptual `can_access(business_id)`:
- uid no null; sesión JWT válida en Auth y asociada al equipo;
- equipo/membresía activos, no revocados/caducados;
- business/epoch de la fila corresponde;
- controles para canal solicitado (Data API, Storage, Realtime), no solo filtro frontend.

No usar roles en `user_metadata`. Tampoco confiar exclusivamente en app_metadata/JWT viejo para revocación: consulta estado vivo en BD. `auth.uid()`/session_id siempre derivan de contexto validado, no argumentos. Helper de lookup en esquema privado, sin ciclos recursivos RLS de memberships.

| Superficie | Permiso propuesto |
| --- | --- |
| Tablas dominio/proyecciones | Sin INSERT/UPDATE/DELETE/TRUNCATE directos a anon/authenticated; SELECT solo por vistas security_invoker/RPC autorizadas o política por negocio |
| Memberships/invitaciones | Sin mutación directa; lectura mínima de equipos propios vía RPC; ningún hash token exportado |
| Submit/corrección/abonos | authenticated + control vivo del equipo/negocio; solo RPC transaccional |
| Ledgers, audit, resultados | Append-only mediante escritor interno; read por negocio; no borrado funcional |
| Storage fotos futuro | Bucket privado, ruta business/product, policies propias activas; no asumir que RLS tabla cubre Storage |
| Realtime | Canal privado, autorización específica; payload solo revisión, no fiados/datos sensibles; pull revalida permiso |
| Backup/snapshot | RPC controla membresía; exportación sin sesiones/secretos; descarga autenticada y expirable |

`SECURITY INVOKER` preferido para lectores/vistas. Escritor transaccional necesita privilegios que cliente no posee: wrapper API invoker delega a función **privada** SECURITY DEFINER revisada, propiedad de rol limitado (sin superuser/bypassrls), search_path vacío, nombres cualificados, sin SQL dinámico, checks explícitos y restricciones FK. Revocar EXECUTE de PUBLIC/anon por defecto; otorgar ejecución mínima necesaria al wrapper/rol. Si helper privado debe ser ejecutable por authenticated para delegación, también valida autorización por sí mismo; privacidad de schema no es control suficiente. Forzar RLS donde corresponda y escribir políticas específicas para rol interno, probadas con el dueño real; no asumir que definer preserva RLS automáticamente.

Prohibir que cliente envíe resultados, costo asignado o asientos como autoridad. No exponer función genérica para ejecutar SQL, modificar membresías o fijar contexto de negocio. UPDATE, si alguna tabla editable se expone en fase futura, necesita SELECT + USING + WITH CHECK; FKs compuestas bloquean sustitución de tenant. Toda función nueva revoca privilegios predeterminados antes de grants, todo en una migración revisada. Ninguna sentencia aquí se ejecuta.

## Revocación y acceso offline

Online: revocar membresía + registrar audit + invalidar invitaciones emitidas pendientes; revocar sesión/refresh tokens por canal privilegiado seguro, sin service_role en PWA. Aunque JWT no haya caducado, consulta de membresía niega comandos/pull/snapshot; competir con comando se ordena por mismo lock y revalidación.

Offline no se puede conocer revocación remota ni borrar caché a distancia. Propuesta a aprobar: autorización local con lease de24h desde comprobación segura. Durante vigencia, registro local pendiente normal; al vencer o enterarse de revocación, registro de ventas físicas en **cuarentena** y posibilidad de exportación, sin acceso remoto ni promesa de aplicación. Alternativa: bloquear nuevas cargas después de caducidad (más restrictiva, dificulta conservar ventas). Ninguna opción elimina trabajo existente. Retroceder reloj no es defensa confiable: usar ancla servidor/tiempo monotónico cuando exista, detectar inconsistencias, no afirmar seguridad del lease contra propietario del navegador.

Equipo autorizado revisa paquete de operaciones del revocado: servidor compara IDs originales/hashes antes de admitir hechos, registra aprobador + origen original, aplica solo pendientes no confirmados. Nueva autorización administrativa envuelve IDs originales, **no** convierte cada venta en ID nuevo; misma operación importada dos veces produce un efecto. No aceptar automáticamente un archivo firmado/antiguo como autorización actual. Motivo y revisión humana obligatorios para fraude posible.

## Amenazas y controles verificables

| Amenaza | Control / límite |
| --- | --- |
| Robo de teléfono desbloqueado | Revocación desde cualquier otro habilitado, bloqueo OS y step-up para invitar; datos ya descargados pueden ser leídos por ladrón |
| Copia device_id / negocio ajeno | Binding uid/session, RLS vivo, FK compuesta, tests cross-tenant por cada endpoint |
| JWT todavía válido de revocado | Verificar membresía/sesión en cada RPC y políticas de lectura; no esperar expiración JWT |
| Invitación filtrada / replay | Token alta entropía, hash/TTL/uso único, desafío entre equipos y aprobación fresca |
| XSS / dependencia comprometida | Evitar HTML no saneado, CSP revisada antes de deploy, sin scripts terceros innecesarios, lockfile, análisis de dependencias; token cliente sigue siendo objetivo |
| Manipular costos/total/reloj | Validación servidor, rational exacto, jornada auditada, orden por aceptación; reloj dudoso abre revisión |
| Colisión ID/secuencia | UUID + uniques + hash; distinto payload no reaplica; reinstall nueva instalación, no resetear contador existente |
| Commit servidor sin ack | Ledger/result/batch transaccional + reintento mismo ID |
| Eliminación de caché/browser | Respaldo independiente; pendientes sin copia externa no se pueden recuperar mágicamente |
| Auth anónimo masivo / DoS | Rate limits/CAPTCHA si se habilita, sin membresía por defecto; payload acotado y lock con timeout |
| Backup expone clientes/deudas | Cifrado independiente, custodia externa, sin JWT/refresh token; checksum detecta corrupción, no autentica autor |

Antes de activar: pruebas negativas como anon, authenticated no autorizado, negocioB, sesión revocada/caducada, wrapper/helper directo y tablas/API alternativas. Probar Storage/Realtime si se incorporan. Advisors complementan tests, no sustituyen autorización ni auditoría manual.
