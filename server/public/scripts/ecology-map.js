'use strict';
document.addEventListener('DOMContentLoaded',async()=>{
 const mapEl=document.getElementById('ecology-map'),list=document.getElementById('species-list');
 if(!mapEl||!list)return;
 if(!window.L){mapEl.textContent='地图组件暂时无法载入。请检查网络连接后重试。';return;}
 try{
  const response=await fetch('/api/species');
  if(!response.ok)throw new Error('无法读取物种资料。');
  const species=await response.json();
  const map=L.map(mapEl,{scrollWheelZoom:false,minZoom:2}).setView([12,112],2.7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:10,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  const layer=L.layerGroup().addTo(map),markers=new Map(),buttons=new Map();let activeFilter='all';
  const makePopup=s=>{const box=document.createElement('div');const strong=document.createElement('strong');strong.textContent=s.commonName+' / '+s.scientificName;const type=document.createElement('p');type.textContent=s.waterType==='marine'?'海水 / Marine':'淡水 / Freshwater';const range=document.createElement('p');range.textContent=s.range;const habitat=document.createElement('em');habitat.textContent=s.habitat;const note=document.createElement('small');note.textContent=s.distributionNote||'';box.append(strong,type,range,habitat,note);return box;};
  species.forEach(s=>{const color=s.waterType==='marine'?'#367c8a':'#a64e3e';markers.set(s.id,L.circleMarker(s.coordinates,{radius:8,color,weight:2,fillColor:color,fillOpacity:.78}).bindPopup(makePopup(s)));});
  function select(id){const s=species.find(x=>x.id===id);if(!s)return;buttons.forEach((b,key)=>{b.classList.toggle('active',key===id);b.setAttribute('aria-pressed',String(key===id));});map.flyTo(s.coordinates,4,{duration:.6});markers.get(id).openPopup();}
  function render(){layer.clearLayers();list.replaceChildren();const visible=species.filter(s=>activeFilter==='all'||s.waterType===activeFilter);visible.forEach(s=>{markers.get(s.id).addTo(layer);const button=document.createElement('button');button.type='button';button.className='species-entry';button.setAttribute('aria-pressed','false');const head=document.createElement('span');head.className='species-entry-head';const name=document.createElement('strong');name.textContent=s.commonName;const kind=document.createElement('i');kind.className=s.waterType==='marine'?'type-marine':'type-fresh';kind.textContent=s.waterType==='marine'?'海水':'淡水';head.append(name,kind);const latin=document.createElement('em');latin.textContent=s.scientificName;const range=document.createElement('small');range.textContent=s.range;const details=document.createElement('small');details.textContent=s.origin;button.append(head,latin,range,details);button.addEventListener('click',()=>select(s.id));list.append(button);buttons.set(s.id,button);});document.getElementById('species-count').textContent=visible.length+' SPECIES';if(visible.length)select(visible[0].id);}
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===button));render();}));
  render();const requested=new URLSearchParams(location.search).get('species');if(requested&&markers.has(requested)&&buttons.has(requested))window.setTimeout(()=>select(requested),120);
 }catch(error){mapEl.textContent=error.message||'生态资料暂不可用。';}
});
