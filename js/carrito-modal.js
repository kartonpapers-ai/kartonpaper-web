(function(){
  'use strict';
  const dialog=document.getElementById('cart-drawer');
  const closeButton=document.getElementById('close-cart-btn');
  const defaultOpener=document.getElementById('open-cart-btn');
  let state=null,backdropPress=null;
  function controls(){
    return Array.from(dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')).filter(element=>{
      if(element.tabIndex<0||element.matches(':disabled'))return false;
      for(let node=element;node&&node!==dialog.parentElement;node=node.parentElement){
        const style=getComputedStyle(node);
        if(node.hidden||node.hasAttribute('inert')||style.display==='none'||style.visibility==='hidden')return false;
      }
      return true;
    });
  }
  function open(opener){
    if(dialog.open)return;
    if(state)close();
    backdropPress=null;
    state={opener:opener||document.activeElement,overflow:document.body.style.overflow,background:[]};
    dialog.setAttribute('aria-hidden','false');
    if(typeof dialog.showModal==='function')dialog.showModal();
    else {
      // Fallback for environments without the native dialog API.
      state.background=Array.from(document.body.children).filter(node=>node!==dialog&&!node.hasAttribute('inert'));
      state.background.forEach(node=>node.setAttribute('inert',''));
      dialog.open=true;
    }
    dialog.classList.add('open');document.body.style.overflow='hidden';closeButton.focus();
  }
  function close(){
    if(!state)return;
    const previous=state;state=null;
    if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.open=false;
    dialog.classList.remove('open');
    previous.background.forEach(node=>node.removeAttribute('inert'));
    document.body.style.overflow=previous.overflow;
    const opener=previous.opener;
    if(opener?.isConnected&&!opener.closest('[hidden],[inert]')&&!opener.matches(':disabled'))opener.focus({preventScroll:true});
    else defaultOpener.focus({preventScroll:true});
    dialog.setAttribute('aria-hidden','true');
  }
  closeButton.addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('close',()=>{if(!dialog.open)close();});
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
  dialog.addEventListener('keydown',event=>{
    if(!dialog.open)return;
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key!=='Tab')return;
    const list=controls(),first=list[0]||closeButton,last=list.at(-1)||closeButton;
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  document.addEventListener('focusin',event=>{if(dialog.open&&!dialog.contains(event.target))closeButton.focus();});
  window.KP_CART_MODAL=Object.freeze({open,close});
})();
