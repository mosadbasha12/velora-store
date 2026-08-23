(function () {
  const offerKey = 'velora-offers';
  const readOffers = () => JSON.parse(localStorage.getItem(offerKey) || '{}');
  const saveOffers = (offers) => localStorage.setItem(offerKey, JSON.stringify(offers));
  const activeOffer = (product) => {
    const offer = readOffers()[product.id];
    if (!offer) return null;
    const now = Date.now();
    const start = new Date(`${offer.start}T00:00:00`).getTime();
    const end = new Date(`${offer.end}T23:59:59`).getTime();
    if (now < start || now > end) return null;
    return offer;
  };
  const money = (value) => `${localStorage.getItem('velora-currency')?.startsWith('EGP') ? 'ج.م ' : '$'}${Number(value || 0).toLocaleString()}`;
  const discount = (product, offer) => Math.max(0, Math.round((1 - Number(offer.price) / Number(product.salePrice ?? product.price)) * 100));
  const countdown = (date) => {
    const left = Math.max(0, new Date(`${date}T23:59:59`).getTime() - Date.now());
    const seconds = Math.floor(left / 1000), days = Math.floor(seconds / 86400), hours = Math.floor((seconds % 86400) / 3600), minutes = Math.floor((seconds % 3600) / 60), remainingSeconds = seconds % 60;
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(remainingSeconds).padStart(2, '0')}s`;
  };

  function addOffersNav() {
    if (typeof accountRole !== 'undefined' && accountRole === 'customer') return;
    const nav = document.querySelector('.nav-list');
    if (!nav || nav.querySelector('[data-section="Offers"]')) return;
    const settings = nav.querySelector('[data-section="Settings"]');
    const item = document.createElement('button');
    item.className = 'nav-item'; item.dataset.section = 'Offers';
    item.innerHTML = '<span class="icon">%</span>Offers';
    settings ? nav.insertBefore(item, settings) : nav.appendChild(item);
    item.addEventListener('click', () => { nav.querySelector('.active')?.classList.remove('active'); item.classList.add('active'); window.renderOffers(); });
  }

  window.renderOffers = function renderOffers() {
    const offers = readOffers();
    openDynamic('Offers', { actions: '<button class="gold-button" id="refreshOffers">Refresh offers</button>', content: `<div class="offers-admin-grid">${products.map((product) => {
      const offer = activeOffer(product), original = Number(product.salePrice ?? product.price ?? 0);
      return `<article class="offer-admin-card"><img src="${product.images?.[0] || product.image}" alt="${product.name}"><div><small>${product.category}</small><h3>${product.name}</h3>${offer ? `<p class="offer-active">${discount(product, offer)}% off · ${money(offer.price)} · Ends ${offer.end}</p>` : '<p>No active offer</p>'}<button class="gold-button" data-offer-product="${product.id}">${offer ? 'Edit offer' : 'Activate offer'}</button></div><strong>${money(original)}</strong></article>`;
    }).join('') || '<p class="empty-comments">Add products first to create offers.</p>'}</div>` });
    document.getElementById('refreshOffers')?.addEventListener('click', renderOffers);
    document.querySelectorAll('[data-offer-product]').forEach((button) => button.addEventListener('click', () => openOfferModal(Number(button.dataset.offerProduct))));
  };

  function openOfferModal(id) {
    const product = products.find((item) => item.id === id), existing = readOffers()[id];
    const root = document.getElementById('productModalRoot') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'productModalRoot' }));
    root.innerHTML = `<div class="offer-modal-overlay"><div class="offer-modal"><button class="modal-close" id="closeOffer">×</button><p class="eyebrow">PRODUCT OFFER</p><h2>${product.name}</h2><p>Original price: <strong>${money(product.salePrice ?? product.price)}</strong></p><form id="offerForm"><label>Offer price<input name="price" type="number" min="0" step="0.01" value="${existing?.price || ''}" required></label><label>Start date<input name="start" type="date" value="${existing?.start || new Date().toISOString().slice(0, 10)}" required></label><label>End date<input name="end" type="date" value="${existing?.end || ''}" required></label><button class="account-action" type="submit">Confirm offer</button></form></div></div>`;
    document.getElementById('closeOffer').onclick = () => root.innerHTML = '';
    document.getElementById('offerForm').onsubmit = (event) => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const price = Number(data.get('price'));
      if (price >= Number(product.salePrice ?? product.price)) return showToast('Offer price must be lower than the original price');
      if (data.get('end') < data.get('start')) return showToast('End date must be after the start date');
      const offers = readOffers(); offers[id] = { price, start: data.get('start'), end: data.get('end') }; saveOffers(offers);
      root.innerHTML = ''; showToast('Offer activated successfully'); window.renderOffers();
    };
  }

  function addProductOfferButtons() {
    document.querySelectorAll('.product-item').forEach((row) => {
      if (row.querySelector('[data-offer-product]')) return;
      const edit = row.querySelector('[data-edit]'); if (!edit) return;
      const button = document.createElement('button'); button.className = 'offer-row-button'; button.textContent = 'Offer'; button.dataset.offerProduct = edit.dataset.edit;
      button.onclick = () => openOfferModal(Number(button.dataset.offerProduct));
      row.querySelector('.row-actions')?.appendChild(button);
    });
  }

  function enhanceCustomerStoreCards() {
    if (typeof accountRole === 'undefined' || accountRole !== 'customer') return;
    document.querySelectorAll('[data-view-product]').forEach((button) => {
      const product = products.find((item) => item.id === Number(button.dataset.viewProduct));
      const offer = product && activeOffer(product);
      const info = button.closest('.store-card')?.querySelector('div:last-child');
      if (!product || !info || !offer || info.querySelector('.store-offer-price')) return;
      const price = info.querySelector('strong');
      if (price) price.outerHTML = `<del class="store-original-price">${money(product.salePrice ?? product.price)}</del><strong class="store-offer-price">${money(offer.price)}</strong>`;
      info.insertAdjacentHTML('afterbegin', `<span class="discount-badge">-${discount(product, offer)}%</span><small class="store-countdown">Ends in ${countdown(offer.end)}</small>`);
    });
  }

  function readWishlist() {
    try { return JSON.parse(localStorage.getItem('velora-wishlist') || '[]'); } catch { return []; }
  }

  function toggleWishlist(id, button) {
    const wishlist = readWishlist();
    const index = wishlist.indexOf(id);
    if (index >= 0) wishlist.splice(index, 1);
    else wishlist.push(id);
    localStorage.setItem('velora-wishlist', JSON.stringify(wishlist));
    button.classList.toggle('is-saved', wishlist.includes(id));
    button.textContent = wishlist.includes(id) ? '♥' : '♡';
    showToast(wishlist.includes(id) ? 'Added to wishlist' : 'Removed from wishlist');
  }

  function bindLiveCardActions(root) {
    root.querySelectorAll('[data-live-view]').forEach((button) => button.addEventListener('click', () => {
      const product = products.find((item) => item.id === Number(button.dataset.liveView));
      if (product && typeof openProductDetails === 'function') openProductDetails(product.id);
    }));
    root.querySelectorAll('[data-live-cart]').forEach((button) => button.addEventListener('click', () => {
      const product = products.find((item) => item.id === Number(button.dataset.liveCart));
      if (product && typeof addToCart === 'function') addToCart(product);
    }));
    root.querySelectorAll('[data-live-wishlist]').forEach((button) => button.addEventListener('click', () => toggleWishlist(Number(button.dataset.liveWishlist), button)));
  }

  function focusCarouselCards(root) {
    root.querySelectorAll('[data-carousel]').forEach((carousel) => {
      const cards = [...carousel.querySelectorAll('.customer-offer-card')];
      if (!cards.length) return;
      const update = () => {
        const center = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
        let closest = null, distance = Infinity;
        cards.forEach((card) => {
          const box = card.getBoundingClientRect();
          const d = Math.abs(box.left + box.width / 2 - center);
          if (d < distance) { distance = d; closest = card; }
        });
        cards.forEach((card) => card.classList.toggle('is-center', card === closest));
      };
      carousel.addEventListener('scroll', update, { passive: true });
      requestAnimationFrame(() => {
        if (carousel.scrollLeft === 0 && cards.length > 1) carousel.scrollLeft = cards[0].offsetWidth + 12;
        update();
      });
    });
  }

  function customerLiveDashboard() {
    if (typeof accountRole === 'undefined' || accountRole !== 'customer') return;
    dashboardSections.forEach((section) => section.style.display = 'none');
    const old = document.getElementById('customerLiveDashboard'); old?.remove();
    const visits = Number(localStorage.getItem('velora-store-visits') || 0) + 1;
    localStorage.setItem('velora-store-visits', String(visits));
    const host = document.getElementById('dynamicPage');
    const live = document.createElement('div'); live.id = 'customerLiveDashboard';
    host.before(live);
      const renderLive = () => {
      const offerProducts = products.filter((product) => activeOffer(product));
      const average = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
      const vipProducts = products.filter((product) => product.vip);
      const oldOffersScroll = live.querySelector('[data-carousel="offers"]')?.scrollLeft || 0;
      const oldVipScroll = live.querySelector('[data-carousel="vip"]')?.scrollLeft || 0;
      live.innerHTML = `<div class="customer-live-stats"><article><div class="stat-label"><span>Live page visits</span><b>LIVE</b></div><div class="stat-metric"><strong>${Number(localStorage.getItem('velora-store-visits') || 0).toLocaleString()}</strong><small>visitors now</small></div><p>Updated in real time</p></article><article><div class="stat-label"><span>Total orders</span><b>STORE</b></div><div class="stat-metric"><strong>${orders.length.toLocaleString()}</strong><small>orders</small></div><p>Placed through your store</p></article><article><div class="stat-label"><span>Customer rating</span><b>REVIEWS</b></div><div class="stat-metric"><strong>${average} <em>★</em></strong><small>out of 5</small></div><p>Based on ${reviews.length} customer reviews</p></article></div><section class="customer-offers-strip"><div class="section-heading"><div><span class="eyebrow">LIMITED TIME</span><h2>Offers collection</h2><p>Special prices available for a limited time.</p></div><span class="offer-live-dot">LIVE</span></div><div class="carousel-shell"><button class="carousel-arrow" data-carousel-prev="offers" aria-label="Previous offers">‹</button><div class="customer-offer-cards" data-carousel="offers">${offerProducts.map((product) => { const offer = activeOffer(product); return `<article class="customer-offer-card live-product-card" data-live-product="${product.id}"><img src="${product.images?.[0] || product.image}" alt="${product.name}"><div class="live-product-copy"><span class="discount-badge">-${discount(product, offer)}%</span><h3>${product.name}</h3><del>${money(product.salePrice ?? product.price)}</del><strong>${money(offer.price)}</strong><small class="store-countdown" data-offer-end="${offer.end}">Ends in ${countdown(offer.end)}</small><div class="live-card-actions"><button class="live-view-button" data-live-view="${product.id}">View product</button><button class="live-cart-button" data-live-cart="${product.id}" aria-label="Add ${product.name} to bag">＋</button><button class="live-wishlist-button ${readWishlist().includes(product.id) ? 'is-saved' : ''}" data-live-wishlist="${product.id}" aria-label="Add ${product.name} to wishlist">${readWishlist().includes(product.id) ? '♥' : '♡'}</button></div></div></article>`; }).join('') || '<p class="empty-comments">No offers are active right now.</p>'}</div><button class="carousel-arrow" data-carousel-next="offers" aria-label="Next offers">›</button></div></section><section class="customer-vip-strip"><div class="section-heading"><div><span class="eyebrow">EXCLUSIVE ACCESS</span><h2>VIP collection</h2><p>Exclusive pieces selected for our VIP customers.</p></div><span class="vip-crown">✦ VIP</span></div><div class="carousel-shell"><button class="carousel-arrow" data-carousel-prev="vip" aria-label="Previous VIP products">‹</button><div class="customer-offer-cards" data-carousel="vip">${vipProducts.map((product) => `<article class="customer-offer-card vip-live-card live-product-card" data-live-product="${product.id}"><span class="vip-badge">VIP</span><img src="${product.images?.[0] || product.image}" alt="${product.name}"><div class="live-product-copy"><h3>${product.name}</h3><small>${product.category || 'Velora collection'}</small><strong>${money(product.salePrice ?? product.price)}</strong><div class="live-card-actions"><button class="live-view-button" data-live-view="${product.id}">View product</button><button class="live-cart-button" data-live-cart="${product.id}" aria-label="Add ${product.name} to bag">＋</button><button class="live-wishlist-button ${readWishlist().includes(product.id) ? 'is-saved' : ''}" data-live-wishlist="${product.id}" aria-label="Add ${product.name} to wishlist">${readWishlist().includes(product.id) ? '♥' : '♡'}</button></div></div></article>`).join('') || '<p class="empty-comments">No VIP products have been added yet.</p>'}</div><button class="carousel-arrow" data-carousel-next="vip" aria-label="Next VIP products">›</button></div></section>`;
      const offersCarousel = live.querySelector('[data-carousel="offers"]'), vipCarousel = live.querySelector('[data-carousel="vip"]');
      if (offersCarousel) offersCarousel.scrollLeft = oldOffersScroll;
      if (vipCarousel) vipCarousel.scrollLeft = oldVipScroll;
      const carouselStep = (carousel) => (carousel?.querySelector('.customer-offer-card')?.offsetWidth || 0) + 12;
      live.querySelector('[data-carousel-prev="offers"]')?.addEventListener('click', () => offersCarousel?.scrollBy({ left: -carouselStep(offersCarousel), behavior: 'smooth' }));
      live.querySelector('[data-carousel-next="offers"]')?.addEventListener('click', () => offersCarousel?.scrollBy({ left: carouselStep(offersCarousel), behavior: 'smooth' }));
      live.querySelector('[data-carousel-prev="vip"]')?.addEventListener('click', () => vipCarousel?.scrollBy({ left: -carouselStep(vipCarousel), behavior: 'smooth' }));
      live.querySelector('[data-carousel-next="vip"]')?.addEventListener('click', () => vipCarousel?.scrollBy({ left: carouselStep(vipCarousel), behavior: 'smooth' }));
      bindLiveCardActions(live);
      focusCarouselCards(live);
      enhanceCustomerStoreCards();
    };
    renderLive();
    clearInterval(window.veloraLiveTimer);
    window.veloraLiveTimer = setInterval(() => {
      live.querySelectorAll('[data-offer-end]').forEach((element) => { element.textContent = `Ends in ${countdown(element.dataset.offerEnd)}`; });
    }, 1000);
  }

  window.renderCustomerHome = customerLiveDashboard;
  addOffersNav();
  // Watch only the dynamic content area. Observing the whole body caused every
  // live countdown/DOM update to trigger another full-page scan and could freeze
  // the local file after repeated navigation.
  const dynamicHost = document.getElementById('dynamicPage');
  if (dynamicHost) {
    let scheduled = false;
    new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        addProductOfferButtons();
        enhanceCustomerStoreCards();
      });
    }).observe(dynamicHost, { childList: true, subtree: true });
  }
  addProductOfferButtons();
  customerLiveDashboard();
})();
