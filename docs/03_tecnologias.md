# Tecnologías del Proyecto

## 1. Propósito del documento

Este documento define las tecnologías, arquitectura, dependencias principales y criterios técnicos de **Mora Vinería**.

Su objetivo es evitar decisiones improvisadas durante el desarrollo y mantener una base técnica simple, coherente y alineada con el objetivo del proyecto.

La app debe priorizar:

- Simplicidad.
- Uso mobile-first.
- Funcionamiento offline.
- Instalación como PWA.
- Persistencia local de datos.
- Evitar backend en el MVP.
- Evitar hosting complejo.
- Evitar costos innecesarios.
- Mantener una arquitectura preparada para crecer si el proyecto lo requiere.

---

# 2. Decisión técnica principal

**Mora Vinería** será una aplicación web **PWA local-first**.

Esto significa que:

- La app se desarrollará como una web app.
- Podrá instalarse en el celular como PWA.
- Funcionará offline luego de la carga inicial.
- Los datos se guardarán localmente en el dispositivo.
- No tendrá backend en el MVP.
- No usará base de datos remota en el MVP.
- Podrá publicarse como sitio estático, preferentemente en GitHub Pages.

La arquitectura principal será:

```txt
React + Vite + TypeScript + Tailwind CSS
PWA instalable
IndexedDB + Dexie
GitHub Pages
Backup/restore JSON obligatorio
PDF local
Sin backend en MVP
```

---

# 3. Arquitectura general

La app estará compuesta por una sola aplicación frontend.

No habrá backend durante el MVP.

```txt
mora-vineria/
│
├── frontend/
│   ├── React
│   ├── Vite
│   ├── TypeScript
│   ├── Tailwind CSS
│   ├── PWA
│   └── IndexedDB / Dexie
│
└── docs/
    ├── 00_objetivo_proyecto.md
    ├── 01_requerimientos.md
    ├── 02_diseno_app.md
    ├── 03_tecnologias.md
    └── 04_reglas_ia.md
```

La app debe poder ejecutarse localmente y también publicarse como sitio estático.

El frontend será responsable de:

- Interfaz de usuario.
- Registro de productos.
- Registro de ventas.
- Registro de movimientos.
- Cálculos de reportes.
- Cálculos de proyecciones.
- Persistencia local.
- Backup y restauración.
- Exportación PDF local.
- Exportación CSV si no retrasa el MVP.

---

# 4. Frontend

## 4.1. Tecnologías principales

El frontend utilizará:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.

## 4.2. React

React será utilizado para construir la interfaz de usuario mediante componentes reutilizables.

La app debe mantenerse simple y evitar una arquitectura frontend innecesariamente compleja.

## 4.3. Vite

Vite será utilizado como herramienta de desarrollo y build.

Debe configurarse correctamente para permitir publicación en GitHub Pages, contemplando el `base path` del repositorio si corresponde.

## 4.4. TypeScript

TypeScript será obligatorio.

Debe utilizarse para reducir errores en:

- Productos.
- Ventas.
- Movimientos.
- Reportes.
- Proyecciones.
- Backups.
- Configuración.
- Cálculos de jornada de venta.
- Estados de stock.

El uso de TypeScript debe ser práctico, no excesivamente complejo.

## 4.5. Tailwind CSS

Tailwind CSS será utilizado para estilos.

La interfaz debe respetar el documento `docs/02_diseno_app.md`.

El diseño debe ser:

- Mobile-first.
- Oscuro.
- Rápido de leer.
- Cómodo para uso nocturno.
- Simple y visualmente claro.

---

# 5. PWA

## 5.1. Enfoque

La app debe ser una PWA desde el inicio.

Debe poder instalarse en el celular y abrirse como una app.

## 5.2. Tecnología sugerida

Se utilizará:

- `vite-plugin-pwa`.

## 5.3. Requisitos PWA

La app debe incluir:

- Manifest.
- Nombre instalable: `Mora Vinería`.
- Iconos.
- Theme color.
- Service Worker.
- Cache de archivos principales.
- Funcionamiento offline luego de la carga inicial.

## 5.4. Limitación importante

La PWA podrá funcionar offline, pero la primera carga o instalación puede requerir conexión.

Los datos se guardarán localmente en el dispositivo donde se use la app.

---

# 6. Base de datos local

## 6.1. Decisión

El MVP no usará una base de datos de servidor.

La app utilizará base de datos local del navegador mediante:

- IndexedDB.
- Dexie.js.

## 6.2. IndexedDB

IndexedDB será la tecnología base para guardar datos estructurados localmente.

Se usará para persistir:

- Productos.
- Categorías.
- Ventas.
- Detalles de ventas.
- Movimientos.
- Reposiciones.
- Aportes externos.
- Gastos puntuales.
- Configuración.
- Metas mensuales.
- Información de backups.
- Rol del dispositivo.

