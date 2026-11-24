'use strict';
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('cart-items');
  const totalLabel = document.getElementById('cart-total');
  if (!container || !totalLabel) return;

  const request = async (url, options = {}) => {
    const response = await fetch(url, { credentials:'same-origin', ...options });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { location.href = 'login.html'; return null; }
    if (!response.ok) throw new Error(data.error || '请求失败，请稍后重试。');
    return data;
  };

  const load = async () => {
    container.setAttribute('aria-busy', 'true');
    const data = await request('/api/cart');
    if (!data) return;
    container.replaceChildren();
    if (!data.lines.length) {
      const empty = document.createElement('div');
      empty.className = 'cart-empty';
      const title = document.createElement('h2');
      title.textContent = '鱼篓尚空';
      const note = document.createElement('p');
      note.textContent = '去水族雅集寻一件与你有缘的藏品吧。';
      const link = document.createElement('a');
      link.href = 'fish-shop.html';
      link.textContent = '浏览水族雅集 ↗';
      empty.append(title, note, link);
      container.append(empty);
    }
    data.lines.forEach(item => {
      const row = document.createElement('article');
      row.className = 'cart-item';
      const visual = document.createElement('a');
      visual.className = 'cart-item-image';
      visual.href = 'product.html?id=' + encodeURIComponent(item.productId);
      const image = document.createElement('img');
      image.src = item.image || 'images/products/aquarium-card.svg';
      image.alt = item.name;
      image.loading = 'lazy';
      image.addEventListener('error', () => { image.src = 'images/products/aquarium-card.svg'; }, { once:true });
      visual.append(image);

      const info = document.createElement('div');
      info.className = 'cart-item-info';
      const name = document.createElement('h3');
      const nameLink = document.createElement('a');
      nameLink.href = visual.href;
      nameLink.textContent = item.name;
      name.append(nameLink);
      const price = document.createElement('p');
      price.textContent = 'RM ' + Number(item.unitPrice).toFixed(2) + ' × ' + item.quantity + ' = RM ' + Number(item.lineTotal).toFixed(2);
      info.append(name, price);

      const controls = document.createElement('div');
      controls.className = 'cart-controls';
      const quantityLabel = document.createElement('label');
      quantityLabel.textContent = '数量';
      const quantity = document.createElement('input');
      quantity.type = 'number';
      quantity.min = '1';
      quantity.max = '99';
      quantity.value = item.quantity;
      quantity.setAttribute('aria-label', item.name + ' 数量');
      const update = document.createElement('button');
      update.type = 'button';
      update.className = 'cart-update';
      update.textContent = '更新';
      update.addEventListener('click', async () => {
        const amount = Number(quantity.value);
        if (!Number.isInteger(amount) || amount < 1 || amount > 99) { showMessage(row, '数量必须为 1 至 99。'); return; }
        update.disabled = true;
        try { await request('/api/cart/items/' + encodeURIComponent(item.productId), { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ quantity:amount }) }); await load(); }
        catch (error) { showMessage(row, error.message); update.disabled = false; }
      });
      quantityLabel.append(quantity);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cart-remove';
      remove.textContent = '移除';
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try { await request('/api/cart/items/' + encodeURIComponent(item.productId), { method:'DELETE' }); await load(); }
        catch (error) { showMessage(row, error.message); remove.disabled = false; }
      });
      controls.append(quantityLabel, update, remove);
      row.append(visual, info, controls);
      container.append(row);
    });
    totalLabel.textContent = 'RM ' + Number(data.total).toFixed(2);
    container.setAttribute('aria-busy', 'false');
  };

  function showMessage(row, message) {
    let note = row.querySelector('.cart-item-error');
    if (!note) { note = document.createElement('p'); note.className = 'cart-item-error'; row.append(note); }
    note.textContent = message;
  }

  try { await load(); }
  catch (error) { container.textContent = error.message; container.setAttribute('aria-busy', 'false'); }
});
