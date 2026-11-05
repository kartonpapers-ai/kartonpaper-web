# Paso 7 · Biblioteca de imágenes para heroes

## Activar

1. En Supabase → SQL Editor, ejecuta únicamente `supabase/07-biblioteca-heroes.sql` una vez. No vuelvas a ejecutar 05 ni 06. Este paso no cambia tus productos ni campañas existentes.
2. Descomprime este ZIP y sube su contenido a la raíz de la rama `desarrollo/admin` de GitHub, conservando las carpetas `admin`, `css`, `js`, `supabase` y `tests`. No subas el ZIP ni crees una carpeta exterior adicional. Confirma con Commit changes.
3. Cuando Cloudflare termine, abre https://desarrollo-admin.kartonpaper-web.pages.dev/admin/campanas.html y recarga la página.

## Probar sin publicar

- Abre «Biblioteca de imágenes»: aparecen las fotos de los productos y las campañas actuales, sin volver a subirlas. Busca por nombre o filtra por categoría.
- Pulsa «Crear campaña»: inicia oculta, con fondo blanco y colores de marca editables.
- Completa título y descripción, pulsa «Elegir de la biblioteca» y selecciona una foto. Ajusta tamaño y posición en escritorio y móvil.
- Cambia los colores del título, descripción, detalles y botón. Comprueba el contraste en la vista previa.
- Guarda manteniendo desmarcada «Activar campaña». Se puede activar cuando esté lista; compruébala después en «Ver tienda».
- Para guardar una foto independiente, usa «Subir una imagen a la biblioteca», indica nombre y categoría y guarda. Puede reutilizarse en varias campañas.

## Fotos

PNG y WebP pueden conservar transparencia; JPG sirve para fotos con fondo blanco o escenas completas. El panel optimiza las nuevas imágenes a WebP (máximo 1920 px y 1 MB), sin ampliar originales. No elimina fondos. El peso final depende del detalle; aparece en la galería.

Las fotos existentes se reutilizan mediante su dirección actual y conservan su peso. Una foto con fondo gris o crema no se convierte automáticamente en blanco. Para fotografías de producto, usa «Foto de producto + fondo editable»; para escenas editoriales, «Escena completa».

Las imágenes nuevas se guardan en el almacenamiento que ya usa el panel. La galería y sus nombres solo son accesibles al administrador; los archivos de imagen conservan el acceso público necesario para la tienda. Esta etapa no incluye eliminación de imágenes ni generación de imágenes con IA.

## Validación

Pruebas de PostgreSQL (PGlite) y de interfaz simulada (JSDOM): permisos, validación de direcciones y colores, selección de fotos sin subirlas, búsqueda y filtro, subida, reintento tras fallo del guardado, reutilización sin duplicados y guardado de colores. Se mantuvieron las pruebas de catálogo, precios, login y campañas. La revisión visual final en navegador se realiza con la vista previa del panel.
