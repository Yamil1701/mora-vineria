# 02 — Catálogo de pantallas, capacidades y ubicaciones

**Versión:** propuesta 0.1, no aprobada. Esta matriz es el inventario de destinos; **no equivale a un plan de desarrollo inmediato**. Los nombres de rutas son identificadores conceptuales para diseño y pruebas, no URLs reales ni decisión de incorporar un enrutador externo.

**Estados:** V = usado y aprobado en QA móvil previo; T = existe y tiene pruebas automáticas pero QA móvil completo o fidelidad visual pendientes; P = necesidad registrada, no implementada; E = explorar antes de comprometer; F = fuera de MVP sin nueva aprobación. La pantalla puede estar parcialmente implementada; verificar capacidad por fila.

## I. Inicio: orientación, no administración

| ID de pantalla | Contenido canónico | Acciones permitidas | Estado |
| --- | --- | --- | --- |
| IN-01 Resumen de hoy | Fecha/jornada, ventas, ganancia estimada, hasta 3 faltantes | Ver reporte, ir a Reposición/Caja; **+ global** disponible para nueva venta | V/T, presentación provisional |
| IN-02 Alertas y tareas | Stock insuficiente, operaciones pendientes, errores recuperables, backup desactualizado | Ir al destino dueño, reintentar operación sellada | T/P según alerta |
| IN-03 Accesos globales | Entrada a Caja y Configuración con posición estable | Navegar, no ejecutar movimiento | P (hoy accesos mezclados) |

**Exclusiones:** historiales extensos, ventas completas, conteo stock, formularios de gasto, paneles de diagnóstico o reportes completos.

## II. Ventas: historial y gestión; «+» inicia nueva venta

| ID | Pantalla | Qué debe hacer | Estado |
| --- | --- | --- | --- |
| VE-00 Área Ventas | Historial y detalle predominantes, con futuras correcciones/fiados y venta en preparación | Pulsar **Ventas** llega aquí, **no** al selector | P pantalla, historial base V |
| VE-01 Selector de nueva venta | Buscar, favoritos, categorías opcionales, precios/stock, agregar uno o varios productos | Pulsar **+ central**; editar borrador durable sin crear venta | V flujo, acceso global P |
| VE-02 Carrito | Ver artículos, cambiar cantidades, vaciar con protección, importe | Regresar selector o continuar a cobro; es opcional | V |
| VE-03 Cobro | Total y método; efectivo recibido y vuelto; después transferencia manual, mixto y fiado | Validar suma, acreditación manual o deuda según método | V sólo efectivo; P otros |
| VE-04 Confirmación | Resultado durable único, importe, artículos, faltantes, próximo paso | Repetir venta nueva o ver detalle; no doble cargo | V/T |
| VE-05 Historial | Fecha/hora, importe, tipo de cobro, búsqueda/filtro útiles | Abrir detalle | V historial básico |
| VE-06 Detalle de venta | Líneas, precio cobrado y referencia, costo FIFO si calculable, cobro, revisión | Corregir por flujo auditable | V lectura básica; P corrección |
| VE-07 Corregir venta | Modificación auditada; diferencia de caja, stock, deuda y asignaciones costo | Guardar compensaciones, no sobrescribir original | P |
| VE-08 Fiados | Deudas por nombre, venta origen, saldos y abonos | Registrar abono total/parcial | P |
| VE-09 Abono | Importe recibido, medio/cuenta, saldo anterior/nuevo | Confirmar pago y efecto monetario único | P |

**Riesgos:** transferencia se valida por una persona observando acreditación bancaria real; fiado nuevo suma venta pero no efectivo; el abono suma cobro pero no venta; corrección exige operación trazable, no borrado.

## III. Productos: catálogo, inventario y reposición

