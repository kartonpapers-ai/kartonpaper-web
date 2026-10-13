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

Los productos con precio por unidad neto y opciones del tipo `Pack 50 u. ($33.500)`
activan el cálculo de packs. Editar **Precio por unidad, neto (CLP)** actualiza la
vista previa del texto visible y cada total (cantidad × precio). Guardar envía los
tres campos juntos a Supabase; no hace falta ejecutar SQL ni cambiar la tienda.
El cálculo usa pesos enteros, permite cero y rechaza negativos o totales inválidos.

Desactivar **Calcular packs desde el precio por unidad** permite cantidades nuevas,
descuentos o precios especiales; esa elección se conserva al guardar. Cotizaciones,
medidas, cajas y packs con precio propio mantienen el modo manual. En ese modo hay
que revisar por separado texto, referencia numérica y opciones. No se calculan IVA,
descuentos ni promociones. Si había valores inconsistentes, el modo automático
parte del precio por unidad escrito en el texto visible: revisar los totales antes
de guardar. Recargar la tienda Preview para ver los cambios.

El checkout actual solicita cotización y confirmación;
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

## Agregar productos y fotos

Activación en el proyecto de desarrollo existente:

1. Ejecutar una sola vez `supabase/04-nuevos-productos.sql` en una consulta nueva
   de SQL Editor. No repetir 01, 02 ni 03. La migración conserva los productos,
   activa INSERT solo para el administrador y crea el bucket `kp-productos`.
2. Subir los archivos de esta entrega a la rama `desarrollo/admin`, conservando
   carpetas. Abrir el nuevo Preview o el alias `desarrollo-admin…/admin/`.
3. Pulsar **Agregar producto**. Completar nombre, categoría, forma de venta,
   descripción, características y opciones. Reutilizar una foto del catálogo o
   subir JPG/PNG/WebP. Cada producto recibe un identificador único automático.
4. Para packs, seleccionar Compra de packs o Packs y personalización y editar
   el precio por unidad. Las cantidades iniciales 50/100/200 son ejemplos:
   ajustarlas antes de publicar. Para cotizaciones, mantener el modo manual.
5. Crear producto. Comienza oculto. Revisar todos los datos; activar
   **Mostrar en el catálogo**, guardar y recargar la tienda del mismo Preview.

Prueba de aceptación: crear un producto de prueba oculto con foto; comprobar que
no aparece en la tienda. Publicarlo y comprobar categoría, imagen, precio,
variantes, personalización o carrito según su forma de venta. Después ocultarlo.
También probar en móvil. La subida real a Supabase requiere esta activación;
las pruebas locales usan un servicio simulado para el flujo de subida.

Las fotos son públicas, incluso si el producto está oculto: usar solo imágenes de
catálogo. No subir archivos privados de clientes. El navegador conserva proporción,
no amplía originales, reduce a 1600 px como máximo y convierte a WebP; si el archivo
sigue pesado intenta 1000 px. Se admite un original de hasta 10 MB y 24 megapíxeles;
el archivo resultante debe pesar como máximo 1 MB. Los nombres son únicos para
no sobrescribir fotos ni depender de invalidar caché.

Si la foto se sube pero falla el guardado del producto, el mismo formulario la
reutiliza al reintentar. Si se cierra la pestaña o se descarta, puede quedar una
foto sin producto asociado. La limpieza y eliminación de fotos se implementarán
más adelante; no se borra automáticamente una foto que otro producto podría usar.

La ruta de Storage admitida por la migración está limitada al proyecto de desarrollo
`qdclylextthpzxtijvpx`. Para una base de producción nueva, adaptar esa URL antes
de ejecutar la migración. No se ha publicado este cambio en main.

## Heroes y promociones

Activación en desarrollo:

1. Ejecutar una sola vez `supabase/05-heroes.sql` en una consulta nueva. Crea
   `kp_campaigns`, sus permisos y el bucket `kp-heroes`. Carga los siete heroes
   originales sin tocar precios ni productos. No repetir las migraciones 01–04.
2. Subir esta entrega a `desarrollo/admin` conservando las carpetas. Abrir el
   último Preview o `https://desarrollo-admin.kartonpaper-web.pages.dev/admin/`.
3. Entrar en **Heroes y promociones**. También se puede abrir `/admin/campanas.html`.
   Reutiliza la sesión de la pestaña; el acceso sigue limitado al administrador.
4. Editar un hero existente o Crear campaña. Completar título, segunda parte
   opcional, descripción, imagen y su descripción accesible, botones y hasta tres
   características. La composición mantiene la imagen a ancho completo debajo
   del texto. El fondo menta y el velo de lectura permanecen.
5. Revisar la vista previa en escritorio y móvil. Activar y guardar cuando esté
   listo; una campaña nueva comienza oculta. Recargar Ver tienda del mismo Preview.

Imágenes: original JPG/PNG/WebP hasta 10 MB y 24 megapíxeles. Recomendado 1920×1080,
con área limpia para texto a la izquierda y producto protagonista a la derecha.
Se optimiza a WebP hasta 1920 px (1600 px si es necesario), máximo 1 MB. El archivo
no se amplía y se conserva proporción. Las fotos del bucket son públicas aun si la
campaña está oculta; usar solo material de portada. No se genera ni recompone una
escena con IA. Se puede reutilizar cualquiera de las imágenes de los heroes.

