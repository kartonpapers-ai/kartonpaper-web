(function () {
  "use strict";
  const format = n => new Intl.NumberFormat("es-CL", {maximumFractionDigits:0}).format(n);
  function packs(variants) {
    const quantities = variants.map(v => /^Pack ([1-9][0-9]*) u\. \(\$[0-9.]+\)$/.exec(v)?.[1]).map(Number);
    return quantities.length && quantities.every(n => Number.isSafeInteger(n) && n > 0) ? quantities : null;
  }
  function unitFromText(price) {
    const match = /^\$([0-9.]+) \+ IVA c\/u$/.exec(price);
    return match ? Number(match[1].replaceAll(".", "")) : null;
  }
  function calculate(unit, quantities) {
    if (unit === "" || !Number.isSafeInteger(Number(unit)) || Number(unit) < 0) throw new Error("Ingresa un precio por unidad en pesos enteros, igual o mayor que cero.");
    const n = Number(unit);
    if (!quantities || quantities.some(q => !Number.isSafeInteger(q) || q < 1 || !Number.isSafeInteger(q*n))) throw new Error("Revisa las cantidades de los packs: el total no es válido.");
    return {priceNum:n, price:`$${format(n)} + IVA c/u`, variants:quantities.map(q => `Pack ${q} u. ($${format(q*n)})`)};
  }
  function structured(product, entries, initial) {
    if (!Array.isArray(entries) || !entries.length || entries.length > 30) throw new Error("Conserva entre 1 y 30 packs.");
    if (!Number.isInteger(initial) || !entries[initial]) throw new Error("Selecciona el pack cuyo precio aparecerá primero en el catálogo.");
    const skus = new Set();
    const updated = entries.map((entry, index) => {
      const {quantity, unitPrice, sku, withoutPrint} = entry;
      const prefix = "Pack " + (index + 1) + ": ";
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) throw new Error(prefix + "ingresa entre 1 y 1.000.000 unidades enteras.");
      if (!Number.isSafeInteger(unitPrice) || unitPrice < 0 || unitPrice > 1e9 || !Number.isSafeInteger(quantity * unitPrice)) throw new Error(prefix + "ingresa un precio unitario neto válido en pesos enteros (0 a 1.000.000.000).");
      if (typeof sku !== "string" || !/^[A-Z0-9-]{1,80}$/.test(sku) || skus.has(sku)) throw new Error(prefix + "usa un SKU único, con mayúsculas, números y guiones (máximo 80 caracteres).");
      if (typeof withoutPrint !== "boolean" || typeof entry.requiresLogo !== "boolean" || (withoutPrint && entry.requiresLogo) || (entry.requiresLogo && product.type === "stock")) throw new Error(prefix + "revisa la modalidad de impresión y la forma de venta.");
      skus.add(sku);
      const pack = {...entry, totalNet:quantity * unitPrice};
      const mode = withoutPrint ? " · Sin impresión" : entry.requiresLogo ? " · Con logo" : "";
      pack.label = `Pack ${quantity} u.${mode} ($${format(pack.totalNet)} + IVA)`;
      if (entry.requiresLogo) pack.configuration = `${quantity} unidades`;
      else {delete pack.configuration; delete pack.requiresLogo;}
      return pack;
    });
    const labels = new Set(updated.map(pack => pack.label));
    if (labels.size !== updated.length) throw new Error("Hay packs repetidos: revisa cantidad, impresión y precio.");
    const previousLabels = new Set((product.packs || []).map(pack => pack.label));
    const variants = [...updated.map(pack => pack.label), ...(product.variants || []).filter(label => !previousLabels.has(label))];
    const initialPack = updated[initial];
    const price = `$${format(initialPack.unitPrice)} + IVA c/u · Pack ${initialPack.quantity} u.${initialPack.withoutPrint ? " sin impresión" : initialPack.requiresLogo ? " con logo" : ""}`;
    const result = {packs:updated, variants, price, priceNum:initialPack.unitPrice, pricingMode:"packs"};
    const previousConfigurations = new Set((product.packs || []).filter(pack => pack.requiresLogo).map(pack => pack.configuration));
    const configurations = [...updated.filter(pack => pack.requiresLogo).map(pack => pack.configuration), ...(product.configurations || []).filter(value => !previousConfigurations.has(value))];
    if (product.configurations || configurations.length) result.configurations = [...new Set(configurations)];
    return result;
  }
  function initialPack(product) {
    const quantity = /Pack ([1-9][0-9]*) u\./.exec(product.price)?.[1];
    const index = product.packs?.findIndex(pack => pack.quantity === Number(quantity) && pack.unitPrice === product.priceNum);
    if (index >= 0) return index;
    const match = /^\$([0-9.]+) \+ IVA c\/u/.exec(product.price);
    const byPrice = product.packs?.findIndex(pack => pack.unitPrice === Number(match?.[1].replaceAll(".", "")));
    return byPrice >= 0 ? byPrice : 0;
  }
  function embalajes(product, entries, initial) {
    if (!window.KP_CATALOG.isEmbalaje(product)) throw new Error("Conserva la venta personalizada por embalaje y la impresión en tapa.");
    if (!entries.length || entries.length > 30 || !entries[initial]) throw new Error("Conserva entre 1 y 30 tramos y elige el precio inicial.");
    const skus=new Set(),quantities=new Set();
    const rows=entries.map((entry,index)=>{
      const quantity=entry.quantity,unitPrice=Number.isNaN(entry.unitPrice)?null:entry.unitPrice,sku=entry.sku;
      if (!Number.isSafeInteger(quantity) || quantity < product.orderStep || quantity > 1000000 || quantity % product.orderStep || quantities.has(quantity)) throw new Error("Tramo "+(index+1)+": usa cantidades únicas en múltiplos de "+product.orderStep+" unidades.");
      if (!(unitPrice===null || Number.isSafeInteger(unitPrice) && unitPrice>=0 && unitPrice<=1e9) || unitPrice!==null && !Number.isSafeInteger(quantity*unitPrice)) throw new Error("Revisa el precio unitario del tramo "+(index+1)+". Usa pesos enteros o deja vacío para cotizar.");
      if(typeof sku!=="string" || !/^[A-Z0-9-]{1,80}$/.test(sku) || skus.has(sku)) throw new Error("Revisa el SKU del tramo "+(index+1)+". Debe ser único y usar mayúsculas, números y guiones.");
      quantities.add(quantity);skus.add(sku);
      const totalNet=unitPrice===null?null:quantity*unitPrice,n=quantity/product.orderStep;
      return {quantity,unitPrice,totalNet,sku,label:quantity+" unidades · "+n+(n===1?" embalaje":" embalajes")+" · "+(totalNet===null?"Por cotizar":"$"+format(totalNet)+" + IVA")};
    });
    const chosen=rows[initial];rows.sort((a,b)=>a.quantity-b.quantity);
    return {quantityPrices:rows,initialPriceQuantity:chosen.quantity,variants:rows.map(row=>row.label),priceNum:chosen.unitPrice??undefined,
      price:chosen.unitPrice===null?"Cotización con logo":`$${format(chosen.unitPrice)} + IVA c/u · ${chosen.quantity} unidades`,pricingMode:"embalajes"};
  }
  window.KP_PRICES = Object.freeze({packs, unitFromText, calculate, structured, initialPack, embalajes});
})();
