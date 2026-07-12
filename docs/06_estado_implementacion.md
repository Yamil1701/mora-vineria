# Estado de implementación

Baseline estable: `639c7ee`, tag `v0.1.1`, 12 de julio de 2026.

Versión estable: `v0.1.1`. `v0.2.0` se encuentra en preparación.

Este documento debe actualizarse al cerrar cada capa. No reemplaza los requerimientos.

## Base técnica

| Elemento | Estado | Nota |
| --- | --- | --- |
| App en raíz | Implementado | Sin carpeta `frontend/` |
| Vite base `/mora-vineria/` | Implementado | Compatible con Pages |
| PWA y offline | Implementado | Manifest, SW y actualización |
| Identidad PWA | Implementado | SVG maestro, PNG normal/maskable, favicon y Apple Touch Icon |
| IndexedDB + Dexie v1 | Implementado | Nueve tablas |
| GitHub Actions Pages | Implementado | Ejecuta verificación y auditoría antes de publicar |
| Backup JSON | Implementado | Corrección de última modificación en esta reorganización |
| CSV y PDF local | Implementado | Auxiliar e imprimible |
| Supabase | Base remota aplicada | Migraciones `sync_foundation` y endurecimiento verificadas |
| Dexie v2 | Base preparada | Agrega cola, vínculo, cursor y conflictos sin tocar datos operativos |

## Funcionalidad

| Área | Estado | Pendiente vigente |
| --- | --- | --- |
| Productos y categorías | Implementado | Vistas cards y compacta diferenciadas |
| Stock por porcentaje | Implementado | Edición manual advierte que no genera historial |
| Ventas y anulación | Implementado | Confirmación Radix con resumen completo |
| Movimientos y anulación | Implementado | Eliminación segura y definitiva de anulados |
| Modo principal/consulta | Implementado | Interfaz unificada como modo del dispositivo |
| Inicio | Implementado | Jornada breve y prioridad para stock bajo |
| Reportes | Implementado | Selector y gráficos de productos/medios de pago |
| Proyecciones y meta | Implementado | Gráficos planificados |
| Restauración | Implementado | Mantener pruebas de compatibilidad |

## Diseño y UX

| Elemento | Estado | Nota |
| --- | --- | --- |
| Paleta y fondo oscuro | Implementado | Brillo nocturno reducido |
| Barra inferior con acción central | Implementado | Inicio, Ventas, Nueva venta, Productos y Más; cuatro accesos en consulta |
| Componentes base UI | Implementado | Adopción todavía gradual |
| Toast Radix | Implementado | Arriba y sin cierre visible |
| Confirmación Radix | Implementado | Reemplaza confirmaciones nativas sensibles |
| Arquitectura de tareas | Implementado | Listados, detalles y formularios separados |
| Navegación enfocada y regreso | Implementado | La barra general se oculta en tareas secundarias |
| Thumb-friendly | Implementado | CTA inferior, safe areas y objetivos de 48 px |
| Estados de carga/vacío/error | Implementado | Fallbacks diferidos, skeletons contextuales y recuperación global |
| Animaciones y reduced motion | Implementado | Rutas, toast, diálogos, sheets, carga y destacado; movimiento reducible |
| Vista compacta de productos | Implementado | Preferencia temporal con Zustand |
| Sheets contextuales | Implementado | Detalles conservan el listado de fondo; carrito y cobro usan bottom sheet |
| Gestos de sheets | Implementado | Cierre por arrastre hacia abajo o toque exterior; sin controles redundantes |
| Cobro asistido | Implementado | Vuelto en efectivo y destino persistido para transferencias |
| Gráficos Recharts | Implementado | Carga diferida en reportes |
| Splash y precarga inicial | Implementado | Logo animado, spinner y snapshot transitorio de datos esenciales |

## Tecnologías planificadas

| Tecnología | Estado | Uso esperado |
| --- | --- | --- |
| React Hook Form | Planificado | No fue necesario para reorganizar los formularios actuales |
| Zustand | Implementado | Vista de productos; disponible para estado temporal compartido |
| Recharts | Implementado | Visualizaciones mensuales de reportes |
| Radix Alert Dialog | Implementado | Confirmaciones sensibles |
| Supabase JS | Implementado parcialmente | Activación y dispositivos listos; motor de datos pendiente |
| QR Code + ZXing | Implementado | Generación SVG y cámara diferida con alternativa manual |

## Sincronización `v0.2.0`

| Elemento | Estado | Nota |
| --- | --- | --- |
| Decisión arquitectónica | Implementado | ADR 0006 |
| Sesión anónima por dispositivo | Implementado | Se crea solo al activar, vincular o recuperar |
| Dispositivo principal único | Implementado | Restricción remota, estado local e interfaz de administración |
| Emparejamiento y revocación | Implementado, pendiente de prueba real | QR temporal, ingreso manual, lista, revocación y transferencia |
| Recuperación de principal | Implementado, pendiente de prueba real | Rotación, copia y descarga del nuevo código |
| Cola local y conflictos | Base preparada | Tablas Dexie v2 sin conectar todavía a operaciones |
| Productos, ventas y movimientos remotos | Pendiente | Próxima frontera, luego de validar seguridad |
| Motor push/pull/Realtime | Pendiente | No se activa en esta capa |

