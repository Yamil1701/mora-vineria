# Reglas para la IA

## 1. Propósito del documento

Este documento define las reglas que debe seguir cualquier IA, agente de desarrollo o asistente que trabaje sobre **Mora Vinería**.

Su objetivo es mantener coherencia, evitar desviaciones del alcance, proteger decisiones ya tomadas y asegurar que el desarrollo avance de forma ordenada, verificable y alineada con la documentación del proyecto.

La IA debe actuar como asistente técnico del proyecto, no como dueña del producto. Puede sugerir mejoras, pero no debe cambiar decisiones importantes sin validación previa.

---

# 2. Lectura obligatoria de documentación

Antes de diseñar, modificar código, proponer arquitectura o implementar funcionalidades, la IA debe revisar la documentación del proyecto.

Documentos base:

- `docs/00_objetivo_proyecto.md`
- `docs/01_requerimientos.md`
- `docs/02_diseno_app.md`
- `docs/03_tecnologias.md`
- `docs/04_reglas_ia.md`

Si existe contradicción entre documentos, la IA debe detenerse y pedir aclaración antes de avanzar.

Orden de prioridad recomendado:

1. Reglas explícitas indicadas por el usuario en la conversación actual.
2. `docs/04_reglas_ia.md`
3. `docs/03_tecnologias.md`
4. `docs/01_requerimientos.md`
5. `docs/02_diseno_app.md`
6. `docs/00_objetivo_proyecto.md`

La IA no debe asumir reglas importantes si no están documentadas o aprobadas.

---

# 3. Alcance obligatorio del MVP

El MVP de **Mora Vinería** debe mantenerse enfocado en:

- Administración de productos.
- Categorías.
- Stock simple.
- Registro de ventas.
- Registro de movimientos.
- Reposición de mercadería.
- Aportes externos.
- Gastos puntuales.
- Dashboard.
- Reportes simples.
- Proyecciones básicas.
- PDF mensual local.
- Backup y restauración JSON.
- Migración semiautomática por JSON.
- PWA instalable.
- Funcionamiento local-first.

La IA debe respetar que la app está pensada para una vinería pequeña, administrada principalmente desde un celular.

---

# 4. Funcionalidades fuera de alcance en el MVP

La IA no debe agregar al MVP:

- Combos.
- Facturación fiscal.
- Múltiples sucursales.
- Contabilidad avanzada.
- ERP.
- Backend.
- Base de datos remota.
- PostgreSQL.
- Login.
- Roles de usuario.
- JWT.
- Sincronización automática real.
- Multi-dispositivo editable en tiempo real.
- Integraciones con Mercado Pago.
- Integraciones externas no solicitadas.
- App nativa Android/iOS.
- Docker obligatorio.
- Microservicios.
- WebSockets.
- Redis.
- Celery.
- GraphQL.

Estas funciones pueden sugerirse como mejoras futuras si tienen sentido, pero no deben implementarse sin validación previa.

---

# 5. Reglas de arquitectura

La arquitectura aprobada para el MVP es:

```txt
React + Vite + TypeScript + Tailwind CSS
PWA instalable
IndexedDB + Dexie
GitHub Pages
Backup/restore JSON obligatorio
PDF local
Sin backend en MVP
```

La IA no debe cambiar la arquitectura base sin consultarlo y justificarlo.

No debe agregar backend, servidor, base de datos remota o autenticación real en el MVP.

La app debe mantenerse como una PWA local-first.

---

# 6. Reglas sobre tecnologías

Tecnologías aprobadas:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- vite-plugin-pwa.
- IndexedDB.
- Dexie.js.
- React Router.
- React Hook Form.
- Zod.
- date-fns.
- Zustand.
- Recharts.
- Vitest.
- npm.

La IA no debe cambiar estas tecnologías sin validación previa.

La IA puede sugerir alternativas si detecta una razón técnica fuerte, pero debe explicar:

- Qué problema resuelve.
- Qué costo agrega.
- Qué riesgo reduce.
- Qué impacto tiene en el MVP.
- Por qué la tecnología actual no alcanza.

---

# 7. Dependencias

La IA debe evitar instalar dependencias innecesarias.

Antes de agregar una dependencia nueva, debe justificar brevemente:

