# Panel de control y finanzas privadas

Esta entrega reúne **Productos**, **Precios**, **Campañas** y **Finanzas** en
`/admin/`. Conserva el hero editorial público. Los importes del panel financiero
se expresan en CLP netos por unidad, salvo los campos que indican pedido o compra.

## Activar en desarrollo

En un proyecto que ya tiene el administrador y las migraciones anteriores activos:

1. Descomprimir el ZIP de esta entrega y subir sus archivos a `desarrollo/admin`,
   conservando las carpetas. Revisar el Preview de esa rama antes de pasar a `main`.
   El JSON privado de costos se entrega por separado: no incluirlo en esa subida.
2. Ejecutar completo `supabase/09-finanzas-privadas.sql` en SQL Editor del proyecto
   de desarrollo. No repetir 01–08. El archivo 09 requiere la autorización
   `kp_is_admin()` y el esquema privado creados por las migraciones anteriores.
3. Abrir el Preview en `/admin/`, iniciar sesión con el administrador autorizado y
   entrar en **Finanzas**. Si aparece **Activar el guardado privado**, pulsar
   **Actualizar** después de ejecutar el SQL.
4. Abrir **Importar mis costos o un respaldo**. En **Archivo privado de costos
   (.json)** elegir la copia local de `KartonPaper_costos_privados.json`.
5. Revisar cuántas fichas nuevas detecta el panel y pulsar **Agregar fichas
   faltantes**. Se agregan solo identificadores inexistentes; las fichas guardadas
   se conservan. Reimportar el respaldo no actualiza fichas existentes.
6. Pulsar **Revisar** en cada ficha, completar costos pendientes, confirmar la
   unidad o medida y guardar con **Guardar ficha privada**. Marcar **Revisé todos
   los costos, incluidos los valores cero.** solo después de esa revisión.

La entrega inicial separada contiene 37 fichas, 25 con costo base conocido. Los
costos adicionales desconocidos quedan vacíos y todas comienzan sin revisión.
Un dato pendiente no equivale a cero. Para una instalación nueva, preparar primero
el administrador siguiendo `ADMINISTRADOR.md`.

## Qué hace cada módulo

| Módulo | Comportamiento |
| --- | --- |
| Productos | Buscar, agregar y editar productos, fotos, opciones y visibilidad; guardar cambios del catálogo. |
| Precios | Consultar precios públicos y opciones. **Editar precio** abre la ficha del producto en **Precio y opciones de venta**. |
| Campañas | Abrir `/admin/campanas.html`, cuyo título es **Heroes y promociones**, para administrar campañas y su biblioteca existente. |
| Finanzas | Crear fichas privadas por producto y variante, importar costos, simular rentabilidad y **Exportar respaldo**. Guardar aquí no cambia precios públicos. |

El resumen muestra productos, visibles en tienda, fichas de costos y costos
revisados. Este último contador incluye solo fichas cuyo cálculo está completo,
con costos necesarios informados y confirmación de revisión.

## Cálculo y unidades

Confirmar siempre que el costo y la venta correspondan a la misma unidad y medida.
Un precio de pack no se usa directamente como venta unitaria. **Calcular desde un
embalaje** divide **Compra neta total** por **Unidades por compra** al pulsar
**Usar costo por unidad**. El panel reconoce algunas referencias unitarias del
catálogo; si indica que no identificó el precio, completar **Venta normal neta/u**.
La ficha usa el precio ingresado para el análisis, aunque cambie el catálogo.

Con `m` como merma, `f` como comisión y `g` como margen, todos expresados como
fracciones entre 0 y 1:

```text
base con impresión = costo base + costo por impresión × impresiones por unidad
fabricación/u = (base con impresión + mano de obra + otros costos) / (1 − m)
costo completo/u = fabricación/u + gastos por pedido / unidades vendibles
precio para margen g = redondear hacia arriba(costo completo/u / (1 − f − g))
venta simulada/u = redondear hacia abajo(venta normal neta/u × (1 − descuento))
ganancia/u = venta simulada/u − costo completo/u − venta simulada/u × f
margen = ganancia/u / venta simulada/u
```

La merma representa la fracción no aprovechable de fabricación: 10% significa
dividir el costo directo por 0,90. La comisión se descuenta de la venta neta.
Los gastos por pedido se distribuyen entre las unidades vendibles indicadas.
El objetivo inicial es **45%** y el margen excepcional **40%**; ambos son editables.
El punto de equilibrio usa margen cero e incluye la comisión. Los precios mínimos
se redondean hacia arriba a pesos enteros. El descuento máximo mostrado conserva
el margen objetivo y se redondea hacia abajo a una décima porcentual.

