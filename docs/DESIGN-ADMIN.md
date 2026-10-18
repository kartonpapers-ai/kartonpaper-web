# Superficie de diseño: administración

Alcance: `/admin/`, sus módulos de operación y las reglas compartidas de
`css/admin.css`. El hero público tiene su propia autoridad en `../DESIGN.md`;
estos tokens no lo sustituyen. Fuente de esta descripción: HTML y CSS actuales,
sin verificación visual en navegador.

La intención es un panel mínimo y profesional: navegación explícita, lista o
tabla para comparar, formulario para editar y resultados financieros al lado.
El color señala acciones y estados; los números usan cifras tabulares. El panel
presenta tareas de productos, precios, campañas, costos y ventas sin añadir decoración.

## Tokens observados

| Rol | Valor en `css/admin.css` |
| --- | --- |
| Tinta `--ink` | `#373a3c` |
| Texto secundario `--muted` | `#575e64` |
| Líneas `--line` | `#dfe3eb` |
| Acción y selección `--accent` | `#2e469d` |
| Menta `--mint` | `#c3e6d0` |
| Superficie suave `--soft` | `#f5f6f8` |
| Fondo | `#fff` |
| Tipografía `--font` | `'Libre Franklin', system-ui, sans-serif` |
| Texto base | `15px / 1.55` |
| Título operativo final `h1` | `30px / 1.2`, peso 700, espaciado `-.02em` |
| Segundo nivel `h2` | `22px / 1.3` (20px a ≤480px) |
| Etiqueta | `14px`, peso 600 |
| Tabla | `13px`, cifras tabulares |
| Botón principal | acento, texto blanco, radio `6px`, mínimo `44px`, relleno `11px 18px` |
| Hover principal | `#23377e` |
| Navegación | texto `14px` / peso 600, radio `6px`, mínimo `46px`, relleno `12px 22px` |
| Campo | borde `#b9c1d0`, radio `6px`, mínimo `46px`, relleno `12px` |
| Foco visible | contorno `3px solid var(--accent)`, separación `3px` |
| Éxito / error / advertencia financiera | `#196b41` / `#9d2525` / `#805000` |

Las reglas finales del archivo prevalecen sobre estilos anteriores: el `h1`
operativo usa Libre Franklin aunque exista una declaración serif previa. No
trasladar las fuentes editoriales de la portada al panel.

## Composición y comportamiento

El contenedor principal llega a 1280px, con márgenes interiores horizontales de
24px y relleno superior operativo de 28px. La navegación **Productos**, **Precios**,
**Campañas**, **Finanzas**, **Ventas** está bajo un resumen con divisiones finas. Los botones
activos usan `aria-pressed` y fondo de acento. Campañas es un enlace a su página.

Productos usa columnas de lista `minmax(260px,360px)` y editor flexible, separadas
por 40px. Las filas de producto conservan fotografía de 56px sin recorte.
Precios y Finanzas usan tablas con cabecera fija y desplazamiento horizontal.
Las tablas priorizan nombre, importes, estado y acción. Sus números se alinean
mediante cifras tabulares; los encabezados describen unidad o concepto.

Finanzas usa formulario y resultado de 300px, con separación de 32px. El resultado
permanece visible con `position: sticky; top:24px`, fondo suave y radio de 6px.
A ≤1000px se reduce a 270px y separación de 20px. A ≤800px todo pasa a una columna
y el resultado deja de ser fijo. A ≤480px, navegación y resumen forman dos columnas;
los campos se apilan y el resultado reduce relleno de 24px a 18px.

Los formularios agrupan compra, fabricación y venta en `fieldset`. Las funciones
menos frecuentes se abren con `details`: precio y opciones, importación y cálculo
desde embalaje. Mantener etiquetas visibles, foco de teclado, estados textuales,
ayudas sobre unidad/IVA y protección de cambios sin guardar.

Ventas reutiliza los tokens, botones, tabla y resultados existentes. Su quinta
pestaña reúne filtros, resumen de pedidos y editor con líneas de productos y
movimientos de pago. Los totales quedan junto a las notas, sin posición fija;
a ≤800px pasan a una columna y a ≤480px se apilan filtros y campos. Mantener
explícitas las etiquetas de unidad, neto, IVA y fecha de venta; distinguir el
estado del pedido del estado de pago sin depender solo del color.

## Límites de edición

Mantener logo, hero, catálogo público, carrito y campañas existentes dentro de sus
reglas específicas. El panel no debe convertir costos privados en contenido del
catálogo. Mostrar un número ausente como pendiente, conservar estados textuales
además del color y evitar presentar una simulación como venta realizada.