- Para qué se necesita.
- Qué problema resuelve.
- Si existe una alternativa más simple.
- Si afecta el peso, mantenimiento o seguridad del proyecto.

La IA no debe instalar paquetes poco conocidos o no mantenidos sin consultar.

Se debe mantener `package-lock.json`.

Se debe preferir código simple antes que agregar una librería para tareas menores.

---

# 8. Reglas de diseño e interfaz

La IA debe respetar el diseño definido en `docs/02_diseno_app.md`.

La app debe ser:

- Mobile-first.
- Oscura.
- Cómoda para uso nocturno.
- Simple.
- Cálida.
- Moderna.
- Joven.
- Clara.
- No empresarial pesada.

La interfaz debe usar:

- Barra inferior mobile con iconos.
- Botones claros.
- Acciones principales visibles.
- Alto contraste.
- Cards o listas simples.
- Lenguaje humano y directo.

La IA no debe cambiar la identidad visual sin consultarlo.

---

# 9. Reglas de lenguaje dentro de la app

La app debe evitar lenguaje técnico, contable o empresarial pesado.

Debe usar textos humanos, simples y claros.

Ejemplos correctos:

```txt
Venta guardada. Ya quedó sumada al resumen de hoy.
```

```txt
No hay stock suficiente para completar esta venta.
```

```txt
Tus datos se guardan en este dispositivo. Te recomendamos hacer respaldos seguido.
```

No deben usarse mensajes agresivos o desmotivadores como:

```txt
Vas mal.
```

```txt
Meta fallida.
```

```txt
Error crítico de operación.
```

La IA debe priorizar claridad sin infantilizar la interfaz.

---

# 10. Jornada de venta

La app debe usar internamente una jornada de venta.

La jornada inicia a las 08:00 y finaliza a las 07:59 del día siguiente.

Regla:

- Desde las 08:00 en adelante, la venta o movimiento pertenece a la jornada de ese mismo día.
- Antes de las 08:00, pertenece a la jornada del día anterior.

La interfaz no debe usar el término “día operativo”.

Debe mostrar textos como:

- Resumen de hoy.
- Ventas de hoy.
- Movimientos de hoy.
- Jornada actual, solo si fuera necesario.

Cada venta y movimiento debe guardar:

- Fecha y hora real.
- Fecha de jornada calculada.

La IA no debe alterar esta regla sin validación previa.

---

# 11. Reglas de datos locales

Los datos del MVP viven en el dispositivo mediante IndexedDB y Dexie.

La IA debe tratar el backup como parte central del sistema, no como función secundaria.

Los datos principales deben estar versionados para facilitar migraciones futuras.

La app debe contemplar:

- Productos.
- Categorías.
- Ventas.
- Detalles de ventas.
- Movimientos.
- Configuración.
- Metas mensuales.
- Información de backup.
- Rol del dispositivo.

La IA no debe diseñar funciones que dependan de servidor, nube o sincronización automática.

---

# 12. Backup, restauración y migración

El backup JSON es obligatorio en el MVP.

La app debe permitir:

- Exportar backup JSON completo.
- Importar backup JSON.
- Ver resumen del backup antes de restaurar.
- Distinguir dispositivo principal y dispositivo de consulta.
- Migrar datos de forma semiautomática mediante archivo JSON.
- Compartir backup si el navegador lo permite.
- Descargar el backup manualmente si compartir no está disponible.

La IA no debe presentar esta función como sincronización automática.

Términos permitidos:

- Copia de datos.
- Respaldo.
- Restaurar copia.
- Copiar datos a otro celular.
- Celular principal.
- Celular de consulta.

Términos a evitar:

- Sincronización automática.
- Nube.
- Datos siempre actualizados.
- Multi-dispositivo en tiempo real.

---

# 13. Dispositivo principal y dispositivo de consulta

El dispositivo principal puede:

- Registrar ventas.
- Administrar productos.
- Registrar movimientos.
- Editar datos.
- Anular ventas.
- Generar reportes.
- Exportar backups.

El dispositivo de consulta debe ser de solo lectura por defecto.

Puede:

