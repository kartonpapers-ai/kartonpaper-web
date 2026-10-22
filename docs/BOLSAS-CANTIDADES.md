# Bolsas personalizadas: cantidades por medida

Kraft y blancas conservan productos, imágenes y precios unitarios de referencia
separados. El modelo acordado admite estas cantidades:

| Medida | Cantidades |
| --- | --- |
| 14 × 20 × 8 cm | 100, 200 o 500 unidades |
| 14 × 40 × 8 cm | 400, 800, 1.200… |
| 22 × 30 × 10 cm | 400, 800, 1.200… |
| 30 × 41 × 12 cm | 200, 400, 600… |
| 45 × 48 × 15 cm | 150, 300, 450… |

La pequeña permite fraccionar el embalaje del proveedor. Las demás se venden por
embalajes completos. Todas las opciones continúan exclusivamente personalizadas.
El número de caras impresas y nuevos precios por tramo siguen pendientes de definir.
No se ha aplicado a bolsas la política de margen mínimo específica de Gastronomía.

Seleccionar medida en la tarjeta y pulsar «Con mi logo» abre esa medida en el
formulario. La pequeña ofrece un selector de 100, 200 o 500; las otras permiten
escribir múltiplos válidos hasta 1.000.000 de unidades. Cambiar la medida actualiza
las cantidades. El carrito de la pequeña pasa de 100 a 200 a 500, y el de las otras
avanza un embalaje. Si sumar otra solicitud igual produce una cantidad no permitida,
se mantiene el pedido existente y se pide ajustar la cantidad en el carrito.

Los envíos de bolsas no heredan el mensaje «impresión en tapa» de Gastronomía.
Al volver a la tienda se validan cantidades y opciones contra el catálogo vigente;
se descartan solicitudes anteriores que no cumplan las nuevas cantidades.

Ejecutar `supabase/21-bolsas-cantidades-por-medida.sql` en SQL Editor del proyecto
conectado. Requiere las dos fichas de bolsas en modo personalizado. Solo añade
`quantityRules`; conserva nombres, imágenes, variantes, precios, publicación y orden.
Los criterios se relacionan por medida sin el importe de la variante, para que un
cambio de precio no rompa la relación. Si cambia una medida, actualizar su regla.
No modifica fichas de costos ni los productos de otras categorías.

Pruebas: `tests/test-bolsas-cantidades.cjs`, `tests/test-gastronomia.cjs`,
`tests/test-alfajores-packs.cjs` y `tests/test-beer-pricing.cjs`.
