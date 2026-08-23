(function () {
  if (typeof accountRole === 'undefined' || accountRole !== 'customer') return;

  function currentCustomerName() {
    return localStorage.getItem('velora-customer-name') || 'Mariam Hassan';
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>\"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function reviewProduct(review) {
    return (typeof products !== 'undefined' && products.find((product) => product.name === review.product)) || null;
  }

  function renderCustomerReviews() {
    const name = currentCustomerName();
    const email = (localStorage.getItem('velora-customer-email') || '').toLowerCase();
    const normalizedName = name.trim().toLowerCase();
    const mine = reviews.filter((review) => {
      const reviewName = String(review.customer || review.name || review.author || '').trim().toLowerCase();
      const reviewEmail = String(review.email || review.customerEmail || '').trim().toLowerCase();
      return reviewName === normalizedName || (email && reviewEmail === email);
    });
    const average = mine.length ? (mine.reduce((sum, review) => sum + Number(review.rating || 0), 0) / mine.length).toFixed(1) : '0.0';
    const nav = document.querySelector('.nav-list');
    nav?.querySelector('.active')?.classList.remove('active');
    nav?.querySelector('[data-customer-section="Reviews"]')?.classList.add('active');
    document.getElementById('subtitle').textContent = 'View only the reviews you wrote for Velora products.';
    openDynamic('My reviews', {
      actions: '<button class="gold-button" id="customerReviewsRefresh">Refresh reviews</button>',
      content: `<div class="customer-reviews-note"><span class="eyebrow">YOUR REVIEWS</span><p>Showing reviews submitted from the account: <strong>${esc(name)}</strong></p></div><div class="review-summary customer-review-summary"><div><strong>${average}</strong><span>Your average rating</span></div><div><strong>${mine.length}</strong><span>Your total reviews</span></div><div><strong>${mine.filter((review) => review.status === 'Pending').length}</strong><span>Awaiting approval</span></div></div><div class="reviews-list customer-reviews-list">${mine.map((review) => { const rating = Math.max(0, Math.min(5, Number(review.rating || 0))); const product = reviewProduct(review); const image = product?.images?.[0] || product?.image || ''; const category = product?.category || 'Velora collection'; const reply = review.reply || review.response || review.adminReply || ''; const productLink = product ? `<button class="customer-review-product-image customer-review-product-link" data-review-product="${product.id}" aria-label="Open ${esc(review.product)} in store">${image ? `<img src="${esc(image)}" alt="${esc(review.product)}">` : '<span>V</span>'}</button>` : `<div class="customer-review-product-image">${image ? `<img src="${esc(image)}" alt="${esc(review.product)}">` : '<span>V</span>'}</div>`; return `<article class="review-card customer-review-card"><div class="review-head"><div class="customer"><div class="customer-avatar">${esc((review.customer || name).charAt(0))}</div><div><strong>${esc(review.product)}</strong><small>${esc(review.date || 'Recently submitted')}</small></div></div><span class="review-status ${(review.status || 'Published').toLowerCase()}">${esc(review.status || 'Published')}</span></div><div class="customer-review-product">${productLink}<div><strong>${esc(review.product)}</strong><small>${esc(category)}</small></div><span class="customer-review-stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span></div><p class="customer-review-text">“${esc(review.text)}”</p><div class="customer-review-reply ${reply ? '' : 'is-empty'}"><strong>Velora reply</strong><p>${reply ? esc(reply) : 'No reply from the store yet.'}</p></div></article>`; }).join('') || '<div class="empty-comments">You have not reviewed any products yet.</div>'}</div>`
    });
    document.getElementById('customerReviewsRefresh')?.addEventListener('click', renderCustomerReviews);
    document.querySelectorAll('[data-review-product]').forEach((button) => {
      button.addEventListener('click', () => {
        const productId = Number(button.dataset.reviewProduct);
        if (typeof openProductDetails === 'function') openProductDetails(productId);
      });
    });
  }

  // role-aware.js calls the global renderReviews function. Replace it only in
  // customer mode so the admin review screen remains unchanged.
  window.renderReviews = renderCustomerReviews;

  document.addEventListener('click', (event) => {
    const reviewButton = event.target.closest('[data-customer-section="Reviews"]');
    if (reviewButton) {
      event.preventDefault();
      renderCustomerReviews();
    }
  });
})();
