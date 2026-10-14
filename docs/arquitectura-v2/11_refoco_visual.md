# Refoco de experiencia V2 — PR #11

Estado: propuesta de código sin fusionar ni desplegar. Base de comparación: PR #5 `feature/mora-v2-app-shell`, cinco mockups oficiales en `docs/diseno/mockups-aprobados-v2/`, sistema en `docs/10_sistema_visual_v2.md`, funcionamiento actual de `master` tras PR #10.

## Diagnóstico contrastado

Los mockups oficiales dan prioridad a tres decisiones de Inicio (ventas, ganancia y reposición), a la venta directa y a reportes entendibles. La evolución PR #8→#10 sumó una cinta de estado permanente, etiqueta V2/local, resúmenes contables adicionales, botón de movimientos, botón de backup y detalles técnicos en todas las pantallas sin reducir información previa. Aunque persiste el fondo/fucsia y los controles, la jerarquía se debilita. El catálogo repite cantidades y objetivo, y las fichas muestran fracciones de costos internas. Movimientos reúne los dos historiales abiertos y agrega tres botones principales.

## Corrección aplicada (sin otra ronda de diseño)

- Inicio conserva tres módulos principales. Restaura título editorial «Mora Vinería» y subtítulo «Resumen de hoy»; elimina distintivos de desarrollo. «Movimientos de hoy» pasa a área secundaria compacta con acceso al backup y nota clara sobre recuperación.
- El indicador de red aparece arriba solo al estar desconectado. El aviso de almacenamiento local se conserva al pie y en Inicio; no se confunde guardado local con sincronización.
- Reportes mantiene ventas, ganancia, gráfico y más vendidos visibles; desglose dinero/mercadería e historial quedan en acordeones accesibles.
- Catálogo no repite cantidad/objetivo al mostrar el indicador de stock; ficha conserva lotes y recepciones bajo «Historial de mercadería y costos», con costo unitario redondeado solo **en la presentación**. Persisten costos racionales exactos en IndexedDB/backup.
- Movimientos presenta acciones en una disposición compacta y agrupa los historiales con la mercadería contraída inicialmente. Los movimientos de efectivo quedan visibles por defecto.

## Invariantes, exclusiones y evaluación

Sin cambios en `src/domain/`, `src/local/`, esquema Dexie, IDs, comandos, FIFO, restauración, datos, PWA ni navegación de cuatro tabs. No se habilitan transferencia, fiado, escáner o cuentas inexistentes. Confirmaciones durables y errores permanecen explícitos. La presentación no inventa costos, saldo real ni estados remotos.

QA objetivo: verificar 360/390/430px, Inicio, compras/ventas, botón Cobrar sin carrito obligatorio, formularios, Movimientos, detalle FIFO, Reportes y backup, sin desbordes; red offline indica «Sin conexión»; datos sobreviven actualización. La coherencia visual final requiere revisar render real en el teléfono y capturas frente a los mockups; CI funcional no certifica por sí solo fidelidad de píxeles.
