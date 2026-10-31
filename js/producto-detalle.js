(function(){
 'use strict';
 const dialog=document.getElementById('product-detail-modal');
 const content=document.getElementById('product-detail-content');
 const closeButton=document.getElementById('close-product-detail');
 let active=null,backdropPress=null;
 function close(restoreFocus=true){
  if(!active)return;
  const {card,placeholder,opener,overflow,background}=active;active=null;
  card.classList.remove('product-detail-card');
  card.querySelector('.product-card-title').removeAttribute('id');
  placeholder.replaceWith(card);
  if(typeof dialog.close==='function')dialog.close();else dialog.open=false;
  background.forEach(node=>node.removeAttribute('inert'));
  document.body.style.overflow=overflow;
  if(restoreFocus&&opener?.isConnected)opener.focus({preventScroll:true});
  if(dialog.contains(document.activeElement))document.activeElement.blur();
  dialog.setAttribute('aria-hidden','true');
  return opener;
 }
 function open(card,opener){
  close(false);
  backdropPress=null;
  const placeholder=document.createElement('div');placeholder.className='product-card-placeholder';
  placeholder.style.minHeight=card.getBoundingClientRect().height+'px';placeholder.setAttribute('aria-hidden','true');
  const overflow=document.body.style.overflow;
  card.replaceWith(placeholder);card.classList.add('product-detail-card');
  card.querySelector('.product-card-title').id='product-detail-title';
  content.replaceChildren(card);active={card,placeholder,opener,overflow,background:[]};
  dialog.setAttribute('aria-hidden','false');
  if(typeof dialog.showModal==='function')dialog.showModal();else {
   active.background=Array.from(document.body.children).filter(node=>node!==dialog&&!node.hasAttribute('inert'));
   active.background.forEach(node=>node.setAttribute('inert',''));
   dialog.open=true;
  }
  document.body.style.overflow='hidden';dialog.scrollTop=0;closeButton.focus();
 }
 closeButton.addEventListener('click',()=>close());
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('pointerdown',event=>{
  const rect=dialog.getBoundingClientRect();
  backdropPress=event.target===dialog&&(event.clientX<rect.left||event.clientX>=rect.right||event.clientY<rect.top||event.clientY>=rect.bottom);
 });
 dialog.addEventListener('click',event=>{
  const press=backdropPress;backdropPress=null;
  if(event.target!==dialog||press===false)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>=rect.right||event.clientY<rect.top||event.clientY>=rect.bottom)close();
 });
 dialog.addEventListener('close',()=>{if(!dialog.open)close();});
 window.KP_PRODUCT_DETAIL=Object.freeze({open,close});
})();
