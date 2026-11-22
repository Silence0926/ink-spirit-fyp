'use strict';

document.addEventListener('DOMContentLoaded',async()=>{
  const grid=document.getElementById('product-grid');if(!grid)return;
  try{
    const response=await fetch('/api/products');if(!response.ok)throw new Error('Unable to load products.');
    const products=await response.json();grid.replaceChildren();
    products.forEach(product=>{
      const card=document.createElement('article');card.className='product-card';card.dataset.productId=product.id;
      const image=document.createElement('img');image.src=product.image;image.alt=product.name;image.loading='lazy';image.className='product-image';
      const category=document.createElement('p');category.className='eyebrow';category.textContent=product.category;
      const title=document.createElement('h2');title.textContent=product.name;
      const description=document.createElement('p');description.textContent=product.description;
      const price=document.createElement('strong');price.textContent='RM '+Number(product.price).toFixed(2);
      const stock=document.createElement('small');stock.textContent=product.stock>0?'In stock: '+product.stock:'Out of stock';
      const button=document.createElement('button');button.type='button';button.textContent='Add to Cart';button.disabled=product.stock<1;
      button.addEventListener('click',async()=>{
        try{const response=await fetch('/api/cart/items',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:product.id,quantity:1})});const data=await response.json();if(response.status===401){location.href='login.html';return;}if(!response.ok)throw new Error(data.error||'Unable to add product.');button.textContent='Added ✓';setTimeout(()=>button.textContent='Add to Cart',1000);}catch(error){alert(error.message);}
      });
      card.append(image,category,title,description,price,stock,button);grid.appendChild(card);
    });
  }catch(error){grid.textContent=error.message;}
});
