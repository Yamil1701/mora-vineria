# HANDOFF WORK V2 — Mora Vinería

> **Misión PR #10 (10/10/2026):** PR #6–#9 fusionadas/desplegadas y QA móvil aprobado. [Movimientos y conteos, checkpoints, esquema 4 y backup compatible](arquitectura-v2/10_movimientos.md). Una rama/PR, sin backend, merge ni despliegue automático. Estados anteriores históricos.

> **Nueva misión PR #9 (10/10/2026):** núcleo e interfaz integrados en master, QA móvil aprobado por el usuario. Implementación de [backup JSON y restauración solo en base vacía](arquitectura-v2/09_backup_json.md); sin Supabase, merge ni despliegue automático. Los estados previos siguientes son históricos.

> **Actualización posterior a PR#7 (10/10/2026):** nueva misión autorizada: integrar el diseño de la demo con el núcleo local real, en una única App, sin Supabase ni publicación automática. Ver [auditoría, contratos de integración y QA móvil](arquitectura-v2/08_interfaz_integrada.md). Esta rama preserva la DB existente; las referencias a demo separada describen el estado previo.


> **Etapa local posterior a PR#6 (10/10/2026):** por nueva misión expresa del usuario, este checkout incluye núcleo Dexie/FIFO/efectivo en modo aislado `?mode=local`; ver [implementación, pruebas y límites](arquitectura-v2/07_nucleo_local.md). La ruta normal conserva la demo en memoria. No hay Supabase ni sincronización, y el desarrollo sigue sujeto a PR sin merge/despliegue automático. Los estados históricos siguientes describen el traspaso original.

**Fecha del traspaso:** 9 de octubre de 2026 (etapa V2; verificar la fecha y el HEAD reales antes de operar).  
**Propósito:** transferencia de contexto desde el chat de diseño/implementación a **ChatGPT Work**, para continuar el desarrollo de manera autónoma y controlada. No reemplaza las especificaciones detalladas: es la entrada ordenada a ellas.  
**Estado:** la demo V2 fue publicada para QA; el usuario la revisó y la considera **suficientemente buena para avanzar a funcionalidades reales**, pero **NO aprobada como interfaz definitiva**. Prefiere no seguir generando mockups independientes: avanzar hacia un producto funcional, pulir UI en iteraciones sobre componentes reales.

## 1. Accesos y estado verificado al preparar el traspaso

- **Repo:** https://github.com/Yamil1701/mora-vineria
- **Rama principal:** `master`, ahora contiene una **demo V2** en la raíz; `legacy/v1-final` preserva V1. Existe `feature/mora-v2-app-shell` como antecedente de implementación, pero comprobar contra `master` vigente, no asumir que sigue siendo la rama activa.
- **GitHub Pages:** https://Yamil1701.github.io/mora-vineria/ — reemplazó la visualización de V1 con la demo V2, **con autorización expresa del usuario**. CI de despliegue en `.github/workflows/deploy.yml`; **todo push a `master` ejecuta pruebas/build y puede desplegar**. No pushear código funcional incompleto a `master`.
- **Última PR principal de UI:** #5, fusionada. GitHub Actions informó despliegue satisfactorio. La revisión manual del usuario confirma que vio la nueva demo.
- **Demo actual:** React 19 + Vite 6 + TypeScript + Tailwind 3, `vite-plugin-pwa` / Workbox, tema y componentes propios en `src/ui/`, `src/App.tsx`, módulos demo en `src/app/`; Vite `base: '/mora-vineria/'`. `public/assets/fondo-nocturno-fucsia.webp`.
- **Estado real:** productos y ventas ficticios **solo en memoria**, sin persistencia en IndexedDB ni operaciones reales en Supabase. Los montos y movimientos de pantalla son ejemplos; se reinician al recargar. PWA se compila/instala, pero **no equivale a operación local-first productiva**. Los reportes no calculan costos FIFO. Escáner aún no implementado.
- **Comprobaciones anteriores:** workflows de GitHub pasaron typecheck, Vitest y build; **NO sustituyen QA de dominio, pruebas multi-dispositivo, auditoría de seguridad ni prueba de recuperación**. `package-lock.json` faltaba al cerrar la etapa demo; comprobar y corregir antes de depender de CI reproducible. Actualmente workflows usan `npm install`.
- **Supabase:** todavía no hay contrato/esquema V2 implementado; V1 y cualquier recurso/dato preexistente no están autorizados a borrarse. **No hacer migraciones, crear/modificar recursos remotos, desplegar ni inyectar claves sin autorización específica**. No deducir permisos a partir de la conexión de GitHub.

