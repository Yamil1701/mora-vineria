# Mora Vinería — auditoría crítica independiente v26–v29

**Fecha:** 31/10/2026. **Alcance:** documentación aportada, evidencias locales del ZIP, lectura selectiva de código de la PR #14 y verificación del estado de GitHub. **Sin cambios a Sites, GitHub ni Supabase.**

## Resumen ejecutivo

La versión v29 constituye un avance real y significativo frente a la v26: presenta flujos locales de ventas y cobros, stock inicial y conteos, fiados y abonos, pagos posteriores de mercadería, correcciones auditadas en situaciones determinadas, reportes y metas, respaldo JSON v5 y recuperación de confirmaciones interrumpidas. En la evidencia, un respaldo sintético se restauró en una base vacía, se descargó y, después de dos recargas, se ejecutó **una sola vez** el gasto previamente preparado, sin cambiar los restantes hechos de negocio.

**Juicio:** base local funcional avanzada y visualmente coherente; **no apta todavía para uso productivo multidispositivo ni migración real**. No hay integración de negocio con Supabase, todas las operaciones principales siguen en el almacenamiento local del navegador, la prueba de instalación/offline en teléfonos está pendiente y el PDF A4 nativo no está acreditado. La versión pública continúa declarada como v25; v29 permanece como borrador y la PR #14 no se fusionó.

**Prioridad:** reducir el riesgo de integridad y migración antes de agregar funcionalidades. No es necesario otro rediseño ni una cuarta reconstrucción.

## 1. Evidencia, verificaciones y límites

**Paquete examinado:** `Mora-Documentacion-completa-v26-a-v29-2026-10-31.zip`, 1.886.984 bytes, 113 archivos, clasificados en 45 Markdown, 14 JSON, 45 JPG y 9 TXT. El archivo `INVENTARIO.json` describe 112 elementos; los 112 coinciden exactamente con su tamaño y SHA-256. El propio inventario no se autoincluye. Por contenido hay 96 cargas distintas, pues algunas versiones y capturas se repiten deliberadamente. No es una carpeta de código ejecutable; contiene documentación y evidencia, no el árbol fuente completo.

**Verificación adicional independiente en GitHub:** PR #14 `Mora Sites v29: operaciones locales y recuperación JSON comprobada`, abierta, marcada borrador, sin fusionar, `head=37085976c97ec2a3ab0e77613b7a3f059fbdb2d7`; `master=296c2aa1a95273ccd86af784c14595af33573602`. Los workflows `41165326979` (**Mora Sites export checks**) y `41165326955` (**Mora V2 branch checks**) terminaron `success`. El primero evalúa la exportación nueva; el segundo valida la app anterior y no constituye prueba de calidad de Sites. `sites-next/SOURCE.json` confirma versión 29, fuente `fdc349fcfbafa76883602a49106e98b1f29777a8`, versión base 26 y exportación aislada. Se revisaron selectivamente `local-data.js`, `business-read.js`, `reports-model.js`, `sale-corrections.js`, `operations.js`, `extended-operations.js`, `writer-gate.js`, `remote-queue.js` y el SQL candidato.

**Límites:** no pude cargar directamente `https://mora-vineria-nueva.yamil-17.chatgpt.site/` en este entorno; no realicé un nuevo recorrido del Site ni ejecuté la suite Node desde el árbol de código. La revisión de imagen se hizo a partir de capturas del ZIP. Las pruebas que Work ejecutó están sustentadas por logs, pero no constituyen ejecución independiente actual. No se inspeccionó ni modificó ningún dato real de Mora.

## 2. Evolución documentada

