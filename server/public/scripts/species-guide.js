'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('species-grid');
  if (!grid) return;
  const cards = [...grid.querySelectorAll('.species-card')];
  const search = document.getElementById('species-search');
  const count = document.getElementById('species-result-count');
  let filter = 'all';
  const render = () => {
    const query = (search.value || '').trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const matchesWater = filter === 'all' || card.dataset.water === filter;
      const matchesQuery = card.textContent.toLocaleLowerCase().includes(query);
      const show = matchesWater && matchesQuery;
      card.hidden = !show;
      if (show) visible += 1;
    });
    count.textContent = visible + ' 个物种';
  };
  search.addEventListener('input', render);
  document.querySelectorAll('[data-species-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.speciesFilter;
    document.querySelectorAll('[data-species-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    render();
  }));
  render();
});
