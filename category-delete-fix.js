(function () {
  const storageKey = 'velora-categories';
  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const normalise = (value) => String(value || '').trim().replace(/\s+/g, ' ');
  const themeClass = (value) => {
    const key = normalise(value).toLowerCase();
    if (key.includes('bag')) return 'theme-bags';
    if (key.includes('shoe')) return 'theme-shoes';
    if (key.includes('accessor')) return 'theme-accessories';
    if (key.includes('cloth') || key.includes('fashion')) return 'theme-clothing';
    return 'theme-custom';
  };
  const persistCategories = () => localStorage.setItem(storageKey, JSON.stringify(categories));
  const exists = (value, except) => categories.some((item) =>
    item !== except && item.toLowerCase() === value.toLowerCase()
  );

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (Array.isArray(saved)) categories.splice(0, categories.length, ...saved.map(normalise).filter(Boolean));
  } catch (_) {}

  window.renderCategories = function renderCategoriesWithCrud() {
    openDynamic('Categories', {
      actions: '<button class="gold-button" id="addCategory">+ Add category</button>',
      content: `<div class="category-grid">${categories.map((category, index) => {
        const count = products.filter((product) => product.category === category).length;
        const safe = escapeHtml(category);
        return `<article class="category-card category-card-with-actions ${themeClass(category)}" data-category-card="${safe}">
          <button class="category-open" data-open-category="${safe}" aria-label="Open ${safe}">
            <div class="category-icon">${['◇', '♢', '✦', '◈'][index % 4]}</div>
            <div><h3>${safe}</h3><span>${count} product${count === 1 ? '' : 's'}</span></div><b>›</b>
          </button>
          <div class="category-actions">
            <button class="category-edit" data-edit-category="${safe}" title="Edit category" aria-label="Edit ${safe}">✎</button>
            <button class="category-delete" data-delete-category="${safe}" title="Delete category" aria-label="Delete ${safe}">×</button>
          </div>
        </article>`;
      }).join('')}</div><p class="category-hint">Select a category to view and manage its products.</p>`
    });

    document.getElementById('addCategory')?.addEventListener('click', () => {
      const name = normalise(prompt('Category name'));
      if (!name) return;
      if (exists(name)) return showToast('This category already exists');
      categories.push(name);
      persistCategories();
      window.renderCategories();
      showToast('Category added');
    });

    document.querySelectorAll('[data-open-category]').forEach((button) => {
      button.addEventListener('click', () => renderCategoryProducts(button.dataset.openCategory));
    });

    document.querySelectorAll('[data-edit-category]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const oldName = button.dataset.editCategory;
        const newName = normalise(prompt('Category name', oldName));
        if (!newName || newName === oldName) return;
        if (exists(newName, oldName)) return showToast('This category already exists');
        const index = categories.indexOf(oldName);
        if (index < 0) return;
        categories[index] = newName;
        products = products.map((product) => product.category === oldName ? { ...product, category: newName } : product);
        persistCategories();
        saveProducts();
        window.renderCategories();
        showToast('Category updated');
      });
    });

    document.querySelectorAll('[data-delete-category]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const category = button.dataset.deleteCategory;
        const affected = products.filter((product) => product.category === category).length;
        const message = affected
          ? `${category} contains ${affected} product(s). Delete it and move those products to Uncategorized?`
          : `Delete the ${category} category?`;
        if (!confirm(message)) return;
        const index = categories.indexOf(category);
        if (index < 0) return;
        categories.splice(index, 1);
        if (affected) {
          if (!categories.some((item) => item.toLowerCase() === 'uncategorized')) categories.push('Uncategorized');
          products = products.map((product) => product.category === category ? { ...product, category: 'Uncategorized' } : product);
          saveProducts();
        }
        persistCategories();
        window.renderCategories();
        showToast(`${category} category deleted`);
      });
    });
  };

  const syncProductCategoryOptions = () => {
    document.querySelectorAll('#productForm select[name="category"]').forEach((select) => {
      const current = select.value;
      const existing = new Set([...select.options].map((option) => option.value));
      categories.forEach((category) => {
        if (!existing.has(category)) select.add(new Option(category, category));
      });
      if (categories.includes(current)) select.value = current;
    });
  };
  const dynamicPage = document.getElementById('dynamicPage');
  if (dynamicPage) {
    new MutationObserver(syncProductCategoryOptions).observe(dynamicPage, { childList: true, subtree: true });
    syncProductCategoryOptions();
  }
})();
