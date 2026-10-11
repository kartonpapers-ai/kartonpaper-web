# Inventario inicial para el panel y el asistente

Fuente: código de la rama `main`, commit `3eb5f2e6cf4e13e416fa5a2abfc00d4f11ddffd8`.
Estos son datos observados en la web; no equivalen a una confirmación comercial.

| Área | Estado actual |
| --- | --- |
| Productos | 20 entradas en `productsDB`, dentro de `index.html` |
| Categorías | Cerveza, repostería, gastronomía, bolsas, doypack y posavasos |
| Hero | 7 slides con imágenes y textos dentro del HTML |
| Precios | Texto de presentación y, en algunos productos, `priceNum` |
| Variantes | Listas de textos; mezclan medida, configuración, cantidad y precio |
| Carrito | Se guarda en el navegador con `localStorage` |
| Cotización | Prepara un mensaje para WhatsApp o correo |
| Archivo gráfico | El flujo guarda el nombre seleccionado; no existe un backend de recepción |
| Chat | El botón actual abre WhatsApp; no existe asistente en la web |
| Contenido editorial | Página Ideas y artículo Packaging en delivery |
| Administración | No existe panel, login ni base de datos central |

## Campos propuestos para ordenar el catálogo

- Identificador estable, nombre, categoría y descripción.
- Imagen principal y texto alternativo.
- Material, capacidad o dimensiones, con unidades explícitas.
- Variantes separadas: medida, color, configuración y cantidad por embalaje.
- Modalidad de venta y personalización, zonas imprimibles y requisitos de archivo.
- Precio numérico y su base: unidad o paquete, neto o IVA incluido.
- Cantidad mínima, escalones de pedido y condición de disponibilidad.
- Visibilidad, orden y estado: borrador o publicado.

El precio presentado se derivará de los datos numéricos aprobados. No se deben
mantener dos valores editables que puedan contradecirse.

## Información que debe confirmarse antes de automatizar respuestas

1. Cerveza: el código actual incluye packs sin impresión y mínimos de 50 unidades.
   Confirmar qué modalidades y mínimos deben ofrecerse realmente.
2. Precios: hay valores por unidad y por paquete. Confirmar su base e IVA por
   producto antes de permitir cálculos automáticos.
3. Gastronomía: el catálogo no expresa cantidades por embalaje ni mínimos en
   campos propios. El modelo C205/2 no figura como entrada independiente.
4. Archivo gráfico: confirmar formatos aceptados y requisitos de preparación.
   El asistente no aprobará por sí solo un diseño para la SC300.
5. Plazos: distinguir fecha solicitada por el cliente de plazo confirmado por
   Jorge. No prometer disponibilidad o entrega sin datos aprobados.
6. Enlaces: hoy los filtros funcionan con botones y eventos del navegador;
   no hay un enlace estable propio para abrir cada producto desde una consulta.

Estos puntos quedan pendientes de la siguiente etapa. Esta entrega no modifica
los productos, precios ni reglas de venta existentes.
