# Continuidad de Mora · RC2

Leé primero `00-resumen-ejecutivo.md`, `07-resultados-pruebas.md`, `03-seguridad-integridad.md` y `10-publicacion-y-pendientes.md`. Los JSON de resultados y `estado-final.json` del ZIP distinguen pruebas de esta ejecución y antecedentes. No llamar «certificada» a esta candidata ni «aprobado por el usuario» a ningún QA físico.

Repositorio https://github.com/Yamil1701/mora-vineria · PR https://github.com/Yamil1701/mora-vineria/pull/14 · rama remota `work/sites-v27-entregas-3-4`. Verificá su HEAD real antes de continuar. La rama local fue `work/mora-rc2-integracion`; los commits locales y remotos tienen árboles equivalentes pero SHA distintos por el mecanismo de guardado: consultar commits.json y el árbol registrado.

Fuente única de desarrollo: `sites-next/`, especialmente `dist/`. La PWA en la raíz es historia y no se usa como base. Preservar oscuro cálido/fucsia, marca Mora., header compacto, navegación Inicio/Ventas/+/Caja/Más, venta rápida, favoritos, carrito compacto y total del cobro. No rediseñar, no agregar framework ni proyecciones.

Sites: proyecto `appgprj_6ae1069a80ec8191a07c20695d9194fe`. v29 guardada sin despliegue, fuente `fdc349fcfbafa76883602a49106e98b1f29777a8`. v25 publicada, despliegue `appgdep_6ae380a0c75c8191b3334bd45598941a`. Se verificaron nuevamente con el conector; no se cambiaron.

Master preservado en `296c2aa1a95273ccd86af784c14595af33573602` según la comprobación de base; cotejar otra vez antes de trabajar. PR #14 debe continuar borrador y sin fusionar. No publicar Pages ni Sites, no mover datos reales y no eliminar respaldos o archivo histórico sin autorización.

Supabase: cuenta Yamil, Mora Vinería; proyecto exclusivo `dedcvvgiuxpwdzqqdifn`. Esquema `mora_rc` activo, tres incrementales RC2 ya aplicadas. No reinstalar SQL a ciegas. Edge `mora-command` v5; operador temporal retirado. `mora_legacy_archive` queda separado e intacto; no usar Chofer Utilities.

Claves y sesiones no están en este paquete. Usar la conexión Supabase autorizada; no buscar o volcar claves privilegiadas. Para nuevas pruebas sintéticas, seguir 04-supabase.md y el script de provisión del repositorio; aplicar sólo su DML privado al proyecto verificado. No reutilizar usuarios históricos.

Cierre de código/documentación comprobado por Actions: `7611d300ae2756de9789e382498ebde121e5ab65`, run `41318273066` aprobado, con 77 Node y 15 Chromium. El job alojado de Actions fue omitido y no se lo cuenta como aprobado; las pruebas reales de Work tienen evidencia separada.

Último código de implementación comprobado antes del cierre documental: local `0a41fec`, equivalente remoto `fdfe0f3ec14e9b8eb9de30a10a330fa531b167e4`. El commit final del cierre se registra en el estado del paquete y en la PR; los SHA siguientes pueden incorporar únicamente documentación/evidencia. No confundir ese campo con una autorización productiva.

## Arquitectura activa

`app.js` → `persistence-controller.js` → `workspace-store.js` (IndexedDB) y `remote-client.js` → Edge → `command-service.js` → dominio `command-domain.js` → RPC SQL. El navegador no decide un snapshot remoto; el servidor deriva efectos. Los adaptadores viejos `idb-store.js` y `remote-queue.js` siguen como antecedentes de pruebas, no como almacenamiento activo paralelo.

Dominio v5; espacio IndexedDB/envoltura de backup v1. Jornada Salta 08:00–07:59, fecha real por separado, FIFO real, costo desconocido no cero, venta física con faltante aceptado, fiados parciales, abonos, transferencias pendientes, aportes/retiros/traspasos separados y correcciones sin reescribir historia. Backup y sincronización son distintos.

No confundir preparado, pendiente, confirmado y resultado desconocido. No cambiar el ID para reintentar. Una copia de otro dispositivo conserva pendientes para atención; esa recuperación asistida es trabajo abierto. No fusionar automáticamente dos historias.

## Reproducción técnica para el siguiente agente

Desde `sites-next/`: `npm ci --no-audit --no-fund`, `npm run verify`, `npm test`, `npm run test:browser`. Node >=22, Chromium fijado por package-lock. Si cambia un recurso servido: `npm run stamp` y luego verificar/probar. No se pide al usuario que ejecute estos comandos.

Para pruebas alojadas, leer `scripts/provision-hosted-qa.mjs`, `hosted-qa.py` y `hosted-browser-qa.mjs`. El fixture privado debe estar fuera del repositorio, ser recién creado y llevar metadata `mora_synthetic_run`. Los primeros cinco dispositivos se enrolan después de aplicar el seed. Los enlaces de UI son de un uso. El job opcional de Actions necesita secretos de prueba preparados; no está configurado por esta misión. Las sesiones de esta ejecución no deben trasladarse al siguiente chat.

El ZIP histórico v26-v29 está incluido cuando el entorno permitió acceder al binario; en caso contrario su enlace figura en estado-final.json. Los contratos aprobados permanecen en docs y prevalece v29/RC2 ante propuestas antiguas incompatibles. No investigar de nuevo la PWA descartada.

Retomar por los pendientes concretos de 10-publicacion-y-pendientes.md. La próxima interacción del usuario debe ser su QA masivo cuando exista la vista previa aislada, sin suponer una autorización productiva.

La prueba conectada final adicional y su archivo SQL están en `verificacion/rc2/hosted-core-browser/`. El resumen acumulado actualizado está en `estado-final.json`: 54 comandos confirmados y 5 recorridos funcionales alojados. Los conteos 50/137 de evidencias anteriores corresponden al checkpoint previo.
