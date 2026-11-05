# Redes y marketing

Jorge, esta pestaña privada de `/admin/` reúne la preparación de cuatro cuentas,
una campaña por semana y sus resultados manuales. La propuesta de contenido y
la rutina de trabajo están en [ESTRATEGIA-REDES.md](ESTRATEGIA-REDES.md).
Las cuentas sociales no están creadas por esta entrega.

## Activar en desarrollo

Con el administrador ya activo y autorizado mediante las migraciones 01 y 03:

1. Descomprimir el ZIP y subir sus archivos a la rama `desarrollo/admin`,
   conservando las carpetas y rutas. Revisar el Preview antes de integrar en `main`.
2. Ejecutar completo `supabase/12-redes-marketing.sql` en SQL Editor del Supabase
   de desarrollo. Requiere `kp_private` y `kp_is_admin()` existentes; no repetir
   las migraciones anteriores para activar este módulo.
3. Iniciar sesión en `/admin/`, entrar en **Redes y marketing** y pulsar
   **Actualizar**. Si aparece la ayuda de activación, revisar la sesión y el SQL.
4. Guardar una semana de prueba y recargar para comprobar su persistencia.
   Verificar en Supabase que `kp_social` tiene RLS activo y que una sesión
   anónima o autenticada sin autorización de administrador no puede leer ni
   escribir sus datos. Cerrar sesión y comprobar que el formulario queda oculto.

Si Preview y producción usan el mismo Supabase, comparten esta planificación.
La revisión local de código y pruebas no sustituye estas comprobaciones remotas.

## Preparar cuentas y semana

En **Cuentas y preparación del lanzamiento**, registrar Instagram, Facebook,
TikTok y WhatsApp Business. Los estados **Por crear**, **Creada · por completar**
y **Lista para publicar** se cambian manualmente. El último exige un enlace
público HTTPS; no acredita una conexión ni una verificación de la plataforma.
Crear las cuentas fuera del panel y guardar sus contraseñas en otro lugar.

Seleccionar el lunes en **Semana que comienza el lunes** y pulsar **Abrir semana**.
Para recuperar una anterior, elegirla en **Abrir semana guardada** y pulsar
también **Abrir semana**. Cambiar la fecha por sí solo no cambia el editor.
Si se elige otro día, al abrir se usa el lunes de esa semana. La semana inicial
se calcula en horario de Chile (`America/Santiago`).

Completar nombre, producto protagonista, público, objetivo, mensaje, invitación
y destino HTTPS. **Campaña de la web relacionada** guarda una referencia interna:
no activa una campaña, no cambia el hero ni publica nada en la web. Si no se
pueden cargar las campañas, se puede trabajar sin vincular y reintentar con
**Actualizar**. Revisar costos completos y margen en Finanzas antes de una oferta.

## Preparar y publicar contenido

**Preparar calendario y textos** requiere mensaje y destino. Genera seis
borradores editables dentro de desplegables (`details`):

| Día previsto | Canal | Formato |
| --- | --- | --- |
| Martes | Instagram | Reel de transformación |
| Martes | TikTok | Video de proceso |
| Miércoles | Facebook | Carrusel de producto y uso |
| Jueves | Instagram | Carrusel para elegir un envase |
| Viernes | TikTok | Video de detalle de impresión |
| Viernes | WhatsApp Business | Estado para invitar a cotizar |

Abrir cada pieza para ajustar texto, material que preparar, fecha dentro de la
semana y estado. Volver a preparar el calendario reemplaza los textos y estados
de esa semana, previa confirmación. Las referencias de foto o guion son texto;
el módulo no sube fotografías ni videos.

Usar **Copiar texto**, revisar el contenido y publicar desde cada plataforma.
Después marcar **Publicada · registro manual** y agregar la URL HTTPS de la
publicación; WhatsApp permite registrar un estado sin URL. **Abrir cuenta** usa
el enlace de cuenta guardado. Los estados **Borrador**, **Lista para publicar**
y **Publicada** no ejecutan acciones en las redes.

Los destinos generados incluyen UTM de canal, semana y pieza. En Instagram y
TikTok aparecen como sugerencia para el enlace del perfil, si la cuenta lo
permite. Las etiquetas no miden visitas ni atribuyen ventas por sí mismas.

## Guardar, recuperar y respaldar

**Guardar redes y semana** guarda juntas las cuatro cuentas y la semana abierta,
conservando las demás semanas del mismo registro privado `kp_social/workspace`.
Guardar antes de abrir otra semana o salir; el panel avisa si hay cambios
pendientes. **Actualizar** vuelve a cargar lo guardado y puede descartar cambios
tras la confirmación correspondiente.

El guardado usa control optimista de versión para todo el espacio de trabajo.
Si otra sesión guardó antes, no sobrescribe sus cambios: conservar los textos
manualmente antes de **Actualizar**, revisar la última versión y volver a aplicar
los cambios. Ante un fallo de conexión, comprobar lo guardado antes de repetir.

El historial admite hasta **104 semanas** y el registro completo está limitado
a **5.000.000 bytes** en Supabase. No hay borrado de semanas en la interfaz.
**Descargar respaldo guardado** exporta `kartonpaper-redes-guardadas.json` con
todo lo persistido; excluye cambios pendientes. Esta versión solo exporta:
no ofrece importación ni restauración desde JSON en la interfaz.

## Revisar resultados

Registrar consultas calificadas, cotizaciones, pedidos confirmados, ventas netas
atribuidas y gasto publicitario neto real. Contar cada consulta una sola vez,
aunque llegue por varios canales; los pedidos deben proceder de ese mismo grupo
de consultas. Se puede completar una semana después si una venta cierra más tarde.
El campo vacío se guarda como `null` y significa **pendiente**; **0** significa
que se midió y no hubo resultado.

El panel calcula consulta → pedido como pedidos / consultas y gasto publicitario
por pedido como gasto / pedidos, solo con datos y denominador válido. Los CLP
son enteros netos, con IVA separado; ventas menos publicidad no equivale a
utilidad. Contrastar pedidos en Ventas y costos en Finanzas: no se sincronizan
ni se atribuyen automáticamente. Anotar qué funcionó y qué conviene repetir.

## Privacidad y alcance comprobado

La migración limita lectura, creación y actualización al administrador autorizado
mediante RLS y valida estructura, enlaces, fechas y métricas. No concede borrado.
No guardar contraseñas, tokens ni datos privados de clientes en estos campos.
No hay API social, publicación o programación automática, lectura de mensajes,
analítica automática ni creación de cuentas.

La revisión independiente de fuente y funcionamiento quedó apta para entrega
tras corregir dos observaciones menores; las 15 suites locales pasan. Esto no
acredita una comprobación visual real en navegador ni una ejecución o prueba
contra Supabase remoto. Esas comprobaciones quedan en la instalación anterior.
