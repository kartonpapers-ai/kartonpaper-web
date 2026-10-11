// Catálogo público de KartonPaper. No guardar credenciales ni datos de clientes.
// Fuente única del catálogo durante la etapa estática; cargar antes del script de la tienda.
    // ------------------------------------------------------------------------
    // Base de datos de productos KartonPaper
    // ------------------------------------------------------------------------
    const productsDB = [
      // 1. Cerveza Artesanal (Packs sin impresión en ecommerce + personalizables)
      {
        id: "beer-maleta-3x330",
        category: "cerveza",
        name: "Maleta para 3 botellas",
        subtitle: "Capacidad 330 cc · Formato Maleta",
        type: "dual",
        image: "images/beer-maleta-3x330-approved.webp",
        price: "$670 + IVA c/u",
        priceNum: 670,
        specs: ["Cartulina kraft 400g", "Asa reforzada", "Desde 50 u."],
        variants: ["Pack 50 u. ($33.500)", "Pack 100 u. ($67.000)", "Pack 200 u. ($134.000)"]
      },
      {
        id: "beer-wrap-4x330",
        category: "cerveza",
        name: "Wrap para 4 botellas",
        subtitle: "Capacidad 330 cc · Formato Wrap autoarmable",
        type: "dual",
        image: "images/beer-wrap-4x330-approved.webp",
        price: "$310 + IVA c/u",
        priceNum: 310,
        specs: ["Cartulina kraft 400g", "Fácil armado", "Desde 50 u."],
        variants: ["Pack 50 u. ($15.500)", "Pack 100 u. ($31.000)", "Pack 200 u. ($62.000)"]
      },
      {
        id: "beer-wrap-6x330",
        category: "cerveza",
        name: "Wrap para 6 botellas",
        subtitle: "Capacidad 330 cc (Six-pack) · Formato Wrap",
        type: "dual",
        image: "images/beer-wrap-6x330-approved.webp",
        price: "$450 + IVA c/u",
        priceNum: 450,
        specs: ["Cartulina kraft 400g", "Pack clásico 6u", "Desde 50 u."],
        variants: ["Pack 50 u. ($22.500)", "Pack 100 u. ($45.000)", "Pack 200 u. ($90.000)"]
      },
      {
        id: "beer-wrap-4x500",
        category: "cerveza",
        name: "Wrap para 4 botellas de 500 cc",
        subtitle: "Botellas grandes de 500 cc · Cartulina kraft 400g",
        type: "dual",
        image: "images/cerveza-wrap-4x500.webp",
        price: "$460 + IVA c/u",
        priceNum: 460,
        specs: ["Para botellas 500 cc", "Kraft extra resistente", "Desde 50 u."],
        variants: ["Pack 50 u. ($23.000)", "Pack 100 u. ($46.000)"]
      },
      {
        id: "beer-wrap-2x500",
        category: "cerveza",
        name: "Wrap para 2 botellas de 500 cc",
        subtitle: "Presentación doble para botellas de 500 cc",
        type: "dual",
        image: "images/cerveza-wrap-2x500.webp",
        price: "$350 + IVA c/u",
        priceNum: 350,
        specs: ["Para botellas 500 cc", "Doble compacto", "Desde 50 u."],
        variants: ["Pack 50 u. ($17.500)", "Pack 100 u. ($35.000)"]
      },
      {
        id: "beer-maleta-vaso",
        category: "cerveza",
        name: "Maleta para 2 botellas + vaso",
        subtitle: "Pack degustación con espacio para vaso o 3 botellas",
        type: "dual",
        image: "images/cerveza-maleta-2-botellas-vaso.webp",
        price: "$670 + IVA c/u",
        priceNum: 670,
        specs: ["Formato regalo", "Botellas 330cc o 500cc", "Desde 50 u."],
        variants: ["Configuración 2 botellas + vaso", "Configuración 3 botellas 330cc"]
      },

      // 2. Repostería & Alfajores (Nuevos productos + Cajas de alfajor)
      {
        id: "reposteria-papel-metalizado",
        category: "reposteria",
        name: "Papel aluminio metalizado para alfajores",
        subtitle: "Cuadrados de 15 × 15 cm para envolver alfajores artesanales",
        type: "stock",
        image: "images/papel-aluminio-alfajores.webp",
        price: "Desde $8.900",
        priceNum: 8900,
        specs: ["Medida 15 × 15 cm", "Acabado brillante", "Apto alimentos"],
        variants: ["Dorado metalizado (Pack 100 u.)", "Rosado metalizado (Pack 100 u.)", "Dorado metalizado (Pack 500 u. $36.900)", "Rosado metalizado (Pack 500 u. $36.900)"]
      },
      {
        id: "reposteria-cajas-decoradas",
        category: "reposteria",
        name: "Cajas decoradas para alfajores (Temporada)",
        subtitle: "Caja con visor de mica · Diseños Enamorados y Navidad",
        type: "stock",
        image: "images/reposteria-cajas-decoradas.webp",
        price: "$14.900 (Pack 10 u.)",
        priceNum: 14900,
        specs: ["Ventana transparente", "Cartulina blanca 320g", "Edición lista"],
        variants: ["Día de los Enamorados (Pack 10 u.)", "Navidad & Felices Fiestas (Pack 10 u.)"]
      },
      {
        id: "reposteria-caja-3-alfajores",
        category: "reposteria",
        name: "Caja con ventana para 3 alfajores",
        subtitle: "Cartulina blanca 320 g/m² · Mica transparente",
        type: "custom",
        image: "images/reposteria-caja-3-alfajores.webp",
        price: "Cotización con logo",
        specs: ["Capacidad 3 alfajores", "Personalizable", "Mínimo 100 u."],
        variants: ["100 unidades", "250 unidades", "500 unidades"]
      },
      {
        id: "reposteria-caja-4-alfajores",
        category: "reposteria",
        name: "Caja con ventana para 4 alfajores",
        subtitle: "Medida 14 × 14 × 3 cm · Cartulina blanca 320 g/m²",
        type: "custom",
        image: "images/reposteria-caja-4-alfajores.webp",
        price: "Cotización con logo",
        specs: ["14 × 14 × 3 cm", "Mica transparente", "Mínimo 100 u."],
        variants: ["100 unidades", "250 unidades", "500 unidades"]
      },
      {
        id: "reposteria-caja-6-alfajores",
        category: "reposteria",
        name: "Caja con ventana para 6 alfajores",
        subtitle: "Medida 19 × 14 × 3 cm · Cartulina blanca 320 g/m²",
        type: "custom",
        image: "images/reposteria-caja-6-alfajores.webp",
        price: "Cotización con logo",
        specs: ["19 × 14 × 3 cm", "Visor transparente", "Mínimo 100 u."],
        variants: ["100 unidades", "250 unidades", "500 unidades"]
      },

      // 3. Gastronomía Compostable (Bagasse con impresión en tapa)
      {
        id: "bagasse-pollo-1",
        category: "gastronomia",
        name: "Caja para pollo (Bagasse)",
        subtitle: "Fibra de caña compostable · Personalización en tapa",
        type: "custom",
        image: "images/bagasse-caja-pollo-1.webp",
        price: "Cotización con logo",
        specs: ["100% compostable", "Impresión en tapa", "Cierre seguro"],
        variants: ["Modelo Pollo 1 Bagasse"]
      },
      {
        id: "bagasse-sandwich-6x6",
        category: "gastronomia",
        name: "Envase para sándwich o burger (6×6)",
        subtitle: "Clamshell compostable para hamburgueserías y cafeterías",
        type: "custom",
        image: "images/bagasse-sandwich-6x6.webp",
        price: "Cotización con logo",
        specs: ["Formato 6 × 6 pulgadas", "Resistente a grasa", "Impresión en tapa"],
        variants: ["Modelo 6 × 6 Bagasse"]
      },
      {
        id: "bagasse-bowl-850",
        category: "gastronomia",
        name: "Bowl de bagazo de caña (850 ml)",
        subtitle: "Incluye tapa · Para ensaladas, poke, sopas y pastas",
        type: "custom",
        image: "images/bagasse-bowl-850-con-tapa.webp",
        price: "Cotización con logo",
        specs: ["Capacidad 850 ml", "Tapa hermética", "Compostable"],
        variants: ["Marmita Bowl 850 ml con tapa"]
      },
      {
        id: "bagasse-colacion-c205",
        category: "gastronomia",
        name: "Porta colación C205 (900 ml)",
        subtitle: "Envase compostable para menús ejecutivos y viandas",
        type: "custom",
        image: "images/bagasse-colacion-c205-900.webp",
        price: "Cotización con logo",
        specs: ["Capacidad 900 ml", "Caña de azúcar", "Impresión en tapa"],
        variants: ["Modelo Porta Colación C205 900ml"]
      },

      // 4. Bolsas de Papel con Asas Planas
      {
        id: "bolsa-papel-kraft",
        category: "bolsas",
        name: "Bolsas de papel kraft con asas planas",
        subtitle: "Kraft natural resistente · Para tiendas, delivery y eventos",
        type: "custom",
        image: "images/bolsa-papel-kraft-asa-plana.webp",
        price: "Cotización por medida",
        specs: ["Papel kraft", "Asas planas", "Impresión con logo"],
        variants: [
          "14 × 20 × 8 cm (pequeña)",
          "14 × 40 × 8 cm (para botellas)",
          "22 × 30 × 10 cm (mediana)",
          "30 × 41 × 12 cm (grande)",
          "45 × 48 × 15 cm (extra grande)"
        ]
      },
      {
        id: "bolsa-papel-blanca",
        category: "bolsas",
        name: "Bolsas de papel blancas con asas planas",
        subtitle: "Papel blanco satinado · Presentación limpia y elegante",
        type: "custom",
        image: "images/bolsa-papel-blanca-asa-plana.webp",
        price: "Cotización por medida",
        specs: ["Papel blanco", "Asas planas", "Impresión con logo"],
        variants: [
          "14 × 20 × 8 cm (pequeña)",
          "14 × 40 × 8 cm (para botellas)",
          "22 × 30 × 10 cm (mediana)",
          "30 × 41 × 12 cm (grande)",
          "45 × 48 × 15 cm (extra grande)"
        ]
      },

      // 5. Doypack Kraft con Ventana
      {
        id: "doypack-kraft-ventana",
        category: "doypack",
        name: "Doypack kraft con ventana y Ziplock",
        subtitle: "Barrera contra grasa y humedad · Para café, té y frutos secos",
        type: "custom",
        image: "images/doypack-kraft-ventana.webp",
        price: "Cotización según medida",
        specs: ["Cierre Ziplock", "Interior laminado", "Impresión 1 o 2 caras"],
        variants: [
          "10 × 15 + 3 cm",
          "12 × 20 + 4 cm",
          "14 × 20 + 4 cm",
          "16 × 24 + 4 cm",
          "20 × 29 + 5 cm",
          "25 × 35 + 5 cm"
        ]
      },

      // 6. Posavasos de Pulpa Mecánica Absorbente (NUEVO)
      {
        id: "posavasos-souvenir-chile",
        category: "posavasos",
        name: "Caja Souvenir: 20 Posavasos de Chile",
        subtitle: "Ilustraciones turísticas de Chile · Pulpa absorbente 90 mm",
        type: "stock",
        image: "images/posavasos-antartica.webp",
        price: "$12.900 (Caja 20 u.)",
        priceNum: 12900,
        specs: ["Cartulina absorbente importada", "Diámetro 90 mm", "Caja kraft de regalo"],
        variants: [
          "Colección Completa: Antártica, Torres del Paine, Valparaíso, Atacama (Caja 20 u.)",
          "Colección Antártica Chilena (Caja 20 u.)"
        ]
      },
      {
        id: "posavasos-personalizados",
        category: "posavasos",
        name: "Posavasos circulares 90 mm personalizados",
        subtitle: "Para cervecerías, bares, cafeterías y eventos especiales",
        type: "custom",
        image: "images/posavasos-chile-souvenir.webp",
        price: "Cotización con logo",
        specs: ["Pulpa mecánica absorbente", "Impresión full color", "Desde 100 u."],
        variants: ["100 unidades", "250 unidades", "500 unidades", "1.000 unidades"]
      }
    ];