| ID | Pantalla | Qué debe hacer | Estado |
| --- | --- | --- | --- |
| PR-01 Catálogo | Buscar y ordenar, mostrar nombre, variante, precio y stock/estado legibles | Abrir ficha / alta | V/T |
| PR-02 Ficha | Información comercial, activo, favorito, cantidad y alertas; acciones agrupadas | Editar, contar, ver reposición | V/T |
| PR-03 Alta/edición | Nombre, variante, categoría, precio, objetivo, activo | Confirmación durable; soft delete para historial | V |
| PR-04 Categorías | Lista corta y filtros; administración mínima contextual | Crear/editar si aporta valor, sin árbol complejo | V parcialmente |
| PR-05 Inventario | Cantidades, bajo/crítico por objetivo y pendientes de recuento | Ir a conteo o historial | P vista propia; T stock base |
| PR-06 Conteo y ajuste | Stock previo fechado, cantidad física, diferencia, motivo | Guardar ajuste con CAS, FIFO en bajas y costo desconocido en sobrantes | T, hoy ubicado en Movimientos |
| PR-07 Historial de stock | Aperturas, recepciones, ventas, ajustes y razones | Lectura, detalle técnico bajo demanda | T/P según diseño |
| PR-08 Stock inicial | Cantidad y costo histórico conocido/desconocido | Crear apertura, sin salida ficticia de dinero | V |
| PR-09 Reposición | Sugerencias según objetivo, lista editable de unidades/paquetes | Preparar pedido | P; alertas hoy V |
| PR-10 Preparar pedido | Presentaciones x4/x6/x8/x12 u otra, costo esperado, cantidad editable | Copiar texto WhatsApp; estado enviado sin tocar stock/caja | P |
| PR-11 Recepción | Cantidades reales, presentación, costo real, efectivo pagado, confirmación | Lote FIFO, stock+ y caja- en una operación | V recepción simple; P vincular a pedido |
| PR-12 Compras extraordinarias | Ingreso excepcional al mismo circuito de recepción | Registrar causa/costo real | P mejora, recepción base existe |
| PR-13 Revisiones de diferencia | Venta física sin stock, sobrante/desconocido, ajuste contradictorio | Resolver con evidencia y mantener rastro | T marca pendiente; P cierre/reconciliación |
| PR-14 Proveedor / lista pegada | Equivalencias de packs y catálogo verificables | Vista previa y revisión humana | E |
| PR-15 Escáner / foto SKU | Herramientas para altas y consulta | Nunca simular escaneo o imágenes verificadas | E |

**Nota sobre propietario:** Reposición es un subdominio de Productos. El pago de la compra se refleja automáticamente en Caja, pero no se confirma por segunda vez allí.

## IV. Caja y dinero: registros y saldos

| ID | Pantalla | Qué debe hacer | Estado |
| --- | --- | --- | --- |
| CA-01 Resumen | Efectivo/cuentas, esperado vs contado con fecha, diferencia cuando haya ambos | Ver historial, contar dinero | P; hoy resumen parcial en reportes |
| CA-02 Movimientos | Lista filtrable de movimientos de dinero, fecha, monto y origen | Iniciar gasto/aporte/extracción en su propio flujo | T historial parcial hoy en Movimientos |
| CA-03 Gasto puntual | Importe, motivo libre, fecha real, confirmación | Salida de efectivo; no compra de stock | T |
| CA-04 Aporte externo | Importe, procedencia, fecha, confirmación | Entrada no comercial | T |
| CA-05 Extracción/ahorro | Importe, motivo, fecha | Salida del negocio, no gasto comercial ni traslado interno | P |
| CA-06 Contar caja | Real declarado por usuario, fecha/hora, comparación con esperado | Registrar observación y diferencia sin inventar saldo | P |
| CA-07 Cuentas | Efectivo, Brubank y alternativas atribuibles a negocio | Consultar registros por fuente | P |
| CA-08 Traspaso | Origen/destino/importe y confirmación | No crea venta ni ganancia; evita doble contabilización | P |
| CA-09 Intercambio Brubank→efectivo | Traspaso entre medios, con hechos comprobados | Reflejar montos de Mora, sin acceso bancario supuesto | P |

**Regla de diseño aprobada:** vista secundaria Caja con Resumen / Movimientos / Cuentas y desgloses contraíbles; conservar referencia visual caja-cuentas.webp.

## V. Reportes: consulta e interpretación

| ID | Pantalla | Qué debe hacer | Estado |
| --- | --- | --- | --- |
| RE-01 Resumen Hoy/Semana/Mes | Ventas, ganancia bruta estimada y período | Navegar entre períodos | V/T |
| RE-02 Tendencias | Evolución sin estadísticas ficticias ni porcentajes sobre cero | Ver desglose | T básico |
| RE-03 Productos | Más vendidos y señales de reposición | Vincular al producto dueño | T básico |
| RE-04 Dinero y resultados | Costo de mercadería vendida, bajas valorables, gastos, aportes, variación de caja separados | Leer; ir a Caja para operar | T |
| RE-05 Metas / proyecciones | Estimaciones explícitas con incertidumbre | Sin predicciones con historia insuficiente | E |
| RE-06 Exportaciones | Informe compartible si responde a uso real | PDF imprimible local mediante ventana de impresión sólo si se aprueba prioridad | E |

