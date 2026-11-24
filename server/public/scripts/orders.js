'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('orders-list');
  if (!container) return;
  const labels = {
    pending_payment:'Awaiting payment', payment_failed:'Payment failed',
    paid:'Payment verified', paid_inventory_review:'Payment verified · inventory review',
    processing:'Preparing order', shipped:'Shipped', completed:'Completed', cancelled:'Cancelled'
  };
  const formatDate = value => value ? new Date(value).toLocaleString() : '—';
  const make = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };
  const load = async () => {
    container.replaceChildren(make('p','orders-loading','Loading your order history…'));
    const response = await fetch('/api/orders',{ credentials:'same-origin' });
    const orders = await response.json().catch(() => []);
    if (response.status === 401) { location.href='login.html'; return; }
    if (!response.ok) throw new Error(orders.error || 'Unable to load orders.');
    container.replaceChildren();
    if (!orders.length) {
      container.append(make('section','orders-empty','还没有订单 · No orders yet. Your future orders will appear here.'));
      return;
    }
    for (const order of orders) {
      const card = make('article','order-card');
      const head = make('div','order-card-head');
      const identity = make('div','');
      identity.append(make('h2','order-id',order.id),make('p','order-date','Placed '+formatDate(order.createdAt)));
      const status = make('span','order-status status-'+String(order.status).replace(/[^a-z_]/g,''),labels[order.status] || order.status);
      head.append(identity,status);
      const summary = make('div','order-summary');
      const count = (order.items || []).reduce((sum,item)=>sum+Number(item.quantity||0),0);
      summary.append(make('span','',count+' item(s)'),make('strong','','RM '+Number(order.total).toFixed(2)));
      const details = make('details','order-details');
      const summaryLabel = make('summary','','View order details & tracking');
      const body = make('div','order-detail-body');
      const itemList = make('div','order-item-list');
      (order.items || []).forEach(item => {
        const line=make('article','order-line');
        const image=make('img','order-line-image');
        image.src=item.image||'/images/products/aquarium-card.svg';image.alt=item.name;image.loading='lazy';
        image.addEventListener('error',()=>{image.src='/images/products/aquarium-card.svg';},{once:true});
        const info=make('div','order-line-info');
        const name=make('a','order-line-name',item.name);name.href='product.html?id='+encodeURIComponent(item.productId||'');
        info.append(name,make('p','',item.quantity+' 件 × RM '+Number(item.unitPrice).toFixed(2)));
        line.append(image,info,make('strong','','RM '+Number(item.lineTotal ?? item.unitPrice*item.quantity).toFixed(2)));
        itemList.append(line);
      });
      body.append(make('h3','','Items'),itemList);
      const detailResponse = await fetch('/api/orders/'+encodeURIComponent(order.id),{ credentials:'same-origin' });
      const detailData = await detailResponse.json().catch(()=>({}));
      if (detailResponse.ok && detailData.order) {
        const history = make('ol','order-timeline');
        (detailData.order.statusHistory || []).forEach(event => {
          const entry = make('li','');
          entry.append(make('strong','',labels[event.status] || event.status),make('time','',formatDate(event.at)));
          if(event.note) entry.append(make('p','',event.note));
          history.append(entry);
        });
        body.append(make('h3','','Order progress'),history);
        if(detailData.order.paymentUrl && order.status==='pending_payment') {
          const pay = make('a','primary-link','Continue to payment');
          pay.href=detailData.order.paymentUrl;pay.target='_blank';pay.rel='noopener noreferrer';
          body.append(pay);
        }
      } else {
        body.append(make('p','form-note',detailData.error || 'Tracking details are temporarily unavailable.'));
      }
      details.append(summaryLabel,body);
      card.append(head,summary,details);
      container.append(card);
    }
  };
  try { await load(); } catch(error) { container.replaceChildren(make('p','orders-error',error.message)); }
});
