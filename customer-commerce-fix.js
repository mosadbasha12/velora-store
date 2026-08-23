(function () {
  const customerMode = typeof accountRole !== 'undefined' && accountRole === 'customer';
  const customerName = () => localStorage.getItem('velora-customer-name') || 'Mariam Hassan';
  const money = (value) => `${localStorage.getItem('velora-currency')?.startsWith('EGP') ? 'ج.م ' : '$'}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const readOffers = () => JSON.parse(localStorage.getItem('velora-offers') || '{}');
  const defaultPaymentMethods = ['Cash on delivery', 'Instapay', 'Card / online payment'];
  const readPaymentMethods = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('velora-payment-methods') || 'null');
      return Array.isArray(saved) ? saved : defaultPaymentMethods;
    } catch (_) { return defaultPaymentMethods; }
  };
  const readAddresses = () => {
    const saved = JSON.parse(localStorage.getItem('velora-customer-addresses') || '[]');
    const primary = localStorage.getItem('velora-customer-address') || 'Cairo, Egypt';
    return [...new Set([primary, ...saved].map((address) => String(address || '').trim()).filter(Boolean))];
  };
  const saveAddress = (address) => {
    const addresses = [...new Set([address, ...readAddresses()].map((value) => String(value || '').trim()).filter(Boolean))];
    localStorage.setItem('velora-customer-addresses', JSON.stringify(addresses));
    localStorage.setItem('velora-customer-address', addresses[0] || 'Cairo, Egypt');
  };
  const offerFor = (product) => {
    const offer = readOffers()[product.id]; if (!offer) return null;
    const now = Date.now(), start = new Date(`${offer.start}T00:00:00`).getTime(), end = new Date(`${offer.end}T23:59:59`).getTime();
    return now >= start && now <= end ? offer : null;
  };
  const priceFor = (product) => Number(offerFor(product)?.price ?? product.salePrice ?? product.price ?? 0);
  const checkoutOptions = () => {
    const methods = readPaymentMethods();
    const savedPayment = localStorage.getItem('velora-payment-method');
    return {
    shipping: Math.max(0, Number(localStorage.getItem('velora-store-shipping-fee') ?? localStorage.getItem('velora-shipping-fee') ?? 25)),
    payment: methods.includes(savedPayment) ? savedPayment : (methods[0] || ''),
    methods,
    address: readAddresses()[0] || 'Cairo, Egypt',
    addresses: readAddresses()
    };
  };
  const readHistory = () => {
    const stored = JSON.parse(localStorage.getItem('velora-purchase-history') || '[]');
    if (stored.length || typeof orders === 'undefined' || !orders.length) return stored;
    const first = orders[0], product = products.find((item) => first.items?.includes(item.name));
    return product ? [{ id: first.id, date: first.date, items: [{ id: product.id, name: product.name, quantity: 1 }], subtotal: Number(String(first.total).replace(/[^0-9.-]/g, '')), discount: 0, shipping: 0, total: Number(String(first.total).replace(/[^0-9.-]/g, '')), status: first.status }] : stored;
  };
  const saveHistory = (history) => localStorage.setItem('velora-purchase-history', JSON.stringify(history));

  function totals() {
    const subtotal = cartItems.reduce((sum, item) => { const p = products.find((product) => product.id === item.id); return sum + priceFor(p || item) * item.quantity; }, 0);
    const original = cartItems.reduce((sum, item) => { const p = products.find((product) => product.id === item.id); return sum + Number(p?.salePrice ?? p?.price ?? item.price) * item.quantity; }, 0);
    const options = checkoutOptions(), shipping = subtotal > 0 ? options.shipping : 0;
    const discount = Math.max(0, original - subtotal);
    return { subtotal, discount, shipping, total: subtotal + shipping, payment: options.payment, methods: options.methods, address: options.address, addresses: options.addresses };
  }

  function renderShoppingBag() {
    const t = totals();
    const paymentOptions = t.methods.map((method) => `<option ${t.payment === method ? 'selected' : ''}>${method}</option>`).join('');
    const paymentHelp = t.payment === 'Cash on delivery' ? 'Payment is collected by the delivery team.' : t.payment === 'Instapay' ? `Transfer through Instapay, then keep the transfer reference for verification.${localStorage.getItem('velora-instapay-instructions') ? ` ${localStorage.getItem('velora-instapay-instructions')}` : ''}` : 'Online card payment will remain pending until the payment gateway confirms it.';
    openDynamic('Shopping bag', { actions: '<button class="gold-button" id="bagRefresh">Refresh bag</button>', content: `<div class="shopping-bag-layout"><section class="shopping-bag-items"><div class="bag-heading"><div><span class="eyebrow">YOUR CURRENT PURCHASE</span><h3>Shopping bag</h3></div><strong>${cartItems.reduce((sum, item) => sum + item.quantity, 0)} item(s)</strong></div>${cartItems.map((item) => { const p = products.find((product) => product.id === item.id) || item, offer = offerFor(p); return `<article class="bag-line"><img src="${p.images?.[0] || p.image || 'assets/velora-dashboard-reference.png'}" alt="${p.name}"><div><h3>${p.name}</h3><small>${p.category || 'Velora product'}</small>${offer ? '<span class="bag-offer">Offer price applied</span>' : ''}</div><div class="bag-quantity"><button data-bag-minus="${item.id}">−</button><strong>${item.quantity}</strong><button data-bag-plus="${item.id}">+</button></div><strong>${money(priceFor(p) * item.quantity)}</strong><button class="bag-remove" data-bag-remove="${item.id}">×</button></article>`; }).join('') || '<div class="empty-comments">Your shopping bag is empty.</div>'}</section><aside class="bag-summary"><h3>Order summary</h3><label class="checkout-field">Delivery address<select id="checkoutAddressSelect">${t.addresses.map((address) => `<option ${address === t.address ? 'selected' : ''}>${address}</option>`).join('')}</select></label><button class="secondary-action address-add-button" id="addNewAddress" type="button">+ Add another address</button><div class="shipping-policy"><span>Delivery fee</span><strong>${money(t.shipping)}</strong><small>Set by the Velora team</small></div><label class="checkout-field">Payment method<select id="checkoutPayment" ${t.methods.length ? '' : 'disabled'}>${paymentOptions || '<option>No payment methods available</option>'}</select></label><small class="payment-help" id="paymentHelp">${paymentHelp}</small>${t.payment === 'Instapay' ? '<label class="checkout-field">Transfer reference (optional)<input id="paymentReference" placeholder="Enter the Instapay reference"></label>' : ''}<div><span>Subtotal</span><strong>${money(t.subtotal)}</strong></div><div><span>Discount</span><strong class="bag-discount">−${money(t.discount)}</strong></div><div><span>Delivery</span><strong>${money(t.shipping)}</strong></div><hr><div class="bag-total"><span>Total</span><strong>${money(t.total)}</strong></div><button class="account-action" id="confirmPurchase" ${cartItems.length && t.methods.length ? '' : 'disabled'}>Confirm purchase</button><small>Payment method and delivery details are saved with this order for the Velora team.</small></aside></div>` });
    document.getElementById('bagRefresh')?.addEventListener('click', renderShoppingBag);
    document.querySelectorAll('[data-bag-plus]').forEach((button) => button.addEventListener('click', () => { const item = cartItems.find((entry) => entry.id === Number(button.dataset.bagPlus)); if (item) item.quantity++; saveCart(); renderShoppingBag(); }));
    document.querySelectorAll('[data-bag-minus]').forEach((button) => button.addEventListener('click', () => { const item = cartItems.find((entry) => entry.id === Number(button.dataset.bagMinus)); if (item) item.quantity = Math.max(1, item.quantity - 1); saveCart(); renderShoppingBag(); }));
    document.querySelectorAll('[data-bag-remove]').forEach((button) => button.addEventListener('click', () => { cartItems = cartItems.filter((entry) => entry.id !== Number(button.dataset.bagRemove)); saveCart(); renderShoppingBag(); }));
    document.getElementById('checkoutPayment')?.addEventListener('change', (event) => { localStorage.setItem('velora-payment-method', event.target.value); renderShoppingBag(); });
    document.getElementById('checkoutAddressSelect')?.addEventListener('change', (event) => { localStorage.setItem('velora-customer-address', event.target.value); });
    document.getElementById('addNewAddress')?.addEventListener('click', () => { const address = window.prompt('Enter your new delivery address'); if (address?.trim()) { saveAddress(address.trim()); renderShoppingBag(); } });
    document.getElementById('confirmPurchase')?.addEventListener('click', confirmPurchase);
  }

  function saveCart() { localStorage.setItem('velora-cart', JSON.stringify(cartItems)); }

  function confirmPurchase() {
    if (!cartItems.length) return;
    const t = totals(), id = `#VL-${String(Date.now()).slice(-4)}`, items = cartItems.map((item) => `${item.name} × ${item.quantity}`).join(', ');
    const createdAt = new Date().toISOString();
    const paymentReference = document.getElementById('paymentReference')?.value?.trim() || '';
    const paymentStatus = t.payment === 'Cash on delivery' ? 'Unpaid on delivery' : 'Pending verification';
    const order = { id, customer: customerName(), email: 'customer@velora.com', phone: '+20 100 123 4567', address: t.address, items, subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, totalAmount: t.total, paymentMethod: t.payment, paymentReference, paymentStatus, total: money(t.total), status: 'Received', createdAt, date: new Date(createdAt).toLocaleString('en-GB') };
    orders.unshift(order); localStorage.setItem('velora-orders', JSON.stringify(orders));
    const history = readHistory(); history.unshift({ id, date: order.date, createdAt, address: t.address, paymentMethod: t.payment, paymentStatus: order.paymentStatus, items: cartItems.map((item) => ({ ...item })), subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total, status: 'Received' }); saveHistory(history);
    products = products.map((product) => {
      const purchased = cartItems.find((item) => item.id === product.id);
      if (!purchased) return product;
      const currentStock = Number(product.stock ?? product.stockQuantity ?? 0);
      return { ...product, stock: Math.max(0, currentStock - Number(purchased.quantity || 0)), sold: Number(product.sold || 0) + Number(purchased.quantity || 0) };
    });
    localStorage.setItem('velora-products', JSON.stringify(products));
    cartItems = []; saveCart(); renderShoppingBag(); showToast('Purchase confirmed and sent to Velora orders');
  }

  function renderPurchaseHistory() {
    const history = readHistory();
    openDynamic('Purchase history', { actions: '<button class="gold-button" id="historyRefresh">Refresh history</button>', content: `<div class="purchase-history-list">${history.map((purchase) => `<article class="purchase-history-card"><div class="history-head"><div><strong>${purchase.id}</strong><small>${purchase.date}</small></div><span class="order-status ${purchase.status.toLowerCase()}">${purchase.status}</span></div><div class="history-items">${purchase.items.map((item) => { const p = products.find((product) => product.id === item.id) || item; return `<div><img src="${p.images?.[0] || p.image || 'assets/velora-dashboard-reference.png'}" alt="${p.name}"><span>${p.name} × ${item.quantity}</span></div>`; }).join('')}</div><div class="history-total"><span>Total paid</span><strong>${money(purchase.total)}</strong></div><button class="gold-button" data-reorder="${purchase.id}">Order again</button></article>`).join('') || '<div class="empty-comments">No previous purchases yet.</div>'}</div>` });
    document.getElementById('historyRefresh')?.addEventListener('click', renderPurchaseHistory);
    document.querySelectorAll('[data-reorder]').forEach((button) => button.addEventListener('click', () => { const purchase = history.find((entry) => entry.id === button.dataset.reorder); purchase?.items.forEach((item) => { const found = cartItems.find((entry) => entry.id === item.id); if (found) found.quantity += item.quantity; else cartItems.push({ ...item }); }); saveCart(); showToast('Previous purchase added to your shopping bag'); renderShoppingBag(); }));
  }

  function addCustomerCommerceNav() {
    if (!customerMode) return;
    const nav = document.querySelector('.nav-list'); if (!nav || nav.querySelector('[data-customer-section="Bag"]')) return;
    const account = nav.querySelector('[data-customer-section="Account"]');
    const make = (section, icon, label, handler) => { const item = document.createElement('button'); item.className = 'nav-item'; item.dataset.customerSection = section; item.innerHTML = `<span class="icon">${icon}</span>${label}`; item.addEventListener('click', () => { nav.querySelectorAll('.active').forEach((active) => active.classList.remove('active')); item.classList.add('active'); handler(); }); return item; };
    const history = make('History', '↺', 'Purchase history', renderPurchaseHistory), bag = make('Bag', '▢', 'Shopping bag', renderShoppingBag);
    account ? nav.insertBefore(history, account) : nav.appendChild(history); account ? nav.insertBefore(bag, account) : nav.appendChild(bag);
  }

  function syncOrdersForAdmin() {
    if (customerMode || typeof orders === 'undefined') return;
    const saved = JSON.parse(localStorage.getItem('velora-orders') || '[]');
    saved.forEach((savedOrder) => { if (!orders.some((order) => order.id === savedOrder.id)) orders.unshift(savedOrder); });
  }

  // Expose these screens to the unified customer navigation.  Previously they
  // were trapped inside this IIFE, so clicking the sidebar item did nothing.
  window.renderShoppingBag = renderShoppingBag;
  window.renderPurchaseHistory = renderPurchaseHistory;
  syncOrdersForAdmin(); addCustomerCommerceNav();
})();
