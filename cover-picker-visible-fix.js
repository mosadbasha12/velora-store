(function () {
  function addCoverField(form) {
    const galleryInput = form && form.querySelector('input[name="imageFiles"]');
    if (!form || !galleryInput || form.querySelector('.cover-upload-label')) return;

    const coverLabel = document.createElement('label');
    coverLabel.className = 'cover-upload-label cover-upload-required';
    coverLabel.innerHTML = '<span>Card cover image</span><input name="coverFile" type="file" accept="image/*"><small>Choose the one image that will appear on the product card. The other selected images stay in the gallery.</small><div class="cover-selected-preview" hidden></div>';
    (galleryInput.closest('label') || galleryInput).after(coverLabel);

    const coverInput = coverLabel.querySelector('input[name="coverFile"]');
    const preview = coverLabel.querySelector('.cover-selected-preview');
    coverInput.addEventListener('change', () => {
      const file = coverInput.files && coverInput.files[0];
      coverLabel.classList.toggle('has-cover', Boolean(file));
      preview.hidden = !file;
      preview.innerHTML = '';
      if (!file) return;
      const image = document.createElement('img');
      image.alt = 'Selected card cover preview';
      preview.appendChild(image);
      const reader = new FileReader();
      reader.onload = () => { image.src = reader.result; };
      reader.readAsDataURL(file);
    });

    /* Persist the explicitly chosen cover as the product's first image. */
    if (form.dataset.visibleCoverSubmit !== 'true') {
      form.dataset.visibleCoverSubmit = 'true';
      form.addEventListener('submit', (event) => {
        if (!coverInput.files || !coverInput.files.length) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const data = new FormData(form);
        const existing = typeof products !== 'undefined'
          ? products.find((product) => product.id === Number(data.get('id')))
          : null;
        const read = (file) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        const galleryFiles = [...galleryInput.files].filter((file) => file.size);
        Promise.all([read(coverInput.files[0]), ...galleryFiles.map(read)]).then((images) => {
          const item = {
            id: existing?.id || Date.now(),
            name: data.get('name'), category: data.get('category'),
            costPrice: Number(data.get('costPrice') || 0),
            salePrice: Number(data.get('salePrice') || data.get('price') || 0),
            price: Number(data.get('salePrice') || data.get('price') || 0),
            stock: Number(data.get('stock') || 0), sold: existing?.sold || 0,
            description: data.get('description') || '',
            vip: data.get('vip') === 'on', images
          };
          item.image = item.images[0];
          products = existing
            ? products.map((product) => product.id === existing.id ? item : product)
            : [item, ...products];
          saveProducts();
          renderProducts();
          if (typeof showToast === 'function') showToast('Product saved with selected card cover');
        });
      }, true);
    }
  }

  function scan() {
    const form = document.getElementById('productForm');
    if (form) addCoverField(form);
  }

  const dynamicHost = document.getElementById('dynamicPage');
  if (dynamicHost) new MutationObserver(scan).observe(dynamicHost, { childList: true, subtree: true });
  scan();
})();
