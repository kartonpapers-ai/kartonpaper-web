# Producción · Cola de impresión

**Producción** es la sexta pestaña de `/admin/`. Registra órdenes de trabajo (OT)
privadas, su posición en cola, avance y tinta. No controla la impresora, no sube
archivos y no actualiza automáticamente Ventas ni los costos de Finanzas.

## Activar en desarrollo

Con el administrador y Ventas (`supabase/10-ventas-privadas.sql`) ya activos:

1. Descomprimir el ZIP y subir sus archivos a `desarrollo/admin`, conservando las
   carpetas. Revisar el Preview antes de integrar en `main`.
2. Ejecutar completo **solo** `supabase/11-produccion-privada.sql` en SQL Editor
   del proyecto de desarrollo. No repetir 01–10: el archivo 11 requiere
   `kp_private`, `kp_is_admin()` y `kp_sales` existentes.
3. Abrir `/admin/` en el Preview, iniciar sesión y entrar en **Producción**.
   Después del SQL, pulsar **Actualizar cola**.

No hay clientes, OT iniciales ni credenciales en la entrega. Si Preview y
producción usan el mismo Supabase, comparten los registros privados.

## Crear y ordenar trabajos

**Nueva OT** crea un trabajo manual: elegir un producto de catálogo u **Otro /
trabajo especial**, revisar nombre, variante, cliente y unidades. También se
puede elegir una venta y uno de sus productos. Desde una venta guardada,
**Crear OT** prepara el primer producto que aún no tiene OT; guardar el borrador
y repetir la acción para los demás. Una venta anulada no admite nuevas OT vinculadas.
El número `OT-000001` se asigna al guardar.

La OT copia nombre, variante, cliente, cantidad y fecha objetivo de la venta.
En una OT vinculada, nombre y variante son de solo lectura, pero cantidad y parámetros de impresión siguen ajustables; si al crearla se rechaza un producto de origen desactualizado, actualizar la venta antes de reintentar.
No copia precios ni los sincroniza; cambios posteriores de cantidad o catálogo
tampoco se propagan. Revisar y guardar los datos de producción por separado.
Con una OT vinculada, Ventas protege el producto, nombre, variante y posición
de esa línea: no cambiarla, eliminarla ni reordenarla; agregar una línea nueva
para otro trabajo. Cantidad y precio sí pueden cambiar en Ventas, por lo que
hay que revisar tanto la venta como la OT. Anular la venta no cancela su OT:
actualizar el estado de producción manualmente.
El origen de una OT guardada es inmutable y cada línea de venta admite una sola
OT vinculada, incluso si se cancela. Para reimprimir, crear una **OT manual /
reimpresión** y anotar el número de la OT anterior en las notas.

La cola activa incluye **En cola**, **Preparando archivo** e **Imprimiendo**.
Se ordena por prioridad (1 Urgente, 2 Normal, 3 Baja), después por **Orden manual ·
menor primero** (inicialmente 100) y por número de OT ascendente: la más antigua
primero en caso de empate. La fecha objetivo es una referencia y no ordena la cola.
**Terminada** y **Cancelada** quedan en el historial; usar **Todos los estados**
o el filtro de estado para consultarlas. El historial muestra primero las OT más
recientes. No hay eliminación de OT.

## Avance y tinta

**Cantidad del pedido** son unidades solicitadas. **Unidades conformes ya
impresas** cuenta solo unidades buenas; **merma** registra unidades descartadas
por separado. **Pasadas / impresiones por unidad** indica cuántas impresiones
requiere cada unidad. Para guardar una OT como **Terminada**, las unidades
conformes deben igualar la cantidad del pedido; no pueden superarla.

Tinta estimada = (cantidad + merma registrada) × pasadas × ml por impresión +
ml de preparación / purga. El factor inicial es **0,10 ml por impresión**, con
una pasada y preparación cero; ajustar el factor a la gráfica y al proceso.
La estimación corresponde al tiraje completo, no a la tinta restante. Los ml
reales se ingresan manualmente después de medir el consumo: vacío significa
**Pendiente**, mientras que cero representa una medición registrada de cero.
**Real − estimada** aparece cuando existe consumo real.

La búsqueda incluye OT, producto, variante, cliente y referencia de archivo, y
se combina con el filtro de estado. Los cuatro resúmenes corresponden a la vista
filtrada: **OT en esta vista**, **Unidades por imprimir**, **Tinta estimada de
estas OT** y **Tinta real registrada**. Las unidades pendientes solo suman OT
activas; la tinta estimada incluye el tiraje completo y la merma de todas las OT
filtradas, incluso terminadas o canceladas si se muestran. El consumo real suma
solo valores registrados; la nota indica cuántas OT tienen medición. Sin ninguna
medición muestra **Pendiente**. No son totales contables ni costos de tinta.

## Guardado y privacidad

**Guardar OT** persiste el trabajo en `kp_production`. **Descartar cambios** vuelve
a lo guardado o cierra un borrador nuevo. Hay aviso por cambios sin guardar;
**Actualizar cola** recarga los registros. Si otra sesión modificó una OT, el
control optimista de versión impide sobrescribirla: conservar los cambios,
actualizar y volver a aplicarlos. Ante un fallo de conexión, comprobar la cola
antes de repetir una creación.

RLS exige `kp_is_admin()` para leer, crear y actualizar. El rol anónimo no tiene
acceso y el rol autenticado no recibe permiso de borrado. Cancelar conserva el
registro y su origen; no libera la línea de venta para otra OT vinculada.
La referencia de archivo es texto, no una subida a la impresora. No incluir
datos privados de clientes ni secretos en el código o SQL de semillas.
