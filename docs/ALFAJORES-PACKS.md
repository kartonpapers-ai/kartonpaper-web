# Caja con ventana para 3 alfajores

Precios aprobados el 22 de octubre de 2026. Valores netos en CLP.

| Modalidad | Unidades | Neto/u | Neto del pack | Con IVA 19% |
| --- | ---: | ---: | ---: | ---: |
| Blanca sin impresión | 25 | $400 | $10.000 | $11.900 |
| Blanca sin impresión | 50 | $350 | $17.500 | $20.825 |

La ficha ofrece compra de packs sin impresión y cotización personalizada desde
100 unidades. Se conserva la referencia personalizada de $391 + IVA/u y las
opciones 100, 250 y 500 unidades; el carrito personalizado mantiene «Cotización
con logo», sin trasladar el precio del pack blanco a la personalización.

SKU base `KP-REP-A3`; packs `KP-REP-A3-P025-SI` y `KP-REP-A3-P050-SI`.

Para activar en la tienda conectada, ejecutar `supabase/16-caja-3-alfajores-packs.sql`
en SQL Editor de Supabase. Devuelve una fila con precio, packs y opciones de
personalización. Conserva nombre, imagen, publicación y orden; puede repetirse
sin cambiar filas que ya coinciden. No ejecutar después de aprobar nuevos precios
sin revisar sus valores. La copia estática aplica el mismo modelo.

Verificación: `node tests/test-alfajores-packs.cjs`.

La opción «Pack 100 u. · Con logo ($39.100 + IVA)» aparece junto a los packs blancos.
Seleccionarla muestra $391/u y ofrece personalizar el pack; abre la carga del archivo
con 100 unidades seleccionadas. El total de referencia con IVA es $46.529. No se
agrega como pack blanco al carrito. Para activarla en el catálogo conectado, ejecutar
`supabase/17-caja-3-alfajores-logo.sql` después del archivo 16. No volver a ejecutar
el archivo 16 después del 17: el 16 corresponde al modelo anterior de dos packs.
