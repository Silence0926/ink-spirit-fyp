'use strict';
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('product-detail');
  const breadcrumb = document.getElementById('breadcrumb-name');
  if (!root) return;
  const productId = new URLSearchParams(location.search).get('id');
  const categoryNames = {'Ornamental Fish':'淡水观赏鱼','Marine Fish':'海水鱼','Aquarium':'鱼缸与造景','Equipment':'设备与检测','Food':'鱼粮与营养','Aquatic Plants':'水草'};
  const species = {
    'koi-001':{name:'锦鲤',latin:'Cyprinus carpio',water:'淡水池塘',care:'锦鲤是鲤鱼的观赏选育品系。饲养应以池塘或大型水体为基础，提供强过滤、充足溶氧和稳定水质。购买前确认鱼只健康、来源可信，并预先完成隔离检疫。',map:'koi'},
    'betta-001':{name:'暹罗斗鱼',latin:'Betta splendens',water:'东南亚浅水与缓流水域',care:'斗鱼原生于东南亚浅水环境。提供加盖、温度稳定、低水流且有遮蔽物的成熟水族箱；迷宫器官并不意味着可以长期生活在脏水或无维护容器中。',map:'betta'},
    'goldfish-001':{name:'金鱼',latin:'Carassius auratus',water:'东亚淡水池塘与缓流水域',care:'金鱼由东亚鲫属鱼类长期人工选育而来，排泄负荷较高。请准备足够水量、成熟过滤和规律水质检测，避免将其长期饲养于狭小圆缸。',map:'goldfish'},
    'guppy-001':{name:'孔雀鱼',latin:'Poecilia reticulata',water:'南美洲北部淡水溪流',care:'孔雀鱼为胎生鱼类，繁殖速度较快。建议预先规划性别比例、幼鱼安置和种群数量，并维持稳定水质；防止弃养或放生造成非原生扩散。',map:'guppy'},
    'clownfish-001':{name:'公子小丑鱼',latin:'Amphiprion ocellaris',water:'印度洋—西太平洋珊瑚礁',care:'小丑鱼需要成熟海水系统、稳定盐度和完善过滤。此商品描述标注为人工繁殖来源，但实际采购时仍应向供应方核验来源记录和健康状态。',map:'clown'}
  };
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
    const product = Array.isArray(products) ? products.find(item=>item.id===productId && item.active!==false) : null;
    if (!product) { showError('这件藏品不存在、已下架或暂不可查看。'); return; }
    breadcrumb.textContent=product.name;
    root.className='detail-layout';root.replaceChildren();root.setAttribute('aria-busy','false');
    const visual=document.createElement('div');visual.className='detail-visual';
    const image=document.createElement('img');image.src=product.image||'images/products/aquarium-card.svg';image.alt=product.name+' 商品图';image.loading='eager';image.addEventListener('error',()=>{image.src='images/products/aquarium-card.svg';},{once:true});visual.append(image);
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
    const matched=species[product.id];
    const care=document.createElement('section');care.className='detail-care';
    const careTitle=document.createElement('h2');careTitle.textContent=matched?'物种与照护札记':'使用与养护札记';
    const careText=document.createElement('p');careText.textContent=matched?matched.care:(careForCategory[product.category]||'请在购买前确认商品规格、适用环境及维护要求；如有疑问，请先向专业人员或供应方核实。');
    care.append(careTitle,careText);
    if(matched){const links=document.createElement('div');links.className='detail-links';const atlas=document.createElement('a');atlas.href='map.html?species='+encodeURIComponent(matched.map);atlas.textContent='在生态地图查看 '+matched.name+' ↗';const guide=document.createElement('a');guide.href='fish-list.html';guide.textContent='阅读生灵图谱 ↗';links.append(atlas,guide);care.append(links);}
    root.append(visual,copy,care);
  } catch(error){showError(error.message||'读取商品详情失败。');}
});
