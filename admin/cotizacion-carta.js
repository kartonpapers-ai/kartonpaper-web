(function () {
  'use strict';

  const colors = { white: '#ffffff', ink: '#18251d', muted: '#4a5a50', green: '#285441',
    rule: '#d8e3dc', soft: '#edf4ef' };
  const money = (amount, decimals = 0) => '$' + amount.toLocaleString('es-CL', {
    maximumFractionDigits: decimals
  });
  const dateFormat = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  });

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.referrerPolicy = 'no-referrer';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo cargar una foto. Revisa su origen o desmarca la foto de ese producto.'));
      image.src = source.startsWith('https://') ? source : '../' + source;
    });
  }

  function drawPage(quote, lines, photos, logo, page, pageCount) {
    const canvas = document.createElement('canvas');
    canvas.width = 2550;
    canvas.height = 3300;
    canvas.setAttribute('role', 'img');
    const detail = lines.map(line => line.name + ', ' + line.quantity + ' unidades').join('. ');
    canvas.setAttribute('aria-label', 'Cotización ' + quote.number + ' para ' + quote.customer +
      '. Página ' + page + ' de ' + pageCount + '. ' + detail + '. Total con IVA ' + money(quote.total));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Este navegador no puede generar la imagen.');
    ctx.scale(3, 3);

    function box(x, y, width, height, color, radius = 0, border) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fillStyle = color;
      ctx.fill();
      if (border) {
        ctx.strokeStyle = border;
        ctx.stroke();
      }
    }

    function text(value, x, y, size, weight, options = {}) {
      const { display = false, color = colors.ink, align = 'left', width = 470 } = options;
      ctx.font = weight + ' ' + size + 'px "' + (display ? 'Quote Bricolage' : 'Quote DM Sans') + '", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'top';
      ctx.fillText(value, x, y, width);
    }

    function picture(image, x, y, width, height) {
      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
    }

    const right = { align: 'right', width: 310 };
    const display = { display: true };
    box(0, 0, 850, 1100, colors.white);
    box(50, 45, 750, 5, colors.green);
    picture(logo, 49, 63, 251, 80);
    text('N.º ' + quote.number, 800, 78, 22, 650, { ...right, color: colors.green });
    text(dateFormat.format(new Date(quote.date + 'T00:00:00Z')), 800, 110, 18, 500, { ...right, color: colors.muted });
    text('Cotización', 50, 150, 59, 700, display);
    text(quote.customer, 51, 227, 31, 650, { ...display, color: colors.green, width: 747 });

    lines.forEach((line, index) => {
      const y = 296 + index * 227;
      const photo = photos[index];
      box(50, y, 750, 211, colors.white, 13, colors.rule);
      if (photo) {
        picture(photo, 57, y + 9, 215, 193);
        box(284, y + 26, 2, 159, colors.rule);
      }
      const x = photo ? 309 : 75;
      const width = 775 - x;
      const labels = line.product_id === 'beer-wrap-4x500' ? ['Wrap para 4 botellas', 'de 500 cc']
        : line.product_id === 'beer-maleta-duo' ? ['Maleta Dúo', 'para 2 botellas'] : [line.name];
      ctx.font = '700 28px "Quote Bricolage", sans-serif';
      if (labels.length === 1 && ctx.measureText(labels[0]).width > width) {
        const words = labels[0].split(' ');
        let split = 1;
        while (split + 1 < words.length && ctx.measureText(words.slice(0, split + 1).join(' ')).width <= width) split++;
        if (words.length > 1) labels.splice(0, 1, words.slice(0, split).join(' '), words.slice(split).join(' '));
      }
      labels.forEach((label, i) => text(label, x, y + 20 + i * 35, 28, 700, { ...display, width }));
      const finish = line.personalized ? 'Personalizado' : 'Sin personalización';
      text(line.optionLabel ? finish + ' · ' + line.optionLabel : finish, x, y + 96, 18, 600, { color: colors.green, width });
      if (line.sku) text('SKU ' + line.sku, x, y + 122, 16, 550, { color: colors.muted, width });
      text(line.quantity.toLocaleString('es-CL') + ' unidades', x, y + 149, 20, 600, { width: 225 });
      text(money(line.unit_price, 2) + ' neto c/u', x, y + 178, 16, 450, { color: colors.muted, width: 225 });
      text(money(line.subtotal), 775, y + 147, 31, 700, { ...display, align: 'right', width: 218 });
      text('Subtotal neto', 775, y + 185, 15, 450, { ...right, color: colors.muted });
    });

    if (page === pageCount) {
      const discounted = quote.discountPercent > 0;
      const totals = discounted ? [
        [745, 'Subtotal neto', money(quote.subtotal)],
        [772, 'Descuento (' + quote.discountPercent.toLocaleString('es-CL') + ' %)', '−' + money(quote.discount)],
        [799, 'Neto con descuento', money(quote.net)],
        [826, 'IVA (19 %)', money(quote.iva)]
      ] : [[768, 'Subtotal neto', money(quote.net)], [808, 'IVA (19 %)', money(quote.iva)]];
      for (const [y, label, amount] of totals) {
        text(label, 348, y, discounted ? 19 : 21, 500, { color: colors.muted });
        text(amount, 775, y, discounted ? 21 : 23, 650, right);
      }
      box(50, 862, 750, 86, colors.soft, 12);
      text('Total con IVA', 76, 885, 26, 650, { color: colors.green });
      text(money(quote.total), 775, 875, 47, 750, { ...right, ...display });
    }

    box(50, 988, 750, 1, colors.rule);
    text('kartonpaper.cl', 50, 1005, 20, 650, { color: colors.green });
    text('contacto@kartonpaper.cl', 50, 1033, 18, 500, { color: colors.muted });
    text('Valores en pesos chilenos (CLP)', 800, 1006, 17, 450, { ...right, color: colors.muted });
    if (pageCount > 1) text(page + ' / ' + pageCount, 800, 1033, 17, 500, { ...right, color: colors.muted });
    return canvas;
  }

  async function render(quote) {
    const [logo, photos] = await Promise.all([
      loadImage('images/kartonpaper-logo-lockup.webp'),
      Promise.all(quote.lines.map(line => line.photo ? loadImage(line.photo) : null)),
      document.fonts.load('400 20px "Quote DM Sans"'),
      document.fonts.load('700 28px "Quote Bricolage"')
    ]);
    const pages = [];
    const count = Math.ceil(quote.lines.length / 2);
    for (let index = 0; index < count; index++) {
      const start = index * 2;
      pages.push(drawPage(quote, quote.lines.slice(start, start + 2), photos.slice(start, start + 2), logo, index + 1, count));
    }
    return pages;
  }

  async function png(canvas) {
    const image = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!image) throw new Error('No se pudo generar el PNG.');
    const bytes = new DataView(await image.arrayBuffer());
    const density = new Uint8Array(21);
    const chunk = new DataView(density.buffer);
    chunk.setUint32(0, 9);
    chunk.setUint32(4, 0x70485973); // pHYs
    chunk.setUint32(8, 11811);
    chunk.setUint32(12, 11811);
    density[16] = 1; // Píxeles por metro, equivalentes a 300 ppp.
    let crc = 0xffffffff;
    for (const byte of density.subarray(4, 17)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    chunk.setUint32(17, crc ^ 0xffffffff);
    const parts = [image.slice(0, 33), density]; // Firma PNG e IHDR.
    for (let offset = 33; offset + 12 <= bytes.byteLength;) {
      const end = offset + 12 + bytes.getUint32(offset);
      if (end > bytes.byteLength) throw new Error('El PNG generado está incompleto.');
      if (bytes.getUint32(offset + 4) !== 0x70485973) parts.push(image.slice(offset, end));
      offset = end;
    }
    return new Blob(parts, { type: 'image/png' });
  }

  window.KP_QUOTE_LETTER = Object.freeze({ render, png, money });
})();
