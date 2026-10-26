# 23 — Auditoría de coherencia integral del plano maestro

**Corte:** 25/10/2026. **Objeto:** auditar coherencia de las decisiones aprobadas en las revisiones de los Bloques I, II y III. **Solo documentación**, sin implementar, probar en teléfono esta versión hipotética, fusionar, cambiar base de datos ni desplegar.

**Estado de aprobación:**
- **Bloque I — Experiencia diaria:** dirección general aceptada para avanzar; identidad corregida expresamente («Mora» + cuadrado fucsia del tamaño de un punto). Revisar cohesión global antes de aprobación final.
- **Bloque II — Mercadería y dinero:** paquete funcional y UX **aprobado conceptualmente** mediante «Sí, me parece bien».
- **Bloque III — Información, datos y sistema visual:** paquete funcional y UX **aprobado conceptualmente** mediante «Me parece bien».
- **Plano maestro integral:** **no aprobado ni terminado aún**; esta auditoría inicia su cierre. La aprobación de un bloque no activa código ni significa QA visual.

**Fuentes de precedencia:** [20 Observaciones](20_observaciones_prueba_usuario.md) (palabras y decisiones del usuario) > [22 Plan por bloques](22_cierre_integral_por_bloques.md) y este documento (consolidación) > [01 Mapa](01_mapa_conceptual.md), [02 Catálogo](02_catalogo_pantallas.md), [03 Recorridos](03_recorridos_y_estados.md), [10 Navegación](10_contrato_navegacion.md), [11 Pantallas](11_contratos_pantallas.md), [12 Sistema de componentes](12_sistema_componentes.md) > análisis/hipótesis históricos y código actual. Cuando un contrato especializado siga pendiente, marcar el vacío explícitamente; **no inventar aceptación de usuario**.

## 1. Mapa de responsabilidades sin duplicar hechos

| Hecho / consulta | Pantalla que lo ejecuta (única dueña) | Enlaces/resúmenes legítimos | No debe suceder |
| --- | --- | --- | --- |
| Iniciar/retomar una venta | **+ Nueva venta**: Selector → Carrito opcional → Cobro → Confirmación | Inicio, fila favorita, alerta o historial pueden llevar al mismo flujo | Tocar «Ventas» crea venta o borrador adicional |
| Consultar/corregir venta pasada | **Ventas**: historial → detalle → corrección trazable | Reportes enlaza detalle, sin segundo editor | Sobrescribir/eliminar venta y asignaciones FIFO históricas |
| Consultar precio/catálogo | **Productos**; búsqueda durante nueva venta muestra precio/stock sin sumar | Reposición y Ventas comparten productos por ID | Dos catálogos que divergen o consulta que agrega artículo por accidente |
| Contar/ajustar stock físico | **Inventario** → Producto → Contar/Ajustar | Inicio, Productos y revisión de venta enlazan misma acción | Modificar stock desde carrito o registrar movimiento monetario falso |
| Actualizar lista/precios | **Reposición** → Lista del proveedor → Revisar cambios → Confirmar | Productos refleja precio futuro luego de confirmar | Pegar lista modifica precios/stock/caja sin confirmación |
| Preparar/enviar pedido | **Reposición** → Pedidos | Desde faltantes/Producto | Pedido enviado crea stock, lotes o egreso |
| Registrar compra físicamente recibida | **Reposición** → Recepción multisproducto (desde pedido o sin pedido) | Caja muestra egreso derivado con origen, Inventario muestra unidades | Segundo gasto manual por el mismo pago |
| Ingresar gastos/aportes/retiros/traspasos | **Caja** → «Registrar» (Gasto/Aporte/Mover dinero → Entre cuentas/Retirar) | Inicio puede enlazar Caja o mostrar resumen muy breve | Gasto imita compra; transferencia interna cambia total de fondos |
| Ver dinero/cuentas | **Caja**: Resumen, Movimientos, Cuentas | Reportes muestra resultados comerciales y enlace a Caja | Saldo calculado presentado como saldo bancario real sin verificación |
| Fiado/abono | **Ventas** → Fiados → Cliente → Abonar; registro de entrada monetaria en Caja derivado | Caja muestra abono, Reportes distingue venta vs cobro | Abono crea una segunda venta |
| Interpretar períodos/meta/proyección | **Reportes** | Inicio muestra solo el resumen del día | Reportes duplica edición de ventas, gastos o stock |
| Generar informe mensual local | **Reportes** → Mes → Imprimir/Guardar PDF | Configuración no crea un segundo informe | PDF fiscal, servidor, librería PDF obligatoria o datos fabricados |
| Respaldar/restaurar/migrar por archivo | **Configuración → Datos y respaldo** | Acceso contextual desde aviso/Inicio si corresponde | Llamar «sincronización» a copiar/restaurar JSON |