**Usar producto** prepara un borrador de título y descripción y un botón hacia
ese producto. No inserta precios en el hero ni ofrece descuentos por sí solo.
Revisar los textos antes de guardar. Un texto con precio escrito manualmente
requiere actualización manual si cambia el catálogo. Los descuentos reales se
configuran en Productos. No hay detección automática de productos de baja venta.

Botones: Ver categoría, Ver producto (lleva a su tarjeta), Personalizar producto
(abre el formulario para productos que admiten personalización), o el WhatsApp
habitual de KartonPaper. No se admiten enlaces externos arbitrarios. Si un producto
se oculta después, una campaña dirigida a él deja de mostrarse al recargar.

Programación: fechas opcionales de inicio y término, en la zona horaria del equipo
que muestra el formulario. Se guardan en UTC y la base de datos solo entrega al
público campañas activadas dentro del período vigente. Inicio inclusivo, término
exclusivo; término debe ser posterior a inicio. Campañas futuras aparecen en nuevas
visitas o al recargar. En una página ya abierta se retiran las campañas al terminar
su período, sin volver a textos antiguos. No se envían recordatorios ni se publican
redes sociales. Menor Orden de aparición = primero; a igualdad se ordena por ID.

Si todas las campañas están ocultas, finalizadas o la conexión falla, se oculta
el hero y el catálogo sigue disponible. Con Supabase desactivado se conservan
los siete heroes estáticos del HTML. El nuevo HTML evita mostrar esa copia antigua
mientras se carga la portada conectada.

Prueba de aceptación: editar un hero, guardar y confirmar texto/imagen y botón en
la tienda. Crear una campaña oculta con imagen propia; revisar ambos tamaños;
activarla sin fechas para comprobarla. Programar inicio futuro para verificar que
no aparezca todavía; poner término pasado para comprobar que se retire. Volver a
ocultar la campaña de prueba. No publicar en main antes de completar esta revisión.

Los tests de PostgreSQL verifican permisos, fechas, formatos, conflictos y carga de
los siete heroes. La interfaz y la subida se prueban con un servicio simulado; la
subida y las vistas reales se verifican tras activar la migración en Cloudflare.
La migración limita fotos al proyecto `qdclylextthpzxtijvpx`; adaptar esa referencia
antes de usarla en un proyecto de producción distinto.

### Hero por capas con transparencia

Cada campaña puede usar **Producto transparente + fondo editable** o **Escena
completa**. Los siete heroes originales permanecen como escenas completas; las
campañas nuevas proponen el formato por capas.

En el formato por capas, el producto es una imagen recortada PNG/WebP y el fondo
se dibuja con CSS, como color uniforme o degradado de dos colores. El título,
texto, botones y características siguen en HTML. Hay controles independientes
para tamaño y posición horizontal en escritorio y móvil. En pantallas de hasta
1000 px el producto aparece debajo del texto. Un velo claro protege la lectura.
La vista previa móvil contempla la altura adicional de esta composición.

Subir una imagen recortada: el panel verifica que tenga píxeles transparentes y
conserva el canal alfa al convertir a WebP. No recorta productos ni elimina fondos.
Un PNG opaco requiere editarse antes o utilizar Escena completa. Si se reutiliza
una imagen de escena con fondo en el modo por capas, su fondo sigue siendo visible;
seleccionar un recorte adecuado. La sombra CSS es suave y puede sumarse a una
sombra incluida en el propio recorte.

Esta entrega actualizada incluye las capas en `05-heroes.sql`. Si todavía no se
ejecutó esa migración, ejecutar el 05 actualizado. Si ya se ejecutó la versión
anterior de 05, ejecutar únicamente `06-capas-hero.sql`; no repetir 05. El 06
actualiza los controles de validación sin modificar las campañas existentes.
Usar el ZIP actualizado `kartonpaper-paso-6-heroes-capas.zip` para subir el código.

Prueba adicional: crear una campaña por capas con un PNG transparente, cambiar
ambos colores y los controles de tamaño/posición, revisar escritorio y móvil,
guardar y comprobarla en la tienda Preview. No se han convertido automáticamente
las siete escenas anteriores en recortes transparentes.

## Biblioteca de heroes · paso 7

Ejecutar `supabase/07-biblioteca-heroes.sql` una vez después de 05. No requiere
repetir 05 o 06. El SQL crea `kp_hero_assets`, con lectura e inserción reservadas
al administrador por permisos y RLS. Los productos y campañas permanecen intactos.
También permite reutilizar las direcciones del bucket `kp-productos` en campañas
y valida cinco colores opcionales, estrictamente hexadecimales.

La biblioteca vive en Heroes y promociones. Reúne fotos del catálogo, de campañas
y subidas independientes, sin repetir direcciones. Tiene búsqueda, filtro por
categoría y selección con descripción accesible. Las nuevas fotos pasan por el
optimizador existente y se almacenan en `kp-heroes`. La subida y el registro se
realizan antes de usarlas; si falla el registro se puede reintentar sin otra subida.
No elimina fondos, no comprime de nuevo las fotos actuales y no incluye borrado.

Las campañas nuevas parten ocultas, con fondo blanco y colores editables. Las
anteriores conservan sus valores y el color heredado mientras no se personalice.
Se aceptan JPG de producto con fondo blanco y PNG/WebP transparentes. Comprobar
el tono del fondo real y la resolución antes de publicar. Las campañas nuevas no añaden sombra artificial, para evitar un rectángulo
sombreado en fotos blancas. El control «Añadir sombra suave» puede activarse en
recortes; campañas anteriores conservan su sombra mientras no se desactive.