| Versión | Aporte sustancial | Evidencia | Límite |
|---|---|---|---|
| **v26** | Precio fijado en carrito, identificación por volumen, Caja y saldos, venta con faltante advertido, recuperación de borradores/comandos, JSON v4 | 13 archivos de test; capturas 360/390/430 | Varias operaciones solo en dominio; sin Supabase ni QA móvil real |
| **v27** | Inventario, apertura/conteo, fiado parcial, abonos, correcciones, pagos posteriores, reportes y metas, esquema v5 | Documentos y capturas de entregas 3–4 | No todas las correcciones ambiguas; impresión y remoto pendientes |
| **v28** | Cierre de exportación independiente a `sites-next/`, test runner `.case.mjs`, CI; 19 archivos de test | Logs de etapas, matriz QA, CIERRE-v28, 27 medidas de ancho | Imprimible no implica PDF A4 comprobado; JSON de navegador aún sin descargar en esa ejecución |
| **v29** | Restauración y descarga reales en navegador de QA, resumen completo de recuperación, arreglo de mutación del historial efectivo | 20 archivos de test; tres respaldos JSON, comparación, capturas, CIERRE-v29 | Sólo un origen de QA HTTP; no cruza orígenes ni dispositivos; sin remoto real |

## 3. Estado por bloque de producto aprobado

### I. Ventas, stock y cobros

**Existe en el flujo local según informes y pruebas:** precio estable por línea, venta por efectivo/transferencia/mixto, faltante explícito con revisión, FIFO por lotes, fiado total o parcial, abonos, comprobantes y recuperación de la misma confirmación. La v28 deja registrados ejemplos numéricos con cobros parciales, corrección de precio que modifica fiado sin inventar ingresos y abono final.

**Lo que no está cerrado:** compensaciones físicas complejas cuando ya hay costos incompletos o lotes históricos ambiguos. El sistema debe dejar esas correcciones como pendientes, no ejecutar ajustes silenciosos. La idempotencia local no implica idempotencia remota ni simultaneidad segura.

### II. Caja y dinero

**Existe:** referencias opcionales, saldo no informado distinto de cero, control observacional, gasto/aporte/retiro/traspaso, ingreso confirmado de transferencia, movimientos por origen y cobro posterior de fiados. En el archivo JSON recuperado, los efectos netos por cuenta después de la recuperación son Efectivo −$100 y Brubank $5.500. Esto es coherente con los seis movimientos sintéticos: cobro efectivo $3.000, abono $2.000, compra −$2.000, corrección de cuenta efectivo −$3.000/Brubank +$3.000, transferencia +$2.500 y gasto −$100.

**Límite:** esos importes son exclusivamente sintéticos y no prueban integración bancaria. Falta testear con usuarios la claridad de saldos de cuentas parcialmente personales y la corrección de movimientos complejos.

### III. Productos, Inventario y mercadería

**Existe:** stock inicial con costo conocido o desconocido; conteo y baja por pérdida; resolución documentada de diferencias; recepciones, lotes, pagos posteriores parciales/finales sin segunda entrada de mercadería. Persiste la distinción entre costo desconocido (`null`) y cero.

**Límite:** excepciones de FIFO histórico incompleto; cámara real y envases reales; revalidación de los recorridos de listas/pedidos en teléfono. Reposición conserva deliberadamente su alcance; no hay justificación para añadir automatismos nuevos sin probar el flujo real.

### IV. Reportes, datos y app final

**Existe:** reportes Hoy/Semana/Mes/Fechas, metas mensuales, costos conocidos versus desconocidos, vista de informe e impresión, JSON v5 con compatibilidad 1–4, migración controlada en local, manifiesto e iconos, fuente exportada. Se excluyen Proyecciones conforme a la última decisión.

**No existe aún:** PDF A4 nativo probado y paginado, instalación/reapertura/offline real de PWA, migración verificada de Sites a otro origen, seguridad y operaciones de negocio remotas, pruebas simultáneas entre dispositivos. La vista imprimible no debe anunciarse como un PDF final validado.

## 4. Verificación de respaldos JSON v29

Se inspeccionaron tres archivos completos:

- Entrada `Mora-QA-restauracion-v28.json`: **40.965 bytes**; 2 productos, 2 ventas, 5 movimientos, 3 lotes, 1 recepción, 1 deuda, 1 abono, 3 correcciones, 1 operación preparada.
- Primera descarga `Mora-QA-exportado-antes-recarga.json`: **45.506 bytes**. Las entidades de negocio son iguales a las de entrada; cambia el contenido de `workState`, que recoge estado UI y formulario normalizado.
- Segunda descarga `Mora-QA-exportado-despues-recargas.json`: **45.778 bytes**. Únicamente se agrega **un movimiento** a `ledger` (secuencia 6: `manual:qa_prepared_expense`, −$100 efectivo), y la operación `qa_prepared_expense` cambia de `prepared` a `confirmed`. El total de operaciones sigue siendo 13.

