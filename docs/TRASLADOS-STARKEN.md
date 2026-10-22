# Traslados internos a Starken

En Administración → Finanzas, el bloque «Traslados a Starken · La Cisterna» registra
un viaje del taller a la agencia, con costo inicial editable de $1.500, fecha,
número de pedidos y referencias opcionales. El costo medio por pedido se calcula
dividiendo el costo total por la cantidad de pedidos. Es un promedio, mostrado
con hasta dos decimales; el gasto total conserva pesos enteros.

Ejecutar `supabase/15-traslados-starken.sql` una vez en el SQL Editor del proyecto
conectado y pulsar «Actualizar viajes». La migración puede repetirse sin borrar
registros. Requiere el esquema inicial y administrador configurado. No carga
viajes ni gastos históricos; $1.500 solo es el valor sugerido del formulario.

El resumen suma viajes y pedidos del mes seleccionado, excluyendo anulados. Se
puede corregir un viaje o marcarlo anulado; se conserva en el historial. La edición
comprueba la versión para evitar sobrescribir cambios de otra sesión. Ante un
error de red, actualizar y comprobar el registro antes de ingresar otro viaje.
Si el mes supera 1.000 registros, se informa un error y no se muestra un total parcial.

Los datos de viajes son privados, accesibles únicamente al administrador mediante
RLS. No hay cobro público ni integración con Starken. El costo del traslado se
registra tal como se ingresa, sin calcular ni deducir IVA. El flete al destinatario
sigue por pagar. No se suman estos gastos automáticamente a fichas de producto,
Ventas ni márgenes: no registrar nuevamente el mismo traslado en otros costos.
Las referencias de pedidos son texto manual, no relaciones automáticas con Ventas.

Validación: `node tests/test-traslados.cjs`, `node tests/test-finanzas.cjs` y
`node tests/test-panel.cjs`.
