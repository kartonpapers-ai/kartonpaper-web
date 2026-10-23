(function(){
 'use strict';
 const dialog=document.getElementById('product-detail-modal');
 const content=document.getElementById('product-detail-content');
 const closeButton=document.getElementById('close-product-detail');
 let active=null;
 function close(restoreFocus=true){
  if(!active)return;
  const {card,placeholder,opener,overflow}=active;active=null;
  card.classList.remove('product-detail-card');
  card.querySelector('.product-card-title').removeAttribute('id');
  placeholder.replaceWith(card);
  if(typeof dialog.close==='function')dialog.close();else dialog.open=false;
  document.body.style.overflow=overflow;
  if(restoreFocus&&opener?.isConnected)opener.focus({preventScroll:true});
  return opener;
 }
 function open(card,opener){
  close(false);
  const placeholder=document.createElement('div');placeholder.className='product-card-placeholder';
  placeholder.style.minHeight=card.getBoundingClientRect().height+'px';placeholder.setAttribute('aria-hidden','true');
  const overflow=document.body.style.overflow;
  card.replaceWith(placeholder);card.classList.add('product-detail-card');
  card.querySelector('.product-card-title').id='product-detail-title';
  content.replaceChildren(card);active={card,placeholder,opener,overflow};
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.open=true;
  document.body.style.overflow='hidden';dialog.scrollTop=0;closeButton.focus();
 }
 closeButton.addEventListener('click',()=>close());
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
 dialog.addEventListener('close',()=>{if(!dialog.open)close();});
 window.KP_PRODUCT_DETAIL=Object.freeze({open,close});
})();
