# 05 — Decisiones, investigación, pruebas de arquitectura y plan de ejecución

**Estado:** propuesta v0.1. **No se autoriza todavía reconstruir UI ni crear funcionalidades.** Esta documentación es el punto de partida para la investigación profunda y para validar la arquitectura antes de convertirla en contrato.

## 1. Qué está cerrado y qué no

### Requisitos ya confirmados — no reabrir por gusto

- Herramienta de ventanilla, uso nocturno desde celular, funcionamiento local y sin backend en MVP.
- Cuatro destinos de navegación principal: Inicio, Ventas, Productos, Reportes; **disposición confirmada 21/10/2026: Inicio · Ventas · + Nueva venta · Productos · Reportes**. El + es acción global, no quinta pestaña; Ventas abre historial/gestión. [ADR 17](17_adr_ventas_y_nueva_venta.md).
- Identidad fucsia sobre fondo carbón y cinco referencias móviles oficiales; caja visual aprobada como complemento.
- Productos con categorías simples, favoritos, variantes, stock objetivo; bajo ≤20 % y crítico ≤10 % del objetivo individual.
- Venta 1 o varios productos, cargable después de entrega física, jornada interna 08:00–07:59 con instante real de registro.
- FIFO por lotes como método de costeo comercial, costos desconocidos explícitos.
- Proveedor semanal, compras en paquetes pero stock/venta por unidades; compra real se registra al recibir y pagar.
- Gastos puntuales, aportes, retiros/ahorro que salen del negocio; ninguna entrada de capital crea venta/ganancia.
- Fiados y abonos previstos, sin vencer automáticamente; transferencia verificada manualmente.
- Registros locales durables y backup/restauración JSON obligatorio. No llamarlo sincronización.

### Decisiones estructurales recomendadas pendientes de aceptación

| ID | Propuesta | Por qué | Cómo validar |
| --- | --- | --- | --- |
| D01 | Inventario y conteos dentro de Productos | Estado físico de mercadería, no flujo de dinero | Tareas: rotura, recuento |
| D02 | Reposición como subárea de Productos | Pedido, recepción, lotes; continuidad de stock | Tareas: pedido del jueves, entrega parcial |
| D03 | Caja como destino contextual desde Inicio | Dinero y cuentas no son una pestaña principal de uso continuo | Encontrar gasto/aporte/caja contada |
| D04 | Configuración estable con backup y restauración | Recuperación crítica pero no ocupa centro del tablero | Encontrar respaldo y restauración sin pistas |
| D05 | Reportes sin formularios de escritura | Interpretación diferenciada de operación | Evaluar confusión al consultar costos |
| D06 | Fiados en Ventas, abonos reflejados en Caja | Son saldos de ventas, no entradas comerciales nuevas | Encontrar cliente con deuda y pagar parcial |
| D07 | Inicio máximo resumen y alertas accionables | Evitar la pantalla-cajón de sastre | Prueba de atención en 10 segundos |
| D08 | Referencias visuales + tokens, no nuevos patrones por PR | Identidad coherente en todas las pantallas | Capturas a 360/390/430 + QA humano |
| D09 | Separar componentes y screens por ámbito | Reducir acumulación de src/App.tsx y CSS | Regression tests y revisión modular |
| D10 | Mantener áreas futuras en el plano pero ocultarlas en app | Arquitectura estable sin pantallas vacías | Rondas de QA con features actuales |

Estos diez puntos son **propuestas del asistente** fundamentadas en análisis, no decisiones confirmadas por el usuario sólo por aparecer aquí.

## 2. Preguntas de implementación que sí deben cerrarse cuando toque

