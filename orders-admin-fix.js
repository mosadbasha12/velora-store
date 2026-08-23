(function () {
  const stages = ['Received', 'Preparing', 'Shipped', 'Delivered'];
  const statuses = [...stages, 'Cancelled'];
  const statusLabel = (value) => value || 'Received';
  const customerAddress = (order) => order.address || order.shippingAddress || 'Cairo, Egypt';
  const formatOrderDate = (order) => {
    if (order.createdAt) return new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const raw = String(order.date || ''), date = new Date(), ago = raw.match(/(\d+)\s+days?\s+ago/i);
    if (/yesterday/i.test(raw)) date.setDate(date.getDate() - 1);
    else if (ago) date.setDate(date.getDate() - Number(ago[1]));
    const time = raw.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)?.[1] || '';
    return `${date.toLocaleDateString('en-GB')}${time ? ` ${time}` : ''}`;
  };
  const invoiceValue = (order, key, fallback = '0') => order[key] == null ? fallback : order[key];

  function parsedOrderDate(order) {
    if (!order?.createdAt) return null;
    const parsed = new Date(order.createdAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  function isToday(order) {
    const parsed = parsedOrderDate(order);
    if (parsed) return parsed.toDateString() === new Date().toDateString();
    return /today|just now/i.test(String(order.date || ''));
  }
  function isPrevious(order) {
    const parsed = parsedOrderDate(order);
    if (parsed) return parsed.toDateString() !== new Date().toDateString() && parsed < new Date();
    return /yesterday|\d+\s+days?\s+ago/i.test(String(order.date || ''));
  }
  function orderMatchesDate(order, filter) {
    if (filter === 'today') return isToday(order);
    if (filter === 'previous') return isPrevious(order);
    if (filter === 'new') return isToday(order) || statusLabel(order.status) === 'Received';
    return true;
  }

  function orderText(order) {
    return [order.id, order.customer, order.email, order.phone, customerAddress(order), order.items, order.status].join(' ').toLowerCase();
  }

  function copyText(value, message) {
    navigator.clipboard?.writeText(String(value)).then(() => showToast(message || 'Copied'))
      .catch(() => showToast('Copy is not available in this browser'));
  }

  function printableInvoice(order, note, deliveryDate) {
    const logo = new URL('assets/velora-logo.png', window.location.href).href;
    const rows = String(order.items || '').split(',').map((item) => `<tr><td>${item.trim()}</td><td>${order.subtotal != null ? order.subtotal : (order.total || '')}</td></tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Velora Invoice ${order.id}</title><style>
      body{margin:0;background:#090807;color:#ead7bd;font-family:Arial,sans-serif;padding:42px;-webkit-print-color-adjust:exact;print-color-adjust:exact}main{max-width:760px;margin:auto;border:1px solid #80551e;border-radius:18px;padding:32px;background:linear-gradient(135deg,#1d130a,#090807)}header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #5e401b;padding-bottom:22px}header img{width:190px;max-height:80px;object-fit:contain}.gold{color:#e6a83c}h1{font-family:Georgia,serif;font-weight:500}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 26px;margin:28px 0}.meta div{padding:11px 0;border-bottom:1px solid #312319}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:14px;border-bottom:1px solid #3a2816}th{color:#d89a37}.totals{margin:24px 0 0 auto;max-width:330px}.totals div{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #312319}.totals .grand{font-size:22px;color:#e6a83c;border-bottom:0}.note{margin-top:28px;padding:16px;border:1px solid #65431b;border-radius:10px;color:#c7b59d;white-space:pre-wrap}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:54px}.signatures div{border-top:1px solid #b7873c;padding-top:10px;color:#c7b59d}@media print{body{background:#090807;color:#ead7bd}main{border-color:#80551e;background:linear-gradient(135deg,#1d130a,#090807)}.gold,th,.totals .grand{color:#e6a83c}}
    </style></head><body><main><header><img src="${logo}" alt="Velora"><div><div class="gold">INVOICE</div><h1>${order.id}</h1><div>Order date: ${formatOrderDate(order)}</div><div>Delivery date: ${deliveryDate || 'To be scheduled'}</div></div></header><section class="meta"><div><b>Customer name</b><br>${order.customer || ''}</div><div><b>Phone</b><br>${order.phone || ''}</div><div><b>Email</b><br>${order.email || ''}</div><div><b>Address</b><br>${customerAddress(order)}</div><div><b>Status</b><br>${statusLabel(order.status)}</div><div><b>Payment</b><br>${order.paymentMethod || 'Not specified'}<br>${order.paymentStatus || 'Not specified'}</div></section><table><thead><tr><th>Purchase</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><section class="totals"><div><span>Subtotal</span><b>${invoiceValue(order, 'subtotal', order.total || '0')}</b></div><div><span>Discount</span><b>−${invoiceValue(order, 'discount')}</b></div><div><span>Shipping</span><b>${invoiceValue(order, 'shipping')}</b></div><div class="grand"><span>Total</span><b>${order.total || invoiceValue(order, 'totalAmount')}</b></div></section>${note ? `<div class="note"><b>Notes</b><br>${note}</div>` : ''}<section class="signatures"><div>Customer signature</div><div>Delivery agent signature</div></section></main><script>window.onload=()=>window.print()<\/script></body></html>`;
  }

  function exportExcel(order, note, deliveryDate) {
    const rows = [['Velora invoice', order.id], ['Customer name', order.customer], ['Phone', order.phone], ['Email', order.email], ['Address', customerAddress(order)], ['Status', statusLabel(order.status)], ['Order date', formatOrderDate(order)], ['Delivery date', deliveryDate || 'To be scheduled'], ['Purchases', order.items], ['Subtotal', invoiceValue(order, 'subtotal', order.total)], ['Discount', invoiceValue(order, 'discount')], ['Shipping', invoiceValue(order, 'shipping')], ['Payment method', order.paymentMethod || 'Not specified'], ['Payment status', order.paymentStatus || 'Not specified'], ['Total', order.total], ['Notes', note || '']];
    const html = `<table>${rows.map((row) => `<tr><th>${row[0]}</th><td>${row[1] || ''}</td></tr>`).join('')}</table>`;
    const blob = new Blob([`<html><meta charset="utf-8">${html}</html>`], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `velora-invoice-${order.id}.xls`; link.click(); URL.revokeObjectURL(link.href); showToast('Excel invoice downloaded');
  }

  function openCustomerDetails(order) {
    const root = document.getElementById('productModalRoot') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'productModalRoot' }));
    const fields = [['Customer name', order.customer], ['Phone', order.phone], ['Email', order.email], ['Address', customerAddress(order)], ['Order number', order.id], ['Order date', formatOrderDate(order)], ['Order status', statusLabel(order.status)], ['Payment method', order.paymentMethod || 'Not specified'], ['Payment status', order.paymentStatus || 'Not specified'], ['Subtotal', invoiceValue(order, 'subtotal', order.total)], ['Discount', invoiceValue(order, 'discount')], ['Shipping fee', invoiceValue(order, 'shipping')], ['Purchases', order.items], ['Total', order.total]];
    root.innerHTML = `<div class="customer-details-overlay"><div class="customer-details-modal"><button class="modal-close" id="closeCustomerDetails">×</button><div class="invoice-brand"><img src="assets/velora-logo.png" alt="Velora"><span>Customer & order details</span></div><h2>${order.id}</h2><div class="customer-details-list">${fields.map(([label, value], index) => `<div class="customer-detail-row"><span><small>${label}</small><strong>${value || '—'}</strong></span><button data-copy-detail="${index}">Copy</button></div>`).join('')}</div><label class="invoice-note-label">Delivery date for invoice<input id="deliveryDate" type="date"></label><label class="invoice-note-label">Notes for invoice <textarea id="invoiceNote" placeholder="Optional note..."></textarea></label><div class="customer-detail-actions"><button class="secondary-action" id="copyAllDetails">Copy all data</button><button class="secondary-action" id="exportOrderExcel">Export Excel</button><button class="account-action" id="printOrderInvoice">Print / PDF</button></div></div></div>`;
    const values = fields.map(([label, value]) => `${label}: ${value || '—'}`);
    document.getElementById('closeCustomerDetails').onclick = () => { root.innerHTML = ''; };
    root.querySelectorAll('[data-copy-detail]').forEach((button) => button.addEventListener('click', () => copyText(values[Number(button.dataset.copyDetail)], 'Copied')));
    document.getElementById('copyAllDetails').onclick = () => copyText(values.join('\n'), 'All customer data copied');
    document.getElementById('exportOrderExcel').onclick = () => exportExcel(order, document.getElementById('invoiceNote').value, document.getElementById('deliveryDate').value);
    document.getElementById('printOrderInvoice').onclick = () => { const deliveryDate = document.getElementById('deliveryDate').value; if (!deliveryDate) return showToast('Choose the delivery date first'); const win = window.open('', '_blank'); if (!win) return showToast('Please allow pop-ups to print the invoice'); win.document.write(printableInvoice(order, document.getElementById('invoiceNote').value, deliveryDate)); win.document.close(); };
  }

  function renderOrderCard(order) {
    const current = stages.indexOf(statusLabel(order.status));
    const currentStatus = statusLabel(order.status);
    const paymentStatuses = ['Unpaid on delivery', 'Pending verification', 'Paid / verified', 'Payment failed'];
    const paymentStatus = order.paymentStatus || (order.paymentMethod === 'Cash on delivery' ? 'Unpaid on delivery' : 'Pending verification');
    const progress = currentStatus === 'Cancelled'
      ? '<div class="tracking-cancelled"><strong>Order cancelled</strong><span>Removed from active fulfilment.</span></div>'
      : `<div class="order-progress">${stages.map((stage, index) => `<span class="${index <= current ? 'done' : ''}"><i></i>${stage}</span>`).join('')}</div>`;
    const cancelAction = !['Delivered', 'Cancelled'].includes(currentStatus) ? `<button class="danger-action" data-admin-cancel="${order.id}">Cancel order</button>` : '';
    return `<article class="order-card"><div class="order-top"><div><strong>${order.id}</strong><small>${order.date || ''}</small></div><span class="order-status ${currentStatus.toLowerCase()}">${currentStatus}</span></div><div class="customer"><div class="customer-avatar">${String(order.customer || '?')[0]}</div><div><strong>${order.customer || 'Customer'}</strong><small>${order.email || ''} · ${order.phone || ''}</small></div></div><div class="order-items"><span>${order.items || 'No items listed'}</span><strong>${order.total || ''}</strong></div>${progress}<div class="order-actions"><select data-order-status="${order.id}">${statuses.map((stage) => `<option ${stage === currentStatus ? 'selected' : ''}>${stage}</option>`).join('')}</select><select data-payment-status="${order.id}" title="Payment status">${paymentStatuses.map((status) => `<option ${status === paymentStatus ? 'selected' : ''}>${status}</option>`).join('')}</select><button data-order-details="${order.id}">Customer details</button>${cancelAction}</div></article>`;
  }

  window.renderOrders = function renderOrders() {
    openDynamic('Orders', { actions: `<div class="orders-toolbar"><input id="ordersSearch" placeholder="Search order, customer or phone"><select id="ordersStatus"><option value="all">All statuses</option>${statuses.map((item) => `<option>${item}</option>`).join('')}</select><select id="ordersDate"><option value="all">All dates</option><option value="today">Current / today</option><option value="previous">Previous orders</option><option value="new">New orders</option></select></div>`, content: '<div id="ordersResults"></div><div id="ordersDelivered"></div>' });
    const draw = () => {
      const query = document.getElementById('ordersSearch').value.trim().toLowerCase();
      const status = document.getElementById('ordersStatus').value, date = document.getElementById('ordersDate').value;
      const filtered = orders.filter((order) => (!query || orderText(order).includes(query)) && (status === 'all' || statusLabel(order.status) === status) && orderMatchesDate(order, date));
      const active = filtered.filter((order) => statusLabel(order.status) !== 'Delivered'), delivered = filtered.filter((order) => statusLabel(order.status) === 'Delivered');
      document.getElementById('ordersResults').innerHTML = `<section class="orders-section"><div class="orders-section-heading"><h3>Current orders</h3><span>${active.length}</span></div><div class="orders-grid">${active.map(renderOrderCard).join('') || '<p class="empty-comments">No current orders match your filters.</p>'}</div></section>`;
      document.getElementById('ordersDelivered').innerHTML = `<section class="orders-section delivered-orders-section"><div class="orders-section-heading"><h3>Delivered / completed orders</h3><span>${delivered.length}</span></div><div class="orders-grid">${delivered.map(renderOrderCard).join('') || '<p class="empty-comments">No delivered orders match your filters.</p>'}</div></section>`;
      document.querySelectorAll('[data-order-status]').forEach((select) => select.addEventListener('change', () => { orders = orders.map((order) => order.id === select.dataset.orderStatus ? { ...order, status: select.value } : order); localStorage.setItem('velora-orders', JSON.stringify(orders)); draw(); showToast('Order status updated'); }));
      document.querySelectorAll('[data-payment-status]').forEach((select) => select.addEventListener('change', () => { orders = orders.map((order) => order.id === select.dataset.paymentStatus ? { ...order, paymentStatus: select.value } : order); localStorage.setItem('velora-orders', JSON.stringify(orders)); draw(); showToast('Payment status updated'); }));
      document.querySelectorAll('[data-admin-cancel]').forEach((button) => button.addEventListener('click', () => {
        const order = orders.find((item) => item.id === button.dataset.adminCancel);
        if (!order || ['Delivered', 'Cancelled'].includes(statusLabel(order.status))) return showToast('This order can no longer be cancelled');
        if (!window.confirm(`Cancel order ${order.id}?`)) return;
        orders = orders.map((item) => item.id === order.id ? { ...item, status: 'Cancelled', cancelledAt: new Date().toISOString(), cancellationReason: 'Cancelled by admin' } : item);
        localStorage.setItem('velora-orders', JSON.stringify(orders));
        showToast('Order cancelled');
        draw();
      }));
      document.querySelectorAll('[data-order-details]').forEach((button) => button.addEventListener('click', () => openCustomerDetails(orders.find((order) => order.id === button.dataset.orderDetails))));
    };
    ['ordersSearch', 'ordersStatus', 'ordersDate'].forEach((id) => document.getElementById(id).addEventListener(id === 'ordersSearch' ? 'input' : 'change', draw));
    draw();
  };
})();
