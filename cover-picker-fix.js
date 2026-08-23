(function () {
  function attachCoverPicker(form) {
    if (!form || form.dataset.coverPickerReady === 'true') return;
    const input = form.querySelector('input[name="imageFiles"]');
    if (!input) return;

    form.dataset.coverPickerReady = 'true';
    form.querySelectorAll('.image-cover-picker').forEach((oldPicker) => oldPicker.remove());
    let coverIndex = form.querySelector('input[name="coverIndex"]');
    if (!coverIndex) {
      coverIndex = document.createElement('input');
      coverIndex.type = 'hidden';
      coverIndex.name = 'coverIndex';
      form.insertBefore(coverIndex, input);
    }
    coverIndex.value = '0';

    const panel = document.createElement('div');
    panel.className = 'cover-picker-ui';
    panel.innerHTML = '<strong>Choose the cover image</strong><span>Select the image that should appear on the product card. The other images stay in the product gallery.</span><div class="cover-picker-list"></div>';
    const label = input.closest('label');
    (label || input).after(panel);

    const coverLabel = document.createElement('label');
    coverLabel.className = 'cover-upload-label';
    coverLabel.innerHTML = 'Card cover image<input name="coverFile" type="file" accept="image/*"><small>Choose the image that will appear on the product card.</small>';
    panel.after(coverLabel);
    const coverFile = coverLabel.querySelector('input[name="coverFile"]');
    coverFile.addEventListener('change', () => {
      coverLabel.classList.toggle('has-cover', coverFile.files.length > 0);
    });
    const list = panel.querySelector('.cover-picker-list');

    function selectCover(index) {
      coverIndex.value = String(index);
      list.querySelectorAll('.cover-picker-item').forEach((item, itemIndex) => {
        const selected = itemIndex === index;
        item.classList.toggle('selected', selected);
        const button = item.querySelector('button');
        if (button) button.textContent = selected ? 'Cover image' : 'Set as cover';
      });
    }

    input.addEventListener('change', function () {
      list.innerHTML = '';
      coverIndex.value = '0';
      [...input.files].forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'cover-picker-item' + (index === 0 ? ' selected' : '');
        const image = document.createElement('img');
        image.alt = 'Product image ' + (index + 1);
        const meta = document.createElement('div');
        meta.className = 'cover-picker-meta';
        const name = document.createElement('span');
        name.textContent = file.name;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = index === 0 ? 'Cover image' : 'Set as cover';
        button.addEventListener('click', () => selectCover(index));
        meta.append(name, button);
        item.append(image, meta);
        list.appendChild(item);
        const reader = new FileReader();
        reader.onload = () => { image.src = reader.result; };
        reader.readAsDataURL(file);
      });
      panel.classList.toggle('has-images', input.files.length > 0);
    });

    /* Use the dedicated cover upload as the first image while preserving the gallery. */
    form.addEventListener('submit', function (event) {
      if (!coverFile.files.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const data = new FormData(form);
      const existing = typeof products !== 'undefined' ? products.find((product) => product.id === Number(data.get('id'))) : null;
      const read = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const galleryFiles = [...input.files].filter((file) => file.size);
      Promise.all([read(coverFile.files[0]), ...galleryFiles.map(read)]).then((images) => {
        const ordered = [images[0], ...images.slice(1).filter((image) => image !== images[0])];
        const item = {
          id: existing?.id || Date.now(),
          name: data.get('name'), category: data.get('category'),
          costPrice: Number(data.get('costPrice') || 0), salePrice: Number(data.get('salePrice') || 0),
          price: Number(data.get('salePrice') || 0), stock: Number(data.get('stock') || 0),
          sold: existing?.sold || 0, description: data.get('description') || '',
          vip: data.get('vip') === 'on', images: ordered
        };
        item.image = item.images[0];
        products = existing ? products.map((product) => product.id === existing.id ? item : product) : [item, ...products];
        saveProducts();
        renderProducts();
        showToast('Product saved with selected card cover');
      });
    }, true);
  }

  function scan() {
    attachCoverPicker(document.getElementById('productForm'));
  }

  const dynamicHost = document.getElementById('dynamicPage');
  if (dynamicHost) new MutationObserver(scan).observe(dynamicHost, { childList: true, subtree: true });
  scan();
})();
