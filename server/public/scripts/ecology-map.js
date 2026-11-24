'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const mapEl=document.getElementById('ecology-map'),list=document.getElementById('species-list');
 if(!mapEl||!list||!window.L){if(mapEl)mapEl.textContent='地图组件暂时无法载入。请检查网络连接后重试。';return;}
 const species=[
 {id:'betta',name:'暹罗斗鱼',latin:'Betta splendens',type:'freshwater',range:'湄公河流域，包括泰国、柬埔寨、老挝与越南部分地区。',habitat:'浅水、缓流或静水环境，例如洪泛平原、沼泽、运河与稻田。',lat:15.2,lng:102.3,origin:'原生淡水鱼；现代观赏品系经过长期人工选育。',care:'偏好温暖、低流速且有遮蔽物的淡水环境。'},
 {id:'guppy',name:'孔雀鱼',latin:'Poecilia reticulata',type:'freshwater',range:'原生于委内瑞拉、圭亚那、特立尼达及加勒比海邻近地区。',habitat:'溪流、池塘、沟渠与植被丰富的浅水环境。',lat:9.8,lng:-61.2,origin:'原生分布在热带南美洲及邻近岛屿；已被引入许多地区。',care:'热带淡水鱼；不同品系对水质与温度的适应能力有差异。'},
 {id:'arowana',name:'亚洲龙鱼',latin:'Scleropages formosus',type:'freshwater',range:'东南亚部分流域，包括马来半岛、苏门答腊与婆罗洲等地。',habitat:'森林溪流、黑水河与植被覆盖的低地水域。',lat:2.4,lng:112.8,origin:'原生区域性分布；受国际贸易与保育法规严格管理。',care:'大型鱼类；饲养需大型水体与合法来源证明。'},
 {id:'goldfish',name:'金鱼',latin:'Carassius auratus',type:'freshwater',range:'鲫属鱼类的自然祖先分布于东亚；金鱼在中国长期人工驯化。',habitat:'淡水池塘、湖泊与缓流水域；观赏品系属于人工选育类型。',lat:31.2,lng:112.5,origin:'中国驯化历史；人工品系并不等于野生形态。',care:'高排泄负荷鱼类，需要充足水量、过滤与稳定水质。'},
 {id:'koi',name:'锦鲤',latin:'Nishikigoi · Cyprinus carpio',type:'freshwater',range:'鲤鱼具有广泛的欧亚自然分布；锦鲤观赏品系主要在日本发展。',habitat:'淡水池塘、湖泊、河流回水区与植被丰富的水域。',lat:37.1,lng:138.9,origin:'日本人工选育历史；地图点不代表鲤鱼完整原生分布。',care:'适合池塘系统；需强过滤、充足溶氧与季节性管理。'},
 {id:'clown',name:'眼斑海葵鱼',latin:'Amphiprion ocellaris',type:'marine',range:'印度洋—西太平洋热带海域，包括东南亚与马来群岛周边。',habitat:'珊瑚礁，与特定海葵形成共生关系。',lat:5.5,lng:119.5,origin:'海水鱼；自然分布与人工繁殖贸易来源需区分。',care:'需要成熟海水系统、稳定盐度与合适水质。'},
 {id:'blue-tang',name:'蓝吊',latin:'Paracanthurus hepatus',type:'marine',range:'印度洋与太平洋热带珊瑚礁海域。',habitat:'外礁坡、珊瑚礁与清澈热带海域。',lat:-3.5,lng:130.5,origin:'海水礁区鱼类；成鱼活动空间需求较大。',care:'需要大型成熟海水缸与稳定水质，不适合小型新手鱼缸。'},
 {id:'seahorse',name:'膨腹海马',latin:'Hippocampus abdominalis',type:'marine',range:'澳大利亚南部与新西兰周边温带海域。',habitat:'海草床、海藻区、岩礁与近岸海域。',lat:-38.5,lng:146.5,origin:'温带海马；此处标记为区域参考，不代表全部分布边界。',care:'对水流、食物与同缸竞争敏感，需专业饲养知识。'}
 ];
 const map=L.map(mapEl,{scrollWheelZoom:false,minZoom:2}).setView([12,112],2.7);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:10,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
 const layer=L.layerGroup().addTo(map),markers=new Map(),buttons=new Map();let activeFilter='all';
 const makePopup=s=>{const box=document.createElement('div');const strong=document.createElement('strong');strong.textContent=s.name+' / '+s.latin;const type=document.createElement('p');type.textContent=s.type==='marine'?'海水 / Marine':'淡水 / Freshwater';const range=document.createElement('p');range.textContent=s.range;const habitat=document.createElement('em');habitat.textContent=s.habitat;box.append(strong,type,range,habitat);return box;};
 species.forEach(s=>{const color=s.type==='marine'?'#367c8a':'#a64e3e';const marker=L.circleMarker([s.lat,s.lng],{radius:8,color,weight:2,fillColor:color,fillOpacity:.78}).bindPopup(makePopup(s));markers.set(s.id,marker);});
 function select(id){const s=species.find(x=>x.id===id);if(!s)return;buttons.forEach((b,key)=>{b.classList.toggle('active',key===id);b.setAttribute('aria-pressed',String(key===id));});map.flyTo([s.lat,s.lng],4,{duration:.6});markers.get(id).openPopup();}
 function render(){layer.clearLayers();list.replaceChildren();let visible=species.filter(s=>activeFilter==='all'||s.type===activeFilter);visible.forEach(s=>{const marker=markers.get(s.id);marker.addTo(layer);const button=document.createElement('button');button.type='button';button.className='species-entry';button.dataset.id=s.id;button.setAttribute('aria-pressed','false');const head=document.createElement('span');head.className='species-entry-head';const name=document.createElement('strong');name.textContent=s.name;const kind=document.createElement('i');kind.className=s.type==='marine'?'type-marine':'type-fresh';kind.textContent=s.type==='marine'?'海水':'淡水';head.append(name,kind);const latin=document.createElement('em');latin.textContent=s.latin;const range=document.createElement('small');range.textContent=s.range;const details=document.createElement('small');details.textContent=s.origin;button.append(head,latin,range,details);button.addEventListener('click',()=>select(s.id));list.append(button);buttons.set(s.id,button);});document.getElementById('species-count').textContent=visible.length+' SPECIES';if(visible.length)select(visible[0].id);}
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===button));render();}));
 render();
 const requestedSpecies = new URLSearchParams(window.location.search).get('species');
 if (requestedSpecies && markers.has(requestedSpecies) && buttons.has(requestedSpecies)) {
   window.setTimeout(() => select(requestedSpecies), 120);
 }
});