- ¿Cómo guardar y corregir una venta ya confirmada sin recalcular historia FIFO incorrectamente, ni duplicar dinero?
- ¿Qué estados reales se permiten para transferencia iniciada y aún no verificada si el producto ya fue entregado?
- ¿Cómo representar efectivo esperado sin una cifra inicial contada confiable?
- ¿Qué sucede si un ajuste de caja difiere de la suma registrada: observación sin efecto o asiento explícito de ajuste separado?
- ¿Qué definición simple tendrá «Para reponer» si no hay objetivo configurado o existe venta con stock negativo?
- ¿Qué información de compra/pedido semanal se guarda en la primera vertical sin generar burocracia innecesaria?
- ¿Es necesario guardar orden/precio de proveedor y presentación como atributos propios o sólo histórico de recepción?
- ¿Cuánto detalle técnico de costos/lotes debe ver el operador y dónde?
- ¿Cuándo merece entrar foto exacta de SKU, escáner o lectura de lista de proveedor?
- ¿Hay necesidad real de PDF mensual o basta el resumen con exportación puntual?
- ¿Cómo se versionan datos y backups antes de añadir pagos, fiados, correcciones o caja?
- ¿Cuánto de la navegación necesita estar representado en URLs sin afectar GitHub Pages/PWA?
- ¿Qué señal real indicará que un respaldo es suficientemente reciente y dónde mostrar el recordatorio?

Estas preguntas tienen **dueño y lugar** en el mapa. No se resuelven agregando botones improvisados; se resuelven antes de la fase que corresponda.

## 3. Investigación profunda pendiente: matriz de evidencia

Esta PR **no pretende completar** la investigación de miles de patrones, ni acreditar conformidad ISO. El trabajo siguiente investiga, contextualiza y elige mecanismos útiles para un POS local móvil.

| Eje | Referencia inicial a consultar y contrastar | Resultado esperado |
| --- | --- | --- |
| Diseño centrado en usuario | ISO 9241-210:2019, ISO 9241-11:2018 | Principios de tareas, eficacia, eficiencia y satisfacción |
| Diálogo humano-sistema | ISO 9241-110:2020 | Predictibilidad, autodescripción, control y errores |
| Formularios | ISO 9241-143:2012 y patrones GOV.UK | Entradas, confirmación, etiquetas y errores |
| Calidad de producto | ISO/IEC 25010:2023 | Características relevantes de fiabilidad, mantenibilidad, uso y rendimiento |
| Calidad de datos | ISO/IEC 25012:2008 | Exactitud, completitud y coherencia entre vistas/historial/backup |
| Accesibilidad web móvil | WCAG 2.2 AA | Contraste, foco visible, tamaño de objetivos, errores, zoom |
| Arquitectura de información | NN/g, card sorting y tree testing | Términos que el operador reconoce, ubicación intuitiva |
| Navegación y layout | Apple HIG (tab bars, toolbars, layout), Material Design | Tab principal vs acción, back, cabeceras, jerarquía |
| Componentes y progressive disclosure | GOV.UK Design System | Qué mostrar, cuándo contraer, formularios y ayuda |
| POS reales | Square POS, Loyverse POS, Shopify POS, SumUp, Lightspeed | Buscar, vender, favorecer favoritos, pagos, historial, inventario |
| Offline/PWA | MDN, web.dev, Dexie, Workbox | Ciclo de vida, almacenamiento local, backup, recarga y fallos |
| React/CSS | Documentación React, MDN CSS | Separación de responsabilidades, reusabilidad, estados, rendimiento |
| Prevención de fallos | Guías de seguridad/continuidad según impacto, incl. ISO 22301/27001 cuando pertinente | Disponibilidad local, recuperación, riesgos de almacenamiento |

**Las normas ISO son principalmente de pago**: usar información pública de su ficha oficial y texto adquirido/autorizado si existe. No reproducir el cuerpo protegido ni declarar auditoría/certificación con sólo leer un resumen.

### Referencias públicas verificables de arranque

- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/tab-bars y https://developer.apple.com/design/human-interface-guidelines/layout
- GOV.UK (Details): https://design-system.service.gov.uk/components/details/
- NN/g (tree testing): https://www.nngroup.com/articles/tree-testing/ y arquitectura de información: https://www.nngroup.com/articles/ia-study-guide/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/ y https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- ISO/IEC 25010:2023: https://www.iso.org/standard/78176.html

