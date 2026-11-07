# Vinculación desde un celular designado

**Alcance.** Cada negocio puede tener un único celular habilitado para admitir y revocar otros equipos. Ese permiso se asigna al registro del dispositivo, no a la cuenta. Un operador verifica el equipo de Yamil y lo designa explícitamente. El alta privada del primer dispositivo sigue funcionando con el procedimiento RC2.

## Recorrido

1. El celular designado abre **Más → Configuración → Dispositivos → Vincular otro celular**. Aparece un QR para la cámara y un código que se puede copiar. Duran cinco minutos.
2. El celular nuevo abre el QR o elige **Vincular con otro celular** en el acceso. Introduce el código si hace falta, escribe el nombre del equipo y pide acceso.
3. Ambos ven el mismo número de confirmación. El celular designado comprueba el número y toca **Admitir**.
4. El nuevo equipo recibe una sesión de la cuenta existente y una credencial propia para el mismo negocio. El celular designado recibe la confirmación y ve el equipo en la lista.
5. El celular designado puede quitar el acceso de otro equipo con confirmación. El servidor bloquea sus lecturas y escrituras cuando se vuelve a conectar. La copia local y sus registros pendientes se conservan.

## Seguridad y recuperación

- La función Edge comprueba sesión, membresía, credencial y designación para gestionar dispositivos. La decisión se vuelve a comprobar en la transacción.
- La invitación guarda el hash del código, el equipo que la emitió y la prueba del primer equipo que solicita acceso. El solicitante debe demostrar la misma prueba al consultar o completar el vínculo. El QR no contiene una credencial de Auth.
- La sesión del equipo nuevo se emite y verifica dentro de Edge para la cuenta activa del celular designado. La respuesta de sesión se entrega únicamente al solicitante aprobado. El equipo nuevo puede recuperar un intento interrumpido con su prueba guardada en IndexedDB y mientras siga vigente la invitación.
- Si se pierde el celular designado, el operador verifica el equipo de reemplazo y actualiza la designación en una transacción. En esa misma operación revoca el equipo perdido e invalida sus vinculaciones pendientes. El cliente nunca elige ni se asigna ese permiso.
- Para validar la designación, el operador debe cruzar el ID del negocio, el ID exacto del dispositivo, la cuenta y la membresía activa. El nombre del equipo sirve para identificarlo en pantalla y puede repetirse.

## Validación de desarrollo

Las pruebas SQL se ejecutan en PostgreSQL local (PGlite). El recorrido de navegador usa dos contextos HTTPS y Auth sintético, con el mismo handler y las consultas SQL de la candidata. La validación en un entorno alojado aislado y en Android físico corresponde a la siguiente etapa.
