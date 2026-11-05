# Posavasos: dos modalidades

## Personalizados con logo

Solo 100, 200 o 500 unidades. La tarjeta ofrece esas cantidades y abre el formulario
con la elegida. El cliente adjunta obligatoriamente su logo/gráfica antes de agregar
la solicitud. El archivo se guarda de forma privada y la referencia acompaña el
pedido de WhatsApp o correo. El precio continúa como cotización; no se fijaron
precios nuevos ni número de caras impresas en este cambio.

La carga real se habilita únicamente para las fichas con `requiresArtwork: true`
(actualmente, posavasos personalizados). En los otros productos se conserva la
coordinación del archivo por WhatsApp y se indica expresamente en el formulario.
El componente anterior guardaba solo el nombre del archivo; no lo enviaba.

## Cajas souvenir

Producto separado, sin carga de logo. Cada caja contiene 20 posavasos con diseños
listos. Se elige temática y número de cajas. Se conservan las dos opciones existentes:
colección completa de Chile y colección Antártica Chilena. Se pueden ampliar las
temáticas desde las variantes del producto, manteniendo 20 unidades por caja.

Se conserva la referencia de $12.900 por caja, sin cambiar su tratamiento de IVA.
El carrito multiplica el importe de la caja por la cantidad y muestra las unidades
totales en el pedido; dos cajas contienen 40 posavasos y suman $25.800. No se ofrece
la opción «sin impresión»: son diseños souvenir terminados.

## Activación y archivos privados

Ejecutar `supabase/23-posavasos-modelo-y-logos.sql`. Actualiza únicamente el modelo
de las dos fichas, conserva precios, fotos y temáticas, y prepara el bucket privado
`kp-logos`. Las cargas están limitadas a 10 MB: PDF, PNG, JPG/JPEG, SVG, AI y EPS.
Los archivos se almacenan con UUID y nombre normalizado bajo `posavasos/`.

El visitante puede crear un archivo nuevo en esa carpeta, pero no listar, leer,
sobrescribir ni borrar archivos. El administrador autenticado puede listar y
descargar desde el nuevo módulo **Archivos de clientes**. La descarga genera un
enlace temporal de 60 segundos; las referencias del pedido no son enlaces públicos.
Las políticas restrictivas aíslan este bucket de permisos generales de otros buckets.
No se usan claves secretas ni service_role en el navegador.

Administración muestra hasta 100 archivos recientes y permite descargar archivos
anteriores pegando su referencia. Las cargas no acreditan una compra: deben
relacionarse con el pedido que envía el cliente. Puede haber archivos de solicitudes
abandonadas o incompletas; la retención y eliminación se administran desde Supabase
Storage, usando la cuenta propietaria. No hay automatización de borrado.

El cliente ve errores de carga y puede reintentar; la solicitud no se agrega sin
confirmación de guardado. Se impiden envíos dobles durante la carga y se conserva
la referencia del archivo al recargar el carrito. No se envían archivos por correo
ni WhatsApp automáticamente: se envía su referencia privada junto al pedido.

Validación local: modelo/SQL repetible, RLS con roles anónimo, usuario no administrador
y administrador (incluidas políticas generales existentes), validación de archivos,
solicitudes HTTP simuladas, reintento sin pedido falso, descarga temporal del panel,
carrito de souvenir y regresiones de las otras categorías. Tras activar el SQL,
probar una primera carga y descarga real contra Supabase; esa operación requiere
el bucket activo y no se ha ejecutado desde el entorno local.