- Ver dashboard.
- Ver productos.
- Ver ventas.
- Ver movimientos.
- Ver reportes.
- Ver proyecciones.
- Exportar PDF si corresponde.

No debe cargar ventas ni modificar información operativa por defecto.

La IA no debe convertir el dispositivo de consulta en dispositivo editable sin validación previa.

---

# 14. Productos

La IA debe respetar el modelo funcional de productos definido en requerimientos.

Los productos deben contemplar:

- Nombre.
- Categoría.
- Precio de venta.
- Costo de compra.
- Marca.
- Presentación o tamaño.
- Stock actual.
- Estado activo/inactivo.
- Observaciones.

Reglas importantes:

- El stock simple forma parte del MVP.
- El costo de compra sirve para calcular ganancia estimada.
- Los productos inactivos se ocultan por defecto.
- Si un producto tiene historial, no debe eliminarse definitivamente.
- El costo de compra no debe mostrarse como dato principal en el listado.

---

# 15. Ventas

La venta es el flujo más importante de la app.

La IA debe priorizar que sea rápida, clara y segura.

Reglas:

- Una venta puede tener varios productos.
- La venta funciona como carrito.
- Debe descontar stock.
- Debe bloquear venta si no hay stock suficiente.
- Debe registrar medio de pago.
- Debe permitir observaciones.
- Debe permitir anulación con motivo.
- Debe revertir stock si se anula.
- Debe guardar fecha y hora real.
- Debe guardar fecha de jornada calculada.

La modificación manual del precio debe existir como opción secundaria, no como acción principal.

---

# 16. Movimientos

La pantalla de movimientos agrupa:

- Reposición de mercadería.
- Aporte externo.
- Gasto puntual.
- Historial de movimientos.

La IA no debe tratar todos los movimientos como gastos.

Reglas:

- La reposición aumenta stock.
- El aporte externo no es venta, ganancia ni gasto.
- El gasto puntual existe como opción secundaria.
- La reinversión debe mostrarse separada de gastos puntuales.
- Los movimientos anulados deben conservarse en historial.
- Si un movimiento afecta stock, su anulación debe revertir ese impacto.

---

# 17. Reportes

Los reportes deben ser simples y no contables.

Deben contemplar:

- Resumen de hoy.
- Semana del mes.
- Mes.
- Rango personalizado.
- Total vendido.
- Costo estimado vendido.
- Ganancia bruta estimada.
- Ganancia neta estimada.
- Reinversión.
- Aportes externos.
- Gastos puntuales.
- Productos más vendidos.
- Medios de pago más usados.

La semana del mes debe calcularse de forma simple:

- Semana 1: día 1 al 7.
- Semana 2: día 8 al 14.
- Semana 3: día 15 al 21.
- Semana 4: día 22 al último día del mes.

No usar semanas ISO salvo que se solicite explícitamente.

---

# 18. Proyecciones

Las proyecciones deben mostrarse como orientativas.

La IA no debe presentarlas como certezas.

Debe usarse lenguaje humano y realista.

Ejemplos:

```txt
La proyección es una guía. Puede cambiar por días fuertes, clima, feriados o por cómo se mueva la venta cerca de fin de mes.
```

```txt
Todavía hay margen para acercarse a la meta.
```

Las proyecciones avanzadas por día de semana, clima o feriados quedan como mejora futura.

---

# 19. PDF y CSV

El PDF mensual debe generarse localmente.

Para el MVP se usará vista imprimible y `window.print()`.

El PDF debe ser:

- Claro.
- De fondo claro.
- Escaneable.
- No fiscal.
- No contable.
- Orientado a gestión.

CSV puede incluirse en el MVP si no retrasa el desarrollo principal.

Prioridad:

1. Backup JSON.
2. Restauración JSON.
3. PDF mensual.
4. CSV.

---

# 20. Forma correcta de avanzar

La IA debe explicar brevemente el plan antes de modificar código, salvo que el cambio sea mínimo o ya haya sido pedido con total claridad.

El plan debe ser breve por defecto.

La IA debe avanzar por capas lo más grandes posible, siempre que sean:

- Coherentes.
- Comprensibles.
- Verificables.
- Razonables para revisar.
- Sin mezclar cambios delicados innecesariamente.

