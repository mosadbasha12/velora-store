/* Reliable product save: handles the visible card-cover picker and survives dynamic form redraws. */
(function () {
  const readFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const source = new Image();
      source.onerror = () => resolve(reader.result);
      source.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(source.naturalWidth, source.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
        canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  function persistProducts(list) {
    const key = 'velora-products';
    try {
      localStorage.setItem(key, JSON.stringify(list));
      return;
    } catch (error) {
      if (error?.name !== 'QuotaExceededError' && error?.code !== 22) throw error;
    }

    // Existing products may contain older, full-size gallery images. Keep the
    // selected cover for every product and drop only extra gallery images.
    const compact = list.map((product) => {
      const cover = Array.isArray(product.images) && product.images[0]
        ? product.images[0]
        : (product.image || 'assets/velora-dashboard-reference.png');
      return { ...product, image: cover, images: [cover] };
    });
    localStorage.setItem(key, JSON.stringify(compact));
    products = compact;
  }

  async function saveFromForm(form) {
    const data = new FormData(form);
    const savedProducts = Array.isArray(products) ? products : [];
    const existing = savedProducts.find((product) => product.id === Number(data.get('id')));
    const cover = form.querySelector('input[name="coverFile"]')?.files?.[0];
    const gallery = [...(form.querySelector('input[name="imageFiles"]')?.files || [])].filter((file) => file.size);
    const uploaded = [];
    if (cover) uploaded.push(await readFile(cover));
    uploaded.push(...await Promise.all(gallery.map(readFile)));

    const currentImages = Array.isArray(existing?.images) && existing.images.length
      ? existing.images
      : [existing?.image || 'assets/velora-dashboard-reference.png'];
    const images = uploaded.length ? [...new Set(uploaded)] : currentImages;
    const salePrice = Number(data.get('salePrice') || data.get('price') || 0);
    const item = {
      id: existing?.id || Date.now(),
      name: String(data.get('name') || '').trim(),
      category: data.get('category') || 'Bags',
      costPrice: Number(data.get('costPrice') || 0),
      salePrice,
      price: salePrice,
      stock: Number(data.get('stock') || 0),
      sold: existing?.sold || 0,
      description: data.get('description') || '',
      vip: data.get('vip') === 'on',
      images
    };
    item.image = images[0];
    products = existing ? savedProducts.map((product) => product.id === existing.id ? item : product) : [item, ...savedProducts];
    persistProducts(products);
    try {
      renderProducts();
    } catch (renderError) {
      console.error('Product saved, but the products list could not redraw', renderError);
    }
    if (typeof showToast === 'function') showToast('Product saved and published to customer store');
  }

  function bind() {
    const form = document.getElementById('productForm');
    const button = form?.querySelector('button[type="submit"]');
    if (!button || button.dataset.reliableSave === 'true') return;
    button.dataset.reliableSave = 'true';
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!form.reportValidity()) return;
      button.disabled = true;
      try {
        await saveFromForm(form);
      } catch (error) {
        console.error('Product save failed', error);
        if (typeof showToast === 'function') showToast('Could not save product. Please try again.');
      } finally {
        button.disabled = false;
      }
    }, true);
  }

  const host = document.getElementById('dynamicPage');
  if (host) new MutationObserver(bind).observe(host, { childList: true, subtree: true });
  bind();
})();
