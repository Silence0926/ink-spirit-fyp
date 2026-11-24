'use strict';
document.addEventListener('DOMContentLoaded',async()=>{
 const grid=document.getElementById('species-grid');if(!grid)return;
 const search=document.getElementById('species-search'),count=document.getElementById('species-result-count');let species=[],filter='all',kind='all';
 const render=()=>{
  const query=(search.value||'').trim().toLocaleLowerCase();
  const visible=species.filter(item=>(filter==='all'||item.waterType===filter)&&(kind==='all'||item.organismType===kind)&&[item.commonName,item.scientificName,item.range,item.habitat,item.care,item.origin].join(' ').toLocaleLowerCase().includes(query));
  grid.replaceChildren();
  visible.forEach((item,index)=>{
   const card=document.createElement('article');card.className='species-card';card.dataset.speciesId=item.id;card.dataset.water=item.waterType;
   const image=document.createElement('img');image.src=item.image;image.alt=item.commonName+' 水墨插画';image.loading='lazy';
   const copy=document.createElement('div');copy.className='species-card-copy';
   const kicker=document.createElement('p');kicker.className='species-index';kicker.textContent=String(index+1).padStart(3,'0')+' · '+(item.organismType==='auxiliary'?'AUXILIARY · '+(item.waterType==='marine'?'MARINE':'FRESHWATER'):(item.waterType==='marine'?'MARINE':'FRESHWATER'));
   const title=document.createElement('h2');title.textContent=item.commonName;const latin=document.createElement('i');latin.textContent=item.scientificName;title.append(latin);
   const description=document.createElement('p');description.textContent=item.range+' '+item.origin;
   const dl=document.createElement('dl');
   [['水域',item.waterType==='marine'?'海水':'淡水'],['栖息环境',item.habitat],['照护重点',item.care],['生态与来源提醒',item.conservation]].forEach(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);dl.append(row);});
   const kindLabel=document.createElement('span');kindLabel.className='species-kind-label';kindLabel.textContent=item.organismType==='auxiliary'?'辅助生物 · AQUATIC INVERTEBRATE':'观赏鱼 · ORNAMENTAL FISH';
   const map=document.createElement('a');map.className='species-map-link';map.href='map.html?species='+encodeURIComponent(item.id);map.textContent='在地图中查看生境 ↗';
   const simulator=document.createElement('a');simulator.className='species-simulator-link';simulator.href='virtual-aquarium.html';simulator.textContent='在模拟水族箱中养殖 ↗';
   const shop=document.createElement('a');shop.className='species-shop-link';shop.href='fish-shop.html?species='+encodeURIComponent(item.id);shop.textContent='查看相关藏品 ↗';
   const sources=document.createElement('div');sources.className='species-sources';const sourceTitle=document.createElement('strong');sourceTitle.textContent='资料来源 / REFERENCES';sources.append(sourceTitle);(item.sources||[]).forEach(url=>{const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=new URL(url).hostname; sources.append(link);});
   copy.append(kindLabel,kicker,title,description,dl,map,shop,simulator,sources);card.append(image,copy);grid.append(card);
  });
  count.textContent=visible.length+' 个水族生物';
  if(!visible.length){const empty=document.createElement('p');empty.className='species-empty';empty.textContent='没有找到符合条件的物种。';grid.append(empty);}
 };
 try{const response=await fetch('/api/species');if(!response.ok)throw new Error('物种资料暂不可用。');species=await response.json();render();}
 catch(error){grid.textContent=error.message;count.textContent='资料暂不可用';}
 search.addEventListener('input',render);
 document.querySelectorAll('[data-species-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.speciesFilter;document.querySelectorAll('[data-species-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});render();}));
 document.querySelectorAll('[data-organism-filter]').forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.organismFilter;document.querySelectorAll('[data-organism-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});render();}));
});
