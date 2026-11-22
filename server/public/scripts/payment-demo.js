'use strict';

document.addEventListener('DOMContentLoaded', () => {
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch {}
  const items = document.getElementById('payment-items');
  const totalLabel = document.getElementById('payment-total');
  const status = document.getElementById('payment-status');
  let total = 0;
  cart.forEach(item => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.price) || 0);
    total += quantity * price;
    const row = document.createElement('p');
    row.textContent = (item.name || 'Item') + ' × ' + quantity + ' — RM ' + (quantity * price).toFixed(2);
    items?.appendChild(row);
  });
  if (totalLabel) totalLabel.textContent = 'RM ' + total.toFixed(2);
  document.getElementById('demo-pay-btn')?.addEventListener('click', () => {
    if (!cart.length) {
      if (status) status.textContent = 'Your cart is empty.';
      return;
    }
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem('orders') || '[]'); } catch {}
    orders.push({ date: new Date().toLocaleString(), items: cart, total: total.toFixed(2), type: 'demo-only' });
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.removeItem('cart');
    if (status) status.textContent = 'Demo order saved locally. No payment was processed.';
    document.getElementById('demo-pay-btn').disabled = true;
  });
});