## Calidad

En el baseline auditado:

- 12 archivos de tests y 48 pruebas aprobadas;
- build de producción correcto;
- 0 vulnerabilidades de producción;
- advertencia por bundle JS mayor a 500 kB;
- ESLint configurado pero sin script;
- CI publicaba sin ejecutar tests.

Después de la reorganización local:

- ESLint forma parte de `npm run verify`;
- 12 archivos y 59 pruebas aprobadas;
- build y PWA correctos;
- 0 vulnerabilidades de producción;
- el workflow ejecuta verify y audit antes de publicar;
- se conserva la advertencia de bundle mayor a 500 kB.

Después de la reorganización de experiencia:

- navegación y pantallas se cargan por rutas diferidas;
- el bundle inicial bajó respecto de la pantalla única, aunque conserva una advertencia apenas superior a 500 kB;
- el borrador de venta persiste localmente y se revalida al confirmar;
- quedó preparada la validación manual en dispositivos principal y consulta.

Después de la consolidación UX móvil:

- se corrige el contorno inicial sin perder gestión accesible del foco;
- Nueva venta forma parte de la navegación y el carrito deja de competir con la búsqueda;
- filtros booleanos visibles usan chips en ventas, productos, movimientos y categorías;
- categorías tiene listado y detalle contextual;
- `destinoTransferencia` es opcional y compatible con respaldos v1 e históricos de Mercado Pago.

Después de la capa de resiliencia y feedback:

- la carga inicial solo aparece si preparar los datos supera 250 ms;
- rutas diferidas, listados, detalles, reportes y proyecciones tienen fallbacks sin parpadeo;
- un error boundary ofrece reintento sin presentar una pantalla vacía;
- los formularios de producto y movimiento advierten al salir solo si fueron modificados;
- Más recuerda el primer respaldo o uno con más de siete días;
- 13 archivos y 66 pruebas aprobadas, con build y PWA correctos.

Después de la capa final de continuidad:

- Atrás, gestos, navegación interna y recarga protegen cambios sin guardar;
- Productos, Movimientos y Categorías muestran errores junto al campo y evitan doble envío;
- los estados recuperables principales ofrecen reintento;
- los primeros usos orientan a crear productos, ventas o importar una copia;
- Respaldos muestra fecha y hora de la última copia y permite reintentar;
- la edición de productos detecta cambios externos antes de sobrescribirlos.

Después de la capa de identidad y arranque:

- el icono temporal se reemplaza por la marca `M + gota + copa`;
- la PWA dispone de iconos normales, maskable, favicon y Apple Touch Icon;
- el splash acompaña la inicialización y precarga datos esenciales antes de revelar Inicio;
- Inicio, Configuración y PDF incorporan branding moderado;
- el spinner reutilizable cubre arranque y operaciones sin estructura de contenido;
- 14 archivos de tests y 69 pruebas aprobadas.

Después del hotfix de guardado seguro:

- Productos, Movimientos y Categorías bloquean sincrónicamente envíos repetidos;
- la navegación posterior a un guardado exitoso omite la advertencia de cambios sin guardar;
- una prueba de regresión cubre el doble envío y la salida legítima del formulario de producto.

Después de la base de sincronización:

- Supabase queda preparado con negocio, dispositivos, emparejamiento, recuperación y auditoría;
- `anon` no tiene acceso directo a tablas ni RPC y `authenticated` conserva solo los permisos explícitos;
- las funciones auxiliares de RLS viven fuera del esquema público;
- Dexie v2 agrega vínculo, cola, cursor y conflictos sin modificar los datos operativos existentes;
- los tipos TypeScript se generan desde el esquema remoto definitivo;
- 16 archivos de tests y 75 pruebas aprobadas, con build y PWA correctos.

Después de la interfaz de vinculación:

- Configuración incorpora activación, emparejamiento, recuperación y administración de celulares;
- el QR contiene solo el código efímero, vence a los cinco minutos y mantiene ingreso manual;
- cada celular elige un nombre auditable y recibe modo Operación o Consulta desde el principal;
- el código de recuperación se presenta una sola vez y puede copiarse o descargarse;
- el modo local queda subordinado al vínculo remoto cuando la sincronización está activa;
- falta validar el recorrido completo con dos celulares reales antes de conectar datos operativos.

## Cierre de `v0.1.x`

- validación manual móvil reportada como aprobada;
- `npm run verify` aprobado sobre el baseline final;
- 15 archivos de tests y 70 pruebas aprobadas;
- build y generación PWA correctos;
- 0 vulnerabilidades de producción en `npm audit --omit=dev`;
- `v0.1.0` cerró el MVP y `v0.1.1` incorporó el hotfix de guardado seguro.

## Fuera de alcance

Login de personas, roles de empleados, facturación, ERP, stock avanzado, múltiples sucursales, app nativa e integraciones externas permanecen fuera del alcance. El backend y la sincronización dejan de estar descartados a partir de `v0.2.0`.

Fotos de productos, gráficos de proyección y tutorial guiado permanecen separados de la sincronización de `v0.2.0`.