## 2. Navegación — contrato de convergencia

**Destino global candidato consolidado:** `Inicio · Ventas · (+ Nueva venta) · Caja · Más`. El **+** es una acción diferenciada, **no** una quinta pestaña. `Más` siempre regresa a la **raíz del directorio** cuando se toca en el dock; dentro de Mercadería, **Productos / Inventario / Reposición** son destinos hermanos. En `Más` también se encuentran **Reportes** y **Configuración**. La navegación **desde un atajo contextual** recuerda el origen para `Volver`, independientemente de la pestaña global resaltada.

**Header:** dos franjas en un único sistema; arriba marca **«Mora» + cuadrado fucsia de tamaño óptico del punto de puntuación**, abajo contexto (título, retorno y como mucho las acciones secundarias pertinentes). El cuadrado es un signo gráfico propio, no `.` redondo ni `■` de tamaño grande. La barra inferior se oculta en el flujo concentrado de venta y en confirmaciones sensibles cuando compita por espacio, sin sacrificar regreso seguro.

**Política de estado:**
- **Persistente local:** hechos negocio, venta en curso (`Draft`), operaciones selladas (`writeIntent`), pedido borrador/pendiente, alias aprendidos, metas, cuentas cuando existan, fecha de jornada derivada; copiar en JSON según esquema versionado.
- **Estado de consulta efímero de pantalla/sesión:** filtros, orden, búsquedas, posición de scroll, periodo reportes y origen de retorno; recuperar mientras el recorrido siga activo, sin persistir dinero/stock derivado duplicado.
- **Derivado:** totales, stock, alertas 20/10 %, estado de pedido (desde líneas/recepciones), ganancias, proyecciones, saldo de cuenta calculado; siempre desde una fuente única.
- **Bloqueo de seguridad:** si una escritura sellada está pendiente, no permitir otra incompatible: recuperación del **mismo comando/ID** por encima de navegación o nuevo intento, sin inventar éxito por un clic.

**Punto de aceptación:** el dock candidato y las decisiones de header tienen preferencia explícita del operador y dirección general aceptada, pero todavía necesitan una **aprobación global de coherencia** del plano y comprobación de usabilidad cuando exista el producto construido. No reabrir un microdebate sobre cada ubicación.

## 3. Contradicciones históricas localizadas y precedencia resuelta

| Nº | Contradicción | Regla que prevalece | Acción documental |
| --- | --- | --- | --- |
| C01 | `Mora.` literal/punto redondo en descripciones viejas | **«Mora» + cuadrado pequeño fucsia**; texto anterior = historia de marca | Contrato gráfico 12/21/10 y portada actualizados; seguir normalizando ejemplos que sobrevivan en 11 |
| C02 | Dock `Inicio/Ventas/Productos/Reportes` en implementación y docs antiguas | **Candidato aprobado como dirección global:** Inicio/Ventas/+ Nueva venta/Caja/Más | Tratar dock viejo como estado actual, no blueprint. Validación integral pendiente |
| C03 | `Ventas` abre selector en la app actual | `Ventas` = historial/gestión; `+` = iniciar/retomar selector | Navegación 10, pantallas 11 y mapa 02 tienen precedencia |
| C04 | Productos contiene Inventario y Reposición como subrutas forzadas | En **Más → Mercadería** son **tres accesos propios** | Un único servicio de mercadería/recepción; atajos solo enlazan |
| C05 | Lista proveedor como OCR/IA/remoto/opcional | Pegar **texto de WhatsApp** y sanear, aprendizaje por corrección **local** es requisito de la experiencia; OCR opcional/futuro | No meter OCR o ML remoto como dependencia |
| C06 | Listas sin cambio se muestran completas o precios no preseleccionados | Solo dudas/cambios relevantes visibles; precios seguros distintos del vigente **preseleccionados** y revisión final obligatoria | Se corrigió contrato 11; ejemplos anteriores anotados como reemplazados |
| C07 | Pedido enviado contado como stock/costo pagado | Pedido no altera stock ni Caja; recepción real produce efectos una sola vez | Pedidos persistentes + recepciones parciales vinculadas |
| C08 | «Ganancia» confundida con efectivo o compra cargada como gasto manual | Ganancia comercial según FIFO, Caja muestra entradas/salidas/cuentas; compra afecta Caja **desde Recepción** | No duplicar egresos en «Registrar gasto» |
| C09 | Metas, proyecciones básicas o PDF marcados «E»/optativos | **Metas y proyección básica y PDF mensual local por `window.print()` dentro del alcance MVP** | Catálogo 02, contrato 11 y portada README deben reflejarlo |
| C10 | Docs 00/02/HANDOFF históricos planean Supabase/sync/auth | MVP vigente **sin backend, sin autenticación, sin sincronización**; Dexie + backup/restauración JSON local | Etiquetar docs viejos como históricos; no borrar evidencia |
| C11 | Gate pide screenshots reales de una app rediseñada antes de programar | Plano termina con contratos/coherencia y aprobación del usuario; QA real/screenshot va **tras construir**, antes de desplegar | Corregido gate en 16; 13 y 14 distinguen evaluación estática vs QA futuro |
| C12 | Interpretación de «por ahora» como aprobación de pixel-perfect | La portada Reposición está **aceptada provisionalmente en jerarquía**, no diseño gráfico final | Estado literal en 11/20 |

