# Activar el administrador personal

## Qué contiene esta entrega

- `/admin/`: acceso por correo y contraseña, sin registro público ni enlace en la tienda.
- Lista y búsqueda de los 20 productos existentes.
- Edición de nombre, descripción, precio visible, precio numérico, opciones y características.
- Mostrar u ocultar productos. Guardado persistente en Supabase.
- Detección de cambios concurrentes: una sesión no sobrescribe una edición más reciente.
- Catálogo público conectado a la misma tabla; actualizaciones visibles al recargar la tienda.

No incluye todavía carga de nuevas imágenes, alta de productos, promociones,
pedidos almacenados ni asistente. Los contactos del carrito siguen enviándose por
WhatsApp o por la aplicación de correo del cliente. El logo no se sube a un servidor.

## Activación paso a paso

Mantener todo en `desarrollo/admin` y revisar su Preview antes de pasar a `main`.

1. Crear una cuenta en https://supabase.com y un proyecto **Free** llamado
   `kartonpaper-desarrollo`. Guardar la contraseña de la base de datos en tu gestor;
   no es la contraseña del panel. Elegir la región más cercana disponible.
2. En **SQL Editor**, ejecutar el contenido completo de `supabase/01-esquema.sql`
   una vez, en un proyecto nuevo. Crea la tabla y todas las políticas de acceso.
3. Ejecutar `supabase/02-productos.sql`. Carga los 20 productos actuales. Repetir
   este segundo archivo no sobrescribe precios editados.
4. En **Authentication → Users → Add user / Create user**, crear tu usuario con
   correo y contraseña. Confirmar el correo mediante la opción de creación del
   dashboard o el procedimiento que allí se indique.
5. En la configuración de Authentication, desactivar **Allow new users to sign up**
   y **Allow anonymous sign-ins**. Mantener el acceso con email habilitado.
6. Copiar el UUID del usuario de Authentication, reemplazar el marcador de
   `supabase/03-autorizar-admin.sql` y ejecutar ese SQL en el editor. Este UUID
   autoriza el usuario; no es un secreto. La tabla admite un solo administrador.
   No ejecutar este archivo sin reemplazar el marcador.
7. En **Connect** o **Settings → API Keys**, obtener la URL del proyecto y la clave
   **publishable** que empieza por `sb_publishable_`. Nunca utilizar una clave
   `sb_secret_` ni `service_role` en los archivos de la web.
8. Completar `data/config.js` con esas dos referencias públicas y cambiar `enabled`
   a `true`. Subir ese archivo a `desarrollo/admin` y esperar el despliegue Preview.
9. Abrir el enlace Preview con `/admin/` al final. Iniciar sesión con tu usuario.

La contraseña se introduce en el login y se verifica en Supabase Auth. No se
escribe en el código ni en GitHub. La sesión usa almacenamiento de la pestaña;
cerrar sesión al terminar. El login no ofrece registro ni recuperación por email
todavía: una contraseña olvidada puede restablecerse desde el dashboard de Supabase.

## Prueba de aceptación antes de producción

- Sin conexión configurada, el login indica que está pendiente y no permite entrar.
- Contraseña incorrecta: no permite entrar. Usuario no autorizado: no accede al editor.
- Usuario autorizado: carga productos visibles y ocultos.
- Cambiar un texto de un producto, guardar y recargar la tienda Preview: aparece el cambio.
- Restaurar el texto original antes de publicar.
- Ocultar un producto: desaparece en la tienda al recargar. Volver a mostrarlo.
- Dos pestañas editando el mismo producto: la segunda recibe un aviso de conflicto.
- Cerrar sesión: desaparecen lista y editor. Una petición pública de actualización
  debe fallar, aunque el visitante conozca la URL y la clave pública.
- Probar catálogo, filtros, personalización y carrito en escritorio y móvil.

## Precios y pedidos guardados

Se preservan las condiciones comerciales existentes. El precio visible, el valor
numérico y los precios escritos en variantes no se recalculan automáticamente.
Revisarlos juntos al editar. El checkout actual solicita cotización y confirmación;
no procesa pagos ni constituye una confirmación automática de precio/disponibilidad.

Al recargar la tienda conectada, se revalidan los productos del carrito y se
actualizan sus referencias. Una variante eliminada o un producto oculto se retira
del pedido guardado. Durante una caída de conexión no se permite enviar ese pedido
con referencias antiguas. Todavía no se revalida durante una sesión larga; requiere
recargar. Validación final en servidor se añadirá antes de procesar pagos.

## Disponibilidad y separación

Supabase Free puede pausar proyectos de baja actividad durante siete días. Es
adecuado para comenzar y probar, pero revisar el plan antes de depender de él en
producción. No se ha contratado ningún plan ni creado un proyecto desde esta entrega.
Si falla el catálogo conectado, la tienda avisa y ofrece contacto por WhatsApp;
no vuelve automáticamente a los precios de la copia estática.

Usar un proyecto de desarrollo distinto del futuro proyecto de producción: la
rama separa código, pero una misma base de datos compartiría las ediciones.
El HTML del login es público; los datos y las escrituras están protegidos por
Supabase Auth y RLS. Un Preview de Cloudflare tampoco es privado por defecto.

## Referencias oficiales

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/general-configuration
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/platform/free-project-pausing

## Dependencia incluida

`vendor/supabase-2.117.3.js` es la distribución UMD oficial de
`@supabase/supabase-js` 2.117.3, licencia MIT incluida en
`vendor/SUPABASE-LICENSE.txt`. Se sirve localmente, sin depender de un CDN en el login.
