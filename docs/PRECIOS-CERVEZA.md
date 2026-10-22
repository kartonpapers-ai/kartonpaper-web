# Precios de cerveza aprobados · 22-10-2026

Todos los valores son netos, en pesos chilenos. Agregar IVA del 19%.

| Producto | SKU base | 50 u. c/u | 100 u. c/u | 200 u. c/u | 300 u. c/u | 400 u. c/u |
|---|---|---:|---:|---:|---:|---:|
| Maleta 3 × 330 cc | KP-CER-M3-330 | $900 | $700 | $670 | — | — |
| Wrap 4 × 330 cc | KP-CER-W4-330 | $360 | $310 | $310 | $295 | $285 |
| Wrap 6 × 330 cc | KP-CER-W6-330 | $500 | $450 | $450 | $430 | $415 |
| Wrap 4 × 500 cc | KP-CER-W4-500 | $510 | $460 | $460 | $440 | $425 |
| Wrap 2 × 500 cc | KP-CER-W2-500 | $400 | $350 | $350 | $335 | $325 |
| Maleta 2 botellas + vaso | KP-CER-M2V | $750 | $700 | $700 | $670 | $650 |

Cada pack tiene el sufijo P050, P100, P200, P300 o P400. Los packs de 50 de los cuatro wraps y de la maleta 2 botellas + vaso llevan además el sufijo SI y la indicación «Sin impresión». La maleta de 3 × 330 cc conserva los SKU aprobados sin ese sufijo.

## Aplicar en el catálogo conectado

La rama desarrollo/admin carga el catálogo desde Supabase. Subir archivos a GitHub no modifica esa base de datos.

1. Ejecutar `supabase/14-precios-cerveza-20261022.sql` en el SQL Editor del proyecto conectado.
2. Comprobar que la consulta final devuelve los seis productos y sus packs.
3. Recargar la tienda del despliegue de esta rama y probar un pack de cada producto.

La actualización conserva nombres, imágenes, descripciones, visibilidad y orden. Puede repetirse: no modifica filas que ya tienen estos mismos precios y SKU. No se debe repetir después de acordar nuevos precios sin revisar antes el archivo.

El catálogo estático contiene la misma escala para el modo sin conexión configurada. No sustituye al catálogo remoto cuando la conexión está activada.

## Carrito y personalización

Seleccionar un pack actualiza el precio unitario y muestra su neto y SKU. El carrito guarda el SKU, unidades por pack y total neto; multiplicar packs actualiza el subtotal. WhatsApp y email incluyen neto, IVA y total de cada línea.

«Con mi logo» continúa como solicitud de cotización; no toma automáticamente el precio de un pack sin impresión. Las configuraciones de la maleta 2 botellas + vaso se conservan en la solicitud de personalización.

Los precios estructurados están en `packs` dentro del producto. Para futuras modificaciones, actualizar juntos `packs`, `variants`, `price` y `priceNum`; el editor de texto de variantes por sí solo no modifica los importes estructurados.

## Verificación

`node tests/test-beer-pricing.cjs` comprueba los 28 packs, SKU, subtotales, catálogo estático/remoto, carrito, mensaje de pedido y validación de datos.
