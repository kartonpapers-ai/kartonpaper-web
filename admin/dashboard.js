(function(){
 'use strict';const $=id=>document.getElementById(id);let rows=[],authorized=false;
 const panels={products:'workspace',prices:'prices-panel',finance:'finance-panel',sales:'sales-panel',production:'production-panel',social:'social-panel',artwork:'artwork-panel'};
 function show(name){if(!authorized)return;for(const [key,id]of Object.entries(panels))$(id).hidden=key!==name;document.querySelectorAll('[data-panel]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.panel===name)));}
 function renderPrices(){
  const query=$('price-search').value.trim().toLocaleLowerCase('es');$('price-rows').replaceChildren();
  for(const row of rows.filter(row=>[row.data.name,row.data.category].join(' ').toLocaleLowerCase('es').includes(query))){
   const tr=document.createElement('tr');for(const value of [row.data.name,row.data.price]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
   const variants=document.createElement('td'),details=document.createElement('details'),summary=document.createElement('summary'),ul=document.createElement('ul');summary.textContent=row.data.variants.length+' opciones';for(const value of row.data.variants){const li=document.createElement('li');li.textContent=value;ul.append(li);}details.append(summary,ul);variants.append(details);tr.append(variants);
   const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Editar precio';button.addEventListener('click',()=>{if(!window.KP_ADMIN_UI.mayLeave())return;show('products');window.KP_ADMIN_UI.editProduct(row.id);$('price-fields').open=true;window.KP_PACK_EDITOR.focus();$('price-fields').scrollIntoView({behavior:'auto',block:'start'});});td.append(button);tr.append(td);$('price-rows').append(tr);
  }
 }
 document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>{if(window.KP_ADMIN_UI.mayLeave())show(button.dataset.panel);}));
 $('module-campaigns').addEventListener('click',event=>{if(!window.KP_ADMIN_UI.mayLeave())event.preventDefault();});
 $('price-search').addEventListener('input',renderPrices);
 window.KP_PANEL=Object.freeze({
  connect(client){authorized=true;$('panel-overview').hidden=false;show('products');window.KP_FINANCE.connect(client);window.KP_TRIPS.connect(client);window.KP_SALES.connect(client);window.KP_PRODUCTION.connect(client);window.KP_SOCIAL.connect(client);window.KP_CUSTOMER_FILES_ADMIN.connect(client);},
  clear(){authorized=false;rows=[];$('panel-overview').hidden=true;$('prices-panel').hidden=true;$('finance-panel').hidden=true;$('sales-panel').hidden=true;$('production-panel').hidden=true;$('price-rows').replaceChildren();window.KP_FINANCE.clear();window.KP_TRIPS.clear();window.KP_SALES.clear();window.KP_PRODUCTION.clear();window.KP_SOCIAL.clear();window.KP_CUSTOMER_FILES_ADMIN.clear();$('artwork-panel').hidden=true;$('social-panel').hidden=true;for(const id of ['summary-products','summary-visible','summary-costs','summary-reviewed'])$(id).textContent='—';},
  setCatalog(value){rows=value;$('summary-products').textContent=rows.length;$('summary-visible').textContent=rows.filter(row=>row.published).length;renderPrices();window.KP_FINANCE.setCatalog(rows);window.KP_SALES.setCatalog(rows);window.KP_PRODUCTION.setCatalog(rows);window.KP_SOCIAL.setCatalog(rows);},
  open(name){if(authorized&&Object.hasOwn(panels,name)&&window.KP_ADMIN_UI.mayLeave()){show(name);return true;}return false;},
  busy(value){document.querySelectorAll('[data-panel]').forEach(button=>button.disabled=value);$('logout').disabled=value;}
 });
})();