**Exclusiones:** registro o edición de movimientos; duplicar historial canónico bajo el reporte. Puede haber detalle vinculado, no un segundo sistema de operaciones.

## VI. Configuración y datos

| ID | Pantalla | Qué debe hacer | Estado |
| --- | --- | --- | --- |
| CO-01 Entrada | Ajustes mínimos y acceso directo a resguardo | No modificar ventas | P |
| CO-02 Backup JSON | Preparar, verificar, descargar y registrar fecha/hora de respaldo | Archivar copia independiente del navegador | V |
| CO-03 Restaurar JSON | Archivo, preview de formato/integridad, confirmación y base vacía | Restauración atómica o ninguna modificación | V |
| CO-04 Estado de datos | Versión, modo local, almacenamiento y mensajes comprensibles | Diagnóstico breve, recuperación | T/P |
| CO-05 Preferencias | Preferencias de visualización si necesarias | Sin sobrecarga ni cuentas/roles ficticios | P |
| CO-06 Dispositivos/sync | Autorizar/revocar equipo, sincronizar, recuperar en nube | **No disponible en MVP** | F |

## VII. Elementos transversales sin tab nueva

| ID | Función transversal | Propietario técnico/visual |
| --- | --- | --- |
| TR-01 Navegación | AppShell: Inicio · Ventas · **+** · Productos · Reportes; 4 destinos y una acción global; contexto por área |
| TR-02 Borrador/operación sellada | Servicio durable; la UI comunica preparado/confirmado/reintento |
| TR-03 Conectividad | Estado local real; «sin conexión» sin simular envío a servidor |
| TR-04 Errores | Campo afectado + explicación + acción segura, no alerta genérica |
| TR-05 Confirmación | Un patrón consistente; no perder operación al cerrar o reiniciar |
| TR-06 Búsqueda/filtros | Patrón reutilizable en catálogos o listas; estado/semántica propios |
| TR-07 Ayuda | Texto contextual breve; detalles avanzados sólo si son secundarios |
| TR-08 Accesibilidad | Contraste, foco, gestos, teclado, targets táctiles y lector de pantalla |
| TR-09 Backup pendiente | Recordatorio proporcional al riesgo; acción lleva a CO-02 |
| TR-10 Revisión crítica | Alerta en pantalla de destino y aviso resumido en Inicio |

## Lista explícita de reubicaciones futuras (sin tocar datos)

| Actualmente en producción | Destino propuesto | Necesita |
| --- | --- | --- |
| Pestaña Ventas → selector Nueva venta | Ventas → historial/gestión; **+** → selector | VE-00/VE-01, borrador durable intacto |
| Inicio → botón Movimientos | Inicio → Caja | CA-01/CA-02, acceso permanente predecible |
| Movimientos → Gastos / Aportes | Caja → Movimientos | Misma operación durable, mover acceso y vista |
| Movimientos → Contar y ajustar stock | Productos → Inventario | PR-05/PR-06, reutilizar comando FIFO existente |
| Movimientos → historial de mercadería | Productos → Inventario → Historial | Vista de stock única con contexto |
| Inicio → Backup y restauración | Configuración → Datos | CO-01/CO-02/CO-03; preservar recordatorio visible cuando corresponda |
| Reportes → historial completo | Ventas → Historial | Reporte muestra enlace, no otro listado completo |
| Productos → Ficha → Lotes y recepciones | Inventario/Reposición con contexto | Detalle técnico sólo donde ayuda |
| Inicio → bloque «Movimientos de hoy» | Resumen de Caja contextual, o dato breve si es realmente útil | No duplicar la misma tabla en Inicio |

No migrar registros por cambiar ubicación visual. Evaluar primero que los tests existentes sigan pasando y que los flujos permanezcan accesibles.

## Definición mínima de cada pantalla para diseñar después

Antes de programar, cada ID se amplía con ficha: **propósito en una frase; usuario y frecuencia; datos mínimos; acción primaria; entradas; salidas/regreso; vacío; cargando; error; sin red; operación preparada/confirmada; accesibilidad; pruebas; enlace a dominio; referencia visual**. Nunca crear una pantalla sólo porque un componente ya existe.
