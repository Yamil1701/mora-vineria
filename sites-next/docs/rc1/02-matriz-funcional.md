# Matriz funcional y hallazgos

Estados: **terminado local** = comportamiento activo y probado en este navegador/dominio; **preparado** = código candidato no activado; **parcial** = falta integración o cobertura; **bloqueado externo** = falta infraestructura; **QA físico pendiente** = requiere teléfono/usuario.

| Área | Interfaz local | Servicio candidato | Pendiente concreto |
|---|---|---|---|
| Venta, cobro efectivo/transferencia/mixto | Terminado local | Prueba PostgreSQL local | Conexión Auth/lectura/escritura y pruebas alojadas |
| Venta física con faltante | Terminado local, aceptación deliberada | Probado local; stock negativo/revisión/costo desconocido | QA de claridad del aviso |
| FIFO y costos desconocidos | Terminado local | Dos lotes y fracciones comprobados localmente | Prueba alojada, escala y datos históricos reales en futura migración autorizada |
| Fiado parcial, abonos y saldo | Terminado local | CAS, pago excesivo rechazado, repetición sin nueva venta | Clientes independientes con red real |
| Inventario, stock inicial, conteo, rotura | Terminado local | Comandos preparados/probados | QA físico de conteo |
| Revisiones con evidencia | Terminado local | Dominio compartido; sin cierre artificial | Casos ambiguos continúan pendientes |
| Correcciones comerciales/cuenta/dinero | Terminado local, conserva original | Comandos locales PostgreSQL | QA masivo y casos ambiguos históricos |
| Caja, aportes, retiros, gastos, traspasos | Terminado local | Movimiento/referencia/control preparados | Recorrido remoto integral |
| Producto, compra, pedido y recepción | Terminado local | Producto/pedido/comandos financieros preparados | Listas de proveedor y cambios directos aún no conectados al servidor |
| Entrega parcial/pago posterior | Terminado local | SQL local con efectos y relaciones verificados | Entorno remoto real |
| Reportes y metas | Terminado local | Meta remota candidata probada | Decisión sobre reportes ya cerrados; no hay cierre inmutable |
| Copia JSON y recuperación | Terminado local | Importación al remoto sin implementar | No reemplazar copias por sincronización |
| PWA y actualización | Navegador HTTPS aprobado | No aplica | Android/iOS físico pendiente |
| PDF mensual | PDF A4 real generado | No aplica | Aceptación visual del usuario/impresora real |
| Almacenamiento robusto | localStorage activo protegido | IndexedDB candidato probado | Integración asíncrona pendiente |
| Trabajo entre dispositivos | **No habilitado** | Servicio y transporte preparados | Proyecto Mora dev, bootstrap remoto e integración completa |

## Auditoría crítica contrastada

| Hallazgo original | Verificado contra código | Resultado RC1 |
|---|---|---|
| P0 backend limitado a metas | Sí, el SQL anterior sólo admitía metas | Ampliado servicio candidato con dominio compartido y SQL local. **No cerrado remotamente** |
| P0 concurrencia sin locks/versión vieja | Sí; antes arrancaba sin protección | Bloqueo seguro sin locks, clave RC aislada, dos pestañas reales. Escritor antiguo ensayado como simulación no cooperante |
| P0 migración/rollback | Sí; origen no transporta datos | Descarga/importación real entre dos orígenes y comparación exacta. Datos reales intactos; importación remota pendiente |
| P0 CI ≠ producción | Confirmado | Etiquetas de evidencia separadas; ninguna autorización final |
| P1 localStorage | Confirmado | Fallos/cuota/crecimiento probados y candidato IndexedDB. **Riesgo de implementación activa permanece** |
| P1 PWA física | Confirmado | Offline/update automatizados; teléfono pendiente |
| P1 PDF | Confirmado | Archivo A4 real; se detectó y corrigió fondo oscuro de impresión |
| P1 correcciones físicas complejas | Confirmado, comportamiento deliberado | Revisión conservada; sin reconstrucción ficticia de FIFO |
| P1 accesibilidad/scroll | Recuperación no estaba defectuosa por sólo tocar borde | Reproducción con CTA accesible; sin parche de layout innecesario. Teclado/zoom/contraste completos y comodidad física siguen pendientes |
| P2 lenguaje | Confirmado | Fechas, stock y efecto monetario aclarados |
| P2 períodos corregidos | Confirmado | Aviso de correcciones posteriores; política original preservada, aceptación de cierre pendiente |

Proyecciones excluidas. Ningún caso figura aprobado por el usuario.
