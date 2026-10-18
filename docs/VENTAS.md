# Ventas y pedidos privados

**Ventas** es la quinta pestaña de `/admin/`. Es un registro manual de pedidos de
WhatsApp, correo o tienda: no recibe automáticamente el carrito público, no se
conecta al banco y no emite ni envía facturas. El folio de factura es una referencia
opcional a un documento emitido por otro medio. El número `V-000001` es interno.

## Activar en desarrollo

Con el administrador y las migraciones anteriores ya activos:

1. Descomprimir el ZIP de esta entrega y subir los archivos a `desarrollo/admin`,
   conservando las carpetas. Revisar el Preview antes de integrar en `main`.
2. Ejecutar completo `supabase/10-ventas-privadas.sql` una sola vez en SQL Editor
   del proyecto de desarrollo. No repetir las migraciones 01–09. El archivo 10
   requiere el esquema `kp_private` y la función `kp_is_admin()` existentes.
3. Abrir `/admin/` en el Preview, iniciar sesión con la cuenta autorizada y entrar
   en **Ventas**. Si aparece **Activar Ventas**, pulsar **Actualizar** después del SQL.

No se incluyen clientes ni ventas iniciales en el repositorio o el ZIP. Los datos
privados se ingresan después de activar el módulo. Una rama separa el código;
si Preview y producción comparten Supabase, también comparten las ventas.

## Registrar una venta

1. Pulsar **Registrar venta**. La fecha inicial es hoy en `America/Santiago`, el
   estado es **Pendiente**, el despacho es cero y no hay pagos registrados.
2. Escribir el cliente; contacto, OC o referencia y entrega prevista son opcionales.
   La entrega prevista no puede ser anterior a la venta.
3. Agregar uno o varios productos (hasta 50), eligiendo catálogo u **Otro / trabajo
   especial**. Revisar nombre, variante, unidades y neto por unidad antes de guardar.
4. Completar despacho neto cobrado al cliente, notas y movimientos realizados.
   Pulsar **Guardar venta**; el número interno se asigna al guardar.

La cantidad siempre representa **unidades**, no cantidad de packs. Al elegir un
producto, el panel propone su primera variante y reconoce cantidades rotuladas
como `Pack 25 u.` o `25 unidades`. Solo propone precios que reconoce como
`$… + IVA c/u`; los otros formatos requieren ingreso manual. Cambiar la variante
vuelve a proponer el precio y ajusta la cantidad si reconoce `Pack N u.` o
`N unidades`. Después se puede modificar la cantidad manualmente: verificar ambos campos.
Por ejemplo, dos packs de 25 requieren 50 unidades y el neto de una unidad.

Cada pedido guarda una copia del nombre, variante y precio acordados. Editar el
catálogo después no recalcula ventas guardadas. Cambiar la selección de producto
o variante en el formulario sí puede reemplazar el precio propuesto.

## Importes y pagos

Los importes son CLP. El neto de cada línea es cantidad × neto unitario (hasta dos
decimales), redondeado al peso. Se suma el despacho cobrado al cliente y se calcula
IVA del 19% sobre ese neto, redondeado al peso. El despacho es un cargo de venta,
no el costo interno del transporte. Total = neto + IVA.

**Registrar movimiento** permite anotar abonos recibidos o devoluciones realizadas,
con fecha, monto con IVA y medio de pago. Los montos son pesos enteros positivos;
no se admiten fechas futuras. Cobrado neto = abonos − devoluciones y debe quedar
entre cero y el total; saldo = total − cobrado neto. Se admiten hasta 100 movimientos.

El estado del pedido se cambia manualmente entre Pendiente, Confirmada, En
producción, Lista para despacho, Despachada, Entregada y Anulada. El estado de pago
se calcula aparte. Para anular una venta con abonos, registrar primero la devolución
completa: una venta anulada requiere cobrado neto cero y muestra saldo cero.

## Consultar y exportar

La búsqueda incluye número, cliente, contacto, referencia y folio de factura. Los
filtros de estado y fechas se combinan; **Venta desde/hasta** usa la fecha del
pedido, no las fechas de pago. Los resúmenes y el CSV corresponden a esos filtros.

**Neto sin anulados** excluye pedidos anulados; **Cobros netos de devoluciones**
resta devoluciones y **Saldo pendiente** suma saldos. Incluyen pedidos pendientes
de confirmar. Son resúmenes operativos de los pedidos filtrados, no ingresos del
período de cobro, utilidad ni estados contables.

**Exportar ventas CSV** descarga una fila por pedido, con importes, cliente,
contacto y referencias; no contiene el detalle de productos o movimientos y no es
un respaldo completo. El CSV usa separador `;`, UTF-8 y protección de celdas que
comienzan con `=`, `+`, `-` o `@` (también tras espacios), anteponiendo una comilla
simple. Tratar la descarga como información privada y compartirla solo con personas
autorizadas.

## Guardado y privacidad

Los cambios sin guardar generan un aviso al salir. **Descartar cambios** vuelve a
la versión guardada. **Actualizar** recarga la lista y puede descartar lo editado
tras confirmar el aviso. Si otra sesión cambió una venta, el guardado se bloquea
por versión: copiar primero los cambios necesarios, actualizar y volver a aplicarlos.
Si falla la conexión, conservar los datos; actualizar antes de repetir una creación
para comprobar si el intento anterior ya quedó guardado.

No hay eliminación de ventas. Corregir el registro o anularlo conservando abonos y
devoluciones reales. Los datos se guardan en `kp_sales`, separados del catálogo y
de los costos. RLS exige `kp_is_admin()` para lectura, creación y actualización;
el rol anónimo no tiene acceso y el rol autenticado no recibe permiso de borrado.
No subir datos de clientes, exportaciones ni credenciales al repositorio público.
