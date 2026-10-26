# 26 — Revisión final integral de Mora Vinería 2.0 (paquete único)

**Estado:** versión para **revisión integral y correcciones en bloque**; **NO** implica aprobación final del usuario, implementación, merge ni despliegue. Preparado a partir de las decisiones aprobadas de los Bloques I–III y de los contratos [22](22_cierre_integral_por_bloques.md), [23](23_auditoria_coherencia_integral.md), [24](24_contratos_operaciones_y_datos.md), [25](25_contrato_unificado_pantallas_y_componentes.md), [11](11_contratos_pantallas.md) y [20](20_observaciones_prueba_usuario.md). **Fecha de preparación:** 26/10/2026.

## 0. Qué estamos aprobando y qué no

El usuario decidió **terminar los planos de toda Mora antes de construir**. Los tres macro-bloques tienen **dirección conceptual acordada**. Esta revisión integra mapa, comportamiento, flujos, operaciones, datos y componentes para **aprobar o corregir todo de una vez**, evitando preguntas por cada botón.

- **Acordado por el usuario:** identidad con cuadrado en lugar de punto redondo; navegación orientada a `Inicio / Ventas / + / Caja / Más`; ventas separadas del historial; Inventario y Reposición independientes; lista semanal saneada que aprende; cambios claros de precios preseleccionados con confirmación; pedidos guardados y recepción desde ellos; Caja con Gasto/Aporte/Mover dinero; trabajo **sin backend** y con backup JSON local; alcance de reportes, metas y PDF.
- **Propuesta de concreción basada en esos acuerdos:** composición detallada de pantallas, componentes reutilizables, reglas de concurrencia/corrección y modelos conceptuales de cuenta, cobro, deuda, alias y pedido. Si se aprueba este paquete integral, pasarían a ser plano de construcción, **no software ya existente**.
- **No está incluido:** comenzar refactor/código, migrar IndexedDB, actualizar GitHub Pages, sincronización automática, facturación fiscal, integración bancaria, ML remoto u OCR obligatorio.

## 1. Identidad y uso visual

Mora debe ser una **PWA mobile-first, nocturna, cálida y minimalista**, con fondo carbón, acento fucsia de referencia `#FF0A89`, y sin apariencia de ERP o demo de tarjetas genéricas.

**Wordmark aprobado:** **«Mora» con un pequeño cuadrado fucsia** alineado ópticamente como punto final y del **tamaño de un punto de puntuación normal**, no carácter `.` redondo ni `■` gigante. Diseñar el cuadrado como parte gráfica propia para evitar diferencias entre fuentes y teléfonos.

**Jerarquía:** un encabezado global con **dos franjas integradas**: arriba identidad y accesos secundarios relevantes; debajo título contextual y `Volver` uniforme a la izquierda. No colocar cinco controles secundarios ni repetir título/retorno en paneles.

**Sistema común:** tipografía de operación legible, importes tabulares, escala de espaciado, botones primario/secundario/discreto, filas compactas, búsqueda/filtros, controles de cantidad, campos de dinero, revisión antes/después, historial, diálogos de confirmación, estados vacíos/errores y recuperación durable. Fucsia solo para identidad, selección y acción prioritaria; blur y superficies cristalinas medidos. Una acción principal por tarea. Los nombres de componentes son conceptuales; reutilizar componentes actuales si respetan contrato, sin segundo UI kit paralelo.

**Responsividad/accesibilidad:** probar 360/390/430 CSS px, teclado virtual, safe area, foco, lectores de pantalla, contrastes reales y reduced motion. El dock no tapa CTA/teclado; los errores no dependen del color, el gesto Atrás no destruye formularios y el `Volver` siempre hace lo mismo que la navegación contextual segura.

## 2. Árbol final de navegación propuesto

