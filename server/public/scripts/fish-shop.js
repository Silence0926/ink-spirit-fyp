'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const searchInput = document.getElementById('product-search');
  const sortSelect = document.getElementById('product-sort');
  const filters = document.getElementById('category-filters');
  const count = document.getElementById('catalog-count');
  const waterFilter = document.getElementById('water-filter');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const inStockFilter = document.getElementById('in-stock-filter');
  const clearFilters = document.getElementById('clear-filters');
  let products = [];
  let activeCategory = 'all';
  const activeSpecies = new URLSearchParams(location.search).get('species') || '';
  const legacySpeciesProducts = { koi:['koi-001'], betta:['betta-001'], goldfish:['goldfish-001'], guppy:['guppy-001'], clown:['clownfish-001'] };

  const categoryNames = {
    'Ornamental Fish':'淡水观赏鱼',
    'Marine Fish':'海水鱼',
    'Aquarium':'鱼缸与造景',
    'Equipment':'设备与检测',
    'Food':'鱼粮与营养',
    'Aquatic Plants':'水草','Aquatic Invertebrates':'水族无脊椎生物'
  };

  function render() {
    const query = (searchInput?.value || '').trim().toLocaleLowerCase();
    const sort = sortSelect?.value || 'featured';
    let visible = products.filter(product => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSpecies = !activeSpecies || product.speciesId === activeSpecies || (!product.speciesId && (legacySpeciesProducts[activeSpecies] || []).includes(product.id));
      const specs = product.specifications || {};
      const matchesWater = !waterFilter || waterFilter.value === 'all' || specs.waterType === waterFilter.value;
      const matchesDifficulty = !difficultyFilter || difficultyFilter.value === 'all' || specs.difficulty === difficultyFilter.value;
      const matchesStock = !inStockFilter?.checked || Number(product.stock) > 0;
      const haystack = [product.name, product.category, product.description, product.speciesId || '', categoryNames[product.category] || '',
        specs.waterType, specs.difficulty, specs.careNotes, specs.minTankLitres, specs.temperatureMinC, specs.temperatureMaxC]
        .filter(value=>value!==undefined&&value!==null).join(' ').toLocaleLowerCase();
      return matchesCategory && matchesSpecies && matchesWater && matchesDifficulty && matchesStock && (!query || haystack.includes(query));
    });

    if (sort === 'price-asc') visible.sort((a,b) => Number(a.price)-Number(b.price));
    if (sort === 'price-desc') visible.sort((a,b) => Number(b.price)-Number(a.price));
    if (sort === 'name') visible.sort((a,b) => a.name.localeCompare(b.name));

    count.textContent = '共收录 ' + visible.length + ' 件藏品';
    grid.replaceChildren();
    grid.setAttribute('aria-busy', 'false');

    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'catalog-empty';
      empty.innerHTML = '<span>空</span><h3>此卷暂未寻得藏品</h3><p>' + (activeSpecies && Object.prototype.hasOwnProperty.call(legacySpeciesProducts, activeSpecies) || ['koi','betta','goldfish','guppy','clown','arowana','blue-tang','seahorse','cherry-shrimp','nerite-snail','cleaner-shrimp','blue-leg-hermit'].includes(activeSpecies) ? '目前没有与此物种直接对应的在售商品。可浏览全部藏品，或先阅读生态照护资料。' : '试试其他关键词，或切换商品类别。') + '</p>';
      grid.appendChild(empty);
      return;
    }

    visible.forEach((product, index) => {
      const card = document.createElement('article');
      card.className = 'ink-product-card';
      card.dataset.productId = product.id;

      const imageWrap = document.createElement('div');
      imageWrap.className = 'product-image-wrap';
      const image = document.createElement('img');
      image.className = 'product-image';
      image.src = product.image || 'images/products/aquarium-card.svg';
      image.alt = product.name + ' · 水族商品插画';
      image.loading = index < 4 ? 'eager' : 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        image.src = 'images/products/aquarium-card.svg';
        image.alt = '水族商品通用插画';
      }, { once:true });
      const seal = document.createElement('span');
      seal.className = 'product-seal';
      seal.textContent = String(index + 1).padStart(2, '0');
      imageWrap.append(image, seal);

      const meta = document.createElement('div');
      meta.className = 'product-meta';
      const category = document.createElement('span');
      category.className = 'product-category';
      category.textContent = categoryNames[product.category] || product.category;
      const stock = document.createElement('span');
      stock.className = product.stock > 0 ? 'stock-state' : 'stock-state unavailable';
      stock.textContent = product.stock > 0 ? '现货 · ' + product.stock : '暂时售罄';
      meta.append(category, stock);
      const specs = product.specifications || {};
      if (specs.waterType || specs.difficulty) {
        const attributes = document.createElement('div');attributes.className='product-spec-tags';
        const waterNames={freshwater:'淡水',marine:'海水',brackish:'汽水',any:'通用'};
        const difficultyNames={beginner:'入门饲养',intermediate:'中等难度',advanced:'进阶饲养'};
        if(specs.waterType){const tag=document.createElement('span');tag.textContent=waterNames[specs.waterType]||specs.waterType;attributes.append(tag);}
        if(specs.difficulty){const tag=document.createElement('span');tag.textContent=difficultyNames[specs.difficulty]||specs.difficulty;attributes.append(tag);}
        card.append(attributes);
      }

      const title = document.createElement('h3');
      const titleLink = document.createElement('a');
      titleLink.href = 'product.html?id=' + encodeURIComponent(product.id);
      titleLink.textContent = product.name;
      titleLink.className = 'product-detail-link';
      title.appendChild(titleLink);
      const description = document.createElement('p');
      description.className = 'product-description';
      description.textContent = product.description;
      const detailLink = document.createElement('a');
      detailLink.href = 'product.html?id=' + encodeURIComponent(product.id);
      detailLink.className = 'product-more-link';
      detailLink.textContent = '阅览藏品详情 ↗';
      const footer = document.createElement('div');
      footer.className = 'product-card-footer';
      const price = document.createElement('strong');
      price.className = 'product-price';
      price.textContent = 'RM ' + Number(product.price).toFixed(2);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'add-to-cart';
      button.textContent = product.stock > 0 ? '加入鱼篓 +' : '暂不可购';
      button.disabled = product.stock < 1;
      button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = '正在放入…';
        try {
          const response = await fetch('/api/cart/items', {
            method:'POST',
            credentials:'same-origin',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({productId:product.id, quantity:1})
          });
          const data = await response.json();
          if (response.status === 401) {
            location.href = 'login.html';
            return;
          }
          if (!response.ok) throw new Error(data.error || '暂时无法加入鱼篓。');
          button.textContent = '已入鱼篓 ✓';
          window.setTimeout(() => {
            button.textContent = '加入鱼篓 +';
            button.disabled = product.stock < 1;
          }, 1300);
        } catch (error) {
          button.textContent = '加入鱼篓 +';
          button.disabled = product.stock < 1;
          const notice = document.createElement('p');
          notice.className = 'cart-feedback';
          notice.textContent = error.message;
          footer.appendChild(notice);
        }
      });
      footer.append(price, button, detailLink);
      card.append(imageWrap, meta, title, description, footer);
      grid.appendChild(card);
    });
  }

  filters?.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    filters.querySelectorAll('.filter-chip').forEach(chip => {
      const selected = chip === button;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });
    render();
  });
  searchInput?.addEventListener('input', render);
  sortSelect?.addEventListener('change', render);
  waterFilter?.addEventListener('change',render);
  difficultyFilter?.addEventListener('change',render);
  inStockFilter?.addEventListener('change',render);
  clearFilters?.addEventListener('click',()=>{
    if(searchInput)searchInput.value='';
    if(sortSelect)sortSelect.value='featured';
    if(waterFilter)waterFilter.value='all';
    if(difficultyFilter)difficultyFilter.value='all';
    if(inStockFilter)inStockFilter.checked=false;
    activeCategory='all';
    filters?.querySelectorAll('.filter-chip').forEach(chip=>{const selected=chip.dataset.category==='all';chip.classList.toggle('active',selected);chip.setAttribute('aria-pressed',String(selected));});
    render();
  });

  try {
    const response = await fetch('/api/products', { credentials:'same-origin' });
    if (!response.ok) throw new Error('无法读取商品目录，请稍后重试。');
    const data = await response.json();
    products = Array.isArray(data) ? data.filter(product => product.active !== false) : [];
    render();
  } catch (error) {
    grid.setAttribute('aria-busy', 'false');
    grid.replaceChildren();
    const message = document.createElement('p');
    message.className = 'catalog-error';
    message.textContent = error.message;
    grid.appendChild(message);
    count.textContent = '目录暂不可用';
  }
});