## 2. Fuentes que Work DEBE leer antes de diseñar o escribir código

En este orden, y contrastando con el repositorio actual:

1. `AGENTS.md` y `docs/README.md`.
2. **Este handoff**.
3. `docs/00_producto_y_experiencia.md` — objetivo y antipatrón V1.
4. `docs/04_descubrimiento_operativo.md` — operación real, distingue hechos/propuestas/pendientes.
5. `docs/07_cierre_relevamiento_16_preguntas.md` — **decisiones expresas más recientes del dominio**.
6. `docs/02_sincronizacion_y_offline.md` — invariantes y escenarios offline.
7. `docs/01_revision_de_reglas.md` — antecedentes/preguntas; **las preguntas ya resueltas quedan subordinadas a #5**.
8. `docs/08_flujos_ux_y_navegacion.md`, `docs/10_sistema_visual_v2.md`, `docs/11_contratos_pantallas_ui.md` — UX funcional, tokens y contratos preliminares.
9. `docs/12_qa_visual_iteracion_02.md`, `docs/13_publicacion_demo_v2.md` — feedback aplicado y límites de la demo.
10. `docs/05_ejemplo_lista_proveedor.md`, `docs/06_lector_de_codigos.md` — fixtures e hipótesis.
11. Referencias visuales **oficiales**: `docs/diseno/mockups-aprobados-v2/{inicio,ventas,cobro,productos,reportes}.webp`; leer su README. **Complementarias:** `docs/diseno/prototipos-v2/caja-cuentas.webp` (aprobada visualmente) y `carrito.webp` (válida para prototipar, NO aprobada como final), con README propio. Fondo: `docs/diseno/fondo/fondo-nocturno-fucsia.webp`.

**Jerarquía ante contradicciones:** nuevo requerimiento explícito del usuario > decisión de negocio expresamente aprobada > documentación de descubrimiento > contratos técnicos propuestos > mockup/fotos ilustrativas > ideas antiguas de V1. Los números, marcas, fotos y mensajes “Sincronizado” de mockups no prueban operaciones o datos reales. Hay documentos históricos con frases como “no hay scaffold Vite”, “faltan pantallas” o “sin backend”; son estados **anteriores a la demo o propios de V1**, no la verdad actual de V2.

## 3. Filosofía de producto y experiencia

- Local de bebidas/vinería pequeño atendido desde ventanilla; a menudo de noche y con cansancio. La prioridad es vender en segundos, consultar precio/stock sin fricción y registrar después de una venta física si fue necesario.
- **Mobile-first nocturno**: carbón/negro, acento fucsia `#FF0A89`, bordes de vidrio luminoso discretos, sombras y blur moderados, fondo fijo ambiental, jerarquía de texto primaria/secundaria/terciaria muy distinguible. Legible y rápido en teléfonos modestos; controles táctiles >=44 px, teclado y safe areas.
- **Cuatro destinos inferiores, exactamente:** Inicio / Ventas / Productos / Reportes. Caja, movimientos, fiados, pedido al proveedor, historial, administración de dispositivos y ajustes son accesos contextuales; **no añadir “Más” como quinta pestaña**.
- Inicio: **Ventas de hoy, ganancia estimada, qué reponer**; luego acciones rápidas. No mezclar venta, ganancia, cobranza, saldo y capital.
- Venta: favoritos, búsqueda, categorías simples (ocultar chips al desplazarse), productos con presentación compacta/fotos verificadas si existen, filtros/ordenación, historial, barra con **total + Cobrar directo**; carrito opcional para editar cantidades, **nunca paso obligatorio**.
- Cobro: jerarquía muy visual (importe destacado, métodos Efectivo / Transferencia / Mixto / Fiado); transferencia se confirma solo si operador verificó acreditación bancaria real por fuera de la app. Elegir cuenta Brubank / Mercado Pago / Naranja X solo cuando corresponda. Evitar interfaces planas, demasiado texto y estados ficticios de sincronización.
- Productos: búsqueda + filtro lateral; Agregar producto, posible acceso Escanear claramente **no funcional** hasta ser implementado; fichas y listas refinadas, no cajas genéricas con iniciales; no inventar fotos de SKU. Reportes con tarjetas de ventas/ganancia y gráficos solo cuando hay datos verificables.
- **Feedback QA:** el usuario probó la segunda demo y dijo “está bastante mejor, hay muchas cosas que no me gustan, pero entiendo que es una demo y va a ir mejorando”. Esto **NO equivale a aprobación visual final**. No seguir con una secuencia indefinida de mockups; refinar mientras se hacen componentes funcionales.
- Interfaz en **español sencillo**, por ejemplo “Resumen de hoy”, “Ventas de hoy”, “Movimientos de hoy”; evitar “día operativo”, jerga contable y pantallas corporativas recargadas.