```text
Barra inferior (4 destinos + acción):
  Inicio | Ventas | [+ Nueva venta] | Caja | Más

Inicio
  Resumen de hoy → Ventas de hoy / Ganancia estimada
  Para reponer → Reposición / Inventario (pantalla dueña)
  Aviso de operación pendiente → Recuperación del mismo comando
  Accesos contextuales → Reportes / Caja / Datos y respaldo

Ventas [historial/gestión, no selector]
  Historial → Detalle → Corrección trazable
  Fiados → Persona → Deuda → Abonar / Historial
  [+ Nueva venta] → Selector → Carrito opcional → Cobro → Confirmación

Caja
  Resumen / Movimientos / Cuentas
  Registrar → Gasto / Aporte / Mover dinero
  Mover dinero → Entre cuentas / Retirar del negocio
  Contar efectivo → comparar sin inventar ajuste

Más [siempre abre raíz]
  Mercadería
    Productos → Catálogo → Ficha → Editar / Favoritos
    Inventario → Stock por producto → Contar/Ajustar → Historial
    Reposición
      Para reponer
      Lista semanal → Sanear → Por revisar / Cambios → Revisar → Aplicar precios
      Preparar pedido → Pendiente → Recibir mercadería
      Pedidos guardados → Pendiente / Parcial / Recibido / Cancelado
      Recibir sin pedido → Recepción multiproducto
  Negocio
    Reportes → Hoy / Semana / Mes → Productos / Resultados / Meta / Informe
  Aplicación
    Configuración → Datos y respaldo / Estado local / Preferencias mínimas
```

**Comportamiento:** `+` es acción, no tab; retoma un único borrador, no lo duplica. `Ventas` muestra historia. `Más` siempre abre su directorio raíz; un enlace desde Inicio/Producto/Reporte conserva el origen para `Volver`. En Nueva venta se oculta la barra inferior para concentrar la tarea; el borrador persistente continúa, incluidos errores de confirmación. `Caja` es destino propio. La barra responde a preferencias y diseño ya acordados; se valida como **conjunto** en este cierre global.

## 3. Bloque I — pantallas de uso diario

| Pantalla | Qué se ve y hace | Límite |
| --- | --- | --- |
| **Inicio** | «Resumen de hoy», «Ventas de hoy», «Ganancia estimada», hasta 3 prioridades «Para reponer», aviso recuperable solo si existe | No historial/stock/contabilidad completos; no duplicar el `+` central con un CTA gigante |
| **Ventas** | Historial por fecha/jornada con total y cobro, búsqueda/filtros útiles, detalle, correcciones y fiados como subflujos | No se entra al selector al tocar Ventas; abono no es venta |
| **Nueva venta** | Buscar y consultar artículos y stock/precio sin agregarlos; favoritos y categorías a demanda; agregar explícitamente | Carrito opcional; venta directa rápida sin pantallas extra |
| **Carrito** | Cambiar cantidades, quitar líneas, sumar productos, ver total; guardado de borrador | Quitar una botella del borrador no descuenta merma física |
| **Cobro** | Total, efectivo/transferencia/mixto y partes por cuenta, vuelto y comprobación humana de acreditación | Una única venta/comando; error permite reintentar mismo ID |
| **Productos** | Catálogo compacto (nombre/variante/precio/stock), categoría y búsqueda, ficha, favorito, editar, desactivar | Cambios futuros no reescriben precios históricos; productos usados soft delete |
| **Inventario** | «Stock por producto», objetivo, contar/ajustar con motivo y vista previa de delta, historial físico | No altera Caja por contar; líneas obsoletas se revisan antes de confirmar |

**Regla de jornada interna:** desde las 08:00 hasta las 07:59 del día siguiente; guardar fecha/hora real **y** fecha de jornada. No mostrar «día operativo» como etiqueta. **Stock bajo ≤20 % del objetivo individual; crítico ≤10 %**; sin objetivo, no inventar alerta.

## 4. Bloque II — proveedor, Reposición, Caja y Ventas con pagos

### 4.1 Lista del proveedor y precio comercial

