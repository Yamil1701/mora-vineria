# Lista del proveedor · decisión técnica B

Fuente: decisiones 20 §§5f–5k, ejemplo real `docs/05_ejemplo_lista_proveedor.md` y contratos 11/24. La persona delegó detalles menores del reconocimiento; la identidad de un artículo y su pack siguen necesitando evidencia.

Se implementa interpretación determinista local, sin modelos remotos ni herencia de nombres entre renglones. Cada renglón conserva su texto original. Sólo se extraen importes enteros completos al final y packs explícitos `xN`/`*N`; expresiones con varios precios o unidades contradictorias quedan para revisión. Una tarifa truncada nunca se multiplica por mil. Packs faltantes se reutilizan sólo de una equivalencia humana única del mismo proveedor y etiqueta, o se completan manualmente.

Las equivalencias recuerdan proveedor + etiqueta normalizada + unidades por presentación + producto ID. No incluyen precio. Pueden corregirse/revocarse. Producto inactivo, dos equivalencias posibles, duplicados o pack contradictorio impiden selección automática. Los cambios claros se preseleccionan, pero el catálogo sólo cambia después de una revisión explícita.

El costo de referencia queda en la lista guardada (no en el alias ni en FIFO). Una lista confirmada permite precargar cantidades de un pedido editable según faltantes/pack; no envía mensajes ni crea mercadería. La referencia de costo puede cambiar en la recepción física, que exige total pagado real.

Aplicación de precios por comando `UpdatePrices`: validación CAS de todos los productos y una sola transacción. Si una versión cambió, ningún precio se aplica; el slot durable se puede reabrir para revisar valores actuales, sin modificar ventas anteriores. Esquema aditivo 6 y backup formato 4 incluyen listas/aliases y el nuevo contrato 3, preservando formatos anteriores.

## Verificación del circuito

Siete pruebas nuevas cubren parser conservador, importes completos, duplicados, equivalencias por proveedor/presentación, revocación, rechazo por versión obsoleta, reversión integral del lote de precios, reintentos concurrentes, conservación del precio de ventas/borradores, backup semántico y migraciones de formatos 2/3 y Dexie 5. Suite final: 155 Vitest.

Recorrido Chromium real: pegar lista desconocida, confirmar equivalencia, recargar, pegar nueva tarifa offline, reconocer y comparar costos, revisar/aplicar precios, recargar confirmación durable y preparar pedido editable según objetivo. Stock y Caja permanecen sin movimientos. Capturas 360/390/430 y formulario con viewport reducido; esto último no equivale a probar un teclado físico.

Limitaciones deliberadas: importación de texto, no OCR; máximo 100 filas/50.000 caracteres. Un nombre abreviado nuevo no se adivina. Si el producto no existe, se crea desde Productos y se vuelve a la lista guardada. Las cantidades sugeridas son editables; sin objetivo se agrega manualmente al pedido. La fecha de importación es inmutable, independiente de la última revisión, para no confundir la comparación con listas anteriores.
