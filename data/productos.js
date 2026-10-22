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
        price: "$700 + IVA c/u · Pack 100 u.",
        priceNum: 700,
        specs: ["Cartulina kraft 400g", "Asa reforzada", "Desde 50 u."],
        variants: ["Pack 50 u. ($45.000 + IVA)", "Pack 100 u. ($70.000 + IVA)", "Pack 200 u. ($134.000 + IVA)"],
        sku: "KP-CER-M3-330",
        packs: [{"quantity": 50, "unitPrice": 900, "totalNet": 45000, "sku": "KP-CER-M3-330-P050", "withoutPrint": false, "label": "Pack 50 u. ($45.000 + IVA)"}, {"quantity": 100, "unitPrice": 700, "totalNet": 70000, "sku": "KP-CER-M3-330-P100", "withoutPrint": false, "label": "Pack 100 u. ($70.000 + IVA)"}, {"quantity": 200, "unitPrice": 670, "totalNet": 134000, "sku": "KP-CER-M3-330-P200", "withoutPrint": false, "label": "Pack 200 u. ($134.000 + IVA)"}]
      },
      {
        id: "beer-wrap-4x330",
        category: "cerveza",
        name: "Wrap para 4 botellas",
        subtitle: "Capacidad 330 cc · Formato Wrap autoarmable",
        type: "dual",
        image: "images/beer-wrap-4x330-approved.webp",
        price: "$310 + IVA c/u · Pack 100 u.",
        priceNum: 310,
        specs: ["Cartulina kraft 400g", "Fácil armado", "Desde 50 u."],
        variants: ["Pack 50 u. · Sin impresión ($18.000 + IVA)", "Pack 100 u. ($31.000 + IVA)", "Pack 200 u. ($62.000 + IVA)", "Pack 300 u. ($88.500 + IVA)", "Pack 400 u. ($114.000 + IVA)"],
        sku: "KP-CER-W4-330",
        packs: [{"quantity": 50, "unitPrice": 360, "totalNet": 18000, "sku": "KP-CER-W4-330-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($18.000 + IVA)"}, {"quantity": 100, "unitPrice": 310, "totalNet": 31000, "sku": "KP-CER-W4-330-P100", "withoutPrint": false, "label": "Pack 100 u. ($31.000 + IVA)"}, {"quantity": 200, "unitPrice": 310, "totalNet": 62000, "sku": "KP-CER-W4-330-P200", "withoutPrint": false, "label": "Pack 200 u. ($62.000 + IVA)"}, {"quantity": 300, "unitPrice": 295, "totalNet": 88500, "sku": "KP-CER-W4-330-P300", "withoutPrint": false, "label": "Pack 300 u. ($88.500 + IVA)"}, {"quantity": 400, "unitPrice": 285, "totalNet": 114000, "sku": "KP-CER-W4-330-P400", "withoutPrint": false, "label": "Pack 400 u. ($114.000 + IVA)"}]
      },
      {
        id: "beer-wrap-6x330",
        category: "cerveza",
        name: "Wrap para 6 botellas",
        subtitle: "Capacidad 330 cc (Six-pack) · Formato Wrap",
        type: "dual",
        image: "images/beer-wrap-6x330-approved.webp",
        price: "$450 + IVA c/u · Pack 100 u.",
        priceNum: 450,
        specs: ["Cartulina kraft 400g", "Pack clásico 6u", "Desde 50 u."],
        variants: ["Pack 50 u. · Sin impresión ($25.000 + IVA)", "Pack 100 u. ($45.000 + IVA)", "Pack 200 u. ($90.000 + IVA)", "Pack 300 u. ($129.000 + IVA)", "Pack 400 u. ($166.000 + IVA)"],
        sku: "KP-CER-W6-330",
        packs: [{"quantity": 50, "unitPrice": 500, "totalNet": 25000, "sku": "KP-CER-W6-330-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($25.000 + IVA)"}, {"quantity": 100, "unitPrice": 450, "totalNet": 45000, "sku": "KP-CER-W6-330-P100", "withoutPrint": false, "label": "Pack 100 u. ($45.000 + IVA)"}, {"quantity": 200, "unitPrice": 450, "totalNet": 90000, "sku": "KP-CER-W6-330-P200", "withoutPrint": false, "label": "Pack 200 u. ($90.000 + IVA)"}, {"quantity": 300, "unitPrice": 430, "totalNet": 129000, "sku": "KP-CER-W6-330-P300", "withoutPrint": false, "label": "Pack 300 u. ($129.000 + IVA)"}, {"quantity": 400, "unitPrice": 415, "totalNet": 166000, "sku": "KP-CER-W6-330-P400", "withoutPrint": false, "label": "Pack 400 u. ($166.000 + IVA)"}]
      },
      {
        id: "beer-wrap-4x500",
        category: "cerveza",
        name: "Wrap para 4 botellas de 500 cc",
        subtitle: "Botellas grandes de 500 cc · Cartulina kraft 400g",
        type: "dual",
        image: "images/cerveza-wrap-4x500.webp",
        price: "$460 + IVA c/u · Pack 100 u.",
        priceNum: 460,
        specs: ["Para botellas 500 cc", "Kraft extra resistente", "Desde 50 u."],
        variants: ["Pack 50 u. · Sin impresión ($25.500 + IVA)", "Pack 100 u. ($46.000 + IVA)", "Pack 200 u. ($92.000 + IVA)", "Pack 300 u. ($132.000 + IVA)", "Pack 400 u. ($170.000 + IVA)"],
        sku: "KP-CER-W4-500",
        packs: [{"quantity": 50, "unitPrice": 510, "totalNet": 25500, "sku": "KP-CER-W4-500-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($25.500 + IVA)"}, {"quantity": 100, "unitPrice": 460, "totalNet": 46000, "sku": "KP-CER-W4-500-P100", "withoutPrint": false, "label": "Pack 100 u. ($46.000 + IVA)"}, {"quantity": 200, "unitPrice": 460, "totalNet": 92000, "sku": "KP-CER-W4-500-P200", "withoutPrint": false, "label": "Pack 200 u. ($92.000 + IVA)"}, {"quantity": 300, "unitPrice": 440, "totalNet": 132000, "sku": "KP-CER-W4-500-P300", "withoutPrint": false, "label": "Pack 300 u. ($132.000 + IVA)"}, {"quantity": 400, "unitPrice": 425, "totalNet": 170000, "sku": "KP-CER-W4-500-P400", "withoutPrint": false, "label": "Pack 400 u. ($170.000 + IVA)"}]
      },
      {
        id: "beer-wrap-2x500",
        category: "cerveza",
        name: "Wrap para 2 botellas de 500 cc",
        subtitle: "Presentación doble para botellas de 500 cc",
        type: "dual",
        image: "images/cerveza-wrap-2x500.webp",
        price: "$350 + IVA c/u · Pack 100 u.",
        priceNum: 350,
        specs: ["Para botellas 500 cc", "Doble compacto", "Desde 50 u."],
        variants: ["Pack 50 u. · Sin impresión ($20.000 + IVA)", "Pack 100 u. ($35.000 + IVA)", "Pack 200 u. ($70.000 + IVA)", "Pack 300 u. ($100.500 + IVA)", "Pack 400 u. ($130.000 + IVA)"],
        sku: "KP-CER-W2-500",
        packs: [{"quantity": 50, "unitPrice": 400, "totalNet": 20000, "sku": "KP-CER-W2-500-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($20.000 + IVA)"}, {"quantity": 100, "unitPrice": 350, "totalNet": 35000, "sku": "KP-CER-W2-500-P100", "withoutPrint": false, "label": "Pack 100 u. ($35.000 + IVA)"}, {"quantity": 200, "unitPrice": 350, "totalNet": 70000, "sku": "KP-CER-W2-500-P200", "withoutPrint": false, "label": "Pack 200 u. ($70.000 + IVA)"}, {"quantity": 300, "unitPrice": 335, "totalNet": 100500, "sku": "KP-CER-W2-500-P300", "withoutPrint": false, "label": "Pack 300 u. ($100.500 + IVA)"}, {"quantity": 400, "unitPrice": 325, "totalNet": 130000, "sku": "KP-CER-W2-500-P400", "withoutPrint": false, "label": "Pack 400 u. ($130.000 + IVA)"}]
      },
      {
        id: "beer-maleta-vaso",
        category: "cerveza",
        name: "Maleta para 2 botellas + vaso",
        subtitle: "Pack degustación con espacio para vaso o 3 botellas",
        type: "dual",
        image: "images/cerveza-maleta-2-botellas-vaso.webp",
        price: "$700 + IVA c/u · Pack 100 u.",
        priceNum: 700,
        specs: ["Formato regalo", "Botellas 330cc o 500cc", "Desde 50 u."],
        variants: ["Pack 50 u. · Sin impresión ($37.500 + IVA)", "Pack 100 u. ($70.000 + IVA)", "Pack 200 u. ($140.000 + IVA)", "Pack 300 u. ($201.000 + IVA)", "Pack 400 u. ($260.000 + IVA)"],
        sku: "KP-CER-M2V",
        packs: [{"quantity": 50, "unitPrice": 750, "totalNet": 37500, "sku": "KP-CER-M2V-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($37.500 + IVA)"}, {"quantity": 100, "unitPrice": 700, "totalNet": 70000, "sku": "KP-CER-M2V-P100", "withoutPrint": false, "label": "Pack 100 u. ($70.000 + IVA)"}, {"quantity": 200, "unitPrice": 700, "totalNet": 140000, "sku": "KP-CER-M2V-P200", "withoutPrint": false, "label": "Pack 200 u. ($140.000 + IVA)"}, {"quantity": 300, "unitPrice": 670, "totalNet": 201000, "sku": "KP-CER-M2V-P300", "withoutPrint": false, "label": "Pack 300 u. ($201.000 + IVA)"}, {"quantity": 400, "unitPrice": 650, "totalNet": 260000, "sku": "KP-CER-M2V-P400", "withoutPrint": false, "label": "Pack 400 u. ($260.000 + IVA)"}],
        configurations: ["2 botellas + vaso", "3 botellas 330cc"]
      },

      // 2. Repostería & Alfajores (Nuevos productos + Cajas de alfajor)
      {
        id: "reposteria-papel-metalizado",
        category: "reposteria",
        name: "Papel aluminio metalizado para alfajores",
        subtitle: "Cuadrados de 15 × 15 cm para envolver alfajores artesanales",
        type: "stock",
        image: "images/papel-aluminio-alfajores.webp",
        price: "$12.300 + IVA (Pack 100 u.)",
        priceNum: 12300,
        specs: ["Medida 15 × 15 cm", "Acabado brillante", "Apto alimentos"],
        variants: ["Dorado metalizado (Pack 100 u. $12.300 + IVA)","Rosado metalizado (Pack 100 u. $12.300 + IVA)","Dorado metalizado (Pack 500 u. $61.500 + IVA)","Rosado metalizado (Pack 500 u. $61.500 + IVA)"]
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
        subtitle: "Cartulina blanca 320 g/m² · Mica transparente · Con logo desde 100 u.: $391 + IVA c/u",
        type: "dual",
        image: "images/reposteria-caja-3-alfajores.webp",
        price: "$400 + IVA c/u · Pack 25 u. sin impresión",
        priceNum: 400,
        specs: ["Capacidad 3 alfajores", "Blancas desde 25 u.", "Con logo desde 100 u."],
        variants: ["Pack 25 u. · Sin impresión ($10.000 + IVA)", "Pack 50 u. · Sin impresión ($17.500 + IVA)", "Pack 100 u. · Con logo ($39.100 + IVA)"],
        sku: "KP-REP-A3",
        packs: [{"quantity": 25, "unitPrice": 400, "totalNet": 10000, "sku": "KP-REP-A3-P025-SI", "withoutPrint": true, "label": "Pack 25 u. · Sin impresión ($10.000 + IVA)"}, {"quantity": 50, "unitPrice": 350, "totalNet": 17500, "sku": "KP-REP-A3-P050-SI", "withoutPrint": true, "label": "Pack 50 u. · Sin impresión ($17.500 + IVA)"}, {"quantity": 100, "unitPrice": 391, "totalNet": 39100, "sku": "KP-REP-A3-P100-LOGO", "withoutPrint": false, "label": "Pack 100 u. · Con logo ($39.100 + IVA)", "requiresLogo": true, "configuration": "100 unidades"}],
        configurations: ["100 unidades", "250 unidades", "500 unidades"]
      },
      {
        "id": "reposteria-caja-4-alfajores",
        "category": "reposteria",
        "name": "Caja con ventana para 4 alfajores",
        "subtitle": "Medida 14 × 14 × 3 cm · Cartulina blanca 320 g/m² · Mica transparente · Con logo desde 100 u.: $391 + IVA c/u",
        "type": "dual",
        "image": "images/reposteria-caja-4-alfajores.webp",
        "price": "$400 + IVA c/u · Pack 25 u. sin impresión",
        "priceNum": 400,
        "specs": [
          "14 × 14 × 3 cm",
          "Blancas desde 25 u.",
          "Con logo desde 100 u."
        ],
        "variants": [
          "Pack 25 u. · Sin impresión ($10.000 + IVA)",
          "Pack 50 u. · Sin impresión ($17.500 + IVA)",
          "Pack 100 u. · Con logo ($39.100 + IVA)"
        ],
        "sku": "KP-REP-A4",
        "packs": [
          {
            "quantity": 25,
            "unitPrice": 400,
            "totalNet": 10000,
            "sku": "KP-REP-A4-P025-SI",
            "withoutPrint": true,
            "label": "Pack 25 u. · Sin impresión ($10.000 + IVA)"
          },
          {
            "quantity": 50,
            "unitPrice": 350,
            "totalNet": 17500,
            "sku": "KP-REP-A4-P050-SI",
            "withoutPrint": true,
            "label": "Pack 50 u. · Sin impresión ($17.500 + IVA)"
          },
          {
            "quantity": 100,
            "unitPrice": 391,
            "totalNet": 39100,
            "sku": "KP-REP-A4-P100-LOGO",
            "withoutPrint": false,
            "label": "Pack 100 u. · Con logo ($39.100 + IVA)",
            "requiresLogo": true,
            "configuration": "100 unidades"
          }
        ],
        "configurations": [
          "100 unidades",
          "250 unidades",
          "500 unidades"
        ]
      },
      {
        "id": "reposteria-caja-6-alfajores",
        "category": "reposteria",
        "name": "Caja con ventana para 6 alfajores",
        "subtitle": "Medida 19 × 14 × 3 cm · Cartulina blanca 320 g/m² · Mica transparente · Con logo desde 100 u.: $397 + IVA c/u",
        "type": "dual",
        "image": "images/reposteria-caja-6-alfajores.webp",
        "price": "$400 + IVA c/u · Pack 25 u. sin impresión",
        "priceNum": 400,
        "specs": [
          "19 × 14 × 3 cm",
          "Blancas desde 25 u.",
          "Con logo desde 100 u."
        ],
        "variants": [
          "Pack 25 u. · Sin impresión ($10.000 + IVA)",
          "Pack 50 u. · Sin impresión ($17.500 + IVA)",
          "Pack 100 u. · Con logo ($39.700 + IVA)"
        ],
        "sku": "KP-REP-A6",
        "packs": [
          {
            "quantity": 25,
            "unitPrice": 400,
            "totalNet": 10000,
            "sku": "KP-REP-A6-P025-SI",
            "withoutPrint": true,
            "label": "Pack 25 u. · Sin impresión ($10.000 + IVA)"
          },
          {
            "quantity": 50,
            "unitPrice": 350,
            "totalNet": 17500,
            "sku": "KP-REP-A6-P050-SI",
            "withoutPrint": true,
            "label": "Pack 50 u. · Sin impresión ($17.500 + IVA)"
          },
          {
            "quantity": 100,
            "unitPrice": 397,
            "totalNet": 39700,
            "sku": "KP-REP-A6-P100-LOGO",
            "withoutPrint": false,
            "label": "Pack 100 u. · Con logo ($39.700 + IVA)",
            "requiresLogo": true,
            "configuration": "100 unidades"
          }
        ],
        "configurations": [
          "100 unidades",
          "250 unidades",
          "500 unidades"
        ]
      },

      // 3. Gastronomía Compostable (Bagasse con impresión en tapa)
      {
        id: "bagasse-pollo-1",
        category: "gastronomia",
        name: "Caja para pollo (Bagasse)",
        subtitle: "Fibra de caña compostable · Personalización en tapa",
        type: "custom",
        image: "images/bagasse-caja-pollo-1.webp",
        price: "$522 + IVA c/u",
        priceNum: 522,
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
        price: "$303 + IVA c/u",
        priceNum: 303,
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
        price: "$352 + IVA c/u",
        priceNum: 352,
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
        price: "$394 + IVA c/u",
        priceNum: 394,
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
        price: "Desde $292 + IVA c/u",
        priceNum: 292,
        specs: ["Papel kraft", "Asas planas", "Impresión con logo"],
        variants: ["14 × 20 × 8 cm (pequeña) · $292 + IVA c/u","14 × 40 × 8 cm (para botellas) · $343 + IVA c/u","22 × 30 × 10 cm (mediana) · $316 + IVA c/u","30 × 41 × 12 cm (grande) · $518 + IVA c/u","45 × 48 × 15 cm (extra grande) · $712 + IVA c/u"]
      },
      {
        id: "bolsa-papel-blanca",
        category: "bolsas",
        name: "Bolsas de papel blancas con asas planas",
        subtitle: "Papel blanco satinado · Presentación limpia y elegante",
        type: "custom",
        image: "images/bolsa-papel-blanca-asa-plana.webp",
        price: "Desde $292 + IVA c/u",
        priceNum: 292,
        specs: ["Papel blanco", "Asas planas", "Impresión con logo"],
        variants: ["14 × 20 × 8 cm (pequeña) · $292 + IVA c/u","14 × 40 × 8 cm (para botellas) · $343 + IVA c/u","22 × 30 × 10 cm (mediana) · $316 + IVA c/u","30 × 41 × 12 cm (grande) · $518 + IVA c/u","45 × 48 × 15 cm (extra grande) · $712 + IVA c/u"]
      },

      // 5. Doypack Kraft con Ventana
      {
        id: "doypack-kraft-ventana",
        category: "doypack",
        name: "Doypack kraft con ventana y Ziplock",
        subtitle: "Barrera contra grasa y humedad · Para café, té y frutos secos",
        type: "custom",
        image: "images/doypack-kraft-ventana.webp",
        price: "Desde $174 + IVA c/u",
        priceNum: 174,
        specs: ["Cierre Ziplock", "Interior laminado", "Impresión 1 o 2 caras"],
        variants: ["10 × 15 + 3 cm · $174 + IVA c/u","12 × 20 + 4 cm · $219 + IVA c/u","14 × 20 + 4 cm · $255 + IVA c/u","16 × 24 + 4 cm · $343 + IVA c/u","20 × 29 + 5 cm · $558 + IVA c/u","25 × 35 + 5 cm · $570 + IVA c/u"]
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
