(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const sales = window.KP_SALES_CALC;
  const currency = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });
  const money = value => value === null ? '—' : currency.format(value);
  const normalize = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
  const orderNumber = row => 'V-' + String(row.number).padStart(6, '0');
  const confirmed = row => Object.hasOwn(sales.states, row.data.state) &&
    !['pendiente', 'anulada'].includes(row.data.state);

  let orders = null;
  let clients = new Map();
  let selectedClient = null;

  function clientKey(row) {
    const contact = normalize(row.data.contact);
    if (!contact) return row.id;
    const identity = /^\+?[\d\s().-]+$/.test(contact) ? contact.replace(/\D/g, '') : contact;
    return JSON.stringify([normalize(row.data.customer), identity]);
  }

  function button(label, action) {
    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'secondary';
    control.textContent = label;
    control.addEventListener('click', action);
    return control;
  }

  function orderRow(row, values, destination) {
    const tr = document.createElement('tr');
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      tr.append(cell);
    }
    const actions = document.createElement('td');
    actions.append(button('Abrir venta', () => window.KP_SALES.open(row.id)));
    tr.append(actions);
    destination.append(tr);
  }

  function selectClient(key, focus = true) {
    selectedClient = key;
    renderCustomers();
    if (focus) $('customer-name').focus();
  }

  function renderCustomers() {
    const query = normalize($('customer-search').value);
    const list = $('customer-list');
    list.replaceChildren();
    let visibleCount = 0;

    for (const [key, history] of clients) {
      const latest = history[0].data;
      if (!normalize(latest.customer + ' ' + latest.contact).includes(query)) continue;
      visibleCount++;
      const item = button(latest.customer, () => selectClient(key));
      item.setAttribute('aria-pressed', String(key === selectedClient));
      if (latest.contact) {
        const contact = document.createElement('small');
        contact.textContent = latest.contact;
        item.append(contact);
      }
      list.append(item);
    }
    $('customer-status').textContent = orders === null ? 'Las fichas se muestran al cargar Ventas.'
      : visibleCount ? visibleCount + (visibleCount === 1 ? ' ficha' : ' fichas') : 'No se encontraron clientes.';

    const detail = $('customer-detail');
    const history = clients.get(selectedClient);
    const table = $('customer-sales');
    table.replaceChildren();
    detail.hidden = !history;
    if (!history) {
      for (const id of ['customer-name', 'customer-contact', 'customer-note-text', 'customer-balance']) $(id).textContent = '';
      return;
    }

    const latest = history[0].data;
    $('customer-name').textContent = latest.customer;
    $('customer-contact').textContent = latest.contact || 'Sin contacto registrado';
    $('customer-notes').hidden = !latest.notes;
    $('customer-note-text').textContent = latest.notes || '';

    let balance = 0n;
    let invalid = false;
    for (const row of history) {
      const result = row.result;
      if (confirmed(row)) {
        if (result) balance += BigInt(result.balance);
        else invalid = true;
      }
      orderRow(row, [orderNumber(row) + ' · ' + row.data.date, money(result?.total ?? null),
        money(result?.balance ?? null), sales.states[row.data.state] || 'Revisar estado'], table);
    }
    $('customer-balance').textContent = money(invalid ? null : balance);
  }

  function renderFinance() {
    const query = normalize($('fin-sales-search').value);
    const from = $('fin-sales-from').value;
    const to = $('fin-sales-to').value;
    const invalidRange = from && to && from > to;
    const matching = !orders || invalidRange ? [] : orders.filter(row =>
      confirmed(row) && (!from || row.data.date >= from) && (!to || row.data.date <= to) &&
      normalize(orderNumber(row) + ' ' + row.data.customer).includes(query));
    const table = $('fin-sales-rows');
    table.replaceChildren();

    const totals = { net: 0n, total: 0n, paid: 0n, balance: 0n };
    let invalid = false;
    for (const row of matching) {
      const result = row.result;
      if (result) {
        for (const field of Object.keys(totals)) totals[field] += BigInt(result[field]);
      } else {
        invalid = true;
      }
      orderRow(row, [orderNumber(row) + ' · ' + row.data.date, row.data.customer,
        money(result?.net ?? null), money(result?.paid ?? null), money(result?.balance ?? null)], table);
    }

    for (const [field, total] of Object.entries(totals)) {
      $('fin-sales-' + field).textContent = money(!orders || invalidRange || invalid ? null : total);
    }
    $('fin-sales-status').textContent = !orders ? 'Los importes se muestran al cargar Ventas.'
      : invalidRange ? 'La fecha desde debe ser anterior o igual a la fecha hasta.'
      : invalid ? 'Hay pedidos que requieren revisión. Abre la venta para revisar sus datos.'
      : matching.length ? matching.length + (matching.length === 1 ? ' pedido' : ' pedidos')
      : 'No hay pedidos confirmados para esta búsqueda.';
  }

  function setSales(rows) {
    clients = new Map();
    orders = rows?.map(row => {
      let result = null;
      try { result = sales.calculate(row.data); } catch {}
      return { ...row, result };
    }) ?? null;
    for (const row of orders || []) {
      const key = clientKey(row);
      if (!clients.has(key)) clients.set(key, []);
      clients.get(key).push(row);
    }
    for (const history of clients.values()) {
      history.sort((first, second) => String(second.data.date).localeCompare(String(first.data.date)) ||
        second.number - first.number);
    }
    if (!clients.has(selectedClient)) selectedClient = null;
    renderCustomers();
    renderFinance();
  }

  $('customer-search').addEventListener('input', renderCustomers);
  for (const id of ['fin-sales-search', 'fin-sales-from', 'fin-sales-to']) {
    $(id).addEventListener('input', renderFinance);
  }

  window.KP_SALES_TRACKING = Object.freeze({
    setSales,
    openCustomer(id) {
      const order = orders?.find(row => row.id === id);
      if (!order || !window.KP_PANEL?.open('customers')) return;
      $('customer-search').value = '';
      selectClient(clientKey(order));
    },
    clear() {
      for (const id of ['customer-search', 'fin-sales-search', 'fin-sales-from', 'fin-sales-to']) $(id).value = '';
      setSales(null);
    }
  });
})();
