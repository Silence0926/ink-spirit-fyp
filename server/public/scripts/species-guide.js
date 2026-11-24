'use strict';
document.addEventListener('DOMContentLoaded',async()=>{
 const grid=document.getElementById('species-grid');if(!grid)return;
 const search=document.getElementById('species-search'),count=document.getElementById('species-result-count');let species=[],filter='all';
 const render=()=>{
  const query=(search.value||'').trim().toLocaleLowerCase();
  const visible=species.filter(item=>(filter==='all'||item.waterType===filter)&&[item.commonName,item.scientificName,item.range,item.habitat,item.care,item.origin].join(' ').toLocaleLowerCase().includes(query));
  grid.replaceChildren();
  visible.forEach((item,index)=>{
   const card=document.createElement('article');card.className='species-card';card.dataset.speciesId=item.id;card.dataset.water=item.waterType;
   const image=document.createElement('img');image.src=item.image;image.alt=item.commonName+' 水墨插画';image.loading='lazy';
   const copy=document.createElement('div');copy.className='species-card-copy';
   const kicker=document.createElement('p');kicker.className='species-index';kicker.textContent=String(index+1).padStart(3,'0')+' · '+(item.waterType==='marine'?'MARINE':'FRESHWATER');
   const title=document.createElement('h2');title.textContent=item.commonName;const latin=document.createElement('i');latin.textContent=item.scientificName;title.append(latin);
   const description=document.createElement('p');description.textContent=item.range+' '+item.origin;
   const dl=document.createElement('dl');
   [['水域',item.waterType==='marine'?'海水':'淡水'],['栖息环境',item.habitat],['照护重点',item.care],['生态与来源提醒',item.conservation]].forEach(([label,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);dl.append(row);});
   const map=document.createElement('a');map.className='species-map-link';map.href='map.html?species='+encodeURIComponent(item.id);map.textContent='在地图中查看生境 ↗';
   const shop=document.createElement('a');shop.className='species-shop-link';shop.href='fish-shop.html?species='+encodeURIComponent(item.id);shop.textContent='查看相关藏品 ↗';
   copy.append(kicker,title,description,dl,map,shop);card.append(image,copy);grid.append(card);
  });
  count.textContent=visible.length+' 个物种';
  if(!visible.length){const empty=document.createElement('p');empty.className='species-empty';empty.textContent='没有找到符合条件的物种。';grid.append(empty);}
 };
 try{const response=await fetch('/api/species');if(!response.ok)throw new Error('物种资料暂不可用。');species=await response.json();render();}
 catch(error){grid.textContent=error.message;count.textContent='资料暂不可用';}
 search.addEventListener('input',render);
 document.querySelectorAll('[data-species-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.speciesFilter;document.querySelectorAll('[data-species-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});render();}));
});