## 4. Reglas de negocio confirmadas (no rediscutir sin conflicto nuevo)

### Venta y jornada
- **Jornada de venta 08:00–07:59**: guardar instante real de registro y la fecha de jornada derivada. Una carga realizada a las 03:00 pertenece a la jornada anterior. Si se anotó tarde una venta física, usar **hora de carga**, no adivinar la hora de venta.
- Unidades sueltas, uno o múltiples productos por venta. Importes en ARS **sin centavos** en la UI; manejar enteros y totales exactos.
- Pagos: efectivo (opcional indicar recibido y calcular vuelto), transferencia (confirmación humana explícita), mixto y fiado.
- **Fiados:** cliente/nombre y deuda, sin vencimientos ni límites automáticos; abonos parciales posibles. Venta fiada NO significa efectivo acreditado; abono NO crea venta nueva.
- Corregir ventas desde la UI preservando rastro de auditoría y **efectos compensatorios** en stock, dinero, deuda y costo asignado. No borrar movimientos originales ni permitir duplicados; devoluciones comerciales/reintegros no son un caso usual.
- Permitir vender si existe físicamente el producto aunque stock registrado indique cero/insuficiente. **Conservar todas las ventas físicas**, marcar discrepancia y requerir recuento/revisión; no fabricar stock para “arreglar” la diferencia.

### Catálogo, costos, compras y stock
- Categorías simples y reducidas. Para productos con historial, desactivar en vez de borrarlos definitivamente.
- Stock objetivo **por producto**, definido inicialmente a mano para cubrir semana + margen; alertas proporcionales, **sin número mínimo fijo global**. No tratar porcentajes de notas viejas (10%, 20%, 30%) como umbral universal confirmado: llevar propuesta revisable al contrato.
- Precios sugeridos: **costo de compra + 50 %**, redondeando **hacia arriba al siguiente múltiplo de $500**, permitiendo edición humana. No cambiar automáticamente precios existentes al importar un nuevo costo.
- **FIFO aprobado como costeo principal**: cada recepción genera lote con cantidad y costo unitario reales; ventas asignan costo de lotes más antiguos y preservan distribución lote-unidades-costo por detalle. Precio histórico cobrado y costo histórico usados para ganancia bruta. Costo promedio ponderado solo indicador secundario.
- Si faltan costos, lotes válidos, o hay ventas offline concurrentes, **no inventar costo ni margen confirmado**: estado provisional / no calculable y conciliación. El FIFO es orden **contable**, no prueba de qué botella se entregó físicamente.
- Mercadería se compra a proveedor aproximadamente semanalmente; pedido suele ser WhatsApp desordenado. Guardar por producto presentación de compra (fardo/cajón x4/x6/x8/x12, etc.) pero stock y venta son **unidades individuales**. Pedido pendiente NO cambia stock ni caja; recepción/pago confirmado aumenta stock y crea lote costo real. Permitir faltantes, recepciones parciales, defectos/reemplazos sin duplicar gastos. También existen compras de emergencia más caras.
- Pérdida por rotura/merma/consumo propio no vendido se registra adecuadamente a costo y con rastro; no confundir con venta ni aporte. Conteos de stock habitualmente parciales e informales.

### Caja, cuentas e informes
- Efectivo y Brubank (cuenta comercial principal). Mercado Pago/Naranja X personales usadas a veces: registrar **solo movimientos atribuibles al negocio**, no mostrar todo el saldo personal como dinero del local.
- Caja/cuentas: **esperado** derivado de operaciones frente a **real contado/introducido manualmente con fecha**; diferencia solo cuando hay conteo. Nunca afirmar “real” inferido de ventas.
- Compras de inventario, aportes externos, retiros, ahorro que sale del negocio y gastos puntuales son operaciones distintas. Transferencias entre cuentas propias **no** crean ingreso nuevo. Comprar mercadería **no es doble deducción del margen**. Aportes/retiros guardan importe, instante, motivo, dispositivo de origen.
- Inicio e informes distinguen ventas brutas, cobros, deuda pendiente, ganancia bruta FIFO, otras pérdidas/gastos y saldo disponible. Reportes simples para comparar jornadas/semanas/meses y orientar reposición; PDF mensual de V1 y su backup JSON fueron poco usados y **no son prioridad inmediata**, pero recuperación robusta **sí es requisito**.

