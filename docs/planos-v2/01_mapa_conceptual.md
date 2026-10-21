# 01 — Mapa conceptual integral

**Estado:** propuesta navegable v0.1, no aprobada; **no implementación**.

## 1. Árbol de producto: los lugares canónicos

~~~mermaid
flowchart TB
  M["MORA VINERÍA"]
  M --> IN["INICIO · información y prioridades"]
  M --> VE["VENTAS · operación comercial"]
  M --> PR["PRODUCTOS · mercadería"]
  M --> RE["REPORTES · interpretación"]
  M --> CA["CAJA Y DINERO · destino contextual"]
  M --> CO["CONFIGURACIÓN · destino contextual"]

  IN --> IN1["Resumen de hoy"]
  IN --> IN2["Avisos accionables"]
  IN --> IN3["Nueva venta · enlace"]
  IN --> IN4["Caja · enlace"]
  IN --> IN5["Reposición · enlace"]

  VE --> VE1["Nueva venta"]
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
  PR --> PR3["Inventario"]
  PR3 --> PR4["Conteo / ajuste / revisión"]
  PR --> PR5["Reposición"]
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
  class VE,PR,IN,RE main
~~~

**Importante:** este diagrama representa **jerarquía de información**, no un listado de features disponibles. Pantallas y capacidades futuras no se vuelven ejecutables por estar en el plano.

## 2. Barra inferior y navegación contextual

- **Persistentes**: Inicio, Ventas, Productos, Reportes. No agregar «Más», Caja o Inventario como quinta pestaña.
- **Caja y dinero**: destino secundario inequívoco y visible desde Inicio; también accesible por enlace contextual desde el reporte correspondiente, pero **sin duplicar formularios**.
- **Configuración**: acceso estable mediante control de ajustes en encabezado global cuando la navegación permita mantenerlo visible; nada de esconder backup solamente dentro del historial de movimientos.
- **Subpantallas**: conservar relación con área padre y navegación de regreso; por ejemplo Productos > Inventario > Conteo. Pueden ocultar la barra inferior temporalmente en una operación modal/concentrada si garantiza regreso y no pierde borrador; la decisión concreta se prueba en móvil.
- **Accesos directos**: «Nueva venta» desde Inicio equivale a Ventas > Nueva venta; «Para reponer» lleva a Productos > Reposición; ninguna entrada paralela tiene lógica o datos propios.

La distinción «pestaña para navegar / botón para actuar» coincide con la guía de Apple para tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars. No convertir cada verbo en una pestaña.

## 3. Propiedad de operaciones (regla central)

| Acción | Propietario único | Atajo/lectura permitida | Prohibición |
| --- | --- | --- | --- |
| Buscar precio y disponibilidad | Productos > Catálogo (consulta) | Selector de Ventas, con misma fuente de datos | Catálogos independientes |
| Alta, edición, desactivación | Productos > Ficha | Atajo desde estado vacío | Edición dispersa en Reportes |
| Favoritos | Productos > Ficha; selector solo consume preferencia | Favoritos en Ventas | Dos listas de favoritos distintas |
| Nueva venta | Ventas > Nueva venta | Botón en Inicio | Cobros independientes en Inicio |
| Efectivo, transferencia, mixto, fiado nuevo | Ventas > Cobro | Ninguno; mismo flujo de venta | Registrar transferencia automáticamente sin verificar |
| Corregir una venta | Ventas > Historial > Detalle | Enlace desde Reportes | Borrar venta o ajustar datos sin auditar |
| Abono de fiado | Ventas > Fiados > Cliente | Vista de cobro en Caja | Generar una segunda venta |
| Contar o ajustar unidades | Productos > Inventario > Conteo | Enlace desde alerta en Inicio / ficha | Formularios de stock dentro de Caja |
| Stock inicial | Productos > Inventario, desde ficha | Asistente de primera carga | Comprar inventario ficticio |
| Preparar pedido | Productos > Reposición | Enlace de «Para reponer» | Sumar stock por marcar pedido enviado |
| Recibir mercadería | Productos > Reposición > Recepción | Desde ficha con contexto correspondiente | Duplicar egreso en «Gastos» |
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
1. Fecha humana y acceso de Nueva venta.
2. Ventas de hoy y cantidad de ventas.
3. Ganancia estimada **solo si los costos son determinables**; si no, texto de cobertura/historia por revisar.
4. «Para reponer» con máximo unas pocas prioridades y entrada a Inventario/Reposición.
5. Avisos **excepcionales y accionables**: operación pendiente, falta de stock relevante, backup atrasado, situación de recuperación.
6. Acceso inequívoco a Caja y Configuración, sin módulo de administración extendido.

**No** contiene: formularios de dinero, listados financieros completos, resumen contable de ocho filas, lotes, historial de ventas completo, herramientas de depuración, ni dos botones primarios compitiendo con Nueva venta.

El texto «Movimientos de hoy» puede existir como lectura breve del estado, pero **no debe reemplazar Caja ni crear un mini-módulo dentro de Inicio**.

## 5. Ventas: límites

Selector y venta son la actividad de mayor frecuencia. Mantener búsqueda rápida, favoritos, filtro opcional por categoría, unidades y carrito persistente con acceso directo al cobro. El carrito es una vista para editar, no una pantalla obligatoria entre selección y cobro. Transferencia/mixto/fiado serán futuras capacidades; no anunciarlas como disponibles salvo indicación honesta.

Historial guarda ventas y sus correcciones; fiados es un subrecorrido comercial ligado a cada venta y sus abonos, cuyo impacto de caja se refleja desde el mismo evento.

## 6. Productos: tres dominios de experiencia, un solo destino superior

**Catálogo** responde «¿qué vendemos y a cuánto?»; **Inventario** responde «¿cuántas unidades hay y qué diferencia existe?»; **Reposición** responde «¿qué falta comprar y qué se recibió/pagó?». Comparten producto, pero sus acciones y datos son diferentes.

- Catálogo: datos públicos de venta, variantes y disponibilidad breve; ficha para editar, favorito, estado activo.
- Inventario: stock físico/registrado, objetivo por artículo (bajo ≤20 %, crítico ≤10 %), conteo, causa, revisión, historial de ajustes. No «importar» costo cero para sobrantes.
- Reposición: faltantes sugeridos por objetivo, pedido editable, texto a WhatsApp, recepción real, presentación por pack, costo total y salida única de efectivo. El lote FIFO nace en la recepción, no en el pedido.

## 7. Caja y dinero: significado de cada número

Tres vistas relacionadas con la referencia visual aprobada de caja-cuentas.webp: **Resumen / Movimientos / Cuentas**. Esas pestañas son *locales a Caja*, no la barra principal de toda Mora.

- **Resumen**: dinero esperado según registros frente a efectivo real ingresado voluntariamente con fecha. Si no hay conteo, no mostrar diferencia calculada.
- **Movimientos**: cobros efectivos de ventas, compras pagadas, gastos excepcionales, aportes, extracciones y transferencias internas como hechos con origen trazable.
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