**Regla del informe de investigación posterior:** para cada conclusión consignar problema de Mora, fuente y versión, evidencia o supuesto, decisión propuesta, alternativa descartada, costo/consecuencia, criterio observable y prioridad. Copiar una pantalla externa no es evidencia suficiente.

## 4. Verificar el árbol antes de esculpir pantallas

Fase de evaluación de arquitectura de información:

1. Presentar **solo el árbol de destinos y sus etiquetas**, sin diseño visual.
2. Aplicar las diez tareas de 03_recorridos_y_estados.md para que quien opera identifique el destino.
3. Registrar primer clic, éxito directo/indirecto, retorno, términos confusos y alternativa que parecía lógica.
4. Corregir ubicación/nombres hasta que cada tarea tenga una ruta clara; permitir enlaces contextuales solo cuando no duplican dueño.
5. Registrar resultados en este directorio, no como memoria oral del chat.
6. Cerrar plano estructural **antes** de reorganizar JSX. Esto está alineado con la metodología tree testing de NN/g.

No imponer una cifra porcentual de éxito sin establecer muestra y criterio de aceptación con el usuario. En un negocio pequeño un ensayo con sus operadores reales aporta más que simular cientos de usuarios ficticios.

## 5. Secuencia sugerida de reconstrucción (todas sin despliegue automático)

| Etapa | Entregable | Condición de salida |
| --- | --- | --- |
| A. Inventario funcional | Matriz de 02 contrastada con el código master, pruebas y datos reales; inconsistencias documentales | No existe acción importante sin dueño/estado |
| B. Investigación y validación IA | Referencias calificadas + pruebas del árbol + registro de decisiones | Mapa revisado y aprobado como contrato de navegación |
| C. Sistema visual e interacción | Contratos de pantallas/patrones, prototipo navegable sobre referencias ya aprobadas | Recorridos de tarea verificables en móvil y feedback visual |
| D. Modularización segura | Shell, pantalla por ámbito, adaptadores; datos intactos | Todos los tests y backup anterior pasan, navegación completa |
| E. Reubicación UX | Mover accesos: Caja, Inventario, Reposición, Datos; sin nuevas features | Usuarios encuentran tareas y se conserva historial íntegro |
| F. Completar flujos prioritarios | Transferencia, luego corrección, caja/retiros/reposición y fiados según necesidad | Una vertical por PR con tests, QA y aprobación antes de deploy |
| G. Operación y calidad continua | Mantenimiento de componentes, auditoría UX periódica, alertas y backups | Sin discrepancias abiertas de navegación ni pérdida de datos |

Fases A–C preceden a la refactorización funcional. No intentar un «big bang» que mezcle navegación nueva, pagos nuevos, esquema de datos y motor de backup.

## 6. Regla de cambios a los planos

Todo cambio relevante necesita un registro simple:
- ID de decisión; qué cambia y por qué;
- necesidad del negocio; dueño canónico y pantalla afectada;
- recorrido afectado; impacto en dominio, base, backup y pruebas;
- comparación con la fuente visual/norma pertinente;
- qué se descartó y costo de revertir;
- estado «propuesto / aprobado / reemplazado» y fecha.

**No inmovilidad:** los planos no son dogmas; son contratos versionados. Si aparecen pruebas que los contradicen, se corrige el contrato antes de programar. Eso evita tanto «construir sobre arenas movedizas» como blindar un error original para siempre.

## 7. Criterio para pasar de plano a código

Un área queda **lista para implementar** sólo cuando:
- todas las acciones tienen propietario inequívoco;
- navegación de entrada/salida y back está diseñada;
- estados vacío/error/offline/pending y confirmación durable están definidos;
- no se inventan saldos, costos ni transferencias verificadas;
- diseño conserva identidad y controles táctiles;
- impactos en journal/FIFO/backups están evaluados;
- existen pruebas automáticas a agregar y tareas móviles de QA;
- el usuario aprobó la versión del plano correspondiente.

Hasta entonces: documentación, investigación y prueba de estructura; **no features y no merge a producción**.
