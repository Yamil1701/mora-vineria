# 04 — Arquitectura de interfaz y guardarraíles para construir los planos

**Propuesta técnica, no refactor autorizado.** La arquitectura actual queda intacta hasta probar y aprobar la sustitución por etapas. **No backend** ni nuevas dependencias salvo justificación específica posterior.

**Decisión de navegación del usuario (ADR 17):** cuatro destinos principales visualmente dispuestos como **Inicio · Ventas · + Nueva venta · Productos · Reportes**. + es la única acción central, no una quinta pestaña; Ventas es historial/gestión y no sinónimo de selector.

## 1. El problema actual, comprobado

En master después de PR #11:
- src/App.tsx concentra destinos, selección de ventas, etapas de cobro, administración de productos, apertura de modales, estado de movimientos, confirmaciones, reportes y backup.
- src/app/app.css suma estilos iniciales, overrides de integración, ajustes de contraste/responsividad y los últimos añadidos de Movimientos/refoco. La acumulación dificulta predecir qué selector manda.
- src/app/Movements.tsx mezcla historial de efectivo y mercadería con flujos que pertenecen a ámbitos distintos; los dos campos de dinero y conteo ya tienen dueño de dominio, pero no dueño de pantalla.
- Los servicios en src/local/ y las reglas de src/domain/ contienen garantías importantes de transaccionalidad/FIFO/backups. **No se reescriben porque la interfaz está desordenada**.
- Algunos README/handoffs presentan etapas antiguas como presentes. Necesitan una referencia clara de vigencia.

## 2. Capas y dependencias permitidas

~~~mermaid
flowchart TB
 UI["Pantallas por áreas: Inicio · Ventas · Productos · Reportes · Caja · Ajustes"]
 NAV["Shell + navegación + diálogos + feedback"]
 VIEW["Adaptadores de consulta / proyecciones"]
 USE["Acciones de aplicación y recuperación"]
 DOM["Reglas y tipos de dominio"]
 DB["LocalService + Dexie + IndexedDB"]
 BAK["Backup/restore JSON"]
 PWA["Vite/PWA/Workbox (sólo shell y actualización)"]

 UI --> NAV
 UI --> VIEW
 UI --> USE
 VIEW --> DOM
 VIEW --> DB
 USE --> DOM
 USE --> DB
 BAK --> DB
 PWA -. "caché app, no operaciones" .-> UI
~~~

**Fronteras:**
1. React presenta registros reales y dispara intenciones; no calcula impactos financieros por su cuenta ni reimplementa FIFO.
2. Adaptador de aplicación deriva un «view model» estable desde snapshot/proyecciones; servicio maneja escrituras atómicas, IDs, deduplicación y recuperación.
3. Una operación canónica puede alimentar más de una proyección de lectura; no significa dos escrituras.
4. Backup/restauración accede al estado completo, valida y opera con su propia garantía atómica. No se transforma en sincronización por archivo.
5. UI nunca atribuye confirmación bancaria automática, stock físico contado, ganancia cierta o servidor sincronizado sin evidencia.

## 3. Estructura orientativa de carpetas — reorganización, no obligación literal

~~~text
src/
  app/
    App.tsx                 # composición raíz, sin pantallas enteras
    navigation/             # 4 destinos + acción central de Nueva venta, subrutas, volver
    shell/                  # fondo, tab bar, avisos transversales
    state/                  # adaptadores/hooks de lectura y escritura
  features/
    home/                   # vista de lectura y enlaces
    sales/                  # selector, carrito, cobro, historial, fiados
    products/               # catálogo, fichas, categoría
    inventory/              # conteos, historial stock, revisiones
    replenishment/          # pedido, recepción, packs
    cash/                   # caja, cuentas, gastos/aportes/retiros
    reports/                # consultas por período
    settings/               # backup, restauración, estado datos
  shared/
    ui/                     # botones, inputs, tarjetas, navegación secund.
    formatting/             # ARS, cantidades, textos de estados
    accessibility/
  domain/                   # conservar contratos y reglas
  local/                    # conservar transacciones, Dexie, backup
~~~

No añadir gestor de estado, enrutador, componente de formularios o framework UI solo para «seguir una arquitectura». Demostrar primero por qué el React existente y la navegación modelada no bastan. Con GitHub Pages y base /mora-vineria/, definir rutas/deep links antes de adoptar URLs de navegador; los IDs de pantallas de 02_catalogo_pantallas.md no son rutas HTTP.

## 4. Contrato universal de pantallas

Cada screen recibe:
- ID/área padre (propietario funcional);
- datos proyectados y estados reales;
- un objetivo/acción principal;
- callbacks de navegación/acciones, sin introducir query mutante en componentes visuales;
- entradas de contexto (producto, venta, período, filtro);
- acción Volver predecible y preservación de borradores;
- estados vacío, carga, error, offline, preparado, guardado, pendiente/revisión;
- accesibilidad semántica, teclado, foco, gestión de diálogo y zonas seguras.

**Una pantalla con más de un objetivo principal probablemente está mal delimitada.** Más de una acción puede ser legítima si pertenecen al mismo flujo y se jerarquizan correctamente.

## 5. Sistema visual: preservar identidad, eliminar improvisación

Fuentes vigentes: cinco mockups de docs/diseno/mockups-aprobados-v2, su README, docs/10_sistema_visual_v2.md y referencia complementaria caja-cuentas.webp. No imponer un estilo completamente nuevo ni copiar ilustraciones generadas como si fueran fotos reales.

