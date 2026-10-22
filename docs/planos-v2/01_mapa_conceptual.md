# 01 — Mapa conceptual integral

**Estado:** propuesta navegable v0.1, no aprobada; **no implementación**.

**Actualización posterior del usuario (21/10/2026), con precedencia sobre la jerarquía v0.1:** **Reposición es un área propia**, del mismo nivel de acceso que Productos e Inventario dentro de **Más → Mercadería**, con posible enlace contextual desde la ficha comercial. Comparte entidades/stock/costos con ambos, pero no queda dentro de Productos. **Caja → Movimientos** tendrá una acción de entrada «Registrar» para elegir entre **tres familias: Gasto, Aporte y retiro o traspaso entre cuentas**; **«Mover dinero» quedó aprobado el 22/10/2026**, y se bifurca en **«Entre cuentas»** y **«Retirar del negocio». El tercer flujo deberá distinguir dinero que sale del negocio de dinero que cambia de cuenta sin salir de él. Nada de esto autoriza código ni activa funciones todavía futuras. Evidencia [20](20_observaciones_prueba_usuario.md), navegación [21](21_hipotesis_shell_mas_header.md).

## 1. Árbol de producto: los lugares canónicos

~~~mermaid
flowchart TB
  M["MORA VINERÍA"]
  M --> IN["INICIO · información y prioridades"]
  M --> VE["VENTAS · operación comercial"]
  M --> PR["PRODUCTOS · catálogo y ficha"]
  M --> INV["INVENTARIO · existencias"]
  M --> RP["REPOSICIÓN · pedidos y recepciones"]
  M --> RE["REPORTES · interpretación"]
  M --> CA["CAJA Y DINERO · destino contextual"]
  M --> CO["CONFIGURACIÓN · destino contextual"]

  IN --> IN1["Resumen de hoy"]
  IN --> IN2["Avisos accionables"]
  IN --> IN4["Caja · enlace"]
  IN --> IN5["Reposición · enlace"]

  M --> A["(+) Nueva venta · acción global"]
  A --> VE1["Selector de nueva venta (flujo de Ventas)"]
  VE --> VE0["Ventas · historial y gestión"]
  VE1 --> VE2["Selección / búsqueda / favoritos"]
  VE2 --> VE3["Carrito opcional"]
  VE2 --> VE4["Cobro directo"]
  VE3 --> VE4
  VE4 --> VE5["Confirmación y próxima venta"]
  VE --> VE6["Historial y detalle"]
  VE6 --> VE7["Corrección / compensación"]
  VE --> VE8["Fiados y abonos"]

  PR --> PR1["Catálogo y ficha"]
  PR1 --> PR2["Alta / edición / desactivación"]
  INV --> PR3["Stock por producto"]
  PR3 --> PR4["Conteo / ajuste / revisión"]
  RP --> PR5["Faltantes y compras"]
  PR5 --> PR6["Pedido y WhatsApp"]
  PR6 --> PR7["Recepción y pago real"]
  PR7 --> PR8["Lote FIFO / stock"]

  RE --> RE1["Hoy / Semana / Mes"]
  RE --> RE2["Ventas y ganancia estimada"]
  RE --> RE3["Productos y tendencias"]
  RE --> RE4["Dinero: lectura, sin editar"]
  RE --> RE5["Alertas / metas verificables"]

  CA --> CA1["Resumen de caja y cuentas"]
  CA --> CA2["Historial de dinero"]
  CA --> CA3["Gastos"]
  CA --> CA4["Aportes y extracciones"]
  CA --> CA5["Conteo físico de caja"]
  CA --> CA6["Transferencias entre cuentas"]

  CO --> CO1["Backup JSON"]
  CO --> CO2["Restaurar sobre base vacía"]
  CO --> CO3["Estado local / versión / almacenamiento"]
  CO --> CO4["Preferencias generales"]

  classDef main fill:#4a1531,color:#fff,stroke:#ff0a89,stroke-width:2px
  class VE,PR,INV,RP,IN,RE,CA main
