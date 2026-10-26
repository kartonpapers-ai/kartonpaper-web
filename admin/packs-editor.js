(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 let product=null;
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
  return window.KP_PRICES.structured({...product,type:$('edit-type').value},entries,rows.findIndex(row=>row.querySelector('[data-pack-initial]').checked));
 }
 function preview(){
  for(const row of $('edit-pack-rows').children){
   const q=row.querySelector('[data-pack-quantity]').value,u=row.querySelector('[data-pack-unit]').value,total=Number(q)*Number(u);
   row.querySelector('output').textContent=q!==''&&u!==''&&Number.isSafeInteger(total)&&Number(q)>0&&Number(u)>=0?window.KP_CATALOG.money(total)+' + IVA':'—';
  }
  try{
   const data=read();$('edit-price').value=data.price;$('edit-number').value=data.priceNum;$('edit-variants').value=data.variants.join('\n');
   $('edit-packs-status').textContent='Los totales y el precio inicial se guardarán junto con los packs.';$('edit-packs-status').className='';
  }catch(error){$('edit-packs-status').textContent=error.message;$('edit-packs-status').className='error';}
 }
 function append(pack={},initial=false){
  const row=document.createElement('fieldset');row.className='pack-edit-row';row.packSource={...pack};
  const legend=document.createElement('legend');legend.textContent='Pack '+($('edit-pack-rows').children.length+1);row.append(legend);
  const grid=document.createElement('div');grid.className='pack-edit-grid';row.append(grid);
  field(grid,'Unidades por pack','number',pack.quantity,'packQuantity',{min:'1',max:'1000000',step:'1',required:true});
  const mode=field(grid,'Impresión','select','','packMode');
  for(const [name,value] of [['Sin impresión','without'],['Con impresión','printed'],['Con logo · requiere archivo','logo']])mode.add(new Option(name,value));
  mode.value=pack.withoutPrint?'without':pack.requiresLogo?'logo':'printed';
  field(grid,'Neto por unidad (CLP)','number',pack.unitPrice,'packUnit',{min:'0',max:'1000000000',step:'1',required:true});
  const totalWrap=document.createElement('div'),label=document.createElement('label'),output=document.createElement('output');output.id='pack-total-'+crypto.randomUUID();label.htmlFor=output.id;label.textContent='Total neto del pack';totalWrap.append(label,output);grid.append(totalWrap);
  field(row,'SKU del pack','text',pack.sku,'packSku',{maxLength:80,pattern:'[A-Z0-9-]{1,80}',required:true});
  const actions=document.createElement('div');actions.className='pack-edit-actions';
  const radioLabel=document.createElement('label');radioLabel.className='checkbox';const radio=document.createElement('input');radio.type='radio';radio.name='initial-pack';radio.dataset.packInitial='true';radio.checked=initial;radioLabel.append(radio,document.createTextNode('Mostrar este precio en el catálogo'));
  const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='Quitar pack';remove.addEventListener('click',()=>{
   const wasInitial=radio.checked,next=row.nextElementSibling||row.previousElementSibling;row.remove();
   if(wasInitial&&next)next.querySelector('[data-pack-initial]').checked=true;
   Array.from($('edit-pack-rows').children).forEach((item,index)=>item.querySelector('legend').textContent='Pack '+(index+1));
   preview();$('edit-pack-rows').dispatchEvent(new Event('input',{bubbles:true}));(next?.querySelector('input')||$('edit-pack-add')).focus();
  });actions.append(radioLabel,remove);row.append(actions);$('edit-pack-rows').append(row);return row;
 }
 $('edit-pack-rows').addEventListener('input',preview);
 $('edit-pack-rows').addEventListener('change',preview);
 $('edit-pack-add').addEventListener('click',()=>{
  if($('edit-pack-rows').children.length>=30){$('edit-packs-status').textContent='El máximo es de 30 packs. Edita uno existente.';$('edit-packs-status').className='error';return;}
  const row=append({withoutPrint:true},!$('edit-pack-rows').children.length);preview();row.querySelector('input').focus();$('edit-pack-rows').dispatchEvent(new Event('input',{bubbles:true}));
 });
 $('edit-type').addEventListener('change',()=>{if(product)preview();});
 window.KP_PACK_EDITOR=Object.freeze({read,select(value){
  product=value?.packs?value:null;$('edit-packs').hidden=!product;$('edit-manual-pricing').hidden=Boolean(product);$('edit-pack-rows').replaceChildren();
  if(!product)return;
  const initial=window.KP_PRICES.initialPack(product);product.packs.forEach((pack,index)=>append(pack,index===initial));preview();
 },focus(){($('edit-pack-rows').querySelector('[data-pack-unit]')||$('edit-number')).focus();}});
})();
