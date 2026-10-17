---
name: KartonPaper — hero editorial aprobado
description: Tokens observados exclusivamente en la nueva portada con producto protagonista.
colors:
  ink: "#202820"
  accent: "#315442"
  muted: "#536056"
  line: "#dce2dc"
  paper: "#ffffff"
  selected: "#edf3ed"
typography:
  display:
    fontFamily: "KPBricolage, KPDM, sans-serif"
    fontSize: "clamp(58px, 6.4vw, 96px)"
    fontWeight: 650
    lineHeight: 1.01
    letterSpacing: "-0.04em"
  support:
    fontFamily: "KPDM, var(--font)"
    fontSize: "clamp(18px, 1.6vw, 23px)"
    fontWeight: 550
    lineHeight: 1.35
  body:
    fontFamily: "KPDM, var(--font)"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "KPDM, var(--font)"
    fontSize: "14px"
    fontWeight: 600
rounded:
  action: "3px"
spacing:
  small: "8px"
  action-gap: "12px"
  section-gap: "24px"
components:
  hero-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "12px 20px"
  hero-primary-hover:
    backgroundColor: "{colors.accent}"
  hero-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "12px 20px"
  hero-category-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.ink}"
---

# Design System: KartonPaper — hero editorial

## Overview

**Creative North Star: "El producto protagonista"**

Este documento registra la portada aprobada en `KartonPaper_hero_producto_protagonista.html`, integrada en `index.html`. Su alcance es el hero editorial: producto fotografiado sobre blanco, titular amplio y selección visible de seis categorías. El mockup aprobado proporciona la autoridad visual; los valores se extraen de `css/hero-editorial.css` y `js/hero-editorial.js`.

El logo y el resto del sitio conservan su identidad existente. Estos tokens no establecen reglas nuevas para catálogo, precios, carrito, personalizador ni administrador.

**Key Characteristics:**
- Producto real como foco de la composición.
- Blanco continuo y acentos verdes contenidos.
- Titular estable; foto y mensaje de apoyo cambian por categoría.

## Colors

La portada combina tinta oscura, verde de marca y blanco continuo. Los nombres del frontmatter describen su función local.

### Primary
- **Accent:** última línea del titular, hover del botón principal y foco visible.

### Neutral
- **Ink:** titular, controles y botón principal.
- **Muted:** descripción, pie de foto y controles de animación.
- **Line:** divisiones entre categorías y borde del botón secundario.
- **Paper:** fondo continuo de la portada y los selectores.
- **Selected:** superficie de la categoría seleccionada, reforzada por subrayado.

## Typography

Bricolage Grotesque (`KPBricolage`) da carácter al titular. DM Sans (`KPDM`) compone los mensajes y controles. Ambas se sirven como WOFF2 locales con `font-display: swap`; procedencia y licencias en `fonts/LICENSES.txt`.

Los roles base están en el frontmatter. El apoyo ocupa hasta 29 caracteres de ancho y la descripción hasta 37. El titular conserva tres líneas: «Tu marca / merece / ser vista.». Los breakpoints y ajustes para pantallas de poca altura están registrados en la hoja CSS, que prevalece sobre esta síntesis.

## Layout

Contenedor máximo de 1600 px, márgenes interiores fluidos entre 20 y 64 px. En escritorio, texto e imagen comparten una cuadrícula de 46% / 54%. La fotografía usa `object-fit: contain` y ocupa su propia zona; no es una escena con texto superpuesto.

A 900 px o menos, texto y foto se apilan y los seis selectores forman tres columnas. A 480 px o menos, forman dos columnas. A 1150 px se compactan los selectores. Hay ajustes adicionales para escritorio de poca altura que reducen el bloque y evitan que el hero consuma la primera pantalla entera.

## Elevation & Depth

La interfaz del hero es plana. La fotografía aporta volumen; `mix-blend-mode: multiply` integra fondos blancos sin eliminar fondos ni reconstruir imágenes. No se añade una sombra CSS al producto en esta composición.

## Shapes

Botones casi rectos, con el radio del token `action`; selectores rectangulares separados por líneas finas. Las fotos conservan proporciones y silueta mediante contención, sin recorte circular ni marco ornamental.

## Components

### Acciones

«Explorar envases» es la acción principal, con tinta oscura, texto blanco y flecha. «Cotizar con mi logo» usa fondo blanco y borde fino. Altura mínima de 50 px; foco visible con contorno de 3 px y separación de 4 px. El botón secundario responde al hover con una superficie verde muy clara.

### Selector de categoría

Seis botones con miniatura, nombre y estado `aria-pressed`. La selección usa superficie suave y subrayado; en tamaños intermedios se oculta la flecha para conservar espacio. Un clic cambia foto, apoyo, descripción, pie y destino de la acción, sin cambiar el h1.

### Movimiento

La entrada del titular revela líneas; la foto entra con desplazamiento y escala leves. «Pausar» y «Repetir animación» controlan estas animaciones, no un carrusel automático. `prefers-reduced-motion` elimina movimiento y las animaciones en curso se cancelan al cambiar categoría.

## Do's and Don'ts

### Do:
- **Do** aplicar estos tokens únicamente al hero editorial aprobado.
- **Do** usar fotografías de producto con fondo blanco o transparente, y texto alternativo descriptivo.
- **Do** mantener el foco visible y el estado seleccionado de las categorías.

### Don't:
- **Don't** extender esta composición ni sus fuentes al catálogo sin una decisión posterior.
- **Don't** convertir los antiguos banners de escena completa en fondos de este hero.
- **Don't** cambiar el titular aprobado al seleccionar una categoría o publicar una campaña.
