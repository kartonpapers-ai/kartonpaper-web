# Portada editorial: producto protagonista

La portada implementa el hero aprobado en `KartonPaper_hero_producto_protagonista.html`.
El titular «Tu marca merece ser vista.» permanece fijo. Los seis selectores cambian
la foto, el mensaje de apoyo, la descripción, el pie y la acción principal. Las categorías rotan automáticamente cada 3 segundos, con transición de imagen de
1,6 segundos. El titular permanece fijo. Pausar detiene la rotación y la animación;
Reanudar permite continuar. Repetir animación vuelve a mostrar la entrada del titular.
La rotación se suspende al pasar el puntero sobre el hero, al enfocar sus controles,
al salir del área visible o al ocultar la pestaña. Con movimiento reducido no hay
rotación automática ni transiciones. Las actualizaciones automáticas no se anuncian
repetidamente al lector de pantalla.

## Fotos iniciales

| Categoría | Archivo curado |
| --- | --- |
| Repostería | `images/reposteria-caja-6-alfajores.webp` |
| Gastronomía | `images/bagasse-caja-pollo-1.webp` |
| Bolsas | `images/bolsa-papel-kraft-asa-plana.webp` |
| Doypack | `images/doypack-kraft-ventana.webp` |
| Cerveza | `images/beer-maleta-3x330-approved.webp` |
| Posavasos | `images/posavasos-chile-souvenir.webp` |

Estos valores iniciales están definidos expresamente en `js/hero-editorial.js`
y en el HTML para la primera carga. No se elige automáticamente cualquier archivo
nuevo de la galería ni la primera foto de un producto. Subir una foto a la biblioteca
o editar una foto de catálogo no reemplaza por sí solo la portada: debe aplicarse
a una campaña compatible y guardarse, o actualizarse deliberadamente el valor curado.

## Usar el administrador existente

1. Entrar en `/admin/campanas.html` y elegir una campaña o **Crear campaña**.
2. Elegir la composición por capas (`layered`), fondo sólido y color blanco exacto
   `#ffffff`. Una escena completa, un degradado u otro color no sustituye una categoría
   de esta portada.
3. En **Biblioteca de imágenes · elegir o subir una foto**, seleccionar una foto de
   catálogo, de campaña o una subida propia; aplicarla a la campaña. Usar una foto
   de producto sobre blanco o transparente y completar su descripción accesible.
   El panel optimiza las fotos; no elimina el fondo.
4. Completar **Título** y **Segunda parte del título**: juntos forman el mensaje de
   apoyo de esa categoría. **Descripción** forma el párrafo inferior. La descripción
   accesible de la foto se usa también como pie. Ninguno reemplaza el h1 fijo.
5. Configurar el botón principal hacia una de las seis categorías, o hacia un
   producto existente de esa categoría mediante **Ver producto** o **Personalizar
   producto**. Un destino «Todo el catálogo» o WhatsApp no permite asignar una categoría.
6. Activar, revisar fechas, guardar y recargar **Ver tienda**. Si varias campañas
   compatibles apuntan a una categoría, gana la primera por orden de aparición y,
   a igualdad, por ID. Las categorías sin campaña compatible conservan su foto curada.

Solo se incorporan campañas publicadas y vigentes: inicio inclusivo, término
exclusivo. Las referencias a productos deben seguir siendo válidas en el catálogo
público, también en el botón secundario; personalización requiere un producto que
la admita. Al finalizar una campaña, su categoría vuelve al valor curado cuando se
revalida la portada. No se toma automáticamente otra foto de la biblioteca.

La acción principal conserva la etiqueta configurada: puede filtrar categoría,
llevar a la tarjeta del producto o abrir su personalizador. «Cotizar con mi logo»
sigue siendo la acción fija de WhatsApp y actualiza su mensaje según la categoría.

La vista previa del administrador mantiene el renderizador de campañas existente.
La integración editorial usa su propia composición: no aplica posiciones, tamaños,
sombra, colores personalizados, características, etiquetas sobre imagen ni botón
secundario de aquella vista previa. Revisar el resultado final en **Ver tienda**.
Las campañas antiguas con escena completa siguen guardadas y editables en el panel;
están excluidas de este hero, sin borrar sus archivos ni registros.

## Archivos y alcance

- `index.html`: composición, h1 fijo, seis selectores y carga de módulos.
- `css/hero-editorial.css`: estilos limitados al hero, tipografía y adaptación móvil.
- `js/hero-editorial.js`: valores curados, selección, animaciones y adaptación de campañas.
- `js/heroes.js`: conserva validación, fechas y carga de campañas; delega el render
  a `KP_EDITORIAL` cuando la sección declara `data-editorial`.
- `fonts/bricolage-grotesque.woff2` y `fonts/dm-sans.woff2`: fuentes locales.
  Distribución original: paquetes npm `@fontsource-variable/bricolage-grotesque`
  y `@fontsource-variable/dm-sans`, archivos Latin WOFF2.
  Los proyectos de origen son Bricolage Grotesque
  (`https://github.com/ateliertriay/bricolage`) y DM Sans
  (`https://github.com/googlefonts/dm-fonts`); ambas licencias OFL están en `fonts/LICENSES.txt`.
- `DESIGN.md` y `.impeccable/design.json`: tokens y extensiones de esta superficie.

El catálogo, sus precios y filtros, carrito, personalizador y logo mantienen sus
reglas existentes. Esta entrega no introduce un nuevo sistema visual para el resto
del sitio. Con campañas ausentes o sin conexión, el hero mantiene sus seis valores
curados; esto no modifica el tratamiento de fallos del catálogo conectado.


## Campaña de envoltorios · octubre 2026

Repostería abre con «Dulces por dentro. Inolvidables por fuera.» y cotización de
**envoltorios**, sin cambiar los precios ni el catálogo. Imágenes generadas con IA,
no fotografías de fabricación real. El texto se conserva en HTML/JS, fuera del
bitmap. Las otras categorías recuperan el titular habitual y su composición.

`picture` elige la composición móvil hasta 900 px y la horizontal en escritorio.
En móvil, la copia fluye encima de la fotografía; el encuadre retira solo la franja
blanca superior, conservando el arte de los productos. El texto ampliado puede
crecer sin superponerse a la foto. Archivos WebP en
`images/campanas/envases-con-personalidad/hero/`.

Una campaña válida del administrador para Repostería sigue teniendo prioridad y
recupera la composición normal. Rotación, pausa, teclado y movimiento reducido
mantienen el comportamiento existente. No se agrega un editor de imágenes al panel.
