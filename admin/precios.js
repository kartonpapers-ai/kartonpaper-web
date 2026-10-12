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
  window.KP_PRICES = Object.freeze({packs, unitFromText, calculate});
})();
