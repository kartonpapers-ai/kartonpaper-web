# Pruebas del catálogo y administrador

Ejecutar `npm install` y `npm test` en una copia local. Las dependencias son solo
para desarrollo; no se sube `node_modules` ni se necesita Node para servir la web.
Cloudflare puede seguir usando el comando `exit 0` y salida `.`.

- `test-db.cjs` ejecuta esquema y carga inicial en PostgreSQL mediante PGlite.
  Comprueba lectura pública, productos ocultos, permisos de escritura, autorización
  de un solo administrador, validación, conflictos y carga sin sobrescrituras.
- `test-ui.cjs` ejecuta las páginas en JSDOM con respuestas de servicio simuladas.
  Comprueba estados del login, búsqueda, edición, guardado fallido, conflicto,
  cierre de sesión, catálogo estático/remoto, filtros, carrito, personalización,
  escape de texto HTML y caída de conexión.

Estas pruebas no acceden a cuentas reales, no envían mensajes y no sustituyen
la revisión visual en navegador ni la prueba final contra Supabase y Cloudflare.
El proyecto Supabase y el usuario deben configurarse antes de esa aceptación.

La migración 04 se prueba con tablas de Storage simuladas en PostgreSQL: verifica
INSERT de productos y objetos, rechazo de otros usuarios, formatos y publicación.
Las pruebas de imágenes simulan la API canvas; conversión y subida reales se
verifican manualmente en el Preview tras activar la migración.

La migración 05 añade pruebas de campañas y permisos. `test-heroes.cjs` cubre
la página del editor y el hero conectado, con API simulada; incluye programación,
fotos, conflictos, botones y ocultación de destinos no publicados.

Paso 7 añade pruebas reales SQL de `kp_hero_assets` (lectura/inserción admin,
rechazo anon y no-admin, direcciones, tamaño máximo, duplicados y ausencia de
borrado/edición), reutilización de fotos de productos y validación de colores.
La prueba de heroes simula búsqueda, filtros, elección de imagen sin subirla,
colores en preview y guardado, y reintento de registro sin duplicar la subida.

`test-posavasos-colecciones.cjs` cubre la migración 24: cuatro modelos visibles,
archivo de temáticas anteriores sin borrado, repetición segura del SQL y datos
ajenos intactos. Comprueba pack prueba de 20, cantidades hasta 5.000, consulta
mayorista, bloqueo de compra con precios pendientes y limpieza del carrito antiguo.
Para activar la venta por caja en administración: fija precio numérico por caja,
texto visible con su IVA correspondiente y desmarca «Precio pendiente».

`test-producto-detalle.cjs` comprueba tarjetas compactas con precio inicial,
detalle con selección persistente, cierre con Escape/fondo/botón, devolución del
foco y transición al carrito o a personalización sin ventanas superpuestas.
