'use strict';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-add-to-cart]').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('[data-product]');
      if (!card) return;
      const product = {
        name: card.dataset.product,
        price: Number(card.dataset.price),
        image: card.dataset.image || '',
        quantity: 1
      };
      if (!product.name || !Number.isFinite(product.price) || product.price < 0) return;
      let cart = [];
      try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch {}
      const existing = cart.find(item => item.name === product.name);
      if (existing) existing.quantity = Math.min(99, (Number(existing.quantity) || 1) + 1);
      else cart.push(product);
      localStorage.setItem('cart', JSON.stringify(cart));
      const original = button.textContent;
      button.textContent = 'Added to Cart';
      window.setTimeout(() => { button.textContent = original; }, 900);
    });
  });
});
