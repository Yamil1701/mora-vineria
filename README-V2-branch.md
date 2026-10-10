# Mora Vinería 2.0 — rama de desarrollo

> **NO ES PRODUCCIÓN.** Rama `feature/mora-v2-app-shell` creada desde `master` sin tocar el despliegue existente, los datos de V1 ni Supabase.

## Qué incluye

- React 19 + Vite 6 + TypeScript + Tailwind 3, instalados en **la raíz del repositorio**.
- PWA instalable basada en Workbox con `base: '/mora-vineria/'` y aviso de actualización **manual** para no recargar una venta en curso.
- UI Kit ya documentado en `src/ui/`; fondo aceptado en `public/assets/fondo-nocturno-fucsia.webp`.
- Inicio y Venta como demostración interactiva: búsqueda de productos, categorías, carrito, cambio de cantidades y cobro simulado en efectivo/transferencia/mixto/fiado. Productos y Reportes son vistas exploratorias aún sin lógica de negocio.
- Cifras de prueba coherentes dentro de la misma sesión, sin escribir datos en IndexedDB, Supabase o el navegador. **Al recargar, la demostración se reinicia.**

## Probar en una computadora

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Abrir la URL indicada por Vite (respetando `base` `/mora-vineria/`). Para abrirlo desde otro dispositivo de la red usar `npm run dev -- --host 0.0.0.0`, con las medidas de seguridad adecuadas para una red de confianza.

## Casos manuales de prueba

1. Abrir en 360×780 y 390×844, recorrer las cuatro pestañas y confirmar que Inicio sigue accesible.
2. En Ventas, filtrar por categoría y buscar «Coca»; agregar distintos productos, editar cantidades, quitar líneas y comprobar el total.
3. Efectivo: ingresar menos que el total (no se debe habilitar venta), luego más (muestra vuelto correcto).
4. Transferencia: sin marcar acreditación manual no se habilita cobro; tras marcarla, registrar solo una **venta simulada**.
5. Mixto: ingresar parte en efectivo, verificar la transferencia restante. Fiado: nombre requerido, sin fecha límite.
6. Añadir más unidades de las disponibles en el stock ficticio. La demostración debe permitirlo, mostrar una revisión pendiente y conservar la venta simulada.
7. Refrescar la página: el estado de ejemplo vuelve al inicial. **No hay persistencia ni sincronización reales en esta fase.**
8. Verificar que el aviso de actualización de la PWA nunca recargue solo una venta en curso.

## Exclusiones deliberadas

- Sin Supabase, Auth, RLS, IndexedDB, Dexie ni sincronización todavía. Esto se implementará después de decidir contratos y casos de conflicto, no se debe simular como real.
- Sin datos reales ni reportes de ganancia FIFO. Por eso el campo de ganancia aparece como «—» en la demo.
- Sin importación de datos antiguos, cuentas bancarias ni backups.
- Sin GitHub Pages o publicación automática; el workflow de esta rama solo verifica compilación y tests.

## Pendiente para siguiente entrega

Validar interfaz en teléfonos reales; ajustar componentes y fotos seguras; contrato técnico transaccional de ventas/FIFO y sincronización; configurar ambiente Supabase de prueba solo con nueva autorización específica. Generar y confirmar `package-lock.json` cuando la instalación de dependencias funcione; el workflow actual usa `npm install` porque todavía no hay lockfile generado.