- Pegar texto semanal de WhatsApp, guardar original y normalizar nombres/packs/costos de forma **conservadora**, sin cambiar stock/Caja al pegar.
- Resolver desconocidos desde **«Por revisar»**: sugerencia principal, «Es este producto», «Elegir otro» o «Crear producto». Confirmar le enseña al saneador una equivalencia local **proveedor/etiqueta + producto ID + variante + presentación/pack**; reaplicar en semanas siguientes solo si sigue siendo inequívoca. x6 ≠ x12, costo de cada semana **no** se guarda como alias; alias corregibles/revocables.
- Precio unitario de costo = costo real de presentación / unidades, **sin redondear internamente FIFO**. Precio **sugerido público** = **redondear hacia arriba a múltiplo de $500** `((costo/presentación en unidades) × 1,50)`; se puede editar manualmente.
- Mostrar por defecto solo **cambios accionables y filas dudosas**; realmente iguales ocultos bajo «Ver sin cambios». Costo cambiado con precio público igual **permanece visible**. Cambios claros de **precio público** preseleccionados, desmarcables; dudas nunca auto-seleccionadas.
- `Revisar N cambios` → vista precio anterior/nuevo → confirmación explícita `Aplicar N precios` → actualizar **precios futuros**, sin cambiar lotes, compras ni ventas previas. Propuesta técnica: un lote atómico con verificación de versión del producto; conflictos no se pisan silenciosamente.

### 4.2 Preparar y recibir mercadería

- **Portada de Reposición:** si hay **pedido pendiente**, primero `Recibir mercadería`; si no, `Preparar pedido`. Después «Para reponer», «Lista del proveedor», pedidos y `Recibir sin pedido` como secundarios. Aprobada **provisionalmente** en jerarquía, no como arte final.
- Pedido tipo carrito de compra: faltantes según objetivo (no solo alerta de stock bajo), packs y unidades, cantidades editables y costo **estimado** de lista vigente; advertir lo que ya está pedido sin contarlo como stock. Guardar **Borrador** durable y compartir texto WhatsApp. Abrir WhatsApp **no** significa «enviado»: persona marca `Pendiente/enviado` explícitamente.
- Pedidos con estados Borrador / Pendiente / Parcial / Recibido / Cancelado. Se reabren tras recarga o días, y sirven como **carrito precargado** al llegar la mercadería; también se puede recibir sin pedido.
- En recepción verificar unidades físicas y costo **real**, comparar pedido/entrega, corregir diferencias y confirmar. Solo **lo físicamente recibido** genera lotes FIFO, stock y una salida monetaria única vinculada a la recepción; Caja consulta el mismo evento. Si llega una parte, conservar faltante pendiente. Reintentar por ID sin doble lote/pago.

### 4.3 Caja, cuentas y pagos

- Caja organizada **Resumen / Movimientos / Cuentas**; único CTA `Registrar`: **Gasto**, **Aporte** o **Mover dinero**, con `Entre cuentas` / `Retirar del negocio` como opciones del último.
- Cuentas manuales de Mora: **Efectivo, Brubank**, y Naranja X/Mercado Pago cuando corresponda. **No conexión bancaria** ni dato de saldo remoto. Mostrar `esperado` solo con base fiable; `contado/verificado` solo declarado por operador con fecha; diferencia sólo si ambos comparables.
- **Gasto** no equivale a mercadería recibida; **Aporte** no equivale a venta; **Retirar del negocio** no es gasto operativo; **Entre cuentas** suma +M destino y −M origen, por lo que no cambia el total de fondos.
- **Cobro:** efectivo con vuelto; transferencia solo si persona comprueba acreditación; mixto con partes que suman el importe recibido. Una venta con efectivo + Brubank es **una venta, dos entradas de cuenta**. Traspasar después desde Naranja X a Brubank no registra segunda venta.
- **Fiado simple:** nombre de persona, venta de origen, deuda sin vencimiento forzoso; abonos parciales/total, cada uno registra cobro en cuenta y reduce saldo sin crear segunda venta. Si parte de una venta queda pendiente, indicar explícitamente la porción fiada; no asumir que transferencias sin acreditar son cobros.
- **Correcciones después de vender:** Ventas → Detalle → Corregir; vista previa de impacto en artículo/cantidad/precio/medio/deuda. Operación correctiva auditable; no borrar ni mutar historia de FIFO, ni inventar devoluciones automáticas de dinero. Correcciones complejas que exigirían reescribir lotes históricos pasan a revisión segura en vez de efecto ficticio.