Se compararon programáticamente los demás campos de las 28 claves `DATA_KEYS`; ninguna otra entidad de negocio cambió. Recalculé el checksum FNV-1a32 mediante el algoritmo que utiliza `local-data.js` (sobre unidades UTF-16 de JSON compacto) y los tres valores coinciden exactamente: `1cc42ee1`, `45c871f2` y `276182b9`. También coinciden los SHA-256 externos declarados para las dos descargas.

**Esta es evidencia convincente de recuperación local e idempotencia para el escenario ensayado**, no prueba de concurrencia entre procesos ni de que la restauración sea segura contra archivos maliciosos arbitrarios. FNV-1a comprueba alteración accidental, no autenticidad; la protección real depende de validación de contenido y del almacenamiento seguro.

El campo `mode: "real"` describe el formato de operación no-demo dentro del origen aislado de QA; **el dataset sigue siendo sintético** y no debe restaurarse en el negocio.

## 5. Pruebas y qué significan realmente

- **v26:** 13 archivos Node aprobados.
- **v28:** 19 archivos Node aprobados; 27 pruebas de ancho `scrollWidth == viewport` en 9 áreas × 360/390/430 px; capturas de flujos reales en navegador de escritorio.
- **v29:** 20 archivos Node aprobados, incluidas regresiones de historial y resumen de restauración; confirmación de importación y descarga real en navegador, más dos recargas.
- **CI GitHub:** ambos workflows vinculados a PR #14 finalizados con éxito; solo el workflow de exportación nueva es evidencia directa pertinente para Mora Sites.

**Lo que no prueban:** 20 archivos de test no equivalen a 20 escenarios end-to-end ni a cobertura absoluta; `scrollWidth` correcto no certifica contraste, targets táctiles, foco, teclado, scroll vertical o accesibilidad. Los ensayos de Web Locks y cola remota son simulados; no hubo Supabase real, dos dispositivos ni pruebas HTTPS de varias pestañas. El QA sobre `http://terminal.local:4173/` no reproduce necesariamente el comportamiento de una PWA instalada.

## 6. Auditoría visual y de lenguaje

La evidencia fotográfica de v28/v29 presenta coherencia estética: fondo oscuro cálido, acento fucsia, encabezado compacto, navegación inferior, importes protagonistas y formularios relacionados visualmente. Se reconoce una sola aplicación, no un collage de estilos incompatibles.

**Observaciones concretas:**

1. **Aviso del carrito:** la alerta mejoró notablemente de v26 a v28 y se relaciona con el SKU afectado. Sin embargo, expresiones como «1 por vender · 0 registradas» son menos naturales que «Querés vender 1 y no hay unidades registradas». La frase debe adaptarse a plural/singular.
2. **Corrección aplicada:** la pantalla muestra «Dinero real $0». Para un usuario de negocio es más claro «No cambió el dinero cobrado» o «Sin cobros ni devoluciones» cuando corresponde.
3. **Reportes e impresión:** aparece `2026-10` y `2026-10-01 al 2026-10-31 · jornadas de Salta, corte 08:00`. Es un detalle técnico expuesto, contrario al acuerdo de textos simples. Mostrar «Octubre de 2026» y explicar el horario solo en información contextual si fuera necesario. «Informe mensual · 2026-10» también puede simplificarse.
4. **Recuperar datos:** el resumen de v29 es significativamente más informativo: muestra fiados, abonos, correcciones, pagos posteriores, revisiones y preparaciones. En las capturas 360/430 px, la barra inferior fija coincide visualmente con el área próxima al botón de confirmación, que aparece por debajo. **No se puede afirmar que esté inaccesible solo con una captura**, pero debe comprobarse con scroll completo, teclado y pulsación real en móvil.
5. **Texto pequeño:** algunos renglones de fecha, detalles de costo y mensajes secundarios parecen reducidos en los marcos; validar tamaño y contraste con Android real y ajustes de fuente.
6. **Capturas con botones «360/390/430 px»:** son controles externos del entorno de QA, no componentes de Mora; no evaluarlos como defectos de la app.

