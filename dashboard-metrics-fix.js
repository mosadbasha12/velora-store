(function () {
  const cards = [...document.querySelectorAll('.metric-card')];
  const money = (value) => {
    const egp = localStorage.getItem('velora-currency')?.startsWith('EGP');
    return `${egp ? 'ج.م ' : '$'}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  function updateMetrics() {
    if (!cards.length) return;
    const orderData = typeof orders !== 'undefined' ? orders : [];
    const productData = typeof products !== 'undefined' ? products : [];
    const customerData = typeof customers !== 'undefined' ? customers : [];
    const expenseData = typeof expenses !== 'undefined' ? expenses : [];
    const orderTotal = orderData.reduce((sum, order) => sum + Number(String(order.total || 0).replace(/[^0-9.-]/g, '')), 0);
    const sales = productData.reduce((sum, product) => sum + Number(product.salePrice ?? product.price ?? 0) * Number(product.sold || 0), 0) || orderTotal;
    const purchases = productData.reduce((sum, product) => sum + Number(product.costPrice ?? 0) * Number(product.sold || 0), 0);
    const expensesTotal = expenseData.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const customersCount = customerData.length;
    const values = [
      money(orderTotal),
      String(orderData.length),
      String(customersCount),
      sales ? `${Math.min(100, (orderData.length / Math.max(customersCount, 1)) * 100).toFixed(2)}%` : '0.00%',
      money(sales),
      money(purchases),
      money(sales - purchases - expensesTotal)
    ];
    cards.forEach((card, index) => {
      const value = card.querySelector(':scope > strong');
      if (value) value.textContent = values[index];
      card.classList.add('metric-card-interactive');
    });
  }

  const destinations = ['Analytics', 'Orders', 'Customers', 'Analytics', 'Analytics', 'Expenses', 'Expenses'];
  cards.forEach((card, index) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('title', `Open ${destinations[index]}`);
    const open = () => {
      if (destinations[index] === 'Expenses' && typeof renderExpenses === 'function') renderExpenses();
      else if (typeof navigate === 'function') navigate(destinations[index]);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });

  const originalNavigate = window.navigate;
  if (typeof originalNavigate === 'function' && !originalNavigate.__metricsWrapped) {
    const wrappedNavigate = function (section) {
      originalNavigate(section);
      if (section === 'Dashboard') setTimeout(updateMetrics, 0);
    };
    wrappedNavigate.__metricsWrapped = true;
    window.navigate = wrappedNavigate;
  }

  updateMetrics();
})();
