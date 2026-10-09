# Hipótesis de producto — alta asistida mediante códigos de barras

**Estado: PROPUESTA A VALIDAR, no aprobada para implementación.**
Registro de descubrimiento: 2026-10-09.

## Problema

Dar de alta por primera vez cada producto escribiendo marca, nombre, presentación y otros datos puede ser lento. Se sugirió escanear con la cámara el código del envase para recuperar la información y facilitar la carga inicial del catálogo.

## Alcance propuesto

1. En Alta de producto ofrecer **Escanear código** y **Cargar manualmente**, sin obligar a usar cámara.
2. Leer preferentemente EAN-13/EAN-8 y otros formatos aplicables, detectando y probando compatibilidad del navegador. Cámara bajo HTTPS y permiso expreso; ante fallo permitir entrada manual del código.
3. Consultar **primero el catálogo de Mora** (local/Supabase, según conectividad); si existe, evitar duplicados y abrir la ficha existente.
4. Para códigos desconocidos, con internet consultar una base pública de productos, por ejemplo Open Food Facts (revisar API vigente, términos, licencia de datos/imágenes y cobertura efectiva de productos de Argentina, bebidas y alcohol).
5. Mostrar una **vista previa editable** de los campos que hayan sido encontrados (nombre, marca, volumen, imagen, etc.) y su fuente. Nunca inventar información ausente o trasladar automáticamente características entre variantes parecidas.
6. El código generalmente es **solo un identificador** (GTIN): no contiene por sí mismo nombre, costo, precio de venta, disponibilidad ni cantidad por fardo. Pedir o proponer por separado estos campos comerciales.
7. Guardar el código validado asociado a una variante precisa del producto; producto sin código o con código ilegible sigue admitiendo alta manual.
8. El escaneo de códigos ya vinculados debe funcionar offline gracias al catálogo local; la **búsqueda en bases externas requiere conexión**, salvo datos previamente guardados.
9. El lector no debe ser obligatorio en el flujo de ventas ni prolongar la atención en ventanilla. Posible uso posterior para localizar productos, solo si pruebas reales muestran beneficio.

## Viabilidad técnica

- La PWA puede acceder a cámara con permiso del dispositivo y HTTPS.
- La API web BarcodeDetector tiene soporte desigual según navegador (ver compatibilidad antes de usarla), por lo que puede requerir un fallback de lectura local mediante biblioteca liviana.
- El reconocimiento no necesita IA si el GTIN se lee bien y hay datos registrados. La base pública puede estar incompleta o tener productos/variantes incorrectos; pedir confirmación humana.
- **No seleccionar biblioteca, integración ni crear código todavía.**

## Prueba previa de conveniencia (criterio propuesto)

- Tomar 20–30 envases representativos del local: gaseosas, cerveza, vinos, energizantes, tamaños/variantes, productos regionales.
- En dos dispositivos/navegadores reales, medir: lectura efectiva de código, coincidencia correcta de producto/variante, datos útiles encontrados, tiempo hasta guardar y cantidad de correcciones.
- Comparar contra alta manual simplificada; evaluar confiabilidad, dependencia de la red y necesidades reales.
- **Decidir implementar o descartar** según si ahorra tiempo significativo sin subir la tasa de errores. No incorporar un sistema caro o frágil solo por ser llamativo.

## Preguntas pendientes

- ¿El alta inicial será de decenas o de cientos de productos?
- ¿Se desea capturar foto propia si la fuente pública no ofrece una imagen correcta?
- ¿Se permitirá asociar varios códigos a un producto o separar variantes por tamaño?
- ¿Cómo validar fotos/licencias de fuentes externas y diferenciar botellas individuales de códigos impresos en fardos?
