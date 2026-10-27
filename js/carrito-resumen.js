(function(){
 'use strict';
 function lineNet(item){
  if(!item||item.isCustom||!Number.isSafeInteger(item.qty)||item.qty<1)return null;
  let value=null;
  if(item.stockUnits)value=item.stockUnitPrice;
  else if(item.totalNet!==undefined)value=item.totalNet;
  else {
   // Legacy packs: only an explicit net amount in the selected option is usable.
   // The product's starting price is not the price of every variant.
   const text=String(item.variant??'');
   const match=/\(Pack [1-9][0-9]* u\. \$([0-9.]+) \+ IVA\)$/.exec(text)||/^Pack [1-9][0-9]* u\. \(\$([0-9.]+)(?: \+ IVA)?\)$/.exec(text);
   if(match&&/^(?:[0-9]+|[1-9][0-9]{0,2}(?:\.[0-9]{3})+)$/.test(match[1]))value=Number(match[1].replaceAll('.',''));
  }
  if(!Number.isSafeInteger(value)||value<0||!Number.isSafeInteger(value*item.qty))return null;
  return value*item.qty;
 }
 function calculate(items){
  const priced=[],pending=[];let net=0n;
  for(const item of items){const value=lineNet(item);if(value===null)pending.push(item);else{priced.push({item,net:value});net+=BigInt(value);}}
  const iva=(net*19n+50n)/100n,total=net+iva,overflow=total>BigInt(Number.MAX_SAFE_INTEGER);
  return {priced,pending,net:overflow?null:Number(net),iva:overflow?null:Number(iva),total:overflow?null:Number(total),overflow};
 }
 function render(items){
  const section=document.getElementById('cart-summary'),result=calculate(items),$=id=>document.getElementById(id);
  section.hidden=!items.length;$('cart-priced-summary').hidden=!result.priced.length;
  for(const key of ['net','iva','total'])$('cart-'+key).textContent=result[key]===null?'Revisar importes':window.KP_CATALOG.money(result[key]);
  $('cart-summary-note').textContent=result.overflow?'Los importes exceden el máximo calculable. Confirmaremos el total al revisar tu pedido.':result.pending.length?'Este total incluye solo los productos con precio. Las solicitudes por cotizar se agregan después de confirmarlas.':'Importes de los productos seleccionados. Disponibilidad y plazos por confirmar.';
  $('cart-pending-summary').hidden=!result.pending.length;$('cart-pending-count').textContent=String(result.pending.length);
  $('cart-pending-note').textContent=result.priced.length?'Precio pendiente de confirmación. Estos productos no están incluidos en el total.':'El total del pedido se confirmará con la cotización.';
  const list=$('cart-pending-items');list.replaceChildren();
  for(const item of result.pending){const li=document.createElement('li');li.textContent=item.name+' · '+item.qty+(item.isCustom?' unidades':' '+(item.stockUnits?'caja(s)':'pack(s)'));list.append(li);}
  return result;
 }
 window.KP_CART_SUMMARY=Object.freeze({lineNet,calculate,render});
})();
