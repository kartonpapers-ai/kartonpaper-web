(function(){
 'use strict';
 const categories=['all','cerveza','reposteria','cajas-reposteria','gastronomia','bolsas','doypack','posavasos'];
 const boxes=new Set(['reposteria-caja-3-alfajores','reposteria-caja-4-alfajores','reposteria-caja-6-alfajores']);
 function read(url){const params=new URL(url).searchParams;return {catalog:categories.includes(params.get('catalogo'))?params.get('catalogo'):'all',product:params.get('producto')||null};}
 function category(catalog){return catalog==='cajas-reposteria'?'reposteria':catalog;}
 function matches(product,catalog){return catalog==='all'||(catalog==='cajas-reposteria'?boxes.has(product.id):product.category===catalog);}
 function link(catalog,product){
  const url=new URL(window.location.pathname,window.location.origin);
  if(product)url.searchParams.set('producto',product);
  else if(catalog&&catalog!=='all')url.searchParams.set('catalogo',catalog);
  url.hash='catalogo';return url.href;
 }
 function sync(catalog,product){
  const url=new URL(window.location.href);url.searchParams.delete('catalogo');url.searchParams.delete('producto');
  if(catalog&&catalog!=='all')url.searchParams.set('catalogo',catalog);
  if(product)url.searchParams.set('producto',product);
  if(catalog!=='all'||product)url.hash='catalogo';
  window.history.replaceState(window.history.state,'',url);
 }
 async function copy(url,field,status){
  field.value=url;
  try{
   if(!window.navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
   await window.navigator.clipboard.writeText(url);field.hidden=true;status.textContent='Enlace copiado. Ya puedes pegarlo en WhatsApp.';
  }catch(error){field.hidden=false;field.focus();field.select();status.textContent='Copia este enlace y pégalo en WhatsApp.';}
 }
 window.KP_CATALOG_LINKS=Object.freeze({read,category,matches,link,sync,copy});
})();
