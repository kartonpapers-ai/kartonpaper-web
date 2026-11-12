(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const catalog = window.KP_CATALOG;
  const sales = window.KP_SALES_CALC;
  const letter = window.KP_QUOTE_LETTER;
  const form = $('quote-form');
  const lines = $('quote-lines');
  let products = new Map();
  let client = null;
  let draft = null;
  let revision = 0;
  let printPages = null;

  function status(message) { $('quote-status').textContent = message; }

  function invalidate() {
    revision++;
    $('quote-preview').hidden = true;
    $('quote-pages').replaceChildren();
  }

  function control(row, name, title, type, attributes = {}) {
    const wrapper = document.createElement('label');
    wrapper.textContent = title;
    const field = document.createElement(type === 'select' ? 'select' : 'input');
    if (type !== 'select') field.type = type;
    field.dataset.quoteField = name;
    Object.assign(field, attributes);
    wrapper.append(field);
    row.append(wrapper);
    return field;
  }

  function field(row, name) { return row.querySelector('[data-quote-field="' + name + '"]'); }

  function options(select, placeholder, entries) {
    select.replaceChildren(new Option(placeholder, ''));
    for (const [value, label] of entries) select.add(new Option(label, value));
  }

  function variants(product) {
    const packs = product.packs || catalog.embalajeOptions(product);
    return packs.length ? packs.map(pack => [pack.sku, pack.label])
      : (product.variants || []).map(label => [label, label]);
  }

  function selectProduct(row) {
    const product = products.get(field(row, 'product').value);
    const variant = field(row, 'variant');
    options(variant, 'Selecciona una opción', product ? variants(product) : []);
    variant.required = variant.options.length > 1;
    variant.disabled = !variant.required;
    field(row, 'photo').checked = Boolean(product?.image);
    field(row, 'photo').disabled = !product?.image;
    selectVariant(row);
  }

  function selectVariant(row) {
    const product = products.get(field(row, 'product').value);
    const variant = field(row, 'variant').value;
    const pack = catalog.packFor(product, variant) || catalog.embalajeFor(product, variant);
    const quantity = field(row, 'quantity');
    quantity.value = pack?.quantity ?? '';
    quantity.readOnly = Boolean(pack);
    field(row, 'sku').value = pack?.sku ?? product?.sku ?? '';
    const price = pack?.unitPrice ?? catalog.catalogSale(product, variant);
    field(row, 'price').value = product && (!field(row, 'variant').required || variant) ? price ?? '' : '';
    field(row, 'personalized').checked = Boolean(product && product.type !== 'stock' && !pack?.withoutPrint);
  }

  function addLine() {
    if (!client || lines.children.length >= 10) return;
    const row = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = 'Producto';
    row.append(legend);
    const product = control(row, 'product', 'Producto de catálogo', 'select', { required: true });
    options(product, 'Selecciona un producto', [...products].map(([id, data]) => [id, data.name]));
    control(row, 'variant', 'Formato o tramo', 'select');
    const grid = document.createElement('div');
    grid.className = 'product-options';
    control(grid, 'quantity', 'Unidades', 'number', { required: true, min: '1', max: '1000000', step: '1' });
    control(grid, 'price', 'Precio neto c/u', 'number', { required: true, min: '0', max: '1000000000', step: '0.01' });
    row.append(grid);
    control(row, 'sku', 'SKU', 'text', { maxLength: 100 });
    const actions = document.createElement('div');
    actions.className = 'quote-line-actions';
    control(actions, 'personalized', 'Personalizado ', 'checkbox');
    control(actions, 'photo', 'Incluir foto ', 'checkbox');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary';
    remove.textContent = 'Quitar producto';
    remove.addEventListener('click', () => {
      row.remove();
      updateLineActions();
      invalidate();
      $('quote-add').focus();
    });
    actions.append(remove);
    row.append(actions);
    lines.append(row);
    product.addEventListener('change', () => selectProduct(row));
    field(row, 'variant').addEventListener('change', () => selectVariant(row));
    selectProduct(row);
    updateLineActions();
    invalidate();
    product.focus();
  }

  function updateLineActions() {
    $('quote-add').disabled = !client || !products.size || lines.children.length >= 10;
    $('quote-generate').disabled = !client || !lines.children.length || Boolean(draft?.busy);
    $('quote-new').disabled = !client || Boolean(draft?.busy);
  }

  function readQuote() {
    const customer = $('quote-customer').value.trim();
    const date = $('quote-date').value;
    if (!customer) throw new Error('Completa el nombre del cliente.');
    const items = Array.from(lines.children, row => {
      const product = products.get(field(row, 'product').value);
      if (!product) throw new Error('Selecciona un producto disponible en el catálogo.');
      const variant = field(row, 'variant').value;
      const pack = catalog.packFor(product, variant) || catalog.embalajeFor(product, variant);
      if (field(row, 'variant').required && !variant) throw new Error('Selecciona el formato de ' + product.name + '.');
      const quantity = Number(field(row, 'quantity').value);
      if (pack ? quantity !== pack.quantity : !catalog.validQuantity(product, variant, quantity)) {
        throw new Error('Revisa la cantidad del formato seleccionado para ' + product.name + '.');
      }
      const rawPrice = field(row, 'price').value;
      return { product_id: product.id, name: product.name, variant, quantity, unit_price: rawPrice === '' ? NaN : Number(rawPrice),
        sku: field(row, 'sku').value.trim(), photo: field(row, 'photo').checked ? product.image : '',
        personalized: field(row, 'personalized').checked,
        optionLabel: pack ? '' : variant.split(' · $')[0] };
    });
    const { net, iva, total, lineTotals } = sales.calculate({ ...sales.blank(), customer, date, lines: items });
    return { customer, date, net, iva, total, lines: items.map((item, index) => ({
      ...item, subtotal: lineTotals[index]
    })) };
  }

  function appendPreview(page, index, count, quote, current) {
    const container = document.createElement('div');
    container.className = 'quote-preview-page';
    const button = document.createElement('button');
    button.className = 'secondary';
    button.type = 'button';
    button.textContent = count === 1 ? 'Descargar PNG' : 'Descargar PNG · página ' + (index + 1);
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const blob = await letter.png(page);
        if (current !== revision) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const name = quote.number.replace(/[^a-z0-9_-]/gi, '-');
        link.download = 'Cotizacion-' + name + (count > 1 ? '-p' + (index + 1) : '') + '.png';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch (error) {
        if (current === revision) status(error.message);
      } finally {
        button.disabled = false;
      }
    });
    container.append(page, button);
    $('quote-pages').append(container);
  }

  function clearPrint() {
    printPages?.remove();
    printPages = null;
    document.body.classList.remove('quote-printing');
  }

  async function allocateFolio(session, requestId) {
    const table = () => session.from('kp_quote_folios');
    const existing = () => table().select('number').eq('request_id', requestId).maybeSingle();
    let result = await existing();
    if (!result.error && !result.data) {
      result = await table().insert({ request_id: requestId }).select('number').single();
      if (result.error?.code === '23505') result = await existing();
    }
    const number = Number(result.data?.number);
    if (result.error || !Number.isSafeInteger(number) || number < 2) {
      throw new Error('No se pudo asignar el folio. Revisa la conexión y vuelve a generar la cotización.');
    }
    return 'COT-' + String(number).padStart(4, '0');
  }

  function resetDraft() {
    draft = client ? { id: crypto.randomUUID(), number: '', busy: false } : null;
    form.reset();
    $('quote-number').value = '';
    $('quote-date').value = client ? sales.today() : '';
    lines.replaceChildren();
    clearPrint();
    invalidate();
    updateLineActions();
    status('');
  }

  $('quote-new').addEventListener('click', () => {
    if (!client || draft.busy) return;
    resetDraft();
    $('quote-customer').focus();
  });
  $('quote-add').addEventListener('click', addLine);
  form.addEventListener('input', () => {
    invalidate();
    updateLineActions();
    status('');
  });
  form.addEventListener('change', () => {
    invalidate();
    updateLineActions();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client || draft.busy || !form.reportValidity()) return;
    const session = client;
    const activeDraft = draft;
    invalidate();
    const current = revision;
    activeDraft.busy = true;
    updateLineActions();
    status('Generando la cotización…');
    try {
      const quote = readQuote();
      activeDraft.number ||= await allocateFolio(session, activeDraft.id);
      if (draft !== activeDraft) return;
      $('quote-number').value = activeDraft.number;
      if (current !== revision) return;
      quote.number = activeDraft.number;
      const pages = await letter.render(quote);
      if (current !== revision) return;
      pages.forEach((page, index) => appendPreview(page, index, pages.length, quote, current));
      $('quote-preview').hidden = false;
      status('Total con IVA ' + letter.money(quote.total) + '.');
    } catch (error) {
      if (current === revision) status(error.message);
    } finally {
      if (draft === activeDraft) {
        activeDraft.busy = false;
        updateLineActions();
      }
    }
  });

  $('quote-print').addEventListener('click', () => {
    if (!client || $('quote-preview').hidden) return;
    clearPrint();
    printPages = document.createElement('div');
    printPages.className = 'quote-print';
    for (const page of $('quote-pages').querySelectorAll('canvas')) {
      const copy = page.cloneNode();
      copy.getContext('2d').drawImage(page, 0, 0);
      printPages.append(copy);
    }
    document.body.append(printPages);
    document.body.classList.add('quote-printing');
    window.print();
  });
  window.addEventListener('afterprint', clearPrint);

  window.KP_QUOTES = Object.freeze({
    connect(session) {
      client = session;
      resetDraft();
    },
    setCatalog(rows) {
      products = new Map(rows.map(row => [row.id, row.data]));
      for (const row of lines.children) {
        const product = field(row, 'product');
        const id = product.value;
        const variant = field(row, 'variant');
        const chosen = variant.value;
        options(product, 'Selecciona un producto', [...products].map(([key, data]) => [key, data.name]));
        product.value = products.has(id) ? id : '';
        const data = products.get(id);
        if (!data || !chosen) {
          selectProduct(row);
        } else {
          options(variant, 'Selecciona una opción', variants(data));
          variant.required = variant.options.length > 1;
          variant.disabled = !variant.required;
          variant.value = variants(data).some(([value]) => value === chosen) ? chosen : '';
          if (!variant.value) selectVariant(row);
        }
      }
      invalidate();
      updateLineActions();
    },
    clear() {
      client = null;
      products.clear();
      resetDraft();
    }
  });
})();