~~~

**Importante:** este diagrama representa **jerarquía de información**, no un listado de features disponibles. Pantallas y capacidades futuras no se vuelven ejecutables por estar en el plano.

## 2. Barra inferior y navegación contextual

- **Variante principal actualmente en validación:** **Inicio · Ventas · (+ Nueva venta) · Caja · Más**. Son tres destinos operativos directos (Inicio/Ventas/Caja), **Más** como directorio raíz y una acción + separada (no tab). Ventas abre historial/gestión; + inicia o retoma la venta en pantalla concentrada. Este orden supera la variante histórica Inicio/Ventas/+/Productos/Reportes, pero exige prueba visual/de recorridos antes de implementación.
- **Caja y dinero**: destino directo del dock candidato; su historial y operaciones no se duplican en Reportes ni Reposición.
- **Configuración**: acceso estable mediante control de ajustes en encabezado global cuando la navegación permita mantenerlo visible; nada de esconder backup solamente dentro del historial de movimientos.
- **Subpantallas**: conservar relación con área padre y navegación de regreso; por ejemplo Productos > Inventario > Conteo. Pueden ocultar la barra inferior temporalmente en una operación modal/concentrada si garantiza regreso y no pierde borrador; la decisión concreta se prueba en móvil.
- **Accesos directos**: el + central es la entrada primaria y global a Nueva venta; cualquier atajo contextual eventual debe abrir el **mismo** borrador/recorrido. «Para reponer» lleva directamente al área Reposición.

