'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('orders-list');
  if (!container) return;
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('orders') || '[]'); } catch {}
  if (!orders.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No demo orders have been recorded in this browser.';
    container.appendChild(empty);
    return;
  }
  orders.slice().reverse().forEach((order, index) => {
    const card = document.createElement('article');
    card.className = 'cart-item';
    const heading = document.createElement('h2');
    heading.textContent = 'Order ' + (orders.length - index);
    const date = document.createElement('p');
    date.textContent = order.date || 'Date unavailable';
    const details = document.createElement('p');
    details.textContent = (order.items || []).map(item => (item.name || 'Item') + ' × ' + (item.quantity || 1)).join(', ');
    const total = document.createElement('strong');
    total.textContent = 'RM ' + (Number(order.total) || 0).toFixed(2);
    card.append(heading, date, details, total);
    container.appendChild(card);
  });
});