### Multi-dispositivo
- Aproximadamente **3–4 teléfonos** operando el mismo negocio con **los mismos permisos funcionales**. Cualquier dispositivo ya autorizado debe poder habilitar a otro **mediante procedimiento seguro**. Diseñar también revocación, caducidad, pérdida del dispositivo y recuperación. Identidad de dispositivo no demuestra identidad de persona si se comparte.
- **Supabase/Postgres es la fuente de verdad compartida** (decisión explícita V2, no aplicar prohibición de backend de V1). Cliente PWA con caché/outbox durable en IndexedDB/Dexie, experiencia local-first. Los cambios se replican entre autorizados al volver conexión.
- Registrar operación local de forma atómica antes de presentar “guardada”, mantener ID idempotente estable para reintentos; servidor valida/aplica **una sola vez** dentro de transacción, RLS y auditoría. Realtime sirve para avisar y disparar pull incremental, no como única garantía. El cliente diferencia guardado local, pendiente, confirmado por servidor, conflicto, revisión y error. Dos móviles offline no deben crear doble venta al reintentar ni descartar ventas físicas; conciliación puede dejar stock negativo/revisión y FIFO pendiente.
- **Sincronización NO es backup**. Diseñar recuperación de negocio independiente, restauración verificada y pruebas de pérdida de dispositivo.
- **Nuevo inicio de datos vacío** para V2: no importar automáticamente catálogo, stock, ventas ni deudas de V1. **No borrar recursos de V1 ni datos del navegador** bajo la excusa de empezar desde cero; aislar claramente entornos y almacenamiento.

## 5. Qué está diseñado, qué no está implementado

| Área | Estado al handoff |
| --- | --- |
| Dirección visual | Cinco imágenes oficiales + Caja; fondo y UI Kit; aceptados como guía, refinamiento pendiente |
| UI móvil demo | Compilada y publicada; Inicio, Nueva venta, Favoritos, Productos, Carrito opcional, Cobro simulado, Reportes visuales e historial demo |
| PWA | Vite/PWA configurada; caché de assets, aviso de actualización manual; probar instalación en teléfonos |
| Persistencia local de negocio | **No implementada**; demo únicamente memoria React |
| Supabase V2/Auth/RLS | **No implementados ni autorizados a cambiar remotamente** |
| Lotes FIFO/corrección ventas/fiados reales | **No implementados** |
| Caja/orden proveedor/reportes operativos | Requisitos y mockups, no funciones reales |
| Fotos reales/lector cámara | Pendiente de verificación/estudio |
| Recuperación de datos independiente | Diseñar y ensayar; no confundir con sync |
| Automatización de pruebas | Tests y CI básicos de UI; falta cobertura sustancial, lockfile y E2E móvil |

## 6. PRIMERA MISIÓN PARA WORK: arquitectura verificable (sin desplegar ni mutar datos)

**Objetivo:** producir un contrato técnico implementable, revisado contra documentos, que permita comenzar la primera vertical real sin reescribir UI ni comprometer stock/dinero.

