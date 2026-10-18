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
Heroes, promociones con fechas e imágenes nuevas se administran desde el panel.
Ventas registra pedidos manuales privados con varios productos, abonos y devoluciones;
no emite facturas ni sincroniza el carrito público. El asistente se incorpora después.
Precios, mínimos y plazos requieren confirmación comercial de Jorge.

## Brand Commitments

Conservar el logo de KartonPaper y la identidad del sitio publicado.

## Evidence on Hand

20 productos en `data/productos.js` y seis categorías. La portada implementa el hero
aprobado `KartonPaper_hero_producto_protagonista.html`: titular fijo y seis fotos
curadas de producto seleccionables. Campañas vigentes por capas sobre blanco pueden
sustituir foto y mensajes de su categoría. Los siete banners originales se conservan
en la administración; las escenas completas no participan en esta portada.
Ver `docs/HERO-EDITORIAL.md` para la correspondencia de campos y el alcance.

El panel de operación reúne Productos, Precios, Campañas, Finanzas y Ventas en
`admin/index.html`. Precios abre la ficha pública para editar; Campañas conserva
su página existente. Finanzas guarda fichas por variante en `kp_finance`, con
acceso restringido al administrador por RLS (`supabase/09-finanzas-privadas.sql`).
Los costos se importan desde un JSON privado local, fuera del repositorio. El
cálculo separa merma, comisión, gastos por pedido e IVA y permite simular márgenes
sin publicar precios ni ofertas. Evidencia funcional: `admin/dashboard.js`,
`admin/finanzas.js` y `admin/finanzas-calculo.js`; esta descripción no acredita
pruebas reales en navegador. Operación en `docs/PANEL-FINANZAS.md` y tokens locales
en `docs/DESIGN-ADMIN.md`.

Ventas guarda copias de precios y variantes acordados en `kp_sales`, protegida
por RLS (`supabase/10-ventas-privadas.sql`), con IVA 19%, seguimiento de saldo,
filtros y CSV privado. No incluye datos iniciales de clientes. Operación y límites
en `docs/VENTAS.md`; sus resúmenes son operativos, no contables.

## Product Principles

- Una fuente de productos para la tienda y el panel.
- Guardar cambios en almacenamiento persistente, sin editar HTML.
- Proteger escrituras en la base de datos, además de mostrar un formulario de acceso.
- Confirmar diseños y plazos antes de comprometer producción.

## Biblioteca de campañas

Fotos de catálogo y campañas reutilizables, más subidas independientes con nombre
y categoría. Nuevas campañas con fondo blanco, fotos opacas o transparentes y
colores editables; las campañas existentes conservan sus configuraciones.