Las filas son **conflictos de fuentes y diseño**, no evidencia de errores ejecutados en producción. Los artefactos anteriores continúan como historial etiquetado; no cambiar código para “corregir” documentación durante esta fase.

## 4. Riesgos abiertos que impiden convertir los planos en instrucciones ejecutables completas

Los tres paquetes **ya tienen dirección UX acordada**, pero hay que detallar y comprobar documentalmente:

| Riesgo | Contrato a cerrar, sin implementar aún | Prueba de aceptación documental |
| --- | --- | --- |
| P01 — Cuentas y pagos mixtos | Modelo de cuentas efectivo/Brubank/otras; venta con una o varias partes de cobro; acreditación manual; recibos, retiros y traspasos sin duplicar totales; valor desconocido distinto de cero | Cobro efectivo 100 %; transferencia 100 %; mixto 2 medios; movimiento entre cuentas mantiene total; traslado Naranja X→Brubank no crea cobro nuevo |
| P02 — Correcciones comerciales | Contrato de operaciones correctivas inmutables y su efecto en unidades, precio, FIFO, dinero y deuda; no cambiar sale histórico en silencio | Venta corregida tras otra venta; cambio cantidad/precio, medio y fiado; balances preservados y vista de historial inteligible |
| P03 — Fiados/abonos | Deuda vinculada a venta y cliente por nombre; saldo, pagos parciales, medios/cuentas, no vencimiento obligatorio | Dos abonos parciales y cierre; no crear venta nueva; saldo no negativo |
| P04 — Pedidos/recepciones parciales | Pedido con líneas por presentación, cantidad pedida/recibida, recepción(s) vinculadas, excepciones de productos distintos, costo efectivamente pagado por recepción, idempotencia | Pedido enviado sin efecto; recepción parcial uno, recarga, segundo ingreso; lotes/efectivo solo por recibido, sin duplicación |
| P05 — Precios masivos y aprendizaje de alias | Equivalencias proveedor/producto/presentación por ID; versión local y rectificación; precios nuevos seguros **preseleccionados** pero aplicados con una confirmación en lote; conflictos si cambió producto en otro contexto | Misma lista reimportada, costo variado, x6 vs x12, propuesta dudosa; rechazo/recuperación sin actualización parcial engañosa |
| P06 — Metas/proyección | Base de días del mes y límites de muestra, diferencia entre ventas y cobros, manejo de días sin venta y costo faltante | Mes vacío, mes parcialmente cargado, jornada nocturna, meta no configurada y período cruzando cambio de mes |
| P07 — Informe mensual imprimible | Campos, corte por jornada, exportación offline, leyenda de costo incompleto, CSS impresión que excluye dock/fondo ambiental | A4/PDF del navegador legible en móvil y escritorio, mismas cifras que Reportes, datos faltantes no inventados |
| P08 — Respaldo/migraciones | Versionar nuevas entidades en Dexie y JSON (pedidos, alias, cuentas, pagos, fiados/correcciones, metas); migración de formato y restauración **en espacio vacío**; fidelidad de comandos/drafts/writeIntent | Exportar instalación vieja, migrar; restaurar en navegador limpio, verificar igualdad de operaciones e IDs y reintentar una vez |
| P09 — Componentes/states de UX | Contrato único de token, cabecera, dock, Volver, filas, formularios, cobro, confirmación, indicadores, fallas, vacíos y teclado a 360/390/430 px; no crear library paralela | La misma acción usa el mismo control, criterio de foco, mensaje y jerarquía en cada área |
| P10 — Alcance documental y precedencia | Resolver contradicciones persistentes de los docs antiguos, clasificar funciones y escenarios de QA como `aprobado / propuesto / no implementado / fuera` | Un lector externo sabe qué construir sin confundir supuesto histórico con decisión del usuario |

**Prioridad de cierre:** P01–P05 y P08 son los más importantes para no tener que rehacer la base local o el historial. P06–P07/P09 cierran el Bloque III. Son **trabajos de especificación** y no habilitan implementar nada.

## 5. Plantilla obligatoria para cerrar pantallas y operaciones restantes

