# 13 — Plan de validación integral y corte de implementación

**Versión 0.1 — 21/10/2026.** Plan de pruebas futuras, **no** declaración de que ya se realizaron. El QA móvil de PR #10 está aprobado según el usuario; PR #11 pasó QA provisional de utilidad, **no** aprobación definitiva de diseño. No repetir ese QA de funcionalidad como requisito de empezar a documentar, pero exigir regresión al reorganizar pantallas.

## 1. Tres preguntas diferentes, tres evidencias diferentes

| Qué queremos saber | Método | Evidencia válida |
| --- | --- | --- |
| ¿La persona encuentra la función donde la espera? | Tree testing sin aspecto gráfico; escenarios reales | Ruta de primera elección, desvíos, comentarios del operador |
| ¿Puede completar la tarea con rapidez/seguridad? | Prototipo navegable y QA real en teléfono, teclado/foco | Tarea lograda, errores, dudas, comportamiento de regreso |
| ¿El sistema conserva datos correctos? | Tests Vitest/arquitectura/Playwright, restauración en perfiles aislados | Assertions sobre IDs, transacciones, stock FIFO, caja, JSON |

**No confundir:** 142 pruebas unitarias o 21 E2E verdes de una versión anterior no prueban si el usuario encuentra «Contar stock». Una captura bonita no prueba el backup. Un tree test no prueba FIFO. Estos métodos son complementarios.

## 2. Tree test — estructura del experimento

**Material operativo:** [19 — Guion de prueba sin pistas](19_guion_prueba_arbol.md). El documento [18 — Prevalidación heurística](18_prevalidacion_heuristica.md) contiene rutas esperadas y **no se entrega al participante**. Hasta contar con observaciones auténticas, este gate permanece **sin ejecutar**.

Preparar un árbol de texto con estos destinos SIN colores, iconos ni pistas en la tarea:

~~~text
Mora Vinería
├─ Inicio
├─ Ventas (pestaña: abre gestión)
│  ├─ Historial / Detalle / Corregir
│  └─ Fiados / Cliente / Abono [futuro]
├─ (+) Nueva venta (acción global, NO área)
│  └─ Selector / Carrito opcional / Cobro / Confirmación
├─ Productos
│  ├─ Catálogo / Ficha / Editar
│  ├─ Inventario / Conteo / Historial de stock
│  └─ Reposición / Pedido / Recibir mercadería
├─ Reportes
│  └─ Hoy / Semana / Mes / Detalles
├─ Caja y dinero [secundaria]
│  ├─ Resumen / Contar efectivo [futuro]
│  ├─ Movimientos / Gasto / Aporte / Retiro
│  └─ Cuentas / Traspaso [futuro]
└─ Configuración [secundaria]
   ├─ Datos / Respaldo JSON / Restauración
   └─ Estado del almacenamiento
~~~

**Tareas:** T1–T12 de `09_decisiones_pruebas_y_gates.md`. No decir «buscá en Inventario» al participante cuando la tarea es una botella rota. Mezclar orden de tareas para que no aprenda jerarquía por repetición. Registrar si la tarea es **actual** o **futura** para no fingir una opción disponible en producción.

**Ficha por observación:**

~~~text
Participante (seudónimo): ___  Fecha: ___  Dispositivo: ___
Tarea: ___
Ruta inicial elegida: ___
Rutas alternativas consideradas: ___
Ruta final: ___
Resultado: encontrado / no encontrado / encontrado tras desvío
Duda/cita textual: ___
Propuesta de cambio a etiqueta o lugar: ___
~~~

