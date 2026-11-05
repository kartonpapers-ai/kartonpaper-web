# Doypack: cantidades personalizadas

Las seis medidas de doypack kraft con ventana y Ziplock se ofrecen personalizadas
en 100, 200 o 500 unidades: 10×15+3, 12×20+4, 14×20+4, 16×24+4, 20×29+5 y 25×35+5 cm.
Se fracciona el embalaje del proveedor. El alcance de impresión por una o ambas
caras y los precios por tramo quedan pendientes de definir; se conservan los
precios unitarios de referencia y las características existentes.

Seleccionar una medida abre esa misma medida en el formulario y ofrece únicamente
100, 200 y 500 unidades. El carrito avanza 100 → 200 → 500 y retrocede 500 → 200 → 100.
No admite cantidades intermedias; una solicitud duplicada que produciría un total
no permitido se bloquea con una indicación para ajustar el pedido en el carrito.

Ejecutar `supabase/22-doypack-cantidades.sql` en SQL Editor del proyecto conectado.
Solo añade `quantityRules` a la ficha existente; conserva nombres, fotos, variantes,
precios, orden, publicación y demás productos. Puede repetirse sin cambiar datos
que ya coincidan. Al recargar, la tienda revalida los pedidos guardados y elimina
los que no cumplan las nuevas cantidades.

Validación: `node tests/test-doypack-cantidades.cjs`.
