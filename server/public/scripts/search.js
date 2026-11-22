'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const query = (new URLSearchParams(location.search).get('q') || '').trim().toLowerCase();
  const queryLabel = document.getElementById('search-query');
  const results = document.getElementById('search-results');
  if (queryLabel) queryLabel.textContent = query || '—';
  if (!results) return;

  const routes = { home:'index.html', map:'map.html', shop:'fish-shop.html', fish:'fish-list.html', cart:'cart.html', order:'orders.html', game:'game.html' };
  if (routes[query]) { location.replace(routes[query]); return; }

  const items = [
    {name:'Clownfish',description:'Marine ornamental fish from the Indo-Pacific.',page:'fish-list.html'},
    {name:'Betta',description:'Freshwater fish native to Southeast Asia.',page:'fish-list.html'},
    {name:'Goldfish',description:'A domesticated ornamental carp from China.',page:'fish-list.html'},
    {name:'Fish Tank',description:'Aquarium tank for home aquatic setups.',page:'fish-shop.html'},
    {name:'Fish Food',description:'Daily nutrition for ornamental fish.',page:'fish-shop.html'},
    {name:'Fishing Rod',description:'Fishing accessory.',page:'fish-shop.html'}
  ];
  const matches = items.filter(item => (item.name+' '+item.description).toLowerCase().includes(query));
  if (!query || !matches.length) {
    const empty = document.createElement('p');
    empty.textContent = query ? 'No matching results found.' : 'Enter a keyword in the navigation search box.';
    results.appendChild(empty);
    return;
  }
  matches.forEach(item => {
    const card = document.createElement('article');
    card.className = 'product-card';
    const title = document.createElement('h2');
    title.textContent = item.name;
    const description = document.createElement('p');
    description.textContent = item.description;
    const link = document.createElement('a');
    link.href = item.page;
    link.textContent = 'View details';
    card.append(title, description, link);
    results.appendChild(card);
  });
});
