(function () {
  if (typeof accountRole === 'undefined' || accountRole !== 'customer') return;

  document.addEventListener('click', function (event) {
    const item = event.target.closest('[data-customer-section="Bag"]');
    if (!item) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelectorAll('.nav-list .active').forEach((active) => active.classList.remove('active'));
    item.classList.add('active');

    if (typeof window.renderShoppingBag === 'function') {
      window.renderShoppingBag();
    }
  }, true);
})();
