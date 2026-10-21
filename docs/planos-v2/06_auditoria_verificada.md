# 06 — Auditoría contrastada del producto publicado

**Fecha de revisión:** 21/10/2026. **Código base:** master 90264e5c4f27132e7314722e38c08edfbb16e73f (PR #11 fusionada). **Método:** inspección del código y documentación, revisión de referencias, contraste con relatos/QA del usuario. **No se realizó en esta pasada una inspección renderizada de todos los estados reales en iOS/Android ni un benchmark cronometrado.** No equivale a certificación de calidad.

## 0. Estado actualizado por el usuario

**QA de PR #10 confirmado como aprobado por el usuario** el 21/10/2026; **QA de PR #11 aprobado de manera provisional** con insatisfacción respecto al nivel de diseño. Esta declaración prevalece sobre menciones anteriores «QA pendiente» en documentos históricos. La aceptación funcional no aprueba la arquitectura de información ni los detalles visuales de cada pantalla. Las PR #7–#9 ya habían pasado QA móvil de productos, ventas, FIFO, offline y respaldo/recuperación.

## 1. Evidencias técnicas reproducibles

| ID | Comprobación del repositorio | Evidencia observable y alcance |
|---|---|---|
| AU-01 | Monolito de composición | \`src/App.tsx\`, 241 líneas físicas / aprox. 38,7 k caracteres; funciones de navegación, ventas, formularios, persistencia, modales, detalles e informes en un mismo componente. Líneas de JSX muy extensas. El número de líneas no es una métrica de calidad aislada: importa la mezcla de responsabilidades. |
| AU-02 | Navegación sin modelo de rutas de pantalla | \`src/App.tsx:32-36\`, \`81\`, \`162\`: estados \`tab\` + \`stage\` + \`movementsOpen\` + \`detailId\` + \`backupOpen\` + \`modal\`, en vez de un modelo explícito de destino, subpantalla y regreso. Riesgo de estados combinados incoherentes y de regresos impredecibles; no se probó que haya bug en cada combinación. |
| AU-03 | Navegar reinicia estado de consulta | \`navigate(to)\` en \`src/App.tsx:81\`: borra categoría, filtro de stock, búsqueda, selección de producto, modal y etapa. No borra por ello el borrador Dexie. **Hipótesis UX:** se pierde contexto al ir a detalle y volver; requiere tarea real para confirmar si perjudica. |
| AU-04 | Inicio con accesos operativos secundarios | \`src/App.tsx:179-193\`: tres bloques principales y después «Movimientos de hoy», botón «Movimientos», backup JSON y advertencia de almacenamiento. Hace de panel de control y menú administrativo. |
| AU-05 | Conteo de stock clasificado junto al dinero | \`src/app/Movements.tsx\`: botones Registrar gasto, Registrar aporte y Contar y ajustar stock; en la misma pantalla aparecen movimientos de efectivo y de mercadería. El servicio sí distingue stock/caja; el problema es del **lugar en la interfaz**. |
| AU-06 | Historial de ventas en dos contextos | \`src/App.tsx:219\`: historial en Ventas; \`236\`: otro \`History\` embebido en Reportes. Mismo dataset, dos ubicaciones de navegación. Recomendación: un solo historial navegable como destino propio, enlaces desde Reportes. |
| AU-07 | Cobro sólo efectivo | \`src/App.tsx:211-217\`: Transferencia/Mixto/Fiado se muestran deshabilitados y marcados «Pendiente»; no se habilitó verificación automática. No deben tratarse como implementados. |
| AU-08 | Recepción accesible desde la ficha | \`src/App.tsx:226\`: «Recibir mercadería» dentro de ficha de producto. No existe todavía un flujo continuo de pedido semanal y recepción vinculada. Reposición está resumida en Inicio pero no es área operativa real. |
| AU-09 | Backup vital ubicado como acción de Inicio | \`src/App.tsx:188-191\`; \`src/app/BackupPanel.tsx\` contiene exportación, validación de archivo/restauración. Falta un área estable Datos/Respaldo; **no eliminar el acceso hasta que el nuevo exista y sea encontrable**. |
| AU-10 | Confirmación durable transversal pero mal contextualizada | \`src/App.tsx:166-172\`: la confirmación de escritura aparece fuera de la pantalla del propietario, con identificadores y textos técnicos. **No es un error de datos**: protege contra duplicación y reintentos; el rediseño debe preservar esa garantía y contextualizar la presentación. |
| AU-11 | Hoja CSS incremental extensa | \`src/app/app.css\` 390 líneas físicas, aprox. 39,8 k caracteres, aprox. 386 bloques CSS y varias correcciones finales. Valores y selectores se repiten; **indicio de acumulación**, no prueba de que el CSS falle. Hace falta inventario de tokens y pruebas de regresión visual antes de modularizar. |
| AU-12 | UI kit disponible pero sin fronteras claras de uso | \`src/ui/components.tsx\` tiene \`AppShell\`, \`BottomNav\`, \`GlassPanel\`, \`MoraButton\`, \`MetricCard\`, \`ProductRow\`, \`CashBalance\`, \`CartFooter\`, \`SyncStatus\`. Algunas composiciones principales de \`App.tsx\` usan JSX específico y CSS adicional. Riesgo de componentes paralelos, debe verificarse con catálogo visual. |
| AU-13 | Datos de negocio separados | \`src/domain/*\`, \`src/local/service.ts\`, \`src/local/database.ts\`, \`src/local/backup.ts\` albergan FIFO, comandos, Dexie y recuperación. Refactor de navegación **no requiere migrar tablas**. No replantear núcleo sin incidente concreto. |
| AU-14 | Reportes con derivaciones y períodos reales | \`src/app/projections.ts\` y \`MovementSummary.tsx\`; \`src/App.tsx:229-236\`. Las ventas/ganancias y variaciones de efectivo tienen fuentes distintas. La ganancia no se presenta como calculable cuando faltan costos completos. Preservar esta diferenciación. |
| AU-15 | Servicio offline sin sincronización | \`src/local/database.ts\`, \`src/app/pwa.ts\`, \`src/App.tsx:238\`. PWA cachea la interfaz; IndexedDB guarda operaciones. El outbox no implica un emisor a servidor. El JSON es migración manual y backup, no sync. |
| AU-16 | Documentos históricos activos contradictorios | \`README.md\` aún describe PR #10 como pendiente y una decisión futura de Supabase; \`AGENTS.md\` y handoff combinan notas de varias épocas. **No editar ni borrar historia a ciegas**; agregar primero estado vigente con precedencia documentada. |
| AU-17 | No hay caja/cuentas propia ni configuración en navegación | Los estados \`tab\` aceptan cuatro destinos; Caja no es un screen y Backup funciona mediante booleano modal. Crear destinos secundarios conceptualizados no equivale a quinta pestaña. |
| AU-18 | El avance visual se juzga distinto al QA técnico | El usuario validó funcionamiento de #10/#11, pero expresó que #11 sólo «sirve por ahora». No etiquetar diseño como terminado por CI verde. |

### Hallazgos prioritarios derivados

**P0 — Integridad, no refactor destructivo:** preservar comandos durables, costo FIFO exacto, salida monetaria de recepción, jornadas, formatos y restauración, sin duplicar servicios en componentes React.

**P1 — Arquitectura de información:** mover el conteo a Inventario, dinero a Caja, backup a Datos/Configuración; historial de ventas canónico; Reposición como subárea de Productos. Exponer acciones cruzadas como atajos al **mismo** destino.

**P1 — Navegación:** sustituir progresivamente booleanos ad hoc por un contrato explícito de pantalla/subpantalla/contexto; preservar búsqueda, período, borradores y volver al origen cuando el usuario lo espera. No obliga a instalar React Router.

**P1 — Confirmaciones y errores:** patrón transversal para sellar, confirmar, reintentar, cerrar, volver a editar. La interfaz puede ser más humana, pero no puede esconder o recomponer un comando ya sellado.

**P2 — Sistema visual:** separar tokens, densidades, componentes, estados, tipografías y layouts. Limitar tarjetas anidadas y variantes de botón; contrastar capturas con referencias aprobadas, no regenerar «una nueva estética».

**P2 — Riesgo de backup:** botón reubicado solo cuando el nuevo acceso está completo, visible y probado con usuarios; instalación y almacenamiento por origen tienen límites.

## 2. Matriz problema → ubicación actual → ubicación objetivo → prueba

| Tarea observable | Hoy | Propuesta canónica | Evidencia requerida |
| --- | --- | --- | --- |
| Gasto ocasional | Inicio→Movimientos→Gasto | Caja→Movimientos→Gasto | Primera elección del operador y sin segundo registro |
| Aporte de bolsillo | Inicio→Movimientos→Aporte | Caja→Movimientos→Aporte | No suma ventas ni margen |
| Botella rota / recuento | Inicio→Movimientos→Contar | Productos→Inventario→Contar | Se preserva CAS/FIFO e historial |
| Llegó mercadería | Productos→Ficha→Recibir | Productos→Reposición→Recibir | Lote y pago únicos, sin gasto duplicado |
| Preparar pedido | No implementado | Productos→Reposición→Pedido | Enviado no cambia inventario |
| Consultar ventas anteriores | Ventas o Reportes | Ventas→Historial | Informe enlaza a detalle, no duplica árbol |
| Descargar backup | Inicio→Backup modal | Configuración→Datos→Respaldo | Encontrarlo sin pista y descargar archivo real |
| Recuperar backup | Modal de Inicio | Configuración→Datos→Restaurar | Base vacía y operación atómica |
| Corregir venta | No implementado | Ventas→Historial→Detalle→Corregir | No modificar historia sin evento compensatorio |
| Consultar dinero real en caja | No implementado | Caja→Resumen→Contar | No confundir esperado con real |
| Saber costo/ganancia | Inicio o Reportes | Reportes, resumen en Inicio | Costos desconocidos explícitos |

## 3. Riesgos y límites de observación

- No se inspeccionaron los datos privados del negocio y no se necesitan para esta auditoría.
- No se auditaron todavía completamente contrastes de píxeles renderizados, accesibilidad con lector de pantalla, latencias en teléfono físico ni recuperación de foco al navegar; **no declarar su aprobación**.
- El nombre \`Movimientos\` no es incorrecto por sí solo: el error comprobado es mezclar dos dominios de trabajo, no la palabra.
- \`App.tsx\` concentrado es **riesgo de mantenimiento**; no significa que las ventas guarden incorrectamente.
- CI no prueba la encontrabilidad de tareas ni la satisfacción con el diseño.
- No eliminar el banner/documentación de backup al esconderlo en ajustes: la seguridad de datos es un objetivo funcional.

## 4. Criterios para cerrar la auditoría

Completar fichas de destino según \`02_catalogo_pantallas.md\`, inventariar CSS selector por selector y hacer captura/test visual de las pantallas con distintos datos y errores. Usar datos sintéticos en navegador aislado y respaldos de prueba, nunca información real ni un reinicio de producción. Evaluar con el operador los diez escenarios de \`03_recorridos_y_estados.md\`. Resultado: lista de cambios de navegación con riesgos y casos de regresión, **sin tocar el dominio por motivos estéticos**.
