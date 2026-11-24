'use strict';
document.addEventListener('DOMContentLoaded',async()=>{
 const grid=document.getElementById('encyclopedia-grid'),search=document.getElementById('encyclopedia-search'),cats=document.getElementById('encyclopedia-categories');
 if(!grid||!search||!cats)return;
 let data=null,active='all',query='';
 const categoryNames={};
 const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 function render(){
  const filtered=data.articles.filter(a=>(active==='all'||a.category===active)&&[a.title,a.subtitle,a.summary,a.level,...a.tags].join(' ').toLocaleLowerCase().includes(query));
  grid.replaceChildren();
  filtered.forEach((article,index)=>{
   const card=make('article','encyclopedia-card');
   const top=make('div','article-topline');top.append(make('span','article-index',String(index+1).padStart(2,'0')),make('span','article-level',article.level));card.append(top);
   card.append(make('p','article-category',categoryNames[article.category]||article.category));
   card.append(make('h3','',article.title));card.append(make('p','article-subtitle',article.subtitle));card.append(make('p','article-summary',article.summary));
   const tags=make('div','article-tags');article.tags.slice(0,5).forEach(t=>tags.append(make('span','',t)));card.append(tags);
   const details=make('details','article-details'),summary=make('summary','', '展开阅读 / Read article');details.append(summary);
   if(article.warning)details.append(make('p','article-warning','注意 · '+article.warning));
   article.sections.forEach(section=>{const block=make('section','article-section');block.append(make('h4','',section.heading));(section.body||[]).forEach(p=>block.append(make('p','',p)));if(section.bullets){const ul=make('ul','');section.bullets.forEach(item=>ul.append(make('li','',item)));block.append(ul);}details.append(block);});
   if(article.sources?.length){const sourceBox=make('div','article-sources');sourceBox.append(make('strong','','延伸资料 / References'));article.sources.forEach(source=>{const a=make('a','',source.label);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';sourceBox.append(a);});details.append(sourceBox);}
   card.append(details);grid.append(card);
  });
  document.getElementById('encyclopedia-count').textContent=data.articles.length+' ARTICLES';
  document.getElementById('encyclopedia-result-count').textContent=filtered.length+' 篇';
  document.getElementById('encyclopedia-section-title').textContent=active==='all'?'全部知识专题':categoryNames[active];
  if(!filtered.length)grid.append(make('p','encyclopedia-empty','没有找到相关内容，请尝试其他关键词或分类。'));
 }
 try{
  const response=await fetch('/api/encyclopedia');if(!response.ok)throw new Error('百科资料暂时无法读取。');data=await response.json();
  data.categories.forEach(category=>categoryNames[category.id]=category.name);
  const all=make('button','encyclopedia-category active','全部专题');all.type='button';all.dataset.category='all';all.setAttribute('aria-pressed','true');cats.append(all);
  data.categories.forEach(category=>{const b=make('button','encyclopedia-category',category.name);b.type='button';b.dataset.category=category.id;b.setAttribute('aria-pressed','false');const en=make('small','',category.english);b.append(en);cats.append(b);});
  cats.addEventListener('click',event=>{const button=event.target.closest('button[data-category]');if(!button)return;active=button.dataset.category;cats.querySelectorAll('button').forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});render();});
  search.addEventListener('input',()=>{query=search.value.trim().toLocaleLowerCase();render();});render();
 }catch(error){grid.textContent=error.message;document.getElementById('encyclopedia-count').textContent='暂不可用';}
});
