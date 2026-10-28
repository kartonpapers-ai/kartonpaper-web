(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 let product=null;
 const isEmbalaje=()=>window.KP_CATALOG.isEmbalaje(product);
 function field(parent,title,kind,value,key,attrs={}){
  const wrap=document.createElement('div'),label=document.createElement('label'),input=document.createElement(kind==='select'?'select':'input');
  wrap.className='pack-edit-field';input.id='pack-'+crypto.randomUUID();input.dataset[key]='true';label.htmlFor=input.id;label.textContent=title;
  if(kind!=='select'){input.type=kind;input.value=value??'';}Object.assign(input,attrs);wrap.append(label,input);parent.append(wrap);return input;
 }
 function read(){
  const rows=Array.from($('edit-pack-rows').children);
  const entries=rows.map(row=>{
   const value=key=>row.querySelector('[data-'+key+']').value;
   const numeric=key=>value(key).trim()===''?NaN:Number(value(key));
   return {...row.packSource,quantity:numeric('pack-quantity'),unitPrice:numeric('pack-unit'),sku:value('pack-sku').trim(),withoutPrint:value('pack-mode')==='without',requiresLogo:value('pack-mode')==='logo'};
  });
  const build=isEmbalaje()?window.KP_PRICES.embalajes:window.KP_PRICES.structured;
  return build({...product,type:$('edit-type').value},entries,rows.findIndex(row=>row.querySelector('[data-pack-initial]').checked));
 }
 function preview(){
  for(const row of $('edit-pack-rows').children){
   const q=row.querySelector('[data-pack-quantity]').value,u=row.querySelector('[data-pack-unit]').value,total=Number(q)*Number(u);
   row.querySelector('output').textContent=q!==''&&u!==''&&Number.isSafeInteger(total)&&Number(q)>0&&Number(u)>=0?window.KP_CATALOG.money(total)+' + IVA':isEmbalaje()?'Por cotizar':'—';
  }
  try{
   const data=read();$('edit-price').value=data.price;$('edit-number').value=data.priceNum??'';$('edit-variants').value=data.variants.join('\n');
   $('edit-packs-status').textContent=isEmbalaje()?'Los totales y el precio inicial se guardarán junto con los tramos.':'Los totales y el precio inicial se guardarán junto con los packs.';$('edit-packs-status').className='';
  }catch(error){$('edit-packs-status').textContent=error.message;$('edit-packs-status').className='error';}
 }
 function append(pack={},initial=false){
  const row=document.createElement('fieldset');row.className='pack-edit-row';row.packSource={...pack};
  const legend=document.createElement('legend');legend.textContent=(isEmbalaje()?'Tramo ':'Pack ')+($('edit-pack-rows').children.length+1);row.append(legend);
  const grid=document.createElement('div');grid.className='pack-edit-grid';row.append(grid);
  field(grid,isEmbalaje()?'Unidades del pedido':'Unidades por pack','number',pack.quantity,'packQuantity',{min:String(isEmbalaje()?product.orderStep:1),max:'1000000',step:String(isEmbalaje()?product.orderStep:1),required:true});
  const mode=field(grid,'Impresión','select','','packMode');
  for(const [name,value] of (isEmbalaje()?[['Impresión solo en tapa','printed']]:[['Sin impresión','without'],['Con impresión','printed'],['Con logo · requiere archivo','logo']]))mode.add(new Option(name,value));
  mode.value=isEmbalaje()?'printed':pack.withoutPrint?'without':pack.requiresLogo?'logo':'printed';
  field(grid,'Neto por unidad (CLP)','number',pack.unitPrice,'packUnit',{min:'0',max:'1000000000',step:'1',required:!isEmbalaje()});
  const totalWrap=document.createElement('div'),label=document.createElement('label'),output=document.createElement('output');output.id='pack-total-'+crypto.randomUUID();label.htmlFor=output.id;label.textContent=isEmbalaje()?'Total neto del pedido':'Total neto del pack';totalWrap.append(label,output);grid.append(totalWrap);
  field(row,isEmbalaje()?'SKU del tramo':'SKU del pack','text',pack.sku,'packSku',{maxLength:80,pattern:'[A-Z0-9-]{1,80}',required:true});
  const actions=document.createElement('div');actions.className='pack-edit-actions';
  const radioLabel=document.createElement('label');radioLabel.className='checkbox';const radio=document.createElement('input');radio.type='radio';radio.name='initial-pack';radio.dataset.packInitial='true';radio.checked=initial;radioLabel.append(radio,document.createTextNode('Mostrar este precio en el catálogo'));
  const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent=isEmbalaje()?'Quitar tramo':'Quitar pack';remove.addEventListener('click',()=>{
   const wasInitial=radio.checked,next=row.nextElementSibling||row.previousElementSibling;row.remove();
   if(wasInitial&&next)next.querySelector('[data-pack-initial]').checked=true;
   Array.from($('edit-pack-rows').children).forEach((item,index)=>item.querySelector('legend').textContent=(isEmbalaje()?'Tramo ':'Pack ')+(index+1));
   preview();$('edit-pack-rows').dispatchEvent(new Event('input',{bubbles:true}));(next?.querySelector('input')||$('edit-pack-add')).focus();
  });actions.append(radioLabel,remove);row.append(actions);$('edit-pack-rows').append(row);return row;
 }
 $('edit-pack-rows').addEventListener('input',preview);
 $('edit-pack-rows').addEventListener('change',preview);
 $('edit-pack-add').addEventListener('click',()=>{
  if($('edit-pack-rows').children.length>=30){$('edit-packs-status').textContent='El máximo es de 30 packs. Edita uno existente.';$('edit-packs-status').className='error';return;}
  const row=append({withoutPrint:!isEmbalaje()},!$('edit-pack-rows').children.length);preview();row.querySelector('input').focus();$('edit-pack-rows').dispatchEvent(new Event('input',{bubbles:true}));
 });
 $('edit-type').addEventListener('change',()=>{if(product)preview();});
 window.KP_PACK_EDITOR=Object.freeze({read,select(value){
  product=value?.packs||window.KP_CATALOG.isEmbalaje(value)?value:null;$('edit-packs').hidden=!product;$('edit-manual-pricing').hidden=Boolean(product);$('edit-pack-rows').replaceChildren();
  if(!product)return;
  const rows=isEmbalaje()?window.KP_CATALOG.embalajeOptions(product):product.packs;
  const requested=product.initialPriceQuantity||/ · ([0-9]+) unidades$/.exec(product.price)?.[1];
  const initial=isEmbalaje()?Math.max(0,rows.findIndex(row=>requested?row.quantity===Number(requested):row.unitPrice===product.priceNum)):window.KP_PRICES.initialPack(product);
  $('edit-packs-title').textContent=isEmbalaje()?'Precios por embalaje':'Precios por pack';
  $('edit-packs-help').textContent=isEmbalaje()?'Impresión solo en tapa. Usa múltiplos de '+product.orderStep+' unidades. Deja el precio vacío para cotizar ese tramo. Fuera de estos tramos, el pedido queda por cotizar.':'Valores netos en CLP. Cada pack tiene su propio precio por unidad. El total se calcula automáticamente; el IVA se agrega al pedido.';
  $('edit-pack-add').textContent=isEmbalaje()?'Agregar tramo':'Agregar pack';
  rows.forEach((pack,index)=>append(pack,index===initial));preview();
 },focus(){($('edit-pack-rows').querySelector('[data-pack-unit]')||$('edit-number')).focus();}});
})();
