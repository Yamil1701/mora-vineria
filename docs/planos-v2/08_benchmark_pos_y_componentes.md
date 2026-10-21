# 08 — Investigación comparativa de POS, componentes y recorridos

> **Nota de vigencia (21/10/2026):** la decisión posterior [ADR 17](17_adr_ventas_y_nueva_venta.md) separa la pestaña **Ventas** (historial/gestión) del botón central **+ Nueva venta**. Este capítulo conserva sus observaciones e investigaciones previas; no debe leerse como contrato que equipara Ventas a Nueva venta.

**Fecha:** 21/10/2026. **Alcance:** documentación oficial de Square, Shopify y Loyverse, contrastada con operación de Mora. **No** se inspeccionó su código propietario, ni se afirma haber realizado pruebas físicas de estas apps. Las funciones consultadas podrían pertenecer a planes pagos, tener otra plataforma o requerir nube; no equivalen a especificación de Mora.

## 1. Método comparativo

Para cada producto:
1. Identificar **problema de trabajo**: venta de ventanilla, stock, recepción, historial, dinero.
2. Documentar **patrón respaldado** por guía pública oficial y señalar limitaciones.
3. Decidir **adoptar / adaptar / descartar / estudiar**, justificando el encaje con un local nocturno y PWA sin backend.
4. Traducir a una prueba concreta: encontrar producto, completar cobro, registrar conteo parcial, reanudar.
5. No importar pantallas genéricas, módulos multi-sucursal, menús empresariales ni «best practices» sin evidencia de tarea.

## 2. Matriz de patrones observados

