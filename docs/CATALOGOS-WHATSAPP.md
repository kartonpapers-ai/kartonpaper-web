# Enlaces del catálogo para WhatsApp

Los enlaces usan el dominio desde el que se comparte la tienda. En desarrollo
apuntan a la web de desarrollo; al publicar esa versión en el dominio oficial,
los botones generan enlaces del dominio oficial.

- `/?catalogo=cerveza#catalogo`: muestra cervecería.
- `/?catalogo=cajas-reposteria#catalogo`: solo las cajas para 3, 4 y 6 alfajores.
- `/?producto=reposteria-caja-3-alfajores#catalogo`: abre directamente su ficha.

La ficha incluye **Copiar enlace de este producto**. Sobre el catálogo hay otra
acción para copiar el enlace del rubro elegido. Desde Repostería, esa acción
comparte exclusivamente las cajas; el filtro general conserva el papel metalizado.
Si el navegador bloquea el portapapeles, se muestra el enlace seleccionado para
copiarlo manualmente y pegarlo en WhatsApp.

Los enlaces resuelven productos por identificador y consultan el catálogo vigente:
no fijan precios en la URL ni agregan productos al carrito. Un producto oculto,
inválido o eliminado no se abre. Un fallo de conexión conserva el bloqueo de precios
antiguos. La navegación a otra categoría durante la carga cancela la apertura pendiente.

Esto permite compartir enlaces de la web; no crea un catálogo en WhatsApp Business
ni envía mensajes automáticamente. La vista previa que WhatsApp genere para la URL
puede seguir usando la imagen general del sitio.