No abrir un rediseño general. Recomiendo una pasada de microcopy, jerarquía de alertas y accesibilidad funcional, conservando la firma visual vigente.

## 7. Hallazgos técnicos y riesgos, ordenados

| Prioridad | Hallazgo | Evidencia / motivo | Acción o puerta de calidad |
|---|---|---|---|
| **P0** | **Backend de negocio incompleto** | El SQL `001_dev_foundation.sql` prepara seguridad/identidades y una RPC **solo para meta mensual**. No hay comandos de venta, FIFO, recepción, abono ni corrección en servidor. La cola remota está desactivada. | Proyecto Mora dev aislado; Auth/RLS; operaciones transaccionales; pruebas de permisos y rollback antes de activar |
| **P0** | **Concurrencia sin certificar** | `writer-gate.js` usa Web Locks entre versiones cooperantes; versiones viejas no participan, y si Web Locks no existe `boot('unavailable')` permite iniciar. No se ensayaron dos pestañas HTTPS reales. | Prueba reproducible de dos pestañas y una versión antigua; salida segura si no se puede garantizar exclusión; con backend, concurrencia resuelta por servidor |
| **P0** | **Migración/rollback de datos** | v29 guarda esquema 5; v25 no puede leerlo. El almacenamiento pertenece al origen y no viaja al exportar el código. | Respaldo externo descargable, importación en origen vacío, comparación exacta, prueba de interrupción y rollback antes de publicar |
| **P0** | **No confundir CI con producción** | Workflows verdes; remoto real y QA físico pendientes. | Mantener v25 pública y PR #14 en borrador hasta cerrar gates; no operar dinero real |
| **P1** | **Fragilidad del almacenamiento local** | Snapshot completo en `localStorage`; foto/historial/JSON pueden crecer y el almacenamiento puede borrarse o alcanzar cuota. | Medir crecimiento, fallos de cuota y recuperación, reforzar copia exportable y plan de migración; considerar modelo definitivo al activar Supabase |
| **P1** | **PWA sin prueba de dispositivo** | Manifiesto, iconos y tests offline-shell; no instalación real, corte de red o actualización física con borrador. | Ensayo en Android e idealmente iOS: instalar, abrir sin internet, preparar, cerrar/reabrir, actualizar con trabajo pendiente |
| **P1** | **PDF mensual no certificado** | Vista imprimible y botón; el navegador de QA no produjo archivo A4 final. | Generar un PDF real desde impresión, revisar paginación, cortes, pie y ausencia de navegación/acciones |
| **P1** | **Correcciones físicas complejas** | Casos con lotes y costos históricos incompletos quedan en revisión por diseño. | Testear casos reales complejos y preservar incertidumbre; no inventar reversión ni costo |
| **P1** | **Accesibilidad y navegación vertical** | 27 medidas evitan desborde horizontal, no solapamiento vertical. | Verificar scroll final en recuperación, CTA, foco, teclado, zoom 200 % y targets táctiles |
| **P2** | **Lenguaje de interfaz técnico** | Reportes exponen fechas ISO y horario interno; corrección usa «Dinero real». | Ajuste localizado de textos, formatos y pluralización, sin rediseñar |
| **P2** | **Política de períodos corregidos** | `buildReport` agrupa venta efectiva por día original y dinero por fecha de movimiento; correcciones posteriores pueden cambiar históricos comerciales. | Definir política de reportes ya cerrados y mostrar cuándo hubo correcciones posteriores |

## 8. Preparación GitHub y Supabase

**GitHub.** La rama de la PR #14 incorpora la nueva app en `sites-next/`, sin reemplazar la app histórica ni modificar `master`. La exportación incluye `SOURCE.json` de trazabilidad. La suite de Sites tiene workflow propio. **Esto es una preparación de distribución**, no la publicación de la nueva Mora en GitHub Pages. Fusionar tal cual la PR no debe confundirse con reemplazar de manera segura el sitio de producción; faltan decisión de ruta, despliegue, respaldo y transición del origen.

