'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };
  const send = (url, method, body) => request(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  const feedback = document.getElementById('admin-feedback');
  const showMessage = (message, isError = false) => {
    feedback.textContent = message;
    feedback.dataset.state = isError ? 'error' : 'success';
    feedback.hidden = !message;
  };
  const setLoading = (target, message = 'Loading…') => {
    target.replaceChildren();
    const p = document.createElement('p');
    p.className = 'admin-empty';
    p.textContent = message;
    target.append(p);
  };

  let currentUser;
  try {
    const result = await request('/api/me');
    currentUser = result.user;
    if (!['admin', 'manager'].includes(currentUser.role)) {
      location.href = 'user.html';
      return;
    }
  } catch {
    location.href = 'login.html';
    return;
  }

  const isAdmin = currentUser.role === 'admin';
  const userTab = document.querySelector('[data-tab="users"]');
  if (!isAdmin && userTab) userTab.hidden = true;
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const panels = [...document.querySelectorAll('.admin-panel')];
  const loaded = new Set();
  let cachedProducts = [];
  const productSearch = document.getElementById('admin-product-search');
  const productFilter = document.getElementById('admin-product-filter');

  const loadProducts = async () => {
    const target = document.getElementById('admin-product-list');
    setLoading(target);
    try {
      const products = await request('/api/admin/products');
      cachedProducts = products;
      renderProductRows();
    } catch (error) {
      setLoading(target, error.message);
      showMessage(error.message, true);
    }
  };

  const renderProductRows = () => {
    const target = document.getElementById('admin-product-list');
    target.replaceChildren();
    const query = (productSearch?.value || '').trim().toLowerCase();
    const filter = productFilter?.value || 'all';
    const lowStockCount = cachedProducts.filter(product => product.active !== false && Number(product.stock) <= (Number.isInteger(product.stockThreshold) ? product.stockThreshold : 5)).length;
    const stockSummary = document.getElementById('low-stock-summary');
    if (stockSummary) stockSummary.textContent = lowStockCount + ' low-stock item(s)';
    const visible = cachedProducts.filter(product => {
      const isActive = product.active !== false;
      const isLow = Number(product.stock) <= (Number.isInteger(product.stockThreshold) ? product.stockThreshold : 5);
      const statusMatch = filter === 'all' || (filter === 'active' && isActive) || (filter === 'archived' && !isActive) || (filter === 'low' && isActive && isLow);
      const textMatch = [product.name, product.category, product.description].join(' ').toLowerCase().includes(query);
      return statusMatch && textMatch;
    });
    if (!visible.length) {
        setLoading(target, cachedProducts.length ? 'No products match these filters.' : 'No products in the catalogue yet.');
        return;
      }
      visible.forEach(product => {
        const row = document.createElement('article');
        row.className = 'admin-row';
        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = product.name + ' · RM ' + Number(product.price).toFixed(2);
        const thumb = document.createElement('img');
        thumb.className = 'admin-row-thumb';
        thumb.src = product.image || '/images/products/aquarium-card.svg';
        thumb.alt = '';
        thumb.addEventListener('error', () => { thumb.src = '/images/products/aquarium-card.svg'; }, { once:true });
        const detail = document.createElement('p');
        const threshold = Number.isInteger(product.stockThreshold) ? product.stockThreshold : 5;
        detail.textContent = product.category + ' · Stock ' + product.stock + ' / Alert at ' + threshold + ' · ' + (product.active === false ? 'Archived' : (Number(product.stock) <= threshold ? 'LOW STOCK' : 'Active'));
        info.append(thumb, title, detail);
        const actions = document.createElement('div');
        actions.className = 'admin-row-actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => editProduct(product));
        actions.append(edit);
        const adjustStock = document.createElement('button');
        adjustStock.type = 'button';
        adjustStock.textContent = 'Adjust stock';
        adjustStock.addEventListener('click', async () => {
          const rawDelta = prompt('Enter stock change (e.g. 12 or -3):', '1');
          if (rawDelta === null) return;
          const delta = Number(rawDelta);
          if (!Number.isInteger(delta) || delta === 0) { showMessage('Enter a non-zero whole-number stock change.', true); return; }
          const reason = prompt('Reason for this stock movement (required):');
          if (reason === null) return;
          try {
            await send('/api/admin/products/' + encodeURIComponent(product.id) + '/stock', 'POST', { mode:'adjust', quantity:delta, reason });
            showMessage('Stock updated and movement recorded.');
            await loadProducts();
          } catch (error) { showMessage(error.message, true); }
        });
        const setThreshold = document.createElement('button');
        setThreshold.type = 'button';
        setThreshold.textContent = 'Set alert';
        setThreshold.addEventListener('click', async () => {
          const raw = prompt('Alert when stock is at or below this quantity:', String(threshold));
          if (raw === null) return;
          const value = Number(raw);
          if (!Number.isInteger(value) || value < 0) { showMessage('Enter a non-negative whole number.', true); return; }
          try {
            await send('/api/admin/products/' + encodeURIComponent(product.id) + '/stock-threshold', 'PATCH', { threshold:value });
            showMessage('Low-stock threshold saved.');
            await loadProducts();
          } catch (error) { showMessage(error.message, true); }
        });
        const historyButton = document.createElement('button');
        historyButton.type = 'button';
        historyButton.textContent = 'Movement log';
        historyButton.addEventListener('click', async () => {
          try {
            const result = await request('/api/admin/products/' + encodeURIComponent(product.id) + '/stock-movements');
            const log = document.createElement('div');
            log.className = 'admin-stock-history';
            if (!result.movements.length) {
              log.textContent = 'No manual stock movements recorded yet.';
            } else {
              result.movements.forEach(movement => {
                const entry = document.createElement('p');
                entry.textContent = new Date(movement.createdAt).toLocaleString() + ' · ' + (movement.delta > 0 ? '+' : '') + movement.delta + ' · ' + movement.previousStock + ' → ' + movement.newStock + ' · ' + movement.reason;
                log.append(entry);
              });
            }
            const oldLog = row.nextElementSibling;
            if (oldLog?.classList.contains('admin-stock-history')) oldLog.remove();
            row.after(log);
          } catch (error) { showMessage(error.message, true); }
        });
        actions.append(adjustStock, setThreshold, historyButton);
        if (isAdmin) {
          const archive = document.createElement('button');
          archive.type = 'button';
          archive.textContent = product.active === false ? 'Archived' : 'Archive';
          archive.disabled = product.active === false;
          archive.addEventListener('click', async () => {
            if (!confirm('Archive ' + product.name + '?')) return;
            try {
              await send('/api/admin/products/' + encodeURIComponent(product.id), 'DELETE');
              showMessage('Product archived.');
              await loadProducts();
            } catch (error) { showMessage(error.message, true); }
          });
          actions.append(archive);
        }
        row.append(info, actions);
        target.append(row);
      });
  };

  productSearch?.addEventListener('input', renderProductRows);
  productFilter?.addEventListener('change', renderProductRows);

  const form = document.getElementById('product-form');
  const editProduct = product => {
    form.hidden = false;
    const values = {
      'product-id': product?.id || '',
      'product-name': product?.name || '',
      'product-category': product?.category || 'Ornamental Fish',
      'product-description': product?.description || '',
      'product-price': product?.price ?? '',
      'product-stock': product?.stock ?? 0,
      'product-stock-threshold': product?.stockThreshold ?? 5,
      'product-image': product?.image || '/images/products/koi-card.svg'
    };
    Object.entries(values).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (id === 'product-category' && ![...field.options].some(option => option.value === value)) {
        const custom = document.createElement('option');
        custom.value = value; custom.textContent = value; field.append(custom);
      }
      field.value = value;
    });
    document.getElementById('product-image-file').value = '';
    document.getElementById('product-gallery').value = Array.isArray(product?.images) ? product.images.join('\n') : '';
    const specs = product?.specifications || {};
    document.getElementById('product-water-type').value = specs.waterType || '';
    document.getElementById('product-difficulty').value = specs.difficulty || '';
    document.getElementById('product-min-tank').value = specs.minTankLitres ?? '';
    document.getElementById('product-temp-min').value = specs.temperatureMinC ?? '';
    document.getElementById('product-temp-max').value = specs.temperatureMaxC ?? '';
    document.getElementById('product-adult-size').value = specs.adultSizeCm ?? '';
    document.getElementById('product-care-notes').value = specs.careNotes || '';
    const preset = document.getElementById('product-image-preset');
    preset.value = [...preset.options].some(option => option.value === values['product-image']) ? values['product-image'] : 'custom';
    document.getElementById('product-image-preview').src = values['product-image'];
    document.getElementById('product-active').checked = product?.active !== false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const imagePath = document.getElementById('product-image');
  const imagePreset = document.getElementById('product-image-preset');
  const imagePreview = document.getElementById('product-image-preview');
  imagePreset.addEventListener('change', () => {
    if (imagePreset.value !== 'custom') imagePath.value = imagePreset.value;
    imagePreview.src = imagePath.value;
  });
  imagePath.addEventListener('input', () => {
    imagePreset.value = [...imagePreset.options].some(option => option.value === imagePath.value) ? imagePath.value : 'custom';
    imagePreview.src = imagePath.value;
  });
  imagePreview.addEventListener('error', () => {
    imagePreview.src = '/images/products/aquarium-card.svg';
  });

  const imageFile = document.getElementById('product-image-file');
  const uploadImageButton = document.getElementById('upload-product-image');
  uploadImageButton.addEventListener('click', async () => {
    const files = [...(imageFile.files || [])];
    if (!files.length) { showMessage('Choose one or more image files first.', true); return; }
    if (files.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      showMessage('Every file must be JPEG, PNG or WebP and no larger than 5 MB.', true); return;
    }
    uploadImageButton.disabled = true;
    uploadImageButton.textContent = 'Uploading…';
    try {
      const paths = [];
      for (const file of files) {
        const response = await fetch('/api/admin/media/products', { method:'POST', credentials:'same-origin', headers:{ 'Content-Type':file.type }, body:file });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Image upload failed.');
        paths.push(result.image);
      }
      const gallery = document.getElementById('product-gallery');
      const existing = gallery.value.split(/\r?\n/).map(value=>value.trim()).filter(Boolean);
      gallery.value = [...new Set([...existing,...paths])].slice(0,8).join('\n');
      if (!imagePath.value.trim()) { imagePath.value=paths[0]; imagePreset.value='custom'; imagePreview.src=paths[0]; }
      showMessage(paths.length+' image(s) uploaded. Save the product to apply the gallery.');
      imageFile.value='';
    } catch (error) { showMessage(error.message, true); }
    finally { uploadImageButton.disabled=false; uploadImageButton.textContent='Upload selected images'; }
  });

  document.getElementById('new-product').addEventListener('click', () => editProduct(null));
  document.getElementById('cancel-product').addEventListener('click', () => { form.hidden = true; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('product-id').value;
    const payload = {
      name: document.getElementById('product-name').value.trim(),
      category: document.getElementById('product-category').value.trim(),
      description: document.getElementById('product-description').value.trim(),
      price: Number(document.getElementById('product-price').value),
      stock: Number(document.getElementById('product-stock').value),
      stockThreshold: Number(document.getElementById('product-stock-threshold').value),
      image: document.getElementById('product-image').value.trim(),
      images: document.getElementById('product-gallery').value.split(/\r?\n/).map(value=>value.trim()).filter(Boolean),
      specifications: {
        waterType:document.getElementById('product-water-type').value,
        difficulty:document.getElementById('product-difficulty').value,
        minTankLitres:document.getElementById('product-min-tank').value === '' ? null : Number(document.getElementById('product-min-tank').value),
        temperatureMinC:document.getElementById('product-temp-min').value === '' ? null : Number(document.getElementById('product-temp-min').value),
        temperatureMaxC:document.getElementById('product-temp-max').value === '' ? null : Number(document.getElementById('product-temp-max').value),
        adultSizeCm:document.getElementById('product-adult-size').value === '' ? null : Number(document.getElementById('product-adult-size').value),
        careNotes:document.getElementById('product-care-notes').value.trim()
      },
      active: document.getElementById('product-active').checked
    };
    try {
      await send(id ? '/api/admin/products/' + encodeURIComponent(id) : '/api/admin/products', id ? 'PATCH' : 'POST', payload);
      form.hidden = true;
      showMessage(id ? 'Product updated.' : 'Product created.');
      await loadProducts();
    } catch (error) { showMessage(error.message, true); }
  });

  const loadOrders = async () => {
    const target = document.getElementById('admin-order-list');
    setLoading(target);
    try {
      const orders = await request('/api/admin/orders');
      target.replaceChildren();
      if (!orders.length) {
        setLoading(target, 'No customer orders yet.');
        return;
      }
      orders.forEach(order => {
        const row = document.createElement('article');
        row.className = 'admin-row admin-order-row';
        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = order.id + ' · RM ' + Number(order.total).toFixed(2);
        const detail = document.createElement('p');
        const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        detail.textContent = order.status + ' · ' + itemCount + ' item(s) · ' + new Date(order.createdAt).toLocaleString();
        info.append(title, detail);
        const actions = document.createElement('div');
        actions.className = 'admin-row-actions';
        const next = {
          paid:['processing', 'cancelled'],
          processing:['shipped', 'cancelled'],
          shipped:['completed']
        }[order.status] || [];
        if (next.length) {
          const select = document.createElement('select');
          select.setAttribute('aria-label', 'Next status for ' + order.id);
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = 'Update status…';
          select.append(placeholder);
          next.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status.replace('_', ' ');
            select.append(option);
          });
          select.addEventListener('change', async () => {
            if (!select.value) return;
            select.disabled = true;
            try {
              await send('/api/admin/orders/' + encodeURIComponent(order.id) + '/status', 'PATCH', { status:select.value });
              showMessage('Order ' + order.id + ' updated to ' + select.value + '.');
              await loadOrders();
            } catch (error) {
              showMessage(error.message, true);
              select.disabled = false;
              select.value = '';
            }
          });
          actions.append(select);
        } else {
          const state = document.createElement('span');
          state.className = 'admin-order-terminal';
          state.textContent = order.status === 'paid_inventory_review' ? 'Inventory review required' : 'No further actions';
          actions.append(state);
        }
        row.append(info, actions);
        target.append(row);
      });
    } catch (error) {
      setLoading(target, error.message);
      showMessage(error.message, true);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    const target = document.getElementById('admin-user-list');
    setLoading(target);
    try {
      const users = await request('/api/admin/users');
      target.replaceChildren();
      if (!users.length) {
        setLoading(target, 'No user accounts yet.');
        return;
      }
      users.forEach(user => {
        const row = document.createElement('article');
        row.className = 'admin-row';
        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = user.username;
        const detail = document.createElement('p');
        detail.textContent = (user.email || 'No email') + ' · ' + user.role;
        info.append(title, detail);
        const select = document.createElement('select');
        select.setAttribute('aria-label', 'Role for ' + user.username);
        ['user', 'manager', 'admin'].forEach(role => {
          const option = document.createElement('option');
          option.value = role;
          option.textContent = role;
          option.selected = role === user.role;
          select.append(option);
        });
        select.addEventListener('change', async () => {
          select.disabled = true;
          try {
            const result = await send('/api/admin/users/' + encodeURIComponent(user.id) + '/role', 'PATCH', { role: select.value });
            showMessage('Updated ' + result.user.username + ' to ' + result.user.role + '.');
            await loadUsers();
          } catch (error) {
            showMessage(error.message, true);
            select.value = user.role;
            select.disabled = false;
          }
        });
        row.append(info, select);
        target.append(row);
      });
    } catch (error) {
      setLoading(target, error.message);
      showMessage(error.message, true);
    }
  };

  const loaders = { products: loadProducts, orders: loadOrders, users: loadUsers };
  const activateTab = async name => {
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
    panels.forEach(panel => { panel.hidden = panel.id !== 'admin-' + name; });
    if (!loaded.has(name)) {
      loaded.add(name);
      await loaders[name]?.();
    }
  };
  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  await activateTab('products');
});
