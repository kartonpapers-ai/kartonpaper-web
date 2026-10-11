# Desarrollo de KartonPaper

## Base de la primera etapa

La web publicada se conserva en `main`. La rama `desarrollo/admin` parte del commit
`3eb5f2e6cf4e13e416fa5a2abfc00d4f11ddffd8` y se usará para preparar el catálogo
administrable, el panel personal y el asistente dentro de la web.

Esta primera entrega añade documentación y una verificación local. No implementa
todavía un administrador, autenticación, base de datos ni inteligencia artificial.

## Flujo de trabajo

1. Trabajar en `desarrollo/admin`.
2. Ejecutar `python3 scripts/verificar_web.py` desde la carpeta del repositorio.
3. Revisar en navegador catálogo, filtros, variantes, carrito, cotización y hero.
4. Revisar los cambios en una vista previa de Cloudflare antes de integrarlos.
5. Integrar en `main` solamente cuando la versión esté revisada. Los commits en
   `main` activan el despliegue de producción configurado en Cloudflare.

Las vistas de prueba de Cloudflare no deben considerarse privadas sin configurar
protección de acceso. No cargar información personal de clientes en GitHub ni en
datos públicos del sitio.

## Abrir una copia local en el Mac

Requiere Git, Python 3 y Node. Usar una carpeta nueva para no mezclar las copias
anteriores descargadas por ZIP.

```bash
git clone https://github.com/kartonpapers-ai/kartonpaper-web.git kartonpaper-desarrollo
cd kartonpaper-desarrollo
git switch desarrollo/admin
python3 scripts/verificar_web.py
python3 -m http.server 8080
```

Abrir `http://localhost:8080` en el navegador. Detener el servidor con Control+C.

Si la copia ya fue clonada, obtener los cambios con `git fetch origin` y revisar
`git status` antes de actualizar. No reemplazar indiscriminadamente una carpeta
que tenga trabajo local sin guardar.

## Catálogo separado (segunda entrega)

El catálogo público está en `data/productos.js` y se carga antes del código de la
tienda. Conserva los 20 productos y todos sus campos, precios, variantes e imágenes.
`index.html` contiene la presentación y la lógica del carrito, sin una copia de
los productos. El archivo externo funciona tanto en un servidor como al abrir
`index.html` directamente en el navegador.

Esta es una etapa intermedia estática. Editar precios todavía exige actualizar el
archivo y desplegar la rama; no existe aún un panel ni una base de datos.
Las condiciones comerciales anotadas en `INVENTARIO-INICIAL.md` siguen pendientes
de confirmación. La extracción no modifica precios ni mínimos.

La siguiente entrega elegirá y conectará almacenamiento persistente y
autenticación real. El panel y la tienda consumirán esa misma fuente de datos,
para que actualizar precios no requiera editar HTML ni publicar código.

La contraseña del administrador y las credenciales de servicios se guardarán
en el servidor; nunca dentro de HTML o JavaScript público. Las consultas y
pedidos deberán almacenarse fuera del repositorio.

## Alcance del asistente inicial

Atender dentro de la web, orientar según el catálogo, recoger cantidad y fecha
requerida y preparar un resumen para enviar a Jorge por WhatsApp. Derivar cuando
falte información o el cliente pida una persona. Los plazos de producción y la
aptitud del diseño para impresión requieren confirmación de Jorge.
