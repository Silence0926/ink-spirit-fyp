'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cart-items');
  const totalLabel = document.getElementById('cart-total');
  if (!container || !totalLabel) return;
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch {}

  const save = () => localStorage.setItem('cart', JSON.stringify(cart));
  const render = () => {
    container.replaceChildren();
    let total = 0;
    cart.forEach((item, index) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = Math.max(0, Number(item.price) || 0);
      const subtotal = quantity * price;
      total += subtotal;
      const row = document.createElement('article');
      row.className = 'cart-item';
      const name = document.createElement('h3');
      name.textContent = item.name || 'Unnamed product';
      const detail = document.createElement('p');
      detail.textContent = 'RM ' + price.toFixed(2) + ' × ' + quantity + ' = RM ' + subtotal.toFixed(2);
      const controls = document.createElement('div');
      controls.className = 'cart-controls';
      [['−', -1], ['+', 1], ['Remove', 0]].forEach(([label, delta]) => {
        const control = document.createElement('button');
        control.type = 'button';
        control.textContent = label;
        control.addEventListener('click', () => {
          if (delta === 0) cart.splice(index, 1);
          else cart[index].quantity = Math.max(1, quantity + delta);
          save();
          render();
        });
        controls.appendChild(control);
      });
      row.append(name, detail, controls);
      container.appendChild(row);
    });
    totalLabel.textContent = 'RM ' + total.toFixed(2);
    if (!cart.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Your cart is empty.';
      container.appendChild(empty);
    }
  };
  render();
});
