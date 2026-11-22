'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('checkout-items');
  const total = document.getElementById('checkout-total');
  const notice = document.getElementById('checkout-notice');
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch {}
  let sum = 0;
  cart.forEach(item => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.price) || 0);
    sum += quantity * price;
    const line = document.createElement('p');
    line.textContent = (item.name || 'Product') + ' × ' + quantity + ' — RM ' + (quantity * price).toFixed(2);
    list?.appendChild(line);
  });
  if (!cart.length && list) list.textContent = 'Your cart is empty.';
  if (total) total.textContent = 'RM ' + sum.toFixed(2);
  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (!cart.length) {
      if (notice) notice.textContent = 'Add products to your cart before checkout.';
      return;
    }
    if (notice) notice.textContent = 'Demo only: no payment has been collected and no order has been placed.';
  });
});
