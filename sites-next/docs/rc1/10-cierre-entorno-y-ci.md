# Cierre posterior: entorno y repetición del CI

El entorno local quedó indisponible al empaquetar. Código e informes ya estaban preservados en GitHub. La carga a Library del PDF local falló por ausencia de entorno; no se afirma que el ZIP nuevo haya sido guardado allí. Se preparó el empaquetado reproducible en GitHub Actions, con sólo contents: read y sin despliegue.

La repetición del CI después del cambio de jornada encontró un desborde real en Reportes a 360 px (418 px de contenido): enlaces de correcciones largas heredaban white-space: nowrap. Se permite partir esos enlaces dentro de la pantalla. La prueba ahora abre explícitamente octubre de 2026, siempre con datos, en los tres anchos. No se ocultó el fallo ni se sustituyó por una repetición sin cambios. Se cambió el cache del worker a mora-shell-rc1.1 para que el ajuste sea detectable.

Las 49 entradas y los 14 recorridos habían pasado localmente y en el CI del código 2a5e70ba8c2a9082e11d0cb642742dedd0f496f6 (run 41194749682). El run posterior 41195044872 falló en ese desborde; sus 49 entradas Node pasaron. El estado definitivo de la corrección y su SHA se toman de estado-final.json del paquete y del CI final, no de los snapshots anteriores.

El paquete nuevo incluye informes, contratos del repositorio, auditoría crítica y evidencia de su CI. Se verifica cada archivo con SHA-256 y se comprueba integridad ZIP. El ZIP histórico completo v26-v29 queda conservado y enlazado aparte: su binario no pudo copiarse al caer el entorno.

El PDF inicial de tres páginas A4 se generó, renderizó e inspeccionó localmente; esa comprobación está en evidencias/previas-rc1/. El CI final genera otra copia nativa. El ajuste nuevo afecta únicamente enlaces de la pantalla Reportes; no cambia la vista imprimible. No se atribuye una inspección física ni visual adicional al PDF final que no pudo revisarse tras la caída.

Los artefactos GitHub se conservan 90 días. Descargalos para tu ronda futura. Los informes y el código quedan además en el repositorio. El paquete registra resultados fallidos si un test falla; sólo un CI verde habilita llamarlo candidata técnicamente comprobada en ese alcance. Sigue sin autorización productiva, sin Supabase conectado y con 45 casos físicos pendientes.
