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
| Productos y categorías | Implementado | Vista compacta |
| Stock por porcentaje | Implementado | Edición manual advierte que no genera historial |
| Ventas y anulación | Implementado | Confirmación Radix con resumen completo |
| Movimientos y anulación | Implementado | Eliminación segura de anulados |
| Modo principal/consulta | Implementado | Interfaz unificada como modo del dispositivo |
| Dashboard | Parcial | Movimientos del mes |
| Reportes | Implementado | Selector limita períodos futuros; gráficos planificados |
| Proyecciones y meta | Implementado | Gráficos planificados |
| Restauración | Implementado | Mantener pruebas de compatibilidad |

## Diseño y UX

| Elemento | Estado | Nota |
| --- | --- | --- |
| Paleta y fondo oscuro | Implementado | Brillo nocturno reducido |
| Barra inferior de cuatro accesos | Implementado | Coincide con diseño |
| Componentes base UI | Implementado | Adopción todavía gradual |
| Toast Radix | Implementado | Arriba y sin cierre visible |
| Confirmación Radix | Implementado | Reemplaza confirmaciones nativas sensibles |
| Estados de carga/vacío/error | Parcial | Presentes, falta uniformidad total |
| Animaciones y reduced motion | Pendiente | Definidas en diseño vigente |
| Vista compacta de productos | Pendiente | Requisito confirmado |
| Gráficos Recharts | Pendiente | Evolución planificada |

## Tecnologías planificadas

| Tecnología | Estado | Uso esperado |
| --- | --- | --- |
| React Hook Form | Planificado | Formularios complejos |
| Zustand | Planificado | Carrito y estado temporal compartido |
| Recharts | Planificado | Visualizaciones de reportes y meta |
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
- 12 archivos y 57 pruebas aprobadas;
- build y PWA correctos;
- 0 vulnerabilidades de producción;
- el workflow ejecuta verify y audit antes de publicar;
- se conserva la advertencia de bundle mayor a 500 kB.

## Fuera de alcance

Backend, login, roles de usuario, sincronización automática, facturación, ERP, stock avanzado, múltiples sucursales, app nativa e integraciones externas permanecen descartados del MVP.