## 5. Bloque III — Reportes, metas, PDF, Configuración y datos

| Función | Comportamiento |
| --- | --- |
| **Reportes** | Hoy/Semana/Mes por jornada; total vendido, cantidad de ventas, unidades, productos destacados y ganancia estimada según costo FIFO conocido. Dinero movido, aporte/gasto/compra/traspaso **separados** |
| **Meta mensual** | Objetivo de ventas ARS editable; avance y porcentaje si está configurada, sin alertas insistentes |
| **Proyección** | Estimación explícita según ritmo observado y cobertura suficiente de jornadas, nunca una promesa; sin datos fiables = «Todavía no hay información suficiente» |
| **Informe mensual** | Vista local imprimible de mes, operaciones, ventas, ganancia con advertencia si faltan costos, dinero, destacados, meta si existe y fecha de generación. **`window.print()`**, CSS de impresión claro/A4 orientativo, sin facturación fiscal |
| **Configuración** | «Datos y respaldo», estado/version de app local y preferencias mínimas; sin perfil/login/roles/sync |
| **Backup JSON** | Exportación integral y **versionada** que incluye catálogo, ventas, FIFO, stock, movimientos, borradores/comandos, compras, pedidos, aliases, cuentas, pagos, fiados, correcciones, metas y metadata; no prometer archivo guardado sin verificar |
| **Restauración JSON** | Seleccionar archivo, validar versión/integridad/relaciones, **vista previa**, confirmar **en espacio vacío**; fallo deja la base sin modificación; soportar backups anteriores mediante migraciones explícitas, sin mezclar dos instalaciones |

**Métricas honestas:** ganancia estimada ≠ efectivo de Caja; costo desconocido ≠ costo cero; saldo contable derivado ≠ saldo bancario; fiado vendido ≠ dinero ingresado; reporte no crea, edita ni duplica registros. El PDF no sustituye el respaldo JSON.

## 6. Integridad local y arquitectura aprobada

La PWA Vite vive **en la raíz** del repositorio, con **React, Vite, TypeScript, Tailwind**, IndexedDB **Dexie**, PWA y GitHub Pages en `https://Yamil1701.github.io/mora-vineria/` con `base: "/mora-vineria/"`. **No backend, Supabase, auth, roles complejos, PostgreSQL, sync automática, Docker obligatorio, ERP ni pagos/facturación integrados**.

**Datos locales fiables:** operaciones durables con IDs estables, reintentos idempotentes; transacciones de stock, FIFO y dinero ligadas a una misma causa; jornada del negocio calculada; historial inmutable/correcciones; borradores que sobreviven reload; productos históricos desactivables sin borrar. Las nuevas entidades **todavía no existen en código**: cuando se desarrolle, migrar DB y formato backup con pruebas, sin resetear instalación.

**Tres capas conceptuales, no estructura de carpetas impuesta:** (1) interfaz y componentes visuales compartidos; (2) reglas/proyecciones del dominio; (3) persistencia, comandos, migración/backup. Las pantallas no recalculan negocio con lógica improvisada; consultan proyecciones/servicios únicos.

## 7. Escenarios completos a los que el plano obliga