Familias de componentes a mantener o normalizar:
- **Estructura**: AppShell, BottomNav, pantalla secundaria con back, header, sección, loading/empty/error.
- **Acciones**: primaria, secundaria, discreta, destructiva con confirmación; no varios botones principales compitiendo.
- **Campos**: texto, importe ARS entero, cantidad, categoría, selector producto, cuenta, nota, validación cercana al campo.
- **Catálogo**: fila compacta, favorito, arte correcto o ilustración abstracta, precio y estado de stock.
- **Venta**: carrito persistente, quantity stepper, total fijo seguro, método de pago y confirmación.
- **Datos**: importe con cifras tabulares, línea de historial, comparación esperado/real, métrica, alerta y gráfico útil.
- **Operación durable**: bloque de «reintentar mismo registro» y «cerrar confirmación», nunca un segundo comando improvisado.
- **Soporte**: dialog nativo accesible, aviso temporal, mensaje persistente accionable, estado de backup.

**Tokens:** una fuente de verdad de colores/espacios/radios/tipografía/estados, sin mezcla de cientos de valores de CSS independientes. Fondo carbón fijo y rosa fucsia #FF0A89 para selección/acento; texto oscuro sobre CTA fucsia cuando el contraste lo requiera. Evitar gradientes superpuestos en cada tarjeta, vidrio anidado, insignias decorativas, texto ≤11 px para información crítica y iconos diferentes para una misma acción.

Usar listas y separadores para información repetitiva, tarjetas cuando haya agrupación real. Un desplegable es válido para detalles **secundarios**, no para ocultar información imprescindible para tomar la decisión. Referencia: https://design-system.service.gov.uk/components/details/.

## 6. Accesibilidad verificable

- Evaluar WCAG 2.2 AA como referencia de calidad, no declarar conformidad sin auditoría. https://www.w3.org/TR/WCAG22/
- Contraste texto regular al menos 4.5:1 en pares relevantes; los colores sobre fondo translúcido se miden renderizados. https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- Objetivos táctiles de acciones principales recomendados >=44–48 px como decisión de producto; WCAG 2.2 AA SC 2.5.8 fija 24×24 CSS px con excepciones, **no** 44 obligatorio. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Foco visible, orden de tabulación y componente enfocado no oculto por sticky cart/footer, teclado o diálogos. https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum
- Inputs numéricos y etiquetas en español entendibles, sin confiar sólo en placeholder; errores ubicados, texto que explica cómo recuperar.
- Diálogos nativos con cierre, foco inicial/restauración. No perder escritura sellada por pulsar fuera o navegar accidentalmente.
- Probar iOS/Safari/Android/Chromium en 360, 390 y 430 CSS px, teclado abierto, zoom 200 %, safe area y landscape cuando sea relevante.
- Animación no esencial, transparencia reducida, rendimiento en equipos modestos.

## 7. Reglas de contenido y jerarquía

- Etiquetas centradas en la tarea: «Nueva venta», «Para reponer», «Contar stock», «Registrar gasto», «Descargar respaldo», «Dinero esperado», «Dinero contado».
- «Resumen de hoy», «Ventas de hoy», «Movimientos de hoy» sólo donde el contexto lo amerite.
- Nunca «día operativo» en interfaz. La jornada 08:00–07:59 es regla interna que puede explicarse en ayuda contextual si hay duda con la madrugada.
- No mostrar UUID, denominador de costo racional, contratos, secuencias, identificadores de journal por defecto; diagnósticos técnicos bajo «Información del registro» o exportación, sin perder trazabilidad.
- No confundir **stock registrado** con stock físico verificado; **ganancia bruta** con recaudación/caja; **saldo esperado** con contado; **archivo exportado** con sincronización.
- Estados locales: guardada en este equipo, preparada para reintentar, necesita revisión, sin red. No «todo sincronizado».

## 8. Datos: invariantes a proteger durante refactor

1. Nunca eliminar o reescribir la base del navegador para cambiar UI.
2. Mismas IDs y timestamps en journal; mismo costeo FIFO por lotes y cobertura desconocida.
3. Proteger histórico al desactivar producto y al corregir venta (futuro).
4. Compra física: stock+ y salida de caja en el mismo comando, no doble gasto; pedido no afecta ningún ledger.
5. Gastos/aportes y conteos: misma semántica que PR #10, sin relanzar operaciones al mover su acceso a otro módulo.
6. Backup formato 2 de esquema Dexie 4, importación válida del formato 1 y recuperación de confirmaciones pendientes. No cambiar contrato con un refactor visual.
7. Jornada interna por Salta, fecha real y fecha derivada; corte a las 08:00.
8. Operación guardada durable, errores y doble toque seguros.
9. Nada de acceso multi-equipo, servidor, autenticación remota o sincronización implícita en el MVP.
10. Un nuevo patrón visual debe integrarse con los tipos/servicios existentes, no mantener una segunda fuente de datos.

## 9. Calidad exigida por paso

**Antes de implementar:** dueño único, flujo completo y excepciones, estado real/futuro, diferencia visual respecto a referencias, riesgos de datos, cambio registrado en plano.

**Durante:** refactor con slices verticales pequeñas (una pantalla + adaptador + tests), no megapull request que cambie navegación, datos, backend y estilos a la vez. Pestañas inmutables. No publicar ramas incompletas.

**Después de cada corte:** TypeScript, Vitest, arquitectura, Playwright móvil, PWA offline y backup; pruebas de snapshots con datos propios, borrador y writeIntent pendientes; contraste, scroll y uso con una mano. QA visual honesto separado de CI verde.

**Condición de salida global:** el usuario puede completar las tareas del negocio y encontrarlas donde intuitivamente espera, sin tener que recorrer Inicio para acceder a una acción «perdida». El sistema no presenta operaciones disponibles que en realidad sólo son botones de demo.
