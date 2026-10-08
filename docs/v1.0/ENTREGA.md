# Mora Vinería 1.0 — candidata integral

Una actualización en `feat/mora-v1-polish`, contra `master`. Base de código `07a9dbd` (paquete 0.3.0); el tag 0.2.0 permanece como antecedente publicado, no como versión de esta rama. Sin publicación ni modificación de datos reales.

## Cambios orientados al uso

1. Sistema visual compartido para todas las vistas: superficies más simples, cifras tabulares, controles de 48 px, tipografía y contraste revisados en ambos temas.
2. Inicio muestra vendido, cobrado y vendido fiado con significados distintos; stock urgente ordenado por porcentaje y acceso al catálogo filtrado.
3. Reportes ocupa un destino principal; Más pasa a cabecera y escritorio ofrece acceso directo a dinero y movimientos.
4. Nueva venta busca en todo el catálogo, muestra cantidad de resultados y carga progresiva de 24; no oculta productos silenciosamente.
5. Carrito más legible y confirmación con total, cobro y cuenta; borrador recuperable y bloqueo síncrono de envíos repetidos.
6. Catálogo con categorías, lista/tarjetas, filtros conservados y alta/edición con datos opcionales agrupados.
7. Tesorería prioriza disponible y separa entradas/salidas, cuentas e historial; protege cambios sin guardar y el modo Consulta por URL directa.
8. Movimientos aclara pendientes y cantidades; confirmación/anulación conserva stock y contrapartidas, con protección contra doble toque.
9. Reportes diferencia vendido, cobrado y ganancia estimada; inventario actual independiente del período. Proyecciones conserva escenarios y confianza.
10. Sheets con cierre accesible; errores y foco revisados. CI verifica la PR sin credenciales y evita desplegar desde la rama de trabajo.

## Compatibilidad

| Área | Efecto de la candidata |
| --- | --- |
| IndexedDB | Dexie v8 conservado; no hay migración ni borrado |
| Respaldo | JSON v6; compatibilidad histórica existente conservada |
| Supabase | Sin cambios en RPC, esquema, RLS, identidad, outbox ni cursores |
| Stock/dinero | Sin cambios en reglas de cálculo o validación transaccional |
| PWA | Mismo id, scope, base y actualización con confirmación |
| Preferencias | Nuevas claves de sesión para filtros; no contienen registros operativos |
| Dependencias | Sin paquetes nuevos del producto; QA externo opcional |

La rama no accede a Supabase de producción. Las pruebas de navegador usan un contexto nuevo y datos ficticios, bloquean red externa y compilan solo ese ensayo con sincronización deshabilitada. La configuración del producto conserva su sincronización.

## Publicar, únicamente después de autorización explícita

1. Pausar brevemente la carga de operaciones. En cada celular operativo, comprobar que no haya sincronización pendiente ni conflictos. No borrar almacenamiento ni revocar identidades.
2. Descargar y guardar fuera del celular un respaldo JSON reciente. Comprobar fecha, cantidades, schemaVersion y lectura del archivo; ensayar restauración en un perfil separado, nunca en el celular que opera. Conservar copia previa.
3. Completar el protocolo físico de QA, comprobar CI verde para el último commit y obtener autorización del propietario para desplegar.
4. Fusionar esta única PR a master: el workflow existente verifica, audita, compila con las variables configuradas y publica Pages. No cambiar secretos/variables como parte del rediseño.
5. Abrir la PWA en cada celular, aceptar «Actualizar ahora» cuando estén fuera de una venta en curso. Confirmar versión 1.0.0 en Dispositivo, saldos, stock y última venta. Reanudar la operación.
6. Etiquetar v1.0.0 solamente después de verificar el despliegue autorizado.

## Recuperación

Si el problema es visual o de código, revertir el commit de fusión en master y ejecutar el mismo workflow sobre el código anterior. No restaurar JSON ni limpiar IndexedDB para volver a una interfaz anterior: no hubo migración de datos. Aceptar la actualización de recuperación y comprobar continuidad de operaciones.

Si se detecta un problema de datos, detener escrituras y guardar además una copia del estado actual para preservar operaciones posteriores. Comparar stock, cobros y libro; no restaurar una copia vieja automáticamente, ya que perdería registros recientes. Una recuperación de datos requiere una decisión explícita y conciliación, con el respaldo original conservado.

No se crea preview pública: la revisión usa evidencia y ejecución local aislada. PR, evidencia y comandos están enlazados desde QA.md.
