# Hero móvil y transiciones

Destino: rama desarrollo/admin de kartonpapers-ai/kartonpaper-web.

En móvil el titular queda sobre la zona superior de la imagen con tamaño proporcional. Las imágenes mantienen su proporción completa, sin recortar productos. Repostería tiene espacio adicional entre la primera caja y el mensaje. Descripción y botones permanecen debajo. Las reglas de escritorio mantienen su diseño.

Incluye la corrección de transiciones anterior: precarga, decodificación y fundido continuo, manteniendo tres segundos, pausa y movimiento reducido.

## Aplicar

Descomprimir y subir las carpetas y archivos del interior a la raíz del repositorio en desarrollo/admin, reemplazando las rutas existentes. No subir solamente el ZIP. Esperar el despliegue de Cloudflare y recargar la tienda. No requiere imágenes nuevas ni cambios en administración.

## Validación

Pasaron pruebas de rotación, transiciones y DOM de tienda y administración; sintaxis JavaScript y git diff --check. Comparación de reglas CSS confirmó que la composición de escritorio permanece intacta. Pendiente revisión visual en teléfono: no fue posible instalar el navegador de prueba en este entorno.
