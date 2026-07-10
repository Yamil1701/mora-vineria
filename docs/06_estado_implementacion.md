# Estado de implementación

Baseline auditado originalmente: `f4d77515b12d3d2e7197d0fc215ea4dcef356b1f`, rama `master`, 10 de julio de 2026.

Este documento debe actualizarse al cerrar cada capa. No reemplaza los requerimientos.

## Base técnica

| Elemento | Estado | Nota |
| --- | --- | --- |
| App en raíz | Implementado | Sin carpeta `frontend/` |
| Vite base `/mora-vineria/` | Implementado | Compatible con Pages |
| PWA y offline | Implementado | Manifest, SW y actualización |
| IndexedDB + Dexie v1 | Implementado | Nueve tablas |
| GitHub Actions Pages | Implementado | Requiere reforzar verificaciones |
| Backup JSON | Implementado | Corrección de última modificación en esta reorganización |
| CSV y PDF local | Implementado | Auxiliar e imprimible |

## Funcionalidad

| Área | Estado | Pendiente vigente |
| --- | --- | --- |
| Productos y categorías | Implementado | Vistas cards y compacta |
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
| Barra inferior de cuatro accesos | Implementado | Inicio, Ventas, Productos y Más |
| Componentes base UI | Implementado | Adopción todavía gradual |
| Toast Radix | Implementado | Arriba y sin cierre visible |
| Confirmación Radix | Implementado | Reemplaza confirmaciones nativas sensibles |
| Arquitectura de tareas | Implementado | Listados, detalles y formularios separados |
| Navegación enfocada y regreso | Implementado | La barra general se oculta en tareas secundarias |
| Thumb-friendly | Implementado | CTA inferior, safe areas y objetivos de 48 px |
| Estados de carga/vacío/error | Implementado | Avisos y estados contextuales |
| Animaciones y reduced motion | Implementado | Entrada y destacado funcionales; movimiento reducible |
| Vista compacta de productos | Implementado | Preferencia temporal con Zustand |
| Gráficos Recharts | Implementado | Carga diferida en reportes |

## Tecnologías planificadas

| Tecnología | Estado | Uso esperado |
| --- | --- | --- |
| React Hook Form | Planificado | No fue necesario para reorganizar los formularios actuales |
| Zustand | Implementado | Vista de productos; disponible para estado temporal compartido |
| Recharts | Implementado | Visualizaciones mensuales de reportes |
| Radix Alert Dialog | Implementado | Confirmaciones sensibles |

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
- falta la validación manual en dispositivos principal y consulta antes de marcar la versión entregable.

## Fuera de alcance

Backend, login, roles de usuario, sincronización automática, facturación, ERP, stock avanzado, múltiples sucursales, app nativa e integraciones externas permanecen descartados del MVP.
