// Product pricing and profitability enhancements.
products = products.map(p => ({
  ...p,
  costPrice: Number(p.costPrice ?? p.purchasePrice ?? 0),
  salePrice: Number(p.salePrice ?? p.price ?? 0),
  sold: Number(p.sold ?? ({'Velora Classic Bag': 120, 'Velora Signature Heels': 86, 'Velora Gold Watch': 64}[p.name] || 0))
}));

const sellingPrice = p => Number(p.salePrice ?? p.price ?? 0);
const purchasePrice = p => Number(p.costPrice ?? p.purchasePrice ?? 0);

function renderProducts() {
  openDynamic('Products', { actions: '<button class="gold-button" id="customerPreview">Customer store preview</button><button class="gold-button" id="addProduct">+ Add product</button>', content: `<div class="product-layout"><form class="product-form" id="productForm"><input type="hidden" name="id"><h3 id="formTitle">Add new product</h3><label>Product name<input name="name" required placeholder="e.g. Velora Evening Bag"></label><label>Category<select name="category"><option>Bags</option><option>Shoes</option><option>Accessories</option><option>Clothing</option></select></label><div class="price-fields"><label>Purchase price<input name="costPrice" type="number" min="0" step="0.01" placeholder="Your cost"></label><label>Selling price<input name="salePrice" type="number" min="0" step="0.01" required placeholder="Customer price"></label></div><label>Stock quantity<input name="stock" type="number" min="0" required></label><label>Product images<input name="imageFiles" type="file" accept="image/*" multiple><small>Upload multiple images and choose the cover image below.</small></label><label>Description<textarea name="description" placeholder="Describe the materials, style and details..."></textarea></label><label class="vip-check"><input name="vip" type="checkbox"><span>VIP product</span><small>Show this product in the VIP section.</small></label><button class="account-action" type="submit">Save product</button><button class="secondary-action" type="button" id="clearProduct">Clear form</button></form><section class="products-table"><div class="table-head"><span></span><span>Product</span><span>Category</span><span>Purchase</span><span>Selling</span><span>Stock</span><span>Actions</span></div>${products.map(p=>`<div class="product-item"><img src="${(p.images?.[0]||p.image)}" alt="${p.name}"><div><strong>${p.vip?'<b class="vip-badge">VIP</b> ':''}${p.name}</strong><small>${p.description||'Visible in customer store'}</small></div><span>${p.category}</span><strong class="muted-price">$${purchasePrice(p).toLocaleString()}</strong><strong>$${sellingPrice(p).toLocaleString()}</strong><span class="stock ${p.stock<10?'low':''}">${p.stock} in stock</span><div class="row-actions"><button data-edit="${p.id}">Edit</button><button data-delete="${p.id}">Delete</button></div></div>`).join('')}</section></div>` });
  bindProductEvents();
}

function saveProduct(e) {
  e.preventDefault();
  const form = e.currentTarget, data = new FormData(form);
  const existing = products.find(p => p.id === Number(data.get('id')));
  const finish = images => {
    const coverIndex = Math.max(0, Math.min(Number(data.get('coverIndex') || 0), Math.max(images.length - 1, 0)));
    const ordered = images.length ? [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)] : existing?.images || [existing?.image || 'assets/velora-dashboard-reference.png'];
    const item = { id: existing?.id || Date.now(), name: data.get('name'), category: data.get('category'), costPrice: Number(data.get('costPrice') || 0), salePrice: Number(data.get('salePrice') || 0), price: Number(data.get('salePrice') || 0), stock: Number(data.get('stock') || 0), sold: existing?.sold || 0, description: data.get('description') || '', vip: data.get('vip') === 'on', images: ordered };
    item.image = item.images[0];
    products = existing ? products.map(p => p.id === existing.id ? item : p) : [item, ...products];
    localStorage.setItem('velora-products', JSON.stringify(products));
    renderProducts();
    showToast('Product pricing and details saved');
  };
  const files = [...data.getAll('imageFiles')].filter(f => f?.size);
  if (files.length) Promise.all(files.map(file => new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); }))).then(finish); else finish([]);
}

function editProduct(id) {
  const p = products.find(x => x.id === id), form = document.getElementById('productForm');
  form.elements.id.value = p.id; form.elements.name.value = p.name; form.elements.category.value = p.category; form.elements.costPrice.value = purchasePrice(p); form.elements.salePrice.value = sellingPrice(p); form.elements.stock.value = p.stock; form.elements.description.value = p.description || ''; form.elements.vip.checked = Boolean(p.vip); document.getElementById('formTitle').textContent = 'Edit product'; form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderAnalytics() {
  openDynamic('Analytics', { actions: '<select class="gold-button"><option>All products</option><option>This month</option><option>This year</option></select>', content: `<div class="analytics-grid"><div class="analytics-card"><span>Total revenue</span><strong>$86,420</strong><em>+18.4%</em></div><div class="analytics-card"><span>Total product cost</span><strong>$42,860</strong><em class="cost-em">Operating cost</em></div><div class="analytics-card"><span>Net profit</span><strong>$43,560</strong><em>+22.1%</em></div></div><div class="analytics-panel product-profit-panel"><h3>Product profitability</h3><div class="profit-head"><span>Product</span><span>Sold</span><span>Cost</span><span>Revenue</span><span>Profit</span><span>Margin</span></div>${products.map(p => { const sold = Number(p.sold || 0), cost = purchasePrice(p) * sold, revenue = sellingPrice(p) * sold, profit = revenue - cost, margin = revenue ? Math.round(profit / revenue * 100) : 0; return `<div class="profit-row"><div><strong>${p.name}</strong><small>${p.category}</small></div><span>${sold}</span><span>$${cost.toLocaleString()}</span><span>$${revenue.toLocaleString()}</span><strong class="profit-value">$${profit.toLocaleString()}</strong><span class="margin-value">${margin}%</span></div>`; }).join('')}</div>` });
}