| Fuente oficial consultada | Patrón respaldado | Qué aprender para Mora | Qué no copiar |
| --- | --- | --- | --- |
| [Square — Configurar grilla de artículos](https://squareup.com/help/us/en/article/8334-set-up-item-grid) | Atajos/favoritos personalizables en el contexto de **cobro**, incluso en teléfonos | Productos frecuentes deben ser visibles/agregables sin entrar al catálogo administrativo | Grilla compleja configurable, servicios, gift cards y funciones irrelevantes |
| [Loyverse — Favoritos en teléfonos](https://help.loyverse.com/help/favorites-on-smartphones) | Acceso a populares desde pantalla de venta; toque agrega al ticket | Favoritos en **Ventas** como aceleración del flujo principal | Presuponer sincronización entre dispositivos o listas enormes de favoritos |
| [Shopify — Procesar venta](https://help.shopify.com/es/manual/sell-in-person/shopify-pos/process-sales-transaction) | Buscar producto, añadir artículo, cobrar | Separar selección de artículos de la decisión sobre el medio de pago | Exigir carrito como una parada obligatoria cuando la compra es de una sola botella |
| [Shopify — Efectivo](https://help.shopify.com/es/manual/sell-in-person/shopify-pos/payment-management/cash-payments) | Importe exacto predeterminado, alternativa de monto recibido para calcular vuelto | Campo de efectivo recibido **opcional** y vuelto cercano al botón confirmar | Hardware obligatorio, fiscalidad o flujos de caja ajenos al MVP |
| [Shopify — Inventario POS](https://help.shopify.com/es/manual/sell-in-person/shopify-pos/inventory-management) | Contar, ajustar, recibir inventario como tareas identificables | Tres recorridos separados en Productos: consultar, contar y recibir | Integración de multi-sucursal o dashboards administradores |
| [Square — Conteo total y cíclico](https://squareup.com/help/us/en/article/8249-conduct-full-inventory-counts-with-square-for-retail) | Distingue full count y cycle count; un conteo parcial **no cambia productos no incluidos** | Los conteos informales de Mora son **por producto o subconjunto**, nunca «hacer inventario completo» que ponga a cero no contados | Frecuencias sugeridas por proveedor como si fueran obligación del local |
| [Loyverse — Ajustes de stock](https://help.loyverse.com/es/help/how-work-stock-adjustments) | Registra motivos distintos: recepción, inventario contado, pérdida/daño | Motivo y cantidad física ligados a cambios; recepción no debe confundirse con merma | Dependencia de backend o planes «Advanced Inventory» |
| [Shopify — Gestión de órdenes](https://help.shopify.com/en/manual/sell-in-person/shopify-pos/order-management) | Historial y detalle después del cobro, con administración de pedidos | Historial de Ventas tiene dueño propio y continuidad con detalle/corrección | Devoluciones, fulfillment, envíos y canales de ecommerce inexistentes |

**Conclusión de benchmark:** hay una convergencia cualitativa entre productos diferentes: la pantalla de venta necesita atajos; la gestión física de stock es una disciplina separada de los pagos; el historial no debería funcionar como un depósito de formularios sueltos. Esto **no demuestra cuantitativamente** que nuestro árbol sea óptimo: requiere tree test con operadores de Mora.

## 3. Cinco principios transferibles, con traza de prueba

### POS-01: vender primero, administrar después

**Problema Mora:** atender por ventanilla con una mano, a veces cansado, compra de un producto tan común como una de varios. **Solución propuesta:** en Ventas, búsqueda con foco útil, favoritos, agregar y Cobrar directo. Carrito opcional para revisar líneas, sin bloquear operación simple. **Prueba:** vender una unidad desde la pantalla principal de Ventas sin abrir historial, ficha administrativa o lista de proveedores.

**Fuente:** Shopify POS + Loyverse favoritos. **Límite:** no se decidió el orden exacto de controles ni el diseño de cada componente; se debe comprobar en móvil.

### POS-02: la mercadería tiene recorridos distintos

- Consultar precio/stock = lectura rápida.
- Contar unidades = operación de inventario sobre stock **físico comprobado**.
- Recibir mercadería = hecho económico y físico, con costo de compra.
- Preparar pedido = intención comercial sin alterar stock ni caja.

**Prueba:** «se rompió una botella» llega a Inventario/Conteo; «llegaron dos cajones» llega a Reposición/Recepción; «¿cuánto cuesta?» llega al catálogo/selector.

**Fuente:** Square cycle count / Shopify inventario / Loyverse ajustes. **Límite:** los servicios comerciales tienen reglas distintas de costeo; Mora preserva FIFO según decisiones propias, no presume que esos proveedores lo calculen igual.

### POS-03: detalle progresivo, no ocultación arbitraria

- Importes, unidades y estado de guardado que afectan decisión se mantienen visibles.
- Lotes FIFO, racionales exactos, UUID de comando y auditoría pueden abrirse desde «Información del registro».
- Un `<details>` es útil para información secundaria; no esconder la forma de pago dentro de uno.
- Cada pantalla lleva un verbo principal claro y acceso Volver.
- Fecha/jornada en historial según contexto, no texto técnico omnipresente.

**Fuente:** [GOV.UK Details](https://design-system.service.gov.uk/components/details/) y [Apple Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars).

### POS-04: no adoptar escalabilidad empresarial de otras apps

Square/Shopify/Loyverse contemplan sucursales, empleados, administración web, hardware y sincronización. Nuestro MVP usa un teléfono/navegador como base local y backup manual. No agregar:
- usuario/login/roles/remoto sin decisión nueva;
- pestañas «More», catálogos web y POS duplicados;
- múltiples cuentas o conciliación bancaria automática;
- inventario total que ajusta productos no contados;
- carrito de ecommerce o devoluciones como requisito universal.

**Regla:** un patrón externo se conserva sólo si reduce errores, pasos o dudas reales en Mora.

### POS-05: recuperar registros es parte de operar

Ventas, recepción y conteo deben sobrevivir error de almacenamiento/reinicio. Confirmación muestra si el comando quedó guardado o preparado para reintentar. JSON recuperable es visible y verificable, no un botón enterrado en un menú genérico.

**Fuente de persistencia:** [MDN Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API), [Dexie best practices](https://dexie.org/docs/Tutorial/Best-Practices). **Observación:** esta es una decisión de seguridad de Mora, no un patrón necesariamente exhibido en los POS de la comparación.

## 4. Benchmark inverso: funciones que otras POS podrían ocultar y Mora necesita visibles

| Necesidad específica de Mora | Por qué modifica el patrón genérico |
| --- | --- |
| Ventas anotadas después de la entrega real | Fecha/hora real de carga y jornada derivada; no pedir hora estimada obligatoria |
| Venta física aunque registro diga 0 | No rechazar el hecho; guardar y abrir revisión sin inventar costo |
| Proveedor por WhatsApp con packs | Reposición por fardo/cajón, stock por unidad, pedido sin cambio de stock/caja |
| Transferencia recibida en Brubank pero sin API | Confirmación **humana de acreditación**; sin etiqueta «banco validó» |
| Caja física con billetes usados para vuelto | Distinguir dinero contado, esperado, aportes, retiro/ahorro, caja y banco |
| Gastos excepcionales, no centro de operación | Función contextual dentro de Caja, no uno de los cuatro destinos principales |
| Backup JSON obligatorio | Configuración/Datos accesible, recordatorio proporcional al riesgo, restaurar en vacío |
| Objetivos individuales de stock | Bajo ≤20 %, crítico ≤10 %, no un umbral uniforme de «quedan 5» |

## 5. Espacio de diseño y componentes (propuestas evaluables, no nueva estética)

| Patrón candidato | Dónde aparece | Cuando usarlo | Cuando **no** usarlo |
| --- | --- | --- | --- |
| Tab bar principal | AppShell | Cambiar entre 4 áreas | Disparar «Registrar gasto» |
| Entrada secundaria contextual | Caja/Configuración | Llevar a área propia sin quinta tab | Esconder acciones urgentes detrás de múltiples niveles |
| Búsqueda enfocada | Selector Ventas; catálogo Productos | Identificar SKU, precio y stock | Sustituir favoritos si hay compra frecuente |
| Favorito/tarjeta compacta | Ventas | Atajo a producto sin abrir ficha | Foto inventada o SKU equivocado |
| Fila de lista con divisor | Catálogo/historial | Repetición de registros similares | Métrica principal que necesita jerarquía |
| Panel destacado / métrica | Inicio/Reportes | Hasta 1–2 cifras principales | Cada fila del historial |
| Barra fija Cobrar | Ventas | Total y confirmación a una mano | Tapar teclado, campos o alertas |
| Formulario de acción | Caja/Inventario/Recepción | Editar un hecho con confirmación | Mostrar formulario en resumen |
| Diálogo | Confirmación/edición contextual breve | Acción corta sin perder origen/foco | Pantalla larga con múltiples subtareas |
| Desplegable | Detalles técnicos/ayuda secundaria | Reducir complejidad sin bloquear tarea | Ocultar pago, advertencia, importe final |
| Historial con ficha detalle | Ventas, Caja, Inventario | Auditar y corregir datos existentes | Duplicar historial íntegro en Reportes |
| Aviso de recuperación | Shell/contexto de operación | Error durable, backup crítico, reintento | Icono decorativo o toast que desaparece sin dar acción |
| Estado vacío útil | Todas | Sin datos o sin coincidencias | Implicar que el usuario debe importar datos de otra instalación |

## 6. Lo que este benchmark no demuestra

No permite concluir cuál es la combinación exacta de grilla/lista, cantidad de favoritos, estilo de tarjetas, longitud de cabeceras o profundidad óptima del árbol para Mora. Tampoco puede demostrar rendimiento ni satisfacción de usuarios sin ensayos. La comparación ilumina **alternativas y antipatrones**, no reemplaza un test con las personas que trabajan en la vinería.

La investigación siguiente deberá revisar capturas **reales y vigentes** de estos patrones bajo permisos de uso y sin copiar activos propietarios, contrastándolas con los cinco mockups de Mora en móviles de 360–430 px; documentar qué se evalúa por apariencia y qué por función. No inventar más renders para dar por resuelto diseño.
