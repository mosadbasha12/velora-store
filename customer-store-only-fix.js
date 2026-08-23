(function () {
  if (typeof accountRole === 'undefined' || accountRole !== 'customer') return;
  const live = () => document.getElementById('customerLiveDashboard');
  const dynamic = () => document.getElementById('dynamicPage');

  function syncVisibility() {
    const liveRoot = live(), page = dynamic();
    if (!liveRoot) return;
    // The live counters and offers belong to Store/VIP only.
    const catalogIsOpen = Boolean(page && !page.hidden && page.querySelector('.catalog-page'));
    const storeIsOpen = !catalogIsOpen && (!page || page.hidden || Boolean(page.querySelector('.store-banner, .vip-store-section')));
    liveRoot.hidden = !storeIsOpen;
  }

  const dynamicHost = dynamic();
  if (dynamicHost) new MutationObserver(syncVisibility).observe(dynamicHost, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  syncVisibility();
})();
