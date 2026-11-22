'use strict';

document.addEventListener('DOMContentLoaded',()=>{
 const mapEl=document.getElementById('ecology-map'),list=document.getElementById('species-list');if(!mapEl||!window.L)return;
 const species=[
  {id:'betta',name:'暹罗斗鱼 / Betta splendens',range:'Mekong basin: Thailand, Cambodia, eastern Laos and Vietnam',habitat:'Shallow, slow-moving or standing freshwater: floodplains, marshes, canals and rice paddies.',lat:15.2,lng:102.3,color:'#9b5548',note:'Wild range summary; captive ornamental strains are widely traded.'},
  {id:'clown',name:'眼斑海葵鱼 / Amphiprion ocellaris',range:'Indo-West Pacific, including Malaysia, Thailand, Indonesia, Philippines and nearby reefs',habitat:'Marine coral reefs; associated with host sea anemones.',lat:5.5,lng:119.5,color:'#d17b42',note:'Marine species. Do not mix its salinity requirements with freshwater fish.'},
  {id:'goldfish',name:'金鱼 / Carassius auratus',range:'East Asia; domesticated in China from crucian carp',habitat:'Freshwater ponds, lakes and slow-flowing waters; modern ornamental strains are domesticated.',lat:31.2,lng:112.5,color:'#bd8a3f',note:'Domestication origin is not the same as the full wild range of the ancestral species.'},
  {id:'koi',name:'锦鲤 / Nishikigoi (Cyprinus carpio)',range:'Common carp has a broad Eurasian native range; ornamental koi varieties were selectively developed in Japan',habitat:'Freshwater ponds, backwaters, reservoirs and vegetated lakes.',lat:37.1,lng:138.9,color:'#a94f43',note:'The marker highlights Japanese ornamental selection history, not the full native range of common carp.'}
 ];
 const map=L.map(mapEl,{scrollWheelZoom:false}).setView([20,112],3);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:10,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
 const markers={};
 species.forEach(s=>{const marker=L.circleMarker([s.lat,s.lng],{radius:10,color:s.color,weight:2,fillColor:s.color,fillOpacity:.75}).addTo(map);marker.bindPopup('<strong>'+s.name+'</strong><br>'+s.range+'<br><em>'+s.habitat+'</em>');markers[s.id]=marker;});
 const select=id=>{const s=species.find(item=>item.id===id);if(!s)return;document.querySelectorAll('.species-entry').forEach(el=>el.classList.toggle('active',el.dataset.id===id));map.flyTo([s.lat,s.lng],5,{duration:.8});markers[id].openPopup();};
 species.forEach(s=>{const button=document.createElement('button');button.type='button';button.className='species-entry';button.dataset.id=s.id;const name=document.createElement('strong');name.textContent=s.name;const range=document.createElement('small');range.textContent=s.range;const habitat=document.createElement('small');habitat.textContent=s.habitat;button.append(name,range,habitat);button.addEventListener('click',()=>select(s.id));list.append(button);});
 select('betta');
});