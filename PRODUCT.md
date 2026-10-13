# KartonPaper

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clientes que buscan envases y solicitan cotizaciones. Jorge administra el negocio
solo y necesita dedicar tiempo a fabricación, adaptación de diseños y despacho.

## Product Purpose

Centralizar catálogo, precios y atención inicial para reducir trabajo repetitivo.

## Capabilities and Constraints

Sitio HTML/CSS/JavaScript publicado en Cloudflare Pages desde GitHub. Desarrollo
en `desarrollo/admin`; producción en `main`. Mantener el catálogo y diseño actual.
Panel de uso personal con correo y contraseña, sin enlace en la navegación pública
ni registro de usuarios. El panel administra productos existentes y permite crear productos con fotos.
Heroes, promociones con fechas e imágenes nuevas se administran desde el panel. Pedidos y asistente se incorporan en etapas siguientes.
Precios, mínimos y plazos requieren confirmación comercial de Jorge.

## Brand Commitments

Conservar el logo de KartonPaper y la identidad del sitio publicado.

## Evidence on Hand

20 productos en `data/productos.js`, seis categorías y siete banners en `index.html`.

## Product Principles

- Una fuente de productos para la tienda y el panel.
- Guardar cambios en almacenamiento persistente, sin editar HTML.
- Proteger escrituras en la base de datos, además de mostrar un formulario de acceso.
- Confirmar diseños y plazos antes de comprometer producción.

## Biblioteca de campañas

Fotos de catálogo y campañas reutilizables, más subidas independientes con nombre
y categoría. Nuevas campañas con fondo blanco, fotos opacas o transparentes y
colores editables; las campañas existentes conservan sus configuraciones.