1. Inspeccionar repositorio y estados de `master`, workflows, dependencias, módulos demo y documentación; registrar hallazgos y inconsistencias **sin confiar ciegamente en este handoff**.
2. Crear una **rama propia** desde `master`, por ejemplo `work/v2-dominio-arquitectura`. No trabajar directamente en `master`; recordar que pushear a `master` despliega Pages.
3. Especificar modelo de dominio, claves/relaciones, fechas reales/jornada, importes, lotes FIFO, reposiciones, movimientos, pagos, fiados, auditoría y estructura de revisiones/conflictos. Separar **comandos** de **proyecciones**; distinguir invariantes fuertes y estados de revisión.
4. Diseñar arquitectura local IndexedDB/Dexie y cola outbox transaccional; idempotencia de comando y resultado en Postgres; confirmación/reconciliación, multi-dispositivo, sincronización incremental, PWA/caché, esquema de snapshots/deltas y migraciones. Incluir diagramas textuales y contratos API/RPC **solo como diseño**, sin crear proyecto Supabase.
5. Diseñar autorización sin secretos en cliente, RLS mínima, invitación por cualquier teléfono habilitado, revocación/recuperación y política de acceso offline revocado. Documentar amenazas y controles; considerar robo de dispositivo, colisión de secuencia, retraso de reloj, fallo tras commit servidor antes del acuse.
6. Preparar especificación de FIFO offline/online con ejemplos reproducibles: dos clientes sobrevendiendo, lote agotado, faltante con costo desconocido, corrección posterior, reposición parcial, dos pagos parciales concurrentes, intento de reenviar 100 veces la misma venta.
7. Escribir **matriz de pruebas y criterios de aceptación medibles**, incluyendo jornada 07:59/08:00, ARS enteros, vuelta de efectivo, fiado, transferencia manual, reemplazo sin doble costo, pérdidas, contabilidad de caja, pantalla sin conexión, doble click/reintento, backup/restauración, seguridad.
8. Recomendar la **primera entrega vertical mínima** posterior (por ejemplo productos + recepción de lotes + una venta con costo y outbox), con checkpoints y riesgos. Corregir incoherencias documentales si están suficientemente justificadas; no borrar decisiones anteriores. Considerar crear lockfile con CI reproducible **solo como cambio separado y probado**, sin tocar el deploy.
9. Abrir **PR documental/técnica** para revisión (no fusionar ni desplegar automáticamente). Entregar resumen: decisiones que aplicó, archivos tocados, pruebas ejecutadas, puntos pendientes y **solo las preguntas verdaderamente bloqueantes**. Seguir ejecutando tareas no bloqueadas.

### Aprobación que Work DEBE esperar

No hay autorización en este handoff para:
- crear/modificar/borrar proyectos, esquemas, políticas RLS o datos de Supabase;
- importar/restaurar/eliminar datos históricos;
- configurar secretos, credenciales, dominios, servicios o pagos externos;
- fusionar PRs, cambiar `master` o publicar nueva versión;
- representar la demo como herramienta apta para facturar/vender realmente.

**Sí está autorizado:** inspeccionar código/documentos, diseñar contratos, crear rama, crear documentos y tests locales sin acciones remotas de negocio, ejecutar pruebas, abrir PR, proponer siguientes etapas.

## 7. Política de trabajo posterior

- Implementar **verticales pequeñas completas** (datos persistidos, operaciones correctas, UI, estados de red, migraciones y pruebas), no pantallas bonitas sin funcionalidad ni un ERP desproporcionado.
- Antes de cambios importantes, plan breve. Después: resumen del cambio, archivos, pruebas, riesgos, y URL de PR. Mantener tareas y decisiones pendientes visibles en GitHub.
- Validar en móviles reales 360/390/430 px; cuidar foco, teclado, scroll y bajo rendimiento. El usuario no quiere rediscutir la identidad ni generar mockups repetidos.
- Para operaciones críticas, priorizar corrección, auditoría, idempotencia, recuperación y seguridad por encima de conveniencia de implementación.
- Si una decisión cambió respecto a este archivo, registrar explícitamente nueva fecha, fuente y alcance. No atribuir al usuario una propuesta técnica no aprobada.

## 8. Texto inicial sugerido para Work

```text
Continuá Mora Vinería 2.0 desde el repositorio GitHub Yamil1701/mora-vineria.

Leé primero AGENTS.md y docs/HANDOFF_WORK_V2.md en master, seguí las fuentes vinculadas y revisá el código y la demo actual. Las decisiones expresas y los documentos del handoff prevalecen sobre sugerencias viejas del MVP V1.

Tu primera misión es la sección “PRIMERA MISIÓN PARA WORK” de docs/HANDOFF_WORK_V2.md: auditar el estado real, diseñar el modelo de datos, contratos de negocio, FIFO, seguridad/RLS, Dexie/outbox y conciliación offline de operaciones, escribir escenarios de pruebas y preparar la primera vertical implementable. Trabajá en una rama nueva y abrí una PR para revisar; NO hagas merge ni despliegues, NO toques Supabase ni datos existentes sin mi autorización específica.

No generes más mockups ni refactorices la UI por estética ahora. Conservá la demo pública y la V1 histórica. Avanzá de forma autónoma en todo lo no bloqueante. Al terminar, entregame resumen de archivos, comprobaciones, decisiones pendientes, riesgos y link a la PR.
```
