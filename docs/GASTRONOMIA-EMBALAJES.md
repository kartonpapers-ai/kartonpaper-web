# Gastronomía: embalajes completos y margen mínimo

La venta es exclusivamente personalizada, con impresión en la parte superior de
la tapa y cantidades múltiplos del embalaje de proveedor. La regla de Gastronomía
es un mínimo de 45% sobre la venta neta, considerando todos los costos registrados;
no equivale a sumar 45% al costo. Sin comisión, precio mínimo = costo completo / 0,55.
Con comisión sobre la venta neta se descuenta también su porcentaje del divisor.

| Producto | Unidades por embalaje | Primeras opciones |
| --- | ---: | --- |
| Caja Pollo 1 | 200 | 200, 400, 600, 800, 1.000 |
| Porta sándwich 6×6 | 500 | 500, 1.000, 1.500, 2.000, 2.500 |
| Bowl 850 con tapa | 300 | 300, 600, 900, 1.200, 1.500 |
| C205 900 ml | 250 | 250, 500, 750, 1.000, 1.250 |
| C205/2 900 ml, pendiente de alta | 250 | 250, 500, 750, 1.000, 1.250 |

Se verificaron cuatro fichas en el catálogo público conectado. C205/2 no existe en
esa fuente ni tiene imagen propia en el repositorio; no se creó una ficha con
foto o precio inventados. El archivo 20 incluye su regla para el identificador
`bagasse-colacion-c205-2` si la ficha ya existe al ejecutarlo. Crear esa ficha y
volver a aplicar el archivo 20 cuando se cuente con su información.

La tarjeta ofrece cinco cantidades iniciales. La personalización permite ingresar
otros múltiplos completos hasta 1.000.000 de unidades. El carrito aumenta o reduce
un embalaje por vez; el mensaje de pedido indica número de embalajes y unidades.
Las solicitudes con cantidades anteriores que no cumplan la nueva regla se quitan
del carrito guardado al recargar. El cliente debe volver a seleccionar su cantidad.

Finanzas inicia fichas nuevas con el tamaño del embalaje y 45% de margen mínimo.
Una ficha anterior con mínimo menor se ajusta en el editor y requiere guardar;
la simulación aplica como mínimo 45% para Gastronomía y queda pendiente si la
cantidad no corresponde a un embalaje completo. El guardado en Supabase también
rechaza mínimos menores de 45% y cantidades fuera del embalaje. Los respaldos
antiguos deben cumplir estas reglas antes de importarse.

Ejecutar `supabase/20-gastronomia-embalajes-margen.sql` después del archivo 09. Incluye
la validación de preparación y embalaje del 19. No modifica los costos privados,
los precios unitarios existentes, nombres, imágenes, publicación u orden. No volver
a ejecutar 09 o 19 después del 20 sin repetir el 20, pues reemplazan su validación.
La consulta final devuelve las cuatro fichas existentes y sus cantidades/margen.

Los precios actuales continúan como referencias; la solicitud conserva «Cotización
con logo». No se garantiza un margen real con costos incompletos ni se publican
nuevos precios automáticos. Preparación, embalaje, merma observada, comisión y
traslado asignado deben completarse y revisarse sin duplicar costos.

Validación: `tests/test-gastronomia.cjs`, `tests/test-finanzas.cjs`,
`tests/test-panel.cjs`, `tests/test-alfajores-packs.cjs`, `tests/test-beer-pricing.cjs`.
