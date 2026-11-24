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

  const loadProducts = async () => {
    const target = document.getElementById('admin-product-list');
    setLoading(target);
    try {
      const products = await request('/api/admin/products');
      target.replaceChildren();
      if (!products.length) {
        setLoading(target, 'No products in the catalogue yet.');
        return;
      }
      products.forEach(product => {
        const row = document.createElement('article');
        row.className = 'admin-row';
        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = product.name + ' · RM ' + Number(product.price).toFixed(2);
        const detail = document.createElement('p');
        detail.textContent = product.category + ' · Stock ' + product.stock + ' · ' + (product.active === false ? 'Archived' : 'Active');
        info.append(title, detail);
        const actions = document.createElement('div');
        actions.className = 'admin-row-actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => editProduct(product));
        actions.append(edit);
        if (isAdmin) {
          const archive = document.createElement('button');
          archive.type = 'button';
          archive.textContent = 'Archive';
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
    } catch (error) {
      setLoading(target, error.message);
      showMessage(error.message, true);
    }
  };

  const form = document.getElementById('product-form');
  const editProduct = product => {
    form.hidden = false;
    const values = {
      'product-id': product?.id || '',
      'product-name': product?.name || '',
      'product-category': product?.category || '',
      'product-description': product?.description || '',
      'product-price': product?.price ?? '',
      'product-stock': product?.stock ?? 0,
      'product-image': product?.image || '/images/products/koi-card.svg'
    };
    Object.entries(values).forEach(([id, value]) => { document.getElementById(id).value = value; });
    document.getElementById('product-active').checked = product?.active !== false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      image: document.getElementById('product-image').value.trim(),
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
        row.className = 'admin-row';
        const info = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = order.id + ' · RM ' + Number(order.total).toFixed(2);
        const detail = document.createElement('p');
        detail.textContent = order.status + ' · ' + new Date(order.createdAt).toLocaleString();
        info.append(title, detail);
        row.append(info);
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