## 6.3. Dexie.js

Dexie.js será utilizado para simplificar el trabajo con IndexedDB.

Debe usarse para definir tablas, índices, consultas y operaciones de persistencia.

## 6.4. Esquema versionado

La base local debe tener versión de esquema.

Esto permitirá migrar datos si en el futuro cambia la estructura.

Ejemplo conceptual:

```ts
schemaVersion: 1
```

Cada backup también debe incluir la versión del esquema.

---

# 7. Persistencia local

## 7.1. Almacenamiento persistente

La app debe solicitar almacenamiento persistente si el navegador lo permite.

Se podrá usar:

```ts
navigator.storage.persist()
```

La app no debe depender exclusivamente de esta función, porque cada navegador puede manejar la persistencia de forma diferente.

## 7.2. Advertencia al usuario

La app debe informar claramente que los datos se guardan en el dispositivo.

Texto sugerido:

```txt
Tus datos se guardan en este dispositivo. Te recomendamos hacer respaldos seguido.
```

## 7.3. Backups obligatorios

Debido a que los datos son locales, el sistema de backup y restauración es obligatorio desde el MVP.

---

# 8. Backup, restauración y migración

## 8.1. Backup JSON obligatorio

La app debe permitir exportar un backup completo en formato JSON.

El backup debe incluir:

- Productos.
- Categorías.
- Ventas.
- Detalles de ventas.
- Movimientos.
- Configuración.
- Metas mensuales.
- Versión del esquema.
- Fecha y hora de exportación.
- Identificador del backup.
- Identificador del dispositivo, si corresponde.
- Fecha de última modificación de datos.

Ejemplo conceptual:

```json
{
  "app": "Mora Vinería",
  "schemaVersion": 1,
  "backupId": "backup-uuid",
  "deviceId": "device-uuid",
  "deviceRole": "principal",
  "exportedAt": "2026-07-08T20:00:00.000Z",
  "lastDataChangeAt": "2026-07-08T19:45:00.000Z",
  "data": {
    "productos": [],
    "categorias": [],
    "ventas": [],
    "movimientos": [],
    "configuracion": {}
  }
}
```

## 8.2. Restauración desde JSON

La app debe permitir importar un backup JSON.

Antes de restaurar, debe mostrar un resumen:

- Fecha del backup.
- Cantidad de productos.
- Cantidad de ventas.
- Cantidad de movimientos.
- Rol del dispositivo de origen.
- Versión del esquema.
- Advertencia de reemplazo o incorporación de datos, según el modo elegido.

## 8.3. Migración semiautomática

El MVP debe contemplar migración semiautomática por JSON.

Esta función permitirá copiar datos desde el celular principal hacia otro celular.

Flujo esperado:

1. En el celular principal se genera un backup.
2. La app permite descargar o compartir el archivo.
3. En el segundo celular se abre Mora Vinería.
4. La app permite indicar que no es el celular principal.
5. Se importa el backup.
6. El segundo celular queda como dispositivo de consulta por defecto.

## 8.4. Dispositivo principal

El dispositivo principal será el celular donde se cargan normalmente las ventas y movimientos.

Debe poder:

- Registrar ventas.
- Registrar productos.
- Registrar movimientos.
- Editar datos.
- Anular ventas.
- Generar backups.
- Exportar reportes.

## 8.5. Dispositivo de consulta

El dispositivo de consulta debe funcionar como copia de lectura por defecto.

Debe poder:

- Consultar productos.
- Consultar ventas.
- Consultar movimientos.
- Ver dashboard.
- Ver reportes.
- Ver proyecciones.
- Exportar PDF si corresponde.

Por defecto, no debe cargar ventas nuevas ni modificar información operativa.

## 8.6. Sin sincronización automática real

El MVP no tendrá sincronización automática entre dispositivos.

No se debe presentar la migración por backup como sincronización real.

La app debe evitar términos engañosos como:

- Sincronización automática.
- Datos siempre actualizados.
- Nube.
- Multi-dispositivo en tiempo real.

Se deben usar términos como:

- Copia de datos.
- Respaldo.
- Restaurar copia.
- Copiar datos a otro celular.
- Celular principal.
- Celular de consulta.

## 8.7. Compartir backup

La app debe intentar usar la función nativa de compartir archivos cuando esté disponible.

Si no está disponible, debe permitir descargar manualmente el archivo JSON.

---

# 9. Exportación CSV

La exportación CSV se incluirá en el MVP siempre que no retrase el desarrollo principal.

Prioridad:

1. Backup JSON completo.
2. Restauración JSON.
3. PDF mensual local.
4. Exportación CSV.

