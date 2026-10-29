(function () {
  "use strict";
  const categories = ["cerveza", "reposteria", "gastronomia", "bolsas", "doypack", "posavasos"];
  let loadIssues = [];
  function validate(p) {
    if (!p || typeof p !== "object") throw new Error("Producto inválido.");
    for (const field of ["id", "category", "name", "subtitle", "type", "image", "price"]) {
      if (typeof p[field] !== "string" || !p[field].trim() || p[field].length > 500) {
        throw new Error("Revisa el campo " + field + ".");
      }
    }
    if (!/^[a-z0-9-]+$/.test(p.id) || !categories.includes(p.category) || !["dual", "custom", "stock"].includes(p.type)) {
      throw new Error("Identificador, categoría o tipo inválidos.");
    }
    if (!/^images\/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$/.test(p.image)) {
      const c = configuration();
      const prefix = c && c.supabaseUrl.replace(/\/$/, "") + "/storage/v1/object/public/kp-productos/";
      if (!prefix || !p.image.startsWith(prefix) || !/^[a-z0-9-]+\.webp$/.test(p.image.slice(prefix.length))) throw new Error("Imagen inválida: usa una foto de este catálogo.");
    }
    for (const field of ["specs", "variants"]) {
      if (!Array.isArray(p[field]) || !p[field].length || p[field].length > 30 || p[field].some(v => typeof v !== "string" || !v.trim() || v.length > 500)) {
        throw new Error("Revisa las opciones y características del producto.");
      }
    }
    if (p.configurations !== undefined && (!Array.isArray(p.configurations) || !p.configurations.length || p.configurations.length > 30 || p.configurations.some(v=>typeof v!=="string"||!v.trim()||v.length>500))) throw new Error("Revisa las configuraciones del producto.");
    if ("priceNum" in p && (!Number.isFinite(p.priceNum) || p.priceNum < 0)) throw new Error("Precio numérico inválido.");
    if (p.orderStep !== undefined && (!Number.isSafeInteger(p.orderStep) || p.orderStep < 1 || p.orderStep > 1000000 || p.type !== 'custom')) throw new Error('Revisa las unidades del embalaje.');
    if (p.customQuantities !== undefined && (p.type!=='custom'||!Array.isArray(p.customQuantities)||!p.customQuantities.length||p.customQuantities.length>30||p.customQuantities.some((q,i)=>!Number.isSafeInteger(q)||q<1||q>1000000||(i>0&&q<=p.customQuantities[i-1])))) throw new Error('Revisa las cantidades personalizadas.');
    if (p.requiresArtwork !== undefined && (typeof p.requiresArtwork!=='boolean'||p.type!=='custom')) throw new Error('Revisa el requisito de archivo.');
    if (p.pricePending !== undefined && (typeof p.pricePending!=='boolean'||p.type!=='stock')) throw new Error('Revisa el estado del precio.');
    if (p.wholesaleInquiry !== undefined && (typeof p.wholesaleInquiry!=='boolean'||p.type!=='stock')) throw new Error('Revisa la consulta mayorista.');
    if (p.stockUnits !== undefined && (p.type!=='stock'||!Number.isSafeInteger(p.stockUnits)||p.stockUnits<1||p.stockUnits>1000000||(!p.pricePending&&(!Number.isFinite(p.priceNum)||p.priceNum<=0)))) throw new Error('Fija un precio mayor que cero para activar la venta por caja.');
    if (p.quantityRules !== undefined) {
      if (!Array.isArray(p.quantityRules) || p.quantityRules.length !== p.variants.length || p.type !== 'custom') throw new Error('Revisa las cantidades por medida.');
      const seen = new Set();
      for (const rule of p.quantityRules) {
        if (!rule || typeof rule.variant !== 'string' || seen.has(rule.variant) || !p.variants.some(v=>v.split(' · $')[0]===rule.variant)) throw new Error('Medida inválida en las cantidades.');
        seen.add(rule.variant);
        if (rule.quantities !== undefined) {
          if (rule.step !== undefined || !Array.isArray(rule.quantities) || !rule.quantities.length || rule.quantities.length > 30 || rule.quantities.some((q,i)=>!Number.isSafeInteger(q)||q<1||q>1000000||(i>0&&q<=rule.quantities[i-1]))) throw new Error('Revisa las cantidades permitidas.');
        } else if (!Number.isSafeInteger(rule.step) || rule.step<1 || rule.step>1000000) throw new Error('Revisa el tamaño del embalaje.');
      }
    }
    if (p.quantityPrices !== undefined) {
      if (!isEmbalaje(p) || !Array.isArray(p.quantityPrices) || !p.quantityPrices.length || p.quantityPrices.length > 30) throw new Error("Revisa los precios por embalaje.");
      if(p.initialPriceQuantity!==undefined&&!p.quantityPrices.some(row=>row?.quantity===p.initialPriceQuantity))throw new Error("Revisa el tramo del precio inicial.");
      const chosen=p.quantityPrices.find(row=>row?.quantity===p.initialPriceQuantity);
      if(chosen&&(chosen.unitPrice===null?'priceNum' in p:p.priceNum!==chosen.unitPrice))throw new Error("El precio inicial no coincide con el tramo seleccionado.");
      const skus = new Set();
      for (const [index, row] of p.quantityPrices.entries()) {
        if (!row || !Number.isSafeInteger(row.quantity) || row.quantity < p.orderStep || row.quantity > 1000000 || row.quantity % p.orderStep || (index && row.quantity <= p.quantityPrices[index-1].quantity)
          || !(row.unitPrice === null || Number.isSafeInteger(row.unitPrice) && row.unitPrice >= 0 && row.unitPrice <= 1e9)
          || row.totalNet !== (row.unitPrice === null ? null : row.unitPrice * row.quantity) || row.totalNet !== null && !Number.isSafeInteger(row.totalNet)
          || typeof row.sku !== "string" || !/^[A-Z0-9-]{1,80}$/.test(row.sku) || skus.has(row.sku) || !p.variants.includes(row.label)) throw new Error("Revisa cantidades, SKU y totales de los embalajes.");
        skus.add(row.sku);
      }
    }
    if (p.packs !== undefined) {
      if (!Array.isArray(p.packs) || !p.packs.length || p.packs.length > 30) throw new Error("Packs inválidos.");
      const skus = new Set();
      for (const pack of p.packs) {
        if (!pack || !Number.isSafeInteger(pack.quantity) || pack.quantity < 1
          || !Number.isSafeInteger(pack.unitPrice) || pack.unitPrice < 0
          || !Number.isSafeInteger(pack.totalNet) || pack.totalNet !== pack.quantity * pack.unitPrice
          || typeof pack.sku !== "string" || !/^[A-Z0-9-]{1,80}$/.test(pack.sku) || skus.has(pack.sku)
          || typeof pack.withoutPrint !== "boolean" || !p.variants.includes(pack.label)) {
          throw new Error("Revisa cantidades, SKU y precios estructurados de los packs.");
        }
        if (pack.requiresLogo !== undefined && (typeof pack.requiresLogo !== "boolean"
          || (pack.requiresLogo && (pack.withoutPrint || p.type === "stock" || typeof pack.configuration !== "string"
            || !p.configurations?.includes(pack.configuration))))) throw new Error("Revisa la configuración del pack con logo.");
        skus.add(pack.sku);
      }
    }
    return p;
  }
  function configuration() {
    const c = window.KP_CONFIG;
    if (!c || !c.enabled) return null;
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(c.supabaseUrl) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(c.publishableKey)) {
      throw new Error("Revisa la URL y la clave pública de Supabase.");
    }
    return c;
  }
  function partition(rows) {
    if (!Array.isArray(rows)) throw new Error("Respuesta de catálogo inválida.");
    const valid = [], rejected = [], counts = new Map();
    for (const row of rows) if (typeof row?.id === "string") counts.set(row.id, (counts.get(row.id) || 0) + 1);
    rows.forEach((row, index) => {
      try {
        const product = validate(row?.data);
        if (row.id !== product.id) throw new Error("El identificador de la fila no coincide con el producto.");
        if (counts.get(row.id) > 1) throw new Error("Identificador duplicado. Revisa las filas de este producto.");
        valid.push(row);
      } catch (error) {
        rejected.push({id:typeof row?.id === "string" ? row.id : null, position:index+1, reason:error.message});
      }
    });
    return {valid, rejected};
  }
  async function load() {
    loadIssues = [];
    const c = configuration();
    if (!c) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const url = c.supabaseUrl.replace(/\/$/, "") + "/rest/v1/kp_products?select=id,data&published=eq.true&order=sort_order.asc,id.asc";
      const response = await fetch(url, {headers: {apikey: c.publishableKey}, signal: controller.signal, cache: "no-store"});
      if (!response.ok) throw new Error("No se pudo consultar el catálogo.");
      const rows = await response.json();
      const result = partition(rows);
      loadIssues = result.rejected;
      return result.valid.map(row => row.data);
    } finally { clearTimeout(timer); }
  }
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
  const money = value => "$" + Number(value).toLocaleString("es-CL");
  function packFor(product, label) {
    if (typeof label !== "string" || !label.trim()) return undefined;
    const packs = product?.packs || [];
    const exact = packs.find(pack => pack.sku === label || pack.label === label);
    if (exact) return exact;
    // Admin fields omit the displayed price. Match only a unique identity,
    // retaining quantity and print mode; never guess a pack from its quantity.
    const identity = value => String(value ?? "").split(" · $")[0]
      .replace(/\s*\(\$[^)]*\)$/, "").trim();
    const matches = packs.filter(pack => pack.configuration === label
      || identity(pack.label) === identity(label));
    return matches.length === 1 ? matches[0] : undefined;
  }
  function isEmbalaje(product) {
    return product?.category === "gastronomia" && product.type === "custom" && Number.isSafeInteger(product.orderStep) && product.orderStep > 0 && product.printingArea === "tapa";
  }
  function embalajeOptions(product) {
    if (!isEmbalaje(product)) return [];
    if (product.quantityPrices) return product.quantityPrices;
    const match = /^\$([0-9.]+) \+ IVA c\/u(?:$| · )/.exec(product.price);
    const displayed = match ? Number(match[1].replaceAll('.', '')) : null;
    const unitPrice = Number.isSafeInteger(displayed) && displayed >= 0 && displayed <= 1e9 && (product.priceNum === undefined || product.priceNum === displayed) ? displayed : null;
    // Compatibility with the live catalog: preserve its published unit price.
    // Only quantities actually offered by the product get a price.
    return (product.variants || []).map(label => ({label,quantity:Number.parseInt(label,10)}))
      .filter(row => Number.isSafeInteger(row.quantity) && row.quantity >= product.orderStep && row.quantity <= 1000000 && row.quantity % product.orderStep === 0)
      .map(row => ({...row,unitPrice,totalNet:unitPrice === null ? null : row.quantity * unitPrice,
        sku:'KP-GAS-'+product.id.replace(/^bagasse-/, '').toUpperCase().slice(0,40)+'-Q'+row.quantity}));
  }
  function embalajeFor(product, key) {
    const rows = embalajeOptions(product);
    if (typeof key === 'number') return rows.find(row => row.quantity === key);
    if (typeof key !== 'string') return undefined;
    const exact = rows.find(row => row.sku === key || row.label === key);
    if (exact) return exact;
    const match = /^([1-9][0-9]*) unidades(?:$| · )/.exec(key);
    return match ? rows.find(row => row.quantity === Number(match[1])) : undefined;
  }
  function embalajeFields(product, quantity) {
    const row = embalajeFor(product, quantity),priced = row && row.unitPrice !== null;
    return {pricedCustomization:Boolean(priced),customUnitPrice:priced?row.unitPrice:null,customPricingSku:priced?row.sku:null,
      price:priced?money(row.unitPrice)+' + IVA c/u · Impresión en tapa':'Cotización con logo'};
  }
  function catalogSale(product, variant) {
    if (!product) return null;
    if (isEmbalaje(product)) return embalajeFor(product,variant)?.unitPrice ?? null;
    const pack = packFor(product, variant);
    if (pack) return pack.unitPrice;
    // A product with structured packs must resolve the selected pack. Its
    // starting price is not a substitute for an unknown option or quote.
    if (product.packs) return null;
    const clean = value => String(value ?? "").split(" · $")[0].trim();
    const option = product.variants?.find(value => clean(value) === clean(variant));
    const unit = /\$([0-9.]+) \+ IVA c\/u(?:$| · )/;
    const match = option && unit.exec(option) || /^\$([0-9.]+) \+ IVA c\/u(?:$| · )/.exec(product.price);
    return match ? Number(match[1].replaceAll(".", "")) : null;
  }
  function packFields(product, label) {
    const pack = packFor(product, label);
    return pack ? {sku:pack.sku, unitsPerPack:pack.quantity, unitPrice:pack.unitPrice,
      totalNet:pack.totalNet, withoutPrint:pack.withoutPrint,
      price:money(pack.totalNet) + " + IVA / pack"} : {price:product.price};
  }
  function quantityRule(product,variant) {
    if (product?.orderStep) return {step:product.orderStep};
    if (product?.customQuantities) return {quantities:product.customQuantities};
    return product?.quantityRules?.find(rule=>rule.variant===String(variant??'').split(' · $')[0]);
  }
  function validQuantity(product,variant,quantity) {
    if (!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000) return false;
    const rule=quantityRule(product,variant);
    return !rule || (rule.quantities ? rule.quantities.includes(quantity) : quantity>=rule.step && quantity%rule.step===0);
  }
  window.KP_CATALOG = Object.freeze({validate, partition, configuration, load, loadIssues:()=>loadIssues.map(issue=>({...issue})), escape, money, packFor, catalogSale, packFields, quantityRule, validQuantity, isEmbalaje, embalajeOptions, embalajeFor, embalajeFields});
})();
