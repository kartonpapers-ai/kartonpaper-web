# Visibilidad en la web

En Administración → Productos, los interruptores de **Visibilidad en la web**
guardan cada categoría al pulsarlos. No cambian el campo `published` de sus
productos. Al reactivar una categoría vuelven únicamente sus productos publicados.
La casilla **Mostrar este producto en la web**, dentro de cada ficha, se aplica
al guardar el formulario del producto.

El listado indica **Oculto por categoría** u **Oculto individualmente**. El contador
superior muestra la visibilidad efectiva. El panel conserva todos los productos,
imágenes, costos, precios y referencias de ventas/producción; ocultar no borra datos.

La web consulta la configuración actual al cargar: excluye productos, navegación,
selectores y rotación del hero de las categorías ocultas. Las campañas con destinos
explícitos a categorías o productos ocultos tampoco se publican. Los enlaces directos
muestran un aviso de indisponibilidad y permiten consultar otras opciones.
Las campañas generales sin vínculo de categoría/producto requieren revisión editorial.

El carrito conserva las líneas no disponibles en el almacenamiento del cliente,
separadas de las líneas activas y excluidas de importes y mensajes de pedido.
Pueden recuperarse al volver el producto, siempre que sus opciones sigan siendo válidas.
Las páginas ya abiertas necesitan recargarse para recibir el cambio; no hay difusión
en tiempo real. No hay integración con el catálogo nativo de WhatsApp Business.

## Persistencia y permisos

`supabase/migrations/20261102141444_catalog_category_visibility.sql` crea seis filas
en `kp_catalog_categories`, inicialmente visibles. Lectura pública de id/estado/versión;
escritura limitada por RLS a `kp_is_admin()`, sin permisos de inserción ni borrado desde
el cliente. La actualización usa id y versión esperada para evitar sobrescrituras.
Las políticas públicas de `kp_products` y `kp_campaigns` aplican el mismo filtro.
El administrador mantiene acceso a productos ocultos y a campañas para editarlos.

Si no se puede consultar la configuración, la tienda no usa los precios estáticos
como sustituto ni sobreescribe el carrito guardado. Los controles del administrador
quedan desactivados cuando no se puede cargar la configuración; Actualizar lista reintenta.

## Verificación

- `tests/test-visibilidad-db.cjs`: permisos, políticas reales con PGlite, categorías,
  destinos principales/secundarios, versiones, reactivación y productos intactos.
- `tests/test-visibilidad-web.cjs`: navegación, enlaces, hero, carrito, error de carga,
  todas las categorías ocultas, guardado admin, conflictos y cambios pendientes.
- Prueba en Supabase dentro de una subtransacción revertida: ocultar Posavasos
  excluye sus productos y campañas para `anon`; estados originales restaurados.