CSV podrá aplicarse inicialmente a:

- Ventas.
- Productos.
- Movimientos.

Si la exportación CSV complica o retrasa el MVP, podrá dejarse como mejora inmediata posterior, pero no debe afectar el backup JSON obligatorio.

---

# 10. PDF local

## 10.1. Decisión

El PDF mensual se generará localmente, sin backend.

Para el MVP se utilizará una vista imprimible con:

```ts
window.print()
```

La app debe mostrar una pantalla o vista especial de resumen mensual con diseño claro y escaneable.

Desde esa vista, el usuario podrá imprimir o guardar como PDF usando las opciones del navegador.

## 10.2. Diseño del PDF

El PDF debe tener:

- Fondo claro.
- Buena legibilidad.
- Diseño simple.
- Información resumida.
- Lenguaje no contable.
- Estructura fácil de leer.

El PDF no debe ser fiscal ni contable.

Debe ser un resumen de gestión.

## 10.3. Librerías PDF

No se debe agregar una librería pesada de PDF en el MVP salvo que sea estrictamente necesario.

Librerías como `@react-pdf/renderer` pueden evaluarse en el futuro si se necesita más control.

---

# 11. Formularios y validaciones

## 11.1. Formularios

Se utilizará:

- React Hook Form.

Debe usarse para formularios como:

- Producto.
- Venta.
- Movimiento.
- Reposición.
- Aporte externo.
- Gasto puntual.
- Configuración.
- Meta mensual.
- Restauración de backup.

## 11.2. Validaciones

Se utilizará:

- Zod.

Debe usarse para validar datos críticos.

Ejemplos:

- El nombre del producto es obligatorio.
- El precio de venta debe ser mayor a 0.
- El costo de compra no puede ser negativo.
- El stock no puede ser negativo.
- La cantidad vendida debe ser mayor a 0.
- El medio de pago es obligatorio.
- No se puede vender más stock del disponible.
- El monto del aporte externo debe ser mayor a 0.
- El backup importado debe tener estructura válida.

---

# 12. Fechas y jornada de venta

## 12.1. Librería de fechas

Se utilizará:

- date-fns.

La app no debe usar Moment.js.

## 12.2. Jornada de venta

La app debe calcular internamente la jornada de venta.

La jornada inicia a las 08:00 y finaliza a las 07:59 del día siguiente.

Regla:

- Desde las 08:00 en adelante, la venta pertenece a la jornada de ese mismo día.
- Antes de las 08:00, la venta pertenece a la jornada del día anterior.

Cada venta y movimiento debe guardar:

- Fecha y hora real.
- Fecha de jornada calculada.

Ejemplo:

```txt
Fecha real: 2026-08-01 02:15
Fecha de jornada: 2026-07-31
```

## 12.3. Interfaz

La interfaz no debe usar el término “día operativo”.

Debe usar textos simples como:

- Resumen de hoy.
- Ventas de hoy.
- Movimientos de hoy.
- Jornada actual, solo si fuera necesario.

---

# 13. Estado global y estado temporal

## 13.1. Librería

Se utilizará:

- Zustand.

## 13.2. Uso recomendado

Zustand debe utilizarse para estado temporal o global simple, por ejemplo:

- Carrito de venta actual.
- Preferencias de vista.
- Filtros activos.
- Configuración visual.
- Estado de navegación.
- Rol del dispositivo.
- Meta mensual activa si corresponde.

No debe usarse para reemplazar la persistencia en IndexedDB.

Los datos permanentes deben guardarse en Dexie/IndexedDB.

---

# 14. Gráficos

## 14.1. Librería

Se utilizará:

- Recharts.

## 14.2. Uso esperado

Los gráficos deben ser simples y legibles desde celular.

Ejemplos:

- Ventas por día.
- Ventas por semana del mes.
- Medios de pago más usados.
- Productos más vendidos.
- Evolución mensual.
- Comparación contra meta mensual.

Los gráficos no deben sobrecargar la interfaz.

---

# 15. Rutas y navegación

## 15.1. Librería

Se utilizará:

- React Router.

## 15.2. Rutas sugeridas

Rutas iniciales sugeridas:

```txt
/
/ventas
/ventas/nueva
/productos
/movimientos
/reportes
/proyecciones
/configuracion
/configuracion/datos
/reportes/pdf-mensual
```

La navegación debe respetar la barra inferior mobile definida en `docs/02_diseno_app.md`.

---

# 16. Testing

## 16.1. Librería

Se utilizará:

- Vitest.

## 16.2. Prioridad de pruebas

No se requiere testing excesivo en el MVP, pero sí pruebas para lógica crítica.

Deben priorizarse tests para:

