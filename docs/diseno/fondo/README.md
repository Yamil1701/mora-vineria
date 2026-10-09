# Fondo ambiental — Mora Vinería 2.0

**Estado:** aceptado como fondo visual para continuar con el sistema de interfaz; no implica que su implementación en una PWA esté finalizada.
**Archivo:** [fondo-nocturno-fucsia.webp](fondo-nocturno-fucsia.webp).
**Fuente:** imagen generada y aceptada por el usuario el 9/10/2026. Optimizada a WebP; conserva 841×1870 píxeles.

## Uso previsto

- Diseño **mobile-first** sobre negro/carbón, con luces fucsia suaves cerca de los bordes y zona central predominantemente oscura.
- Usar como **background ambiental** bajo un overlay carbón oscuro (aproximadamente 25–45 % según pantalla); no convertirlo en una imagen de producto, ni superponer texto directamente sobre áreas luminosas.
- Las superficies de las tarjetas pueden ser semitransparentes con `backdrop-filter` discreto y borde tenue, pero la legibilidad debe sostenerse **sin blur**.
- Imagen comprimida y sin efectos pesados. Evaluar recorte `cover` en 360×800, 390×844 y 430×932; el centro de atención no debe coincidir con el brillo lateral.
- Pantallas muy densas o equipos de bajo rendimiento pueden usar un fondo sólido. Soportar modo de movimiento reducido y ahorro de recursos.
- La navegación inferior debe tapar el fondo lo suficiente para asegurar contraste y no provocar confusión con los botones.

## Advertencias

- No añadir gradientes, partículas o animaciones por defecto.
- Comprobar que los nuevos componentes comparten el mismo fondo mediante el `AppShell`, en lugar de descargar la imagen en cada tarjeta/pantalla.
- No asumir que un diseño generado define los tokens exactos, tamaños táctiles o datos reales. Ver `../sistema/` para decisiones de implementación.