1. Consultar stock/precio en Nueva venta **sin agregar**, luego agregar y cobrar una vez.
2. Sale multiproducto, modifica carrito, cierra/reabre app, retoma borrador y confirma sin duplicar.
3. Corrige una venta pasada, conserva historia, refleja efecto verdadero en stock/dinero.
4. Cuenta/ajusta producto, confirma delta físico sin entrada monetaria.
5. Pega lista mal escrita, resuelve alias, vuelve a pegarla semana siguiente, reconoce y revisa precios con cambio previo/nuevo.
6. Prepara pedido, comparte WhatsApp, lo deja pendiente; **no** cambia stock/Caja hasta recibir.
7. Recibe parcialmente, vuelve días después por resto, contabiliza cada entrega física una sola vez.
8. Vende efectivo/transferencia verificada/mixto; Caja atribuye a cuentas correctas y no duplica.
9. Fiado: dos abonos parciales con saldo decreciente, nunca segunda venta.
10. Traspasa entre efectivo y Brubank sin variar total; retira ahorro sin registrarlo como gasto.
11. Reporte de mes con meta/proyección con y sin datos suficientes, y PDF offline sin cifras inventadas.
12. Descarga JSON, restaura en otro navegador limpio, conserva ID/historia/operaciones y aliases/pedidos/cuentas/metas; falla corrupta sin daño.
13. Falla una operación ya sellada, reinicia PWA, recupera **mismo comando**, sin doble stock/dinero.
14. Va desde Inicio/Reportes/Productos a una hija, `Volver` recupera origen/filtros, `Más` abre raíz y botón Atrás de teléfono no destruye formularios.
15. Revisión visual a anchos 360/390/430 CSS px y teclado, con componentes uniformes, enfoque visible y marca cuadrada.

**Antes de código:** estos son *contratos de aceptación documental*, no pruebas ya ejecutadas. **Después de código:** se automatizan con Vitest, arquitectura, Playwright, migraciones, QA móvil real y verificación de backup.

## 8. Qué todavía es propuesta de cierre, no una decisión histórica del usuario

**No hacer pasar por aprobación previa lo que propuso el asistente:**
- Confirmar el **dock completo** como norma final de navegación en la revisión integral (la preferencia por Caja en dock ya es clara).
- Adoptar el contrato preciso de partes de pago/cuentas, correcciones compensatorias y deudas/abonos según [24](24_contratos_operaciones_y_datos.md), especialmente reconciliación de correcciones FIFO complejas.
- Adoptar transacción **atómica** para aplicar varios precios, integración pedido↔recepciones y estrategia de migración/versionado.
- Adoptar contenido exacto de informe, regla prudente de muestra para proyecciones (en 24 se propone al menos **7 jornadas completas de cobertura**, no se ha aprobado ese número), y los componentes/interacciones descritos en [25](25_contrato_unificado_pantallas_y_componentes.md).
- La **portada de Reposición** tiene conformidad **provisional**, no aprobación estética pixel-perfect. La interfaz final se verificará en app construida, sin necesidad de hacerla primero para terminar los planos.

**Propuesta final al usuario para decidir en un solo mensaje:** aprobar **este paquete completo** como contrato general, o indicar todas las correcciones de alto impacto en una sola devolución. No pedir una aprobación separada por cada opción; la documentación se actualiza después de recibir el conjunto. **Hasta esa respuesta, el plano integral y la PR #12 siguen en borrador.**

## 9. Documentos dueños y uso durante futura construcción

- [01 — Mapa](01_mapa_conceptual.md) y [02 — Catálogo](02_catalogo_pantallas.md): propietario de pantalla y enlaces.
- [03 — Recorridos](03_recorridos_y_estados.md) y [10 — Navegación](10_contrato_navegacion.md): interacción y regreso, estados de flujo.
- [11 — Pantallas](11_contratos_pantallas.md), [12 — UI Kit](12_sistema_componentes.md) y [25 — Contrato unificado](25_contrato_unificado_pantallas_y_componentes.md): composición, visual, responsive y microcopy.
- [24 — Operaciones y datos](24_contratos_operaciones_y_datos.md): operaciones, integridad, migración y respaldo.
- [20 — Observaciones](20_observaciones_prueba_usuario.md), [22 — Cierre por bloques](22_cierre_integral_por_bloques.md), [23 — Auditoría](23_auditoria_coherencia_integral.md): evidencia, precedencia, dudas y decisiones históricas.
- **Este 26 es un documento de **revisión global**, no reemplaza los contratos dueños**. Si se corrige/aprueba, sincronizar cada documento especializado para impedir inconsistencias.

**Control final:** no fusionar ni implementar hasta una aprobación global explícita.
