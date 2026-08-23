// The customer-facing store only uses the selling price.
products = products.map(p => ({ ...p, salePrice: Number(p.salePrice ?? p.price ?? 0), price: Number(p.salePrice ?? p.price ?? 0) }));
render(products);
