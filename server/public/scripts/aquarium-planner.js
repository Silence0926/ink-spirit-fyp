'use strict';
document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),speciesBox=$('planner-species'),assess=$('assess-button'),result=$('compatibility-result'),equipment=$('equipment-results');
 let species=[],products=[],volume=null,latestWaterType='';
 const dimensions=['tank-length','tank-width','tank-height'];
 const fmt=n=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:1}).format(n);
 function updateVolume(){
  const values=dimensions.map(id=>Number($(id).value));
  const valid=values.every((v,i)=>Number.isFinite(v)&&v>0&&v<=2000);
  volume=valid?values.reduce((a,b)=>a*b,1)/1000:null;
  const volumeNode=$('volume-litres');volumeNode.replaceChildren();volumeNode.append(document.createTextNode(volume===null?'— ':fmt(volume)+' '));const unit=document.createElement('small');unit.textContent='L';volumeNode.append(unit);
  $('volume-note').textContent=volume===null?'请输入有效的内部长度、宽度和实际水深。':'几何毛体积；实际水量通常更低，请以注水量或可靠测量为准。';
  renderEquipment();
 }
 dimensions.forEach(id=>$(id).addEventListener('input',updateVolume));
 function selected(){
  return [...speciesBox.querySelectorAll('[data-species-check]:checked')].map(input=>({id:input.value,quantity:Number(speciesBox.querySelector('[data-quantity="'+input.value+'"]').value)}));
 }
 function renderEquipment(){
  const waterTypes=[...new Set(selected().map(x=>species.find(s=>s.id===x.id)?.waterType).filter(Boolean))];
  if(waterTypes.length>1){equipment.textContent='所选物种跨越不同水体类型，请先拆分为独立系统。';return;}
  latestWaterType=waterTypes[0]||'';
  if(volume===null||!latestWaterType){equipment.textContent='请先输入有效鱼缸尺寸并选择物种。';return;}
  const matches=products.filter(p=>p.active!==false&&['Equipment','Aquarium'].includes(p.category)).filter(p=>{
   const s=p.specifications||{};
   return s.waterType===latestWaterType&&Number.isFinite(s.minTankLitres)&&s.minTankLitres<=volume;
  });
  equipment.replaceChildren();
  if(!matches.length){equipment.textContent='目前没有同时具备匹配水体类型与最低适用水量资料的设备商品。可先在 Admin Studio 补充商品规格。';return;}
  matches.forEach(p=>{const card=document.createElement('article');card.className='equipment-card';const title=document.createElement('strong');title.textContent=p.name;const meta=document.createElement('span');meta.textContent='最低适用水量 '+p.specifications.minTankLitres+' L · '+(latestWaterType==='marine'?'海水':'淡水');const link=document.createElement('a');link.href='product.html?id='+encodeURIComponent(p.id);link.textContent='查看商品 ↗';card.append(title,meta,link);equipment.append(card);});
 }
 function renderSpecies(){
  speciesBox.replaceChildren();
  species.forEach(item=>{
   const card=document.createElement('label');card.className='planner-species-card';
   const check=document.createElement('input');check.type='checkbox';check.value=item.id;check.dataset.speciesCheck='true';
   const copy=document.createElement('span');copy.className='planner-species-copy';const name=document.createElement('strong');name.textContent=item.commonName;const latin=document.createElement('small');latin.textContent=item.scientificName;const care=document.createElement('span');care.textContent=item.care;copy.append(name,latin,care);
   const quantity=document.createElement('input');quantity.type='number';quantity.min='1';quantity.max='30';quantity.value='1';quantity.dataset.quantity=item.id;quantity.setAttribute('aria-label',item.commonName+'数量');
   card.append(check,copy,quantity);speciesBox.append(card);
  });
  speciesBox.addEventListener('change',()=>{assess.disabled=selected().length===0;renderEquipment();});
  speciesBox.addEventListener('input',event=>{if(event.target.matches('[data-quantity]'))renderEquipment();});
 }
 assess.addEventListener('click',async()=>{
  const entries=selected();if(!entries.length)return;
  if(entries.some(x=>!Number.isInteger(x.quantity)||x.quantity<1||x.quantity>30)){result.textContent='每个物种数量必须为 1 至 30。';return;}
  assess.disabled=true;result.textContent='正在评估…';
  try{
   const response=await fetch('/api/aquarium/compatibility',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({species:entries})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'评估失败。');
   result.replaceChildren();const status=document.createElement('strong');status.className='assessment-status '+data.status;
   status.textContent=data.status==='incompatible'?'发现水体类型冲突':data.status==='caution'?'需要特别谨慎':data.status==='single_species'?'单一物种基础检查完成':'资料不足，不能确认兼容';
   result.append(status);
   data.issues.forEach(issue=>{const p=document.createElement('p');p.textContent=(issue.severity==='incompatible'?'冲突：':'注意：')+issue.message;result.append(p);});
   data.notes.forEach(note=>{const p=document.createElement('p');p.className='assessment-note';p.textContent=note;result.append(p);});
   const selectedList=document.createElement('p');selectedList.className='assessment-selected';selectedList.textContent='已选：'+data.selected.map(x=>x.commonName+' × '+x.quantity).join('、');result.append(selectedList);
   renderEquipment();
  }catch(error){result.textContent=error.message;}
  finally{assess.disabled=selected().length===0;}
 });
 try{
  const [s,p]=await Promise.all([fetch('/api/species'),fetch('/api/products')]);
  if(!s.ok||!p.ok)throw new Error('物种或商品资料暂时无法读取。');
  species=await s.json();products=await p.json();renderSpecies();updateVolume();
 }catch(error){speciesBox.textContent=error.message;equipment.textContent=error.message;}
});
