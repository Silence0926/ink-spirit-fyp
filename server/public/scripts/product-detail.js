'use strict';
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('product-detail');
  const breadcrumb = document.getElementById('breadcrumb-name');
  if (!root) return;
  const productId = new URLSearchParams(location.search).get('id');
  const categoryNames = {'Ornamental Fish':'淡水观赏鱼','Marine Fish':'海水鱼','Aquarium':'鱼缸与造景','Equipment':'设备与检测','Food':'鱼粮与营养','Aquatic Plants':'水草'};
  const legacySpeciesIds = {'koi-001':'koi','betta-001':'betta','goldfish-001':'goldfish','guppy-001':'guppy','clownfish-001':'clown'};
  const careForCategory = {
    'Aquarium':'鱼缸容量应结合成年鱼体型、活动空间和过滤能力决定。新缸需要完成氮循环后再逐步放养；不要以标称容量替代实际可用水量。',
    'Equipment':'设备规格应与鱼缸实际水量、鱼类负荷和维护能力匹配。安装后检查流量、噪声、漏水与电气安全，并按制造商要求维护。',
    'Food':'选择适合物种和体型的饲料，少量投喂并观察摄食情况。避免过量喂食造成水质恶化。',
    'Aquatic Plants':'种植前确认光照、底床、营养和鱼类兼容性。新植物应检查蜗牛、藻类及农药残留风险。'
  };
  const showError = message => { root.className='detail-error'; root.replaceChildren(); const p=document.createElement('p');p.textContent=message;const a=document.createElement('a');a.className='detail-back';a.href='fish-shop.html';a.textContent='返回水族雅集';root.append(p,a);root.setAttribute('aria-busy','false'); };
  if (!productId) { showError('没有指定藏品编号。请从水族雅集选择一件商品。'); return; }
  try {
    const response = await fetch('/api/products',{credentials:'same-origin'});
    if (!response.ok) throw new Error('暂时无法读取商品资料。');
    const products = await response.json();
    const speciesResponse = await fetch('/api/species',{credentials:'same-origin'});
    if (!speciesResponse.ok) throw new Error('暂时无法读取物种图谱。');
    const speciesCatalogue = await speciesResponse.json();
    const product = Array.isArray(products) ? products.find(item=>item.id===productId && item.active!==false) : null;
    if (!product) { showError('这件藏品不存在、已下架或暂不可查看。'); return; }
    breadcrumb.textContent=product.name;
    root.className='detail-layout';root.replaceChildren();root.setAttribute('aria-busy','false');
    const visual=document.createElement('div');visual.className='detail-visual';
    const gallery=[...new Set([product.image,...(Array.isArray(product.images)?product.images:[])].filter(Boolean))].slice(0,9);
    const image=document.createElement('img');image.src=gallery[0]||'images/products/aquarium-card.svg';image.alt=product.name+' 商品图';image.loading='eager';image.addEventListener('error',()=>{image.src='images/products/aquarium-card.svg';},{once:true});visual.append(image);
    if(gallery.length>1){
      const thumbs=document.createElement('div');thumbs.className='detail-thumbnails';thumbs.setAttribute('aria-label','商品图片选择');
      gallery.forEach((src,index)=>{const thumb=document.createElement('button');thumb.type='button';thumb.className='detail-thumbnail'+(index===0?' active':'');thumb.setAttribute('aria-label','查看商品图片 '+(index+1));const preview=document.createElement('img');preview.src=src;preview.alt='';preview.loading='lazy';thumb.append(preview);thumb.addEventListener('click',()=>{image.src=src;thumbs.querySelectorAll('button').forEach(node=>node.classList.remove('active'));thumb.classList.add('active');});thumbs.append(thumb);});
      visual.append(thumbs);
    }
    const copy=document.createElement('section');copy.className='detail-copy';
    const kicker=document.createElement('p');kicker.className='detail-kicker';kicker.textContent='INK SPIRIT · COLLECTION DETAIL';
    const title=document.createElement('h1');title.textContent=product.name;
    const category=document.createElement('p');category.className='detail-category';category.textContent=categoryNames[product.category]||product.category;
    const price=document.createElement('strong');price.className='detail-price';price.textContent='RM '+Number(product.price).toFixed(2);
    const stock=document.createElement('span');stock.className='detail-stock'+(product.stock>0?'':' out');stock.textContent=product.stock>0?'现货 · '+product.stock+' 件':'暂时售罄';
    const description=document.createElement('p');description.className='detail-description';description.textContent=product.description;
    const buy=document.createElement('div');buy.className='detail-buy-row';
    const quantity=document.createElement('input');quantity.className='detail-quantity';quantity.type='number';quantity.min='1';quantity.max=String(Math.min(99,product.stock));quantity.value='1';quantity.setAttribute('aria-label','购买数量');quantity.disabled=product.stock<1;
    const add=document.createElement('button');add.className='detail-add';add.type='button';add.textContent=product.stock>0?'加入鱼篓 +':'暂不可购';add.disabled=product.stock<1;
    const feedback=document.createElement('p');feedback.className='detail-feedback';feedback.setAttribute('aria-live','polite');
    add.addEventListener('click',async()=>{
      const amount=Number(quantity.value);
      if(!Number.isInteger(amount)||amount<1||amount>99||amount>product.stock){feedback.textContent='请输入有效数量，且不可超过当前库存。';return;}
      add.disabled=true;add.textContent='正在放入…';feedback.textContent='';
      try{const result=await fetch('/api/cart/items',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:product.id,quantity:amount})});const data=await result.json();if(result.status===401){location.href='login.html';return;}if(!result.ok)throw new Error(data.error||'暂时无法加入鱼篓。');add.textContent='已入鱼篓 ✓';feedback.textContent='已将 '+amount+' 件藏品加入鱼篓。';}
      catch(error){add.textContent='加入鱼篓 +';feedback.textContent=error.message;add.disabled=false;}
      if(add.textContent==='已入鱼篓 ✓')add.disabled=false;
    });
    buy.append(quantity,add,feedback);
    copy.append(kicker,title,category,price,stock,description,buy);
    const matched=speciesCatalogue.find(item=>item.id===(product.speciesId||legacySpeciesIds[product.id]));
    const care=document.createElement('section');care.className='detail-care';
    const careTitle=document.createElement('h2');careTitle.textContent=matched?'物种与照护札记':'使用与养护札记';
    const careText=document.createElement('p');careText.textContent=matched?matched.care:(careForCategory[product.category]||'请在购买前确认商品规格、适用环境及维护要求；如有疑问，请先向专业人员或供应方核实。');
    care.append(careTitle,careText);
    const specs=product.specifications||{};
    const specEntries=[];
    const waterLabels={freshwater:'淡水',marine:'海水',brackish:'汽水',any:'通用'};
    const difficultyLabels={beginner:'入门',intermediate:'中等',advanced:'进阶'};
    if(specs.waterType)specEntries.push(['适宜水域',waterLabels[specs.waterType]||specs.waterType]);
    if(specs.difficulty)specEntries.push(['饲养难度',difficultyLabels[specs.difficulty]||specs.difficulty]);
    if(specs.minTankLitres)specEntries.push(['建议最小水体',specs.minTankLitres+' L']);
    if(specs.temperatureMinC!==null&&specs.temperatureMinC!==undefined&&specs.temperatureMaxC!==null&&specs.temperatureMaxC!==undefined)specEntries.push(['温度范围',specs.temperatureMinC+'–'+specs.temperatureMaxC+' °C']);
    if(specs.adultSizeCm)specEntries.push(['成年体长参考',specs.adultSizeCm+' cm']);
    if(specEntries.length||specs.careNotes){
      const specBox=document.createElement('div');specBox.className='detail-specifications';
      if(specEntries.length){const list=document.createElement('dl');specEntries.forEach(([label,value])=>{const group=document.createElement('div');const term=document.createElement('dt');term.textContent=label;const desc=document.createElement('dd');desc.textContent=value;group.append(term,desc);list.append(group);});specBox.append(list);}
      if(specs.careNotes){const notes=document.createElement('p');notes.textContent=specs.careNotes;specBox.append(notes);}
      care.append(specBox);
    }
    if(matched){const links=document.createElement('div');links.className='detail-links';const atlas=document.createElement('a');atlas.href='map.html?species='+encodeURIComponent(matched.id);atlas.textContent='在生态地图查看 '+matched.name+' ↗';const guide=document.createElement('a');guide.href='fish-list.html';guide.textContent='阅读生灵图谱 ↗';links.append(atlas,guide);care.append(links);}
    root.append(visual,copy,care);
    const relatedProducts=products.filter(item=>item.id!==product.id&&item.active!==false&&item.category===product.category).slice(0,4);
    if(relatedProducts.length){
      const section=document.createElement('section');section.className='detail-related';
      const heading=document.createElement('h2');heading.textContent='同卷藏品 · RELATED COLLECTION';section.append(heading);
      const grid=document.createElement('div');grid.className='detail-related-grid';
      relatedProducts.forEach(item=>{const card=document.createElement('a');card.className='detail-related-card';card.href='product.html?id='+encodeURIComponent(item.id);const thumb=document.createElement('img');thumb.src=item.image||'images/products/aquarium-card.svg';thumb.alt=item.name;thumb.loading='lazy';const name=document.createElement('strong');name.textContent=item.name;const amount=document.createElement('span');amount.textContent='RM '+Number(item.price).toFixed(2);card.append(thumb,name,amount);grid.append(card);});
      section.append(grid);root.append(section);
    }

  } catch(error){showError(error.message||'读取商品详情失败。');}
});