Una ficha de pantalla implementable debe tener: `ID`, nombre español, **área dueña**, propósito y frecuencia, información principal/secundaria, acción primaria/secundaria, entrada/origen y regreso, atributos del UI kit, estados `vacío/loading/normal/guardando/preparado/confirmado/error/sin conexión` según correspondan, validación y revisión, modelo de persistencia/derivación, efectos de stock/dinero/historia, integración con backup/migración, navegación con teclado/gesto y **escenarios de aceptación reproducibles**.

No obligar a cada pantalla a tener un estado irrelevante: una vista de lectura no necesita `writeIntent` artificial; una operación monetaria sí exige preservación del formulario y recuperación segura.

La misma regla vale para modelo de datos: concepto, ID, relaciones, estado, operación que lo modifica, versión, invariantes, eventos de historial, pruebas de concurrencia/reintento, formato de backup. No escribir TypeScript ni schema Dexie antes de cerrar estos contratos.

## 6. Matriz de recorridos end-to-end para el cierre integral

| Caso | Recorrido | Debe demostrar |
| --- | --- | --- |
| INT-01 | Inicio → + Nueva venta → consultar precios/stock sin agregar → cobrar | Consulta independiente de agregado; venta única; jornada y total correctos |
| INT-02 | + → varios productos → carrito opcional → salir → regresar → terminar | Borrador persiste, cantidades/totales sin pérdida ni venta duplicada |
| INT-03 | Ventas → Historial → Detalle → Corrección → Volver | Historia preservada, resultado rastreable y efecto de dinero/stock explícito |
| INT-04 | Más → Inventario → Producto → Contar/Ajustar → Volver | SKU correcto, delta validado, stock real, ningún movimiento de Caja falso |
| INT-05 | Más → Reposición → Lista → sanear → corregir alias → aplicar precios | Coincidencias seguras, aprendizaje reutilizable y cambios comerciales sólo tras confirmación |
| INT-06 | Para reponer → Preparar pedido → WhatsApp → Pendiente → recibir | Pedido no mueve stock/dinero; recepción sí y solo una vez |
| INT-07 | Pedido recibido parcialmente → volver otro día → recibir faltante | Sólo stock y costo de cada recepción, saldo pendiente coherente |
| INT-08 | Caja → Registrar → Gasto/Aporte → Consultar | No contar movimiento como venta o ganancia |
| INT-09 | Caja → Entre cuentas / Retirar del negocio | Traspaso no cambia total; retiro no es gasto |
| INT-10 | Cobrar efectivo, transferencia verificada y mixto | Componentes de cobro suman y cobran una vez sin afirmar verificación automática |
| INT-11 | Fiado → abono parcial → abono final | Saldo no negativo, cobro en Caja y venta original única |
| INT-12 | Reportes → Mes → Meta/proyección → Informe imprimible | Métricas fieles, estimación etiquetada y `window.print()` local sin datos falsos |
| INT-13 | Configuración → Backup → exportar JSON → navegador vacío → restaurar | Integridad/identidades/relaciones y cobertura de entidades nuevas; no sincronización |
| INT-14 | Forzar fallo local con writeIntent sellado, recargar y reintentar | Reusar mismo comando, sin duplicar stock, dinero ni ventas |
| INT-15 | Buscar áreas desde Más y retroceder con header/tecla del teléfono | No perder filtros, formularios ni origen; identidad visual uniforme |

**Evidencia requerida antes de llamar cerrado el plano:** contrato trazable por cada caso y validación de diseño con el usuario. **Evidencia requerida tras construir:** tests automatizados de invariantes, Playwright, QA táctil real/teclado/responsive, capturas de referencia y backup/restauración; no certificar anticipadamente.

## 7. Próxima acción del proyecto de planos

1. **Cerrar en una sola pasada documental** P01–P10: modelo conceptual mínimo e invariantes, contrato de recorridos excepcionales, componentes y casos. Resolver internamente los detalles técnicos que no cambien el uso real; señalizar toda decisión verdaderamente nueva.
2. **Presentar al usuario una revisión final integral**, **no** un cuestionario por pantalla. Mostrar mapa de pantallas, circulación, dinero/stock, seguridad de datos, informes y sistema de componentes; pedir un conjunto de correcciones/aprobación.
3. Al recibir aceptación global, actualizar cada archivo dueño, fijar un **índice final implementable con versión y trazabilidad**, documentar qué queda fuera, y recién entonces considerar **terminada la PR documental** (sin fusionarla automáticamente).
4. **Solo después del cierre explícito** elaborar misiones técnicas de implementación con PR/commits/pruebas, manteniendo `master` y los datos existentes intactos durante la fase actual.

**Atención:** las funciones nuevas acordadas no existen en el código actual solo por aparecer en estos documentos. La revisión de la implementación publicada sigue siendo una comprobación separada.