La distinción «pestaña para navegar / botón para actuar» de Apple HIG (https://developer.apple.com/design/human-interface-guidelines/tab-bars) sigue vigente. Android contempla una acción principal destacada (https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns). El + **no** es una pestaña ni un menú de acciones variadas: ver ADR 17.

## 3. Propiedad de operaciones (regla central)

| Acción | Propietario único | Atajo/lectura permitida | Prohibición |
| --- | --- | --- | --- |
| Buscar precio y disponibilidad | Productos > Catálogo (consulta) | Selector de Ventas, con misma fuente de datos | Catálogos independientes |
| Alta, edición, desactivación | Productos > Ficha | Atajo desde estado vacío | Edición dispersa en Reportes |
| Favoritos | Productos > Ficha; selector solo consume preferencia | Favoritos en Ventas | Dos listas de favoritos distintas |
| Nueva venta | Flujo de Ventas > Nueva venta | **+ central desde cualquier área** | Confundir Ventas con Nueva venta, duplicar borrador/cobro |
| Efectivo, transferencia, mixto, fiado nuevo | Ventas > Cobro | Ninguno; mismo flujo de venta | Registrar transferencia automáticamente sin verificar |
| Corregir una venta | Ventas > Historial > Detalle | Enlace desde Reportes | Borrar venta o ajustar datos sin auditar |
| Abono de fiado | Ventas > Fiados > Cliente | Vista de cobro en Caja | Generar una segunda venta |
| Contar o ajustar unidades | Productos > Inventario > Conteo | Enlace desde alerta en Inicio / ficha | Formularios de stock dentro de Caja |
| Stock inicial | Productos > Inventario, desde ficha | Asistente de primera carga | Comprar inventario ficticio |
| Preparar pedido | Reposición > Pedido | Enlace de «Para reponer» y ficha de Producto | Sumar stock por marcar pedido enviado |
| Recibir mercadería | Reposición > Recepción | Enlace desde ficha de Producto con artículo contextual | Duplicar egreso en «Gastos» |
| Registrar gasto puntual | Caja > Movimientos > Gasto | Enlace contextual | Tratar compra de mercadería como gasto adicional |
| Registrar aporte | Caja > Movimientos > Aporte | Enlace contextual | Tratar aporte como ganancia de ventas |
| Registrar ahorro / retiro | Caja > Movimientos > Extracción | Enlace contextual | Marcarlo como dinero operativo disponible |
| Transferir entre cuentas propias | Caja > Cuentas > Traspaso | Enlace contextual | Contar doble ingresos o ventas |
| Contar caja real | Caja > Resumen > Contar efectivo | Recordatorio no invasivo | Inferir efectivo real desde ventas |
| Ver ventas/ganancia/tendencias | Reportes | Resumen en Inicio | Ejecutar operaciones sobre filas de indicadores |
| Ver historial de dinero | Caja > Movimientos | Enlace desde Reportes | Dos libros distintos o historias calculadas con fuentes distintas |
| Backup / restaurar | Configuración > Datos | Alerta contextual de backup pendiente | Esconder restauración en Movimientos |

Cuando la misma entidad aparece en dos áreas, la UI debe indicar **qué es vista y qué es operación**. Una recepción pertenece a Reposición; el pago que genera se lee en Caja automáticamente, pero Caja no repite la recepción.

## 4. Inicio: límite estricto

Muestra, en orden:
1. Fecha humana y panorama del negocio; **+ Nueva venta permanece disponible globalmente**.
2. Ventas de hoy y cantidad de ventas.
3. Ganancia estimada **solo si los costos son determinables**; si no, texto de cobertura/historia por revisar.
4. «Para reponer» con máximo unas pocas prioridades y entrada a Inventario/Reposición.
5. Avisos **excepcionales y accionables**: operación pendiente, falta de stock relevante, backup atrasado, situación de recuperación.
6. Acceso inequívoco a Caja y Configuración, sin módulo de administración extendido.

**No** contiene: formularios de dinero, listados financieros completos, resumen contable de ocho filas, lotes, historial de ventas completo, herramientas de depuración, ni botones primarios que compitan innecesariamente con +.

El texto «Movimientos de hoy» puede existir como lectura breve del estado, pero **no debe reemplazar Caja ni crear un mini-módulo dentro de Inicio**.

## 5. Ventas: límites

La pestaña **Ventas** abre historial, detalle y gestión comercial; no abre el selector. La acción global **+ Nueva venta** conduce al flujo que pertenece al dominio Ventas. Selector y venta son la actividad de mayor frecuencia. Mantener búsqueda rápida, favoritos, filtro opcional por categoría, unidades y carrito persistente con acceso directo al cobro. El carrito es una vista para editar, no una pantalla obligatoria entre selección y cobro. Transferencia/mixto/fiado serán futuras capacidades; no anunciarlas como disponibles salvo indicación honesta.

Historial guarda ventas y sus correcciones; fiados es un subrecorrido comercial ligado a cada venta y sus abonos, cuyo impacto de caja se refleja desde el mismo evento.

## 6. Mercadería: Productos, Inventario y Reposición como accesos propios

**Productos/Catálogo** responde «¿qué vendemos y a cuánto?»; **Inventario** responde «¿cuántas unidades hay y qué diferencia existe?»; **Reposición** responde «¿qué falta comprar y qué se recibió/pagó?». Las tres áreas están **al mismo nivel de acceso en Más**, sin esconder Reposición dentro de Productos. Comparten productos y servicios de dominio, pero sólo Reposición es dueña del recorrido de recepción, y sólo Caja presenta la proyección monetaria de ese mismo hecho.

- Catálogo: datos públicos de venta, variantes y disponibilidad breve; ficha para editar, favorito, estado activo.
- Inventario: stock físico/registrado, objetivo por artículo (bajo ≤20 %, crítico ≤10 %), conteo, causa, revisión, historial de ajustes. No «importar» costo cero para sobrantes.
- Reposición: faltantes sugeridos por objetivo, pedido editable, texto a WhatsApp, recepción real, presentación por pack, costo total y salida única de efectivo. El lote FIFO nace en la recepción, no en el pedido.

## 7. Caja y dinero: significado de cada número

Tres vistas relacionadas con la referencia visual aprobada de caja-cuentas.webp: **Resumen / Movimientos / Cuentas**. Esas pestañas son *locales a Caja*, no la barra principal de toda Mora.

- **Resumen**: dinero esperado según registros frente a efectivo real ingresado voluntariamente con fecha. Si no hay conteo, no mostrar diferencia calculada.
- **Movimientos**: cobros efectivos de ventas, compras pagadas, gastos excepcionales, aportes, extracciones y transferencias internas como hechos con origen trazable. **Entrada de nueva operación (rótulos aprobados el 22/10/2026):** botón único **«Registrar»** con **Gasto**, **Aporte** y **Mover dinero**. Este último lleva a **Entre cuentas** / **Retirar del negocio**; son operaciones distintas aunque compartan acceso. No mostrar acciones aún sin implementación.
- **Cuentas**: efectivo, Brubank y medios personales alternativos con registros atribuibles al negocio. No asumir saldo bancario real ni integración.
- Movimientos de stock **no pertenecen** al historial de efectivo; si una recepción produce pago y unidades, existen dos proyecciones del **mismo hecho** y una única operación canónica.

## 8. Reportes: sólo responder preguntas

Hoy/Semana/Mes: cuánto se vendió, qué parte tiene costo verificado, ganancia bruta estimada, productos, alertas, compras/gastos y movimiento de dinero **separados**. Interpretación antes que más indicadores. Comparaciones solo si hay datos suficientes; nunca inventar tendencia, base de costo o saldo.

El usuario puede saltar a un detalle de venta o a Caja, pero al hacerlo **abandona Reportes como lugar de escritura**.

## 9. Configuración y mantenimiento

- Datos y recuperación: preparar/descargar copia JSON, inspeccionar respaldo, importar solo en espacio vacío, versiones de formato y fecha de respaldo.
- Estado local: instalado, sin sincronización, alcance por navegador, espacio/errores y riesgo de pérdida; evitar mensajes permanentes sobre cada pantalla salvo peligro o acción pendiente.
- Preferencias: formato/experiencia que agregue valor, sin crear administración empresarial.
- Categorías comerciales se administran desde Productos, aunque otras preferencias generales vivan en Configuración.

## 10. Horizontes sin mezclar promesas

- **Hoy implementado (parcial)**: cuatro destinos, efectivo local, productos/favoritos, apertura/recepción, FIFO, gastos/aportes/conteos, reportes, backup JSON. Ubicación actual de gastos/conteos **no coincide** con esta propuesta: hay trabajo de migración visual, no de migración de datos.
- **MVP pendiente confirmado**: transferencia verificada por operador, mixto, fiados, edición/correcciones auditadas, extracciones, caja esperada vs real, pedido simple. Ingresan a casillas ya existentes en el mapa; ninguno obliga a abrir un quinto destino.
- **Investigación y decisiones**: fotos/códigos, automatización de proveedor, análisis avanzado y exportación PDF; no ocupar navegación hasta demostrar valor.
- **Después de MVP, solo con nueva decisión**: sincronización multi-equipo y autorización/servidor, sin sustituir backup ni confundir archivo con sincronización.

## 11. Antipatrones expresamente prohibidos

1. «No sé dónde va; agreguémoslo a Inicio».
2. «Tiene historial, así que pongámoslo en Reportes».
3. «Modifica stock, así que es un movimiento financiero».
4. «El botón ya existe en demo, por eso la funcionalidad está aprobada».
5. «Como el panel molesta, ocultemos el paso imprescindible en un acordeón».
6. «Un componente nuevo necesita un lenguaje visual nuevo».
7. «El diseñador propone una quinta pestaña porque aparece un dominio nuevo».
8. «Una compra debe crearse también como gasto para aparecer en Caja».

**Validación pendiente:** verificar la encontrabilidad con tareas reales antes de promover el mapa a contrato vigente. NN/g recomienda tree testing para evaluar jerarquías: https://www.nngroup.com/articles/tree-testing/.