- Cálculo de jornada de venta.
- Cálculo de semana del mes.
- Cálculo de ganancia bruta estimada.
- Cálculo de ganancia neta estimada.
- Descuento de stock.
- Bloqueo por stock insuficiente.
- Anulación de venta.
- Reversión de stock al anular.
- Backup JSON.
- Restauración JSON.
- Validación de estructura de backup.

---

# 17. Gestor de paquetes y seguridad

## 17.1. Gestor de paquetes

Se utilizará:

- npm.

## 17.2. Reglas de seguridad

Debido a riesgos propios del ecosistema de dependencias, se deben respetar estas reglas:

- Usar pocas dependencias.
- Evitar librerías innecesarias.
- Evitar paquetes poco conocidos si no son necesarios.
- Mantener `package-lock.json`.
- Ejecutar `npm audit` antes de builds importantes.
- Revisar vulnerabilidades relevantes antes de publicar.
- Activar Dependabot en GitHub si el proyecto se sube a repositorio.
- No instalar dependencias solo por comodidad si la funcionalidad puede resolverse de forma simple.

---

# 18. GitHub Pages

## 18.1. Deploy

La app debe poder publicarse en GitHub Pages.

Esto permite evitar backend, hosting pago y despliegues complejos en el MVP.

## 18.2. Configuración

Vite debe configurarse considerando el nombre del repositorio.

Si el repositorio se publica en una ruta como:

```txt
https://usuario.github.io/mora-vineria/
```

el proyecto debe tener configurado correctamente el `base path`.

## 18.3. Limitación

GitHub Pages solo publicará los archivos estáticos de la app.

No debe asumirse disponibilidad de backend, base de datos remota ni autenticación de servidor.

---

# 19. Autenticación y seguridad local

## 19.1. Sin login en MVP

El MVP no incluirá login.

Tampoco incluirá usuarios ni roles.

## 19.2. Seguridad del enfoque local-first

En el MVP, los datos no estarán en un servidor remoto.

Los datos estarán guardados localmente en el dispositivo/navegador donde se usa la app.

Esto reduce exposición externa, pero aumenta la importancia de los backups.

## 19.3. PIN local

El PIN local queda como mejora futura.

No debe incluirse en el MVP inicial.

Posibles mejoras futuras:

- PIN local.
- Bloqueo de app.
- Cifrado local con contraseña.
- Protección de backups con contraseña.

Estas mejoras deben evaluarse cuidadosamente para no generar falsa sensación de seguridad.

---

# 20. Tecnologías fuera de alcance en el MVP

No deben incluirse en el MVP:

- Backend Django.
- Django REST Framework.
- PostgreSQL remoto.
- Firebase.
- Supabase.
- Next.js.
- GraphQL.
- Redis.
- Celery.
- WebSockets.
- Microservicios.
- Autenticación JWT.
- Roles de usuario.
- Integración con Mercado Pago.
- Facturación fiscal.
- Docker obligatorio.
- App nativa Android/iOS.
- Sincronización automática real entre dispositivos.

Estas tecnologías pueden evaluarse en el futuro si aparecen necesidades reales como:

- Sincronización real.
- Multi-dispositivo editable.
- Login seguro.
- Backup en la nube.
- Uso por varias personas.
- Exposición pública controlada.
- Integraciones externas.

---

# 21. Docker

Docker no será obligatorio para el MVP.

Puede agregarse en el futuro si aporta valor para:

- Entorno reproducible.
- Testing.
- Build controlado.
- Integración con backend futuro.

No debe incorporarse si solo suma fricción al desarrollo inicial.

---

# 22. Ruta futura de crecimiento

Si el proyecto crece y necesita sincronización real, login seguro o multi-dispositivo editable, se podrá evaluar una segunda arquitectura.

Ruta futura posible:

```txt
Frontend PWA
Backend Django + Django REST Framework
Base de datos PostgreSQL
Autenticación
Sincronización
Backup en nube
```

Esta ruta no forma parte del MVP.

La app debe diseñarse de forma ordenada para que una migración futura sea posible, pero no debe construirse prematuramente como si ya necesitara backend.

---

# 23. Principios técnicos finales

Durante el desarrollo se deben respetar estos principios:

- Mantener la app local-first.
- No agregar backend en el MVP.
- No agregar base de datos remota en el MVP.
- Mantener mobile-first.
- Usar TypeScript de forma práctica.
- Usar IndexedDB mediante Dexie.
- Mantener backups como parte central del sistema.
- No prometer sincronización automática.
- Diferenciar dispositivo principal y dispositivo de consulta.
- Evitar dependencias innecesarias.
- Priorizar estabilidad por encima de complejidad.
- Mantener el código simple, legible y modular.
- Respetar la documentación del proyecto antes de agregar funcionalidades.