En cerveza, el costo base debe incluir la impresión: el panel fija impresión
adicional e impresiones por unidad en cero. En las demás categorías propone
inicialmente $40 por impresión y una impresión; confirmar el dato real.

**Costos pendientes** impide presentar un margen completo. Hay que completar base,
mano de obra, otros costos, merma, comisión y gastos por pedido, y confirmar la
revisión. Cuando no existe un concepto, ingresar cero de forma consciente.

Con los costos completos, los estados son **Sin venta**, **Cumple objetivo**,
**Solo excepcional**, **Bajo mínimo** o **Pérdida**. La ganancia del pedido es la
ganancia unitaria multiplicada por las unidades vendibles. Es una simulación con
los costos registrados; no constituye ganancia contable ni registra ventas
realizadas. El IVA del 19% se calcula aparte sobre el subtotal neto del pedido y
se suma únicamente en **Total a facturar**. No integra el margen ni la ganancia.
**Descuento a simular (%)** no publica una oferta ni modifica el catálogo.

## Privacidad y respaldo

`kp_finance` almacena costos separados de `kp_products`. El SQL no contiene costos
ni actualiza precios. Habilita RLS y permite leer, insertar y actualizar solo al
usuario autenticado que cumple `kp_is_admin()`. No concede borrado. La función
`kp_import_finance` usa los permisos del usuario y agrega únicamente fichas
faltantes. La base valida importes, porcentajes y revisión; cada actualización
incrementa la versión para detectar cambios de otra sesión.

No subir el JSON privado a GitHub, carpetas públicas del sitio, Storage público,
SQL de semillas ni ZIP de código. Importarlo desde el archivo local después de
autenticarse. **Exportar respaldo** descarga las fichas guardadas en formato
`kartonpaper-finance-v1`; conservar esa descarga de forma privada. La contraseña
y las claves secretas de Supabase tampoco pertenecen al código del sitio.

## Verificación pendiente en el Preview

La documentación describe el código; no acredita una revisión en navegador ni una
importación real. Después de activar el archivo 09, comprobar acceso denegado sin
sesión y con un usuario no administrador, importación inicial y repetida, guardado
y conflicto entre dos sesiones, cierre de sesión, y uso móvil. Revisar una ficha
con costos completos y otra pendiente; confirmar que ni guardar costos ni simular
descuentos cambia la tienda. Mantener estos pasos en desarrollo antes de publicar.

## Preparación y embalaje por pedido · 22-10-2026

Finanzas incluye dos campos privados separados: preparación neta por pedido y
embalaje neto por pedido. Ambos se dividen por las unidades vendibles del pedido,
junto con «Otros gastos netos por pedido» (antes «Preparación y gastos por pedido»).
La preparación incluye puesta a punto y revisión del archivo; el embalaje incluye
caja de despacho, protección, bolsa y cinta. Son importes del pedido completo.

Los valores nuevos comienzan vacíos. Las fichas o respaldos anteriores se conservan,
pero su margen queda pendiente hasta completar preparación y embalaje. Cero solo
se usa para un costo conocido que no existe. Si los importes ya estaban incluidos
en mano de obra, otros costos/u o gastos por pedido, redistribuirlos para evitar
contarlos nuevamente. Los viajes a Starken siguen en su registro independiente;
no se incorporan automáticamente a las fichas.

La merma permanece editable y pendiente si aún no fue medida. Se indica que puede
ser muy baja en impresión digital, sin convertir «casi cero» en una pérdida nula
confirmada. El cálculo conserva la merma de fabricación sobre los costos unitarios;
preparación y embalaje se agregan después, como gastos por pedido.

Ejecutar `supabase/19-finanzas-embalaje-preparacion.sql` después del archivo 09 para
ampliar la validación privada. No cambia importes guardados ni precios públicos;
acepta fichas antiguas y campos nuevos pendientes. Si se vuelve a ejecutar 09,
ejecutar 19 después para conservar la validación ampliada. El guardado, exportación
e importación de fichas incluyen los nuevos campos. El margen se completa solo
cuando los demás costos y la revisión también están completos.

Verificación: `tests/test-finanzas.cjs` y `tests/test-panel.cjs`, con reparto por
cantidad, costos pendientes, persistencia, compatibilidad y permisos privados.
