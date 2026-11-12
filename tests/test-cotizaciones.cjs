const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const { window: w } = new JSDOM(read('admin/index.html'), {
    url: 'https://kartonpaper.test/admin/', runScripts: 'outside-only'
  });
  const d = w.document;
  const $ = id => d.getElementById(id);
  const drawn = [];
  const photoSources = [];
  Object.defineProperty(d, 'fonts', { value: { load: async () => [] } });
  w.Image = class {
    naturalWidth = 600;
    naturalHeight = 800;
    set src(value) { photoSources.push(value); queueMicrotask(() => this.onload()); }
  };
  w.HTMLCanvasElement.prototype.getContext = () => ({
    scale() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, drawImage() {},
    measureText: value => ({ width: value.length * 12 }),
    fillText: value => drawn.push(value)
  });
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9cAAAAASUVORK5CYII=', 'base64');
  w.Blob = Blob;
  w.HTMLCanvasElement.prototype.toBlob = callback => callback(new Blob([pixel], { type: 'image/png' }));
  for (const script of ['js/catalogo-remoto.js', 'admin/ventas-calculo.js', 'admin/cotizacion-carta.js', 'admin/cotizaciones.js']) {
    w.eval(read(script));
  }

  const wrap = { id: 'beer-wrap-4x500', name: 'Wrap para 4 botellas de 500 cc', type: 'dual',
    image: 'images/cerveza-wrap-4x500.webp', packs: [{
      sku: 'KP-CER-W4-500-P100', label: 'Pack 100 u.', quantity: 100, unitPrice: 460
    }] };
  const duo = { id: 'beer-maleta-duo', name: 'Maleta Dúo para cerveza', type: 'dual',
    image: 'images/cerveza-maleta-duo-frontal.jpg', packs: [{
      sku: 'KP-CER-M2-DUO-P100-LOGO', label: 'Pack 100 u. · Con logo', quantity: 100, unitPrice: 600
    }] };
  w.KP_QUOTES.connect();
  w.KP_QUOTES.setCatalog([wrap, duo].map(data => ({ id: data.id, data })));
  $('quote-customer').value = 'Cervecería de prueba';
  $('quote-number').value = 'COT-0001';
  $('quote-date').value = '2026-11-12';

  function change(field, value) {
    field.value = value;
    field.dispatchEvent(new w.Event('change', { bubbles: true }));
  }
  function add(product) {
    $('quote-add').click();
    const row = $('quote-lines').lastElementChild;
    const get = name => row.querySelector('[data-quote-field="' + name + '"]');
    change(get('product'), product.id);
    change(get('variant'), product.packs[0].sku);
    assert.equal(get('quantity').value, '100');
    assert.equal(get('price').value, String(product.packs[0].unitPrice));
    assert.equal(get('sku').value, product.packs[0].sku);
    return get;
  }
  async function generate() {
    $('quote-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    await tick();
  }

  add(wrap);
  add(duo);
  await generate();
  assert.equal($('quote-preview').hidden, false);
  assert.match($('quote-status').textContent, /126\.140/);
  const page = $('quote-pages').querySelector('canvas');
  assert.deepEqual([page.width, page.height], [2550, 3300]);
  for (const value of ['N.º COT-0001', '$46.000', '$60.000', '$20.140', '$126.140', 'contacto@kartonpaper.cl',
    'SKU KP-CER-W4-500-P100', 'SKU KP-CER-M2-DUO-P100-LOGO']) assert.ok(drawn.includes(value), value);
  for (const product of [wrap, duo]) assert.ok(photoSources.includes('../' + product.image));
  const png = Buffer.from(await (await w.KP_QUOTE_LETTER.png(page)).arrayBuffer());
  assert.equal(png.toString('ascii', 37, 41), 'pHYs');
  assert.deepEqual([png.readUInt32BE(41), png.readUInt32BE(45), png[49]], [11811, 11811, 1]);

  add(wrap);
  assert.equal($('quote-preview').hidden, true);
  await generate();
  assert.equal($('quote-pages').querySelectorAll('canvas').length, 2);
  w.print = () => {
    assert.equal(d.querySelectorAll('.quote-print canvas').length, 2);
    assert.equal(d.body.classList.contains('quote-printing'), true);
  };
  $('quote-print').click();
  w.dispatchEvent(new w.Event('afterprint'));
  assert.equal(d.querySelector('.quote-print'), null);
  w.KP_QUOTES.clear();
  assert.equal($('quote-customer').value, '');
  assert.equal($('quote-pages').children.length, 0);
  w.close();
  console.log('OK Cotizaciones: catálogo, SKU, fotos, IVA, exportación Carta, impresión y cierre de sesión.');
})().catch(error => { console.error(error); process.exitCode = 1; });