Cuando el cambio sea delicado, debe dividirlo en capas pequeñas.

Cambios delicados incluyen:

- Persistencia local.
- Backup y restore.
- Migración de datos.
- Jornada de venta.
- Stock.
- Anulación de ventas.
- Cálculos de ganancia.
- Cambios de arquitectura.
- Cambios en tecnologías.
- Cambios en estructura de datos.

---

# 21. Resumen posterior a cambios

Cuando la IA implemente cambios, debe entregar un resumen breve con:

- Qué cambió.
- Archivos tocados.
- Cómo probarlo.
- Riesgos o pendientes.

El resumen debe ser claro y directo.

No debe ser innecesariamente largo salvo que se solicite detalle.

---

# 22. Comentarios en código

La IA debe evitar sobrecomentar.

Los comentarios deben usarse solo cuando ayuden a entender:

- Reglas de negocio.
- Cálculos delicados.
- Jornada de venta.
- Migraciones.
- Backup y restore.
- Decisiones poco obvias.

No comentar código evidente.

Ejemplo innecesario:

```ts
// suma dos números
const total = a + b;
```

Ejemplo aceptable:

```ts
// Las ventas antes de las 08:00 pertenecen a la jornada comercial del día anterior.
```

---

# 23. Datos, borrados y cambios críticos

La IA no debe borrar datos, cambiar lógica crítica o modificar estructuras de backup sin advertirlo antes.

No debe pedir confirmación por cada detalle menor, pero sí debe advertir cuando el cambio pueda afectar:

- Datos guardados.
- Compatibilidad de backups.
- Migraciones.
- Cálculos históricos.
- Stock.
- Reportes.
- Anulaciones.
- Restauración de datos.
- Estructura general del proyecto.

Si existe riesgo de pérdida de datos, debe indicarlo claramente.

---

# 24. Nombres y lenguaje de dominio

La IA debe respetar nombres de dominio en español cuando sean parte del negocio.

Ejemplos:

- producto.
- categoria.
- venta.
- detalleVenta.
- movimiento.
- reposicion.
- aporteExterno.
- gastoPuntual.
- jornadaVenta.
- medioPago.
- gananciaBruta.
- gananciaNeta.
- stockActual.

En código estrictamente técnico puede utilizar nombres estándar del ecosistema si eso mejora claridad.

Ejemplos aceptables:

- hooks.
- components.
- services.
- stores.
- utils.
- schemas.
- routes.

La regla principal es mantener consistencia.

---

# 25. Sugerencias de mejora

La IA puede sugerir mejoras útiles.

No está obligada a limitarse de forma rígida si detecta una mejora razonable.

Sin embargo, antes de implementar una mejora no documentada debe evaluar:

- Si aporta valor real.
- Si aumenta demasiado la fricción.
- Si complica el MVP.
- Si contradice decisiones previas.
- Si requiere nuevas dependencias.
- Si afecta datos existentes.
- Si debería validarse con el usuario.

La IA puede proponer mejoras, preguntar o implementarlas si son menores, razonables y coherentes con el proyecto.

No debe implementar mejoras grandes sin validación.

---

# 26. Ante dudas

Si la IA tiene dudas menores que no afectan arquitectura, datos ni reglas críticas, debe tomar una decisión razonable y documentarla brevemente.

Si la duda afecta decisiones importantes, debe consultar antes de avanzar.

Debe consultar si la duda involucra:

- Cambios de stack.
- Backend.
- Base de datos remota.
- Login.
- Seguridad.
- Backup.
- Restore.
- Migración.
- Pérdida de datos.
- Cambios de jornada de venta.
- Cambios de reportes.
- Cambios de cálculo de ganancia.
- Cambios de stock.
- Nuevas funciones grandes.

---

# 27. Criterio final

La IA debe recordar que **Mora Vinería** no es un ERP, no es un sistema contable y no es una app empresarial compleja.

Es una PWA local-first para ordenar ventas, productos, movimientos, reportes y proyecciones de una vinería pequeña.

La mejor solución será la que mantenga equilibrio entre:

- Utilidad real.
- Simplicidad.
- Seguridad de datos.
- Claridad visual.
- Buen funcionamiento offline.
- Facilidad de mantenimiento.