**Supabase.** El módulo `remote-queue.js` es un adaptador de demostración aislado y no importado por la interfaz. El SQL candidato exige entorno dev y solo implementa de manera parcial metas; faltan la mayoría de las operaciones del negocio. Las políticas y permisos deberán verificarse con JWT/usuarios/dispositivos de prueba contra una instancia real. No utilizar el proyecto ajeno «Chofer Utilities». No copiar una clave privilegiada al navegador. El servidor debe decidir y registrar de forma indivisible dinero, lotes, stock, deuda y resultado por ID de comando.

**Secuencia:** (1) disponer de proyecto Mora dev; (2) aplicar y auditar migraciones en entorno descartable; (3) completar y probar transacciones en servidor; (4) conectar adaptador real; (5) probar offline/reintentos/conflictos y dos usuarios; (6) migrar JSON entre orígenes en QA; (7) probar PWA y PDF; (8) decidir el paso a producción con respaldo y recuperación aprobados.

## 9. Recomendación de próximas entregas

**Entrega A — Cierre local y QA físico (sin ampliar funciones).** Probar 360/390/430 en Android real; migración 3→5 con backup externo; importación y descarga entre dos navegadores u orígenes; actualización con borrador; PDF A4; ensayo real HTTPS de Web Locks; correcciones de microcopy; confirmación accesible en recuperación. Documento de resultados reproducibles.

**Entrega B — Backend Mora dev completo.** Proyecto aislado, Auth/RLS revisadas, comandos indivisibles (ventas/FIFO, abono/deuda, recepción/pago, stock/revisión y corrección), reintentos mismo ID, caída después de commit, conflictos y revocación. No activar remotamente operaciones parciales.

**Entrega C — Integración y migración controlada.** Adaptar la interfaz de Sites sin rediseño, preparar almacenamiento offline seguro, ensayar doble dispositivo, sincronización explícita de pendientes y migración sin pérdidas de origen a destino. Construir release candidate independiente, no en `master` inmediatamente.

**Entrega D — Go/no-go productivo.** Prueba de un ciclo realista completo con datos sintéticos; respaldo y recuperación ensayados; checklist de seguridad, accesibilidad y disponibilidad; autorización humana separada para publicación/migración.

## 10. Decisión ejecutiva final

- **Preservar v29 y su PR #14:** la arquitectura local y los recorridos representan una base útil; rehacerla implicaría perder trabajo probado.
- **No desplegar ni fusionar por ahora.** La v25 pública y los datos del navegador no deben ponerse en riesgo para obtener una captura más actual.
- **No iniciar más módulos amplios.** El valor ahora reside en cerrar integridad, despliegue, backup, accesibilidad y servidor.
- **No declarar Supabase implementado ni PWA/PDF certificados** hasta contar con resultados reales.
- **Preservar el español simple y la interfaz aprobada.** Los ajustes visuales pendientes son localizados, no una nueva dirección de diseño.

## Fuentes y trazabilidad

Fuente documental principal: `00_LEEME_PRIMERO.md`, `04_v29_actual/paquete_entregado/{CIERRE-v29.json,Mora-Continuacion-v29-2026-10-31.md,Mora-estado-y-plan-v29-2026-10-31.md}`, `03_v28_cierre/paquete_entregado/{Mora-Entregas-3-y-4-resultado-v28-2026-10-30.md,Mora-contrato-operaciones-v28-2026-10-30.md,matriz-qa.md}`, documentos de v26, capturas y artefactos `archivos-qa/` del ZIP. Verificados adicionalmente: [PR #14](https://github.com/Yamil1701/mora-vineria/pull/14), [nuevo CI](https://github.com/Yamil1701/mora-vineria/actions/runs/41165326979), [CI histórico](https://github.com/Yamil1701/mora-vineria/actions/runs/41165326955) y módulos del árbol `sites-next/` en el commit `37085976c97ec2a3ab0e77613b7a3f059fbdb2d7`.
