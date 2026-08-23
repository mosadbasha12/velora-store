(function () {
  if (typeof accountRole === 'undefined' || accountRole !== 'admin') return;

  const defaults = ['Cash on delivery', 'Instapay', 'Card / online payment'];
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem('velora-payment-methods') || 'null');
      return Array.isArray(value) ? value : defaults;
    } catch (_) { return defaults; }
  };

  function mount() {
    const page = document.getElementById('dynamicPage');
    if (!page || page.hidden || !/Store Settings/i.test(page.textContent) || page.querySelector('[data-payment-settings]')) return;
    const active = read();
    const panel = document.createElement('div');
    panel.className = 'settings-panel payment-settings-panel';
    panel.dataset.paymentSettings = 'true';
    panel.innerHTML = `<h3>Payment methods</h3><p class="settings-help">Choose which methods customers can use at checkout. Disabled methods disappear from the shopping bag.</p><label class="toggle-row">Cash on delivery <input type="checkbox" data-payment-method="Cash on delivery" ${active.includes('Cash on delivery') ? 'checked' : ''}><span></span></label><label class="toggle-row">Instapay <input type="checkbox" data-payment-method="Instapay" ${active.includes('Instapay') ? 'checked' : ''}><span></span></label><label class="toggle-row">Card / online payment <input type="checkbox" data-payment-method="Card / online payment" ${active.includes('Card / online payment') ? 'checked' : ''}><span></span></label><label>Instapay account / instructions <input type="text" id="instapayInstructions" placeholder="Example: @velora.store or transfer instructions" value="${(localStorage.getItem('velora-instapay-instructions') || '').replace(/"/g, '&quot;')}"></label><small class="settings-help">Instapay and card payments remain pending until verified by the store or a connected payment gateway.</small>`;
    const grid = page.querySelector('.settings-page-grid');
    if (grid) grid.appendChild(panel);
    else page.appendChild(panel);
  }

  document.addEventListener('click', (event) => {
    if (event.target.id !== 'saveStoreSettings') return;
    const panel = document.querySelector('[data-payment-settings]');
    if (!panel) return;
    const methods = [...panel.querySelectorAll('[data-payment-method]:checked')].map((input) => input.dataset.paymentMethod);
    localStorage.setItem('velora-payment-methods', JSON.stringify(methods));
    localStorage.setItem('velora-instapay-instructions', panel.querySelector('#instapayInstructions')?.value || '');
  });

  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  mount();
})();