Muestreo: operadores reales disponibles de Mora, sin participantes ficticios ni porcentajes representativos con n pequeño. [NN/g Tree testing](https://www.nngroup.com/articles/tree-testing/).

## 3. QA de interacción móvil por misión

| ID | Tarea completa con datos sintéticos | Errores a observar |
| --- | --- | --- |
| UX-01 | **+** desde Inicio → favorito → Cobrar sin carrito → exacto | + inicia sólo una venta, campo/cobro visibles, sin duplicación |
| UX-02 | **+** → 2 productos → cambiar unidades → Ventas (historial) → volver a + → cobrar | Se retoma borrador íntegro, Ventas no abre selector, monto congruente |
| UX-03 | Buscar producto, filtrar bajo stock, abrir ficha, ir a Reportes, regresar | Filtro perdido o «Volver» incorrecto |
| UX-04 | Llegaron 2 packs, registrar presentación/unidades/costo, cerrar | Pago duplicado, stock incorrecto, confirmación confusa |
| UX-05 | Conteo físico con diferencia; otra pestaña cambia stock antes de guardar | Ajuste con base antigua, costo falso |
| UX-06 | Registrar aporte y gasto; consultar impacto en Caja y Reportes | Aporte sumado a ventas, compra duplicada como gasto |
| UX-07 | Venta registrada con stock 0; ir a revisión Inventario | Venta bloqueada, faltante oculto o costo inventado |
| UX-08 | Preparar backup JSON y recuperarlo en navegador vacío | Archivo no encontrado, restore sobrescribe base |
| UX-09 | Una transacción falla; cerrar/reabrir, reintentar mismo ID | Comando duplicado o estado «confirmado» falso |
| UX-10 | Cambiar de tab repetidamente con teclado abierto y barra fija | Focus oculto, scroll salto, touch erróneo |
| UX-11 | Abrir Caja desde Inicio, registrar gasto, volver | Regreso forzado a Inicio, historial duplicado |
| UX-12 | Elegir desde Reportes una venta antigua, abrir detalle y regresar | Pierde período seleccionado |
| UX-13 | Instalar/abrir offline después de publicar nueva shell | Caché desactualizada, pérdida de IndexedDB |
| UX-14 | Abrir app vacía, añadir primer producto sin saber tecnología | Call to action inexistente, manual técnico |
| UX-15 | Evaluar futura transferencia: acreditación no verificada → no marcar cobrada | Falso ingreso por activar método de demo |
| UX-16 | Evaluar fiado futuro: abono parcial no genera nueva venta | Saldos/deuda contaminan reportes |

**Etapas UX-15/16 son recorridos de diseño o pruebas una vez implementados**, no casos E2E que el código actual ya deba aprobar.

**Bloque obligatorio ADR 17:** NAV+-01 a NAV+-12 del documento 17, incluidos accesibilidad semántica, ancho 320/360/390/430, teclado/safe area, borrador durable y reintento de operación preparada.

En móvil comparar 360×780, 390×844 y 430×932 px; iOS Safari/PWA y Android Chrome/PWA cuando se pueda. Probar brillo nocturno, texto aumentado, VoiceOver/TalkBack, teclado, safe area y pantallas largas. No presentar simulación desktop como sustituto de QA real.

## 4. Matríz de regresión técnica previa/posterior al refactor

| Suite o invariant | Antes de mover pantallas | Después de cada PR de UI |
| --- | --- | --- |
| TypeScript y build | Base compilable | Sin regresión |
| Tests unitarios de dominio y proyecciones | FIFO, jornada, stock, resultados | Todos verdes |
| Contratos de arquitectura | Comandos, esquema, importaciones | Todos verdes |
| Playwright Chromium y WebKit móvil | Recorridos de ventas, movimientos, backup | Adaptar **sólo** selectores/rutas cuando cambia lugar, nunca quitar aserciones de efectos |
| Persistencia de borrador | Reload/segundo tab/offline | Mismo Draft sin nuevo commandId |
| Confirmación durable | WriteIntent prepared/confirmed/retry | Efecto exactamente una vez |
| Conteo CAS | Cambio entre pestañas → rechazo correcto | Sin baja con referencia antigua |
| FIFO / costos | Segmentos, desconocido, ventas históricas | No recalcular pasado ni introducir costo cero |
| Caja | Recepción paga genera salida; gasto/aporte separados | No doble cargo |
| JSON | Actual formato 2, antiguo formato 1 | Equivalencia, fallo atómico, no importar sobre base ocupada |
| Soft delete | Desactivar producto con historial | Historial intacto |
| PWA | Instalación/actualización sin borrar datos | Recupera shell y datos |
| Visual | Mockups principales/caja complementaria | Capturas, contraste y control humano |

En `master` hay tests `tests/e2e/{local-flow,movements,backup,ux-refoco}.e2e.ts`, `tests/architecture/contract.cases.mjs` y suites en `src/`. Antes de abrir PR de implementación se fijará una base reproducible para comparar. **No reutilizar el número 21 E2E como contrato inmutable**: crecerá o variará al separar pantallas; no se tolera perder cobertura crítica.

## 5. Criterios de aceptación por niveles

**Bloqueante (P0):**
- pérdida, eliminación o corrupción de datos al navegar, actualizar o restaurar;
- doble venta/doble entrada/salida de caja por fallo, retry o doble toque;
- costo FIFO inventado o reescritura de venta histórica;
- «confirmada» sin transacción local o «transferencia recibida» sin verificación manual;
- imposibilidad de llegar a respaldo/restauración sin solución;
- un control crítico de venta/confirmación inaccesible por teclado, toque o foco.

**Importante (P1):**
- ubicación equivocada o caminos duplicados para escribir el mismo hecho;
- Volver pierde contexto de consulta sin motivo;
- historial indispensable oculto sin entrada localizable;
- microcopy técnico que induzca a confundir saldo real/ganancia/stock;
- controles demasiado pequeños para operación real, barra que tapa teclado.

**Refinamiento (P2):**
- densidad visual, jerarquía de tarjetas, transiciones, iconografía y detalles de tipografía, siempre que no oculten contenido importante.

No usar severidad visual para rebajar una falla de integridad.

## 6. Revisión heurística antes de probar con operador

Un experto puede verificar estructura y predecir ambigüedad, pero **no reemplaza observación de personas reales**. Revisar:
- coherencia entre nombres del negocio y nombre del destino;
- visibilidad de estado, reversibilidad o confirmación, error recuperación;
- acciones canónicas vs enlaces;
- foco/semántica de diálogos y disponibilidad con teclado;
- desempeño razonable offline y almacenamiento;
- coincidencia visual con mockups aprobados;
- respaldo visible sin llenar Inicio.

Etiquetar observaciones como «revisión heurística» y no «el usuario falló T3». Los hallazgos de este paquete de PR #12 siguen **sin tree test realizado**.

## 7. Orden de trabajo y regla de publicación

**Precedencia vigente (25/10/2026):** por decisión explícita del usuario, primero se completan y aprueban **todos los planos de Mora**. Los bloques I–III fueron revisados como paquetes; [23 Auditoría](23_auditoria_coherencia_integral.md), [24 Operaciones](24_contratos_operaciones_y_datos.md) y [25 Pantallas](25_contrato_unificado_pantallas_y_componentes.md) documentan la propuesta final de coherencia y casos. Las Etapas 2–6 de abajo son **posteriores** a la aceptación del plano integral. No requieren ejecutar ni desarrollar la nueva interfaz **para dar por terminado el diseño**; las capturas reales, QA móvil y tests de migración son gates del software construido, no pruebas ya efectuadas ni excusa para programar anticipadamente.



**Etapa 1 — Contrato aprobado:** completar investigación y árbol de tareas; actualizar `10_contrato_navegacion`, `11_contratos_pantallas` y `12_sistema_componentes` con decisiones cerradas.

**Etapa 2 — Base de regresión:** ejecutar pruebas actuales en checkout limpio; generar fixtures de prueba seguros, capturas de pantalla e inventario CSS.

**Etapa 3 — Refactor de shell/navegación:** una PR sin nuevas features, doble entrada removida sólo cuando el destino canónico está disponible. QA técnico y UX.

**Etapa 4 — Modularizar por ámbitos:** Productos/Inventario/Reposición, Caja/Configuración, Ventas/Reportes; comprobar transición con casos UX.

**Etapa 5 — Calidad visual y experiencia:** QA en móvil real, pantallas vacías, error, offline y largas; ajustes hasta aproximarse a referencias.

**Etapa 6 — Funcionalidades nuevas:** transferencia, corrección de ventas, reposición, caja, fiados y otras prioridades en PR independientes; contratos de datos/backup si cambian entidades.

Cada etapa requiere autorización para pasar a implementación y aprobación explícita antes de merge/despliegue, sin reinicio de IndexedDB.

## 8. Evidencia que todavía falta

- **QA de arquitectura con operador:** 12 tareas de árbol, recogida de observaciones reales.
- **Comparación visual real:** capturas lado a lado y matriz de diferencias con las seis referencias visuales guardadas; no basta leer su README. La conexión de GitHub disponible para esta ronda no entregó bytes de los `.webp` binarios, por lo que no se declara que se hayan reexaminado píxel a píxel en esta sesión.
- **Pruebas físicas de accesibilidad:** navegador, VoiceOver/TalkBack, foco, teclado, zoom y contraste de composición final.
- **ISO completa:** la ficha pública no sustituye la compra/lectura de la norma ni permite certificar cumplimiento.

Esto no bloquea completar **planos de primer nivel**, pero sí bloquea declarar **diseño definitivo ya validado** o autorizar un refactor irreversible.
