# Mora Vinería · estado y plan restante

30 de octubre de 2026. Desarrollo sobre v26 de Sites. La versión pública v25 se conserva. El cierre de guardado y exportación se registra en el informe de ejecución entregado junto con este plan.

## Estado de los cuatro bloques aprobados

| Bloque | Implementado y probado | Parcial / pendiente | Bloqueado por infraestructura o QA físico |
| --- | --- | --- | --- |
| I · Ventas y cobros | Precio del carrito fijo; faltante ligado a cantidad/stock; efectivo, transferencia y mixto; fiado completo/parcial; abonos; correcciones reales de cantidad/producto/precio con FIFO conocido, cuenta, cobro/devolución y deuda | Correcciones físicas con lote/costo histórico incompleto y otros casos ambiguos quedan para revisión, sin efectos | Transacciones y concurrencia entre dispositivos; teléfonos/teclado nativo |
| II · Caja | Referencia opcional; control observacional; gastos/aportes/retiros/traspasos; historial con cuenta/fecha/tipo; enlaces a venta, abono, recepción y corrección; historial de referencias/controles conservado | Revisión final con datos reales autorizados todavía no realizada | Seguridad y concurrencia remota; prueba de dos pestañas HTTPS y versiones antiguas |
| III · Mercadería | Catálogo conservado; stock inicial conocido/desconocido; conteos/pérdidas con historial; resoluciones con evidencia; recepción original conservada; pago posterior parcial/final sin volver a ingresar stock | Casos de reconstrucción de FIFO faltante no resueltos automáticamente; Reposición mantiene su alcance existente | Cámara, uso físico, transacciones remotas y migración productiva |
| IV · Datos y aplicación final | Reportes hoy/semana/mes/rango; cobertura de costos; metas con avance/restante; vista mensual y acción de impresión; JSON v5 compatible 1–4; plan/verificador de migración; manifiesto/iconos; código exportable sin nuevo framework | Obtención física del PDF y manejo del archivo JSON en otro navegador; preparación remota sin activar; SQL sólo foundation + metas | Supabase Mora dev inexistente; Auth/RLS/transacciones reales, dos dispositivos, instalación/reapertura/offline Android/iOS |

Implementado sin interfaz de producto: adaptador remoto y plan/verificador de migración. Son herramientas de preparación con pruebas locales, no sincronización habilitada ni migración de datos realizada.

## Pendientes priorizados y aceptación

| Prioridad | Trabajo real pendiente | Criterio de aceptación |
| --- | --- | --- |
| P0 | Disponer de un proyecto Mora dev inequívocamente aislado | Identidad del entorno revisada; sólo datos sintéticos; no utilizar el proyecto ajeno listado |
| P0 | Completar servidor y autenticación | RPCs de todos los comandos; negocio/usuario/dispositivo autorizados; sin claves privilegiadas ni escrituras directas; pruebas de permisos y rollback |
| P0 | Probar carreras y recuperación remotas | Mismo ID 100 veces → un efecto/resultado; dos abonos no exceden deuda; dos ventas no pisan FIFO; respuesta perdida recuperada con mismo ID; evidencia física retenida ante conflicto |
| P0 | Verificar escritura de pestaña única sobre HTTPS | Dos pestañas v27: una escribe y otra bloquea antes de cargar/migrar; cerrar primera permite continuar; documentar exclusión de pestañas antiguas |
| P1 | Probar Android/iOS reales | Teclado, scroll, foco, áreas táctiles, confirmaciones, corte de red, cierre/reapertura, instalación y actualización con borrador sin pérdida |
| P1 | Verificar PDF y archivos en navegador/dispositivo | PDF obtenido con datos del selector, saltos A4 y controles ocultos; JSON descargado realmente, importado en origen vacío y cotejado; no sobrescribir origen |
| P1 | Completar excepciones de corrección física | Evidencia y reconstrucción explícitas de lotes/costos faltantes; retorno trazable; prueba de efectos/reintentos antes de habilitar |
| P1 | Ensayar migración en dos orígenes de QA | Namespace/digest, IDs, conteos, lotes/FIFO, dinero/deudas y preparados idénticos; repetir no duplica; respaldo externo accesible |
| P2 | Revisar la política de períodos corregidos | Aceptar o ajustar atribución comercial a jornada original y aclaración de pendientes actuales antes de cierres de períodos |

## Antes de publicar

Presentar funciones terminadas y parciales, gate de pruebas remotas/físicas, plan de respaldo/migración y recuperación. Mantener v25 hasta autorización expresa. No fusionar la PR, no desplegar Pages, no aplicar SQL ni mover datos reales como parte de este cierre.

Recuperación actual: conservar la versión guardada v26 y su SHA, el nuevo borrador, la rama aislada y un JSON externo antes de cualquier cambio futuro de origen. Una reversión visual de la app no debe degradar a ciegas un snapshot esquema 5: exportar primero y usar una versión que lo lea.
