# Implementación y alcance de archivos

Base: RC1 `fc20f44a2c17e6cd46faa6dc9eac766aa4d00e58`, derivada de Sites v29. PR #14 sigue en borrador sobre `work/sites-v27-entregas-3-4`. La rama local `work/mora-rc2-integracion` conserva commits pequeños; la publicación en GitHub se realizó por el conector autenticado, con árboles equivalentes y padres preservados. Consultar `commits.json` para la correspondencia local/remota y el estado final del paquete para el HEAD exacto.

## Cambios

- `dist/command-domain.js`: frontera semántica común para los 25 tipos de comando. Incluye catálogo, compras, referencias, controles e importación; no envía snapshots arbitrarios como decisiones del cliente. Carrito, precios congelados de ese carrito, favoritos y navegación son locales. Una venta tardía no consume lotes posteriores a su fecha física.
- `dist/workspace-store.js`: IndexedDB activa, transacciones con durabilidad estricta, identidad estable, preparación persistida antes del efecto local, estados de envío, evidencia, proyección sobre lectura remota y copia anterior a restaurar. Respaldo con checksum sin sesiones ni credenciales.
- `dist/persistence-controller.js`: apertura/migración del almacenamiento anterior, serialización de borradores, acceso, vínculo, guardado, recuperación, exportación/importación y envío inicial explícito a negocio vacío.
- `dist/auth-client.js`, `remote-client.js`, `runtime-config.js`: Auth REST, renovación, transporte Edge con prueba del dispositivo y reintentos por identidad. La configuración del navegador sólo incluye URL y clave publicable.
- `dist/app.js`, `workflow-ui.js`, `correction-ui.js`, `reports-ui.js`: mutaciones existentes convertidas a comandos. Se esperan los guardados locales durables y se evita editar durante su confirmación local. Guardar un borrador no puede alterar productos, caja ni otras entidades compartidas.
- `backend/*`: lectura y resultado, enrolamiento de un solo uso, revisión explícita con base actual separada, sesión Auth vigente, control de origen y límites de cuerpo. Regresión de reintentos concurrentes corregida y probada.
- `backend/supabase/migrations/*rc2*`: tres incrementales reales, sin reiniciar RC1 ni usar el archivo histórico.
- `scripts/stamp-shell.mjs`: identidad de caché calculada a partir de los recursos exactos. `verify` falla si cambia un recurso servido sin actualizar esa identidad.
- Pruebas: se conservaron las suites previas, se adaptaron controladores a IndexedDB y se añadieron casos de almacenamiento, gateway, Auth y provisión sintética. Los fixtures que alteran estado directamente son preparación explícita de tests, no caminos de escritura del producto.

No se cambió CSS de la identidad v29 ni se importó arquitectura antigua. La interfaz de acceso y los indicadores usan los patrones presentes. El único archivo exterior a `sites-next/` modificado por esta misión es su workflow de comprobaciones.

El inventario completo de archivos modificados está en `archivos-modificados.txt`; las evidencias de cada ejecución se separan de los contratos históricos. Un commit de código no prueba por sí solo que haya sido publicado, integrado en Sites o probado en un teléfono.
