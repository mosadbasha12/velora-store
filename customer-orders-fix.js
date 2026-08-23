(function () {
  if (typeof accountRole === 'undefined' || accountRole !== 'customer') return;

  const stages = ['Received', 'Preparing', 'Shipped', 'Delivered'];
  const stageMessage = {
    Received: 'We received your order and will start preparing it shortly.',
    Preparing: 'Your order is being prepared by the Velora team.',
    Shipped: 'Your order is on the way to the delivery address below.',
    Delivered: 'This order was delivered successfully.',
    Cancelled: 'This order was cancelled. Contact Velora support if you need help.'
  };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const readOrders = () => {
    const saved = JSON.parse(localStorage.getItem('velora-orders') || '[]');
    return saved.length ? saved : (typeof orders !== 'undefined' ? orders : []);
  };
  const currentCustomer = () => localStorage.getItem('velora-customer-name') || 'Mariam Hassan';
  const customerOrders = () => {
    const name = currentCustomer();
    const accountEmail = localStorage.getItem('velora-customer-email') || '';
    return readOrders().filter((order) => !order.customer || order.customer === name || (accountEmail && order.email === accountEmail));
  };
  const orderItems = (order) => Array.isArray(order.items)
    ? order.items.map((item) => `${esc(item.name || item.title || 'Product')} × ${Number(item.quantity || 1)}`).join(', ')
    : esc(order.items || 'Velora products');
  const money = (value) => {
    if (typeof value === 'string' && /[$ج]/.test(value)) return esc(value);
    return `${localStorage.getItem('velora-currency')?.startsWith('EGP') ? 'ج.م ' : '$'}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const canCancel = (status) => ['Received', 'Preparing'].includes(status);

  function renderCustomerOrders() {
    const nav = document.querySelector('.nav-list');
    nav?.querySelectorAll('.active').forEach((item) => item.classList.remove('active'));
    nav?.querySelector('[data-customer-section="Orders"]')?.classList.add('active');
    document.getElementById('subtitle').textContent = 'Follow every step of your Velora delivery.';
    const visibleOrders = customerOrders();
    openDynamic('My orders', {
      actions: '<button class="gold-button" id="customerOrdersRefresh">Refresh tracking</button>',
      content: `<div class="customer-orders-note customer-tracking-header"><span class="eyebrow">ORDER TRACKING</span><h3>Track your delivery</h3><p>Order updates are managed by the Velora team and appear here automatically. You cannot change the delivery status from this page.</p></div><div class="orders-grid customer-orders-grid">${visibleOrders.map((order) => {
        const status = stages.includes(order.status) ? order.status : 'Received';
        const current = stages.indexOf(status);
        const address = order.address || 'Delivery address will appear after checkout';
        const payment = order.paymentMethod || 'Payment method saved with order';
        const tracking = status === 'Cancelled'
          ? `<div class="tracking-cancelled"><strong>Order cancelled</strong><span>${esc(order.cancellationReason || 'Cancellation requested')}</span></div>`
          : `<div class="order-progress">${stages.map((stage, index) => `<span class="${index <= current ? 'done' : ''}"><i></i>${stage}</span>`).join('')}</div>`;
        const cancelAction = canCancel(status) ? `<button class="danger-action" data-customer-cancel="${esc(order.id)}">Cancel order</button>` : '';
        return `<article class="order-card customer-order-card"><div class="order-top"><div><strong>${esc(order.id)}</strong><small>${esc(order.date || 'Recently placed')}</small></div><span class="order-status ${status.toLowerCase()}">${status}</span></div><div class="customer-order-details"><div><span>Items</span><strong>${orderItems(order)}</strong></div><div><span>Delivery address</span><strong>${esc(address)}</strong></div><div><span>Payment</span><strong>${esc(payment)}${order.paymentStatus ? ` · ${esc(order.paymentStatus)}` : ''}</strong></div></div><div class="order-items"><span>Order total</span><strong>${money(order.totalAmount ?? order.total)}</strong></div>${tracking}<div class="customer-order-status"><div><span>Current status</span><strong>${status}</strong></div><p class="tracking-message">${stageMessage[status] || stageMessage.Received}</p>${cancelAction}</div></article>`;
      }).join('') || '<div class="empty-comments customer-empty-orders"><h3>No orders for this account yet</h3><p>When you complete a purchase, its delivery progress will appear here.</p><button class="gold-button" id="goToCustomerStore">Browse store</button></div>'}</div>`
    });
    document.getElementById('customerOrdersRefresh')?.addEventListener('click', renderCustomerOrders);
    document.querySelectorAll('[data-customer-cancel]').forEach((button) => button.addEventListener('click', () => {
      const order = readOrders().find((item) => item.id === button.dataset.customerCancel);
      if (!order || !canCancel(order.status)) return showToast('This order can no longer be cancelled');
      if (!window.confirm(`Cancel order ${order.id}?`)) return;
      const cancelledAt = new Date().toISOString();
      const updated = readOrders().map((item) => item.id === order.id ? { ...item, status: 'Cancelled', cancelledAt, cancellationReason: 'Cancelled by customer' } : item);
      localStorage.setItem('velora-orders', JSON.stringify(updated));
      const history = JSON.parse(localStorage.getItem('velora-purchase-history') || '[]');
      localStorage.setItem('velora-purchase-history', JSON.stringify(history.map((item) => item.id === order.id ? { ...item, status: 'Cancelled', cancelledAt } : item)));
      showToast('Order cancelled');
      renderCustomerOrders();
    }));
    document.getElementById('goToCustomerStore')?.addEventListener('click', () => window.renderCustomerCatalog?.('All'));
  }

  window.renderCustomerOrders = renderCustomerOrders;
  const orderButton = document.querySelector('[data-customer-section="Orders"]');
  if (orderButton) {
    const replacement = orderButton.cloneNode(true);
    orderButton.replaceWith(replacement);
    replacement.addEventListener('click', renderCustomerOrders);
  }
})();
