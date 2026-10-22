(function(){
 'use strict';const $=id=>document.getElementById(id),calc=window.KP_FINANCE_CALC;
 const numeric=['base','printing','prints','labor','extras','waste','fee','fixed','preparation','packaging','quantity','sale','discount','target','floor','purchase_total','purchase_units'];
 const currency=n=>n===null||n===undefined?'—':'$'+new Intl.NumberFormat('es-CL',{maximumFractionDigits:2}).format(n);
 const percent=n=>n===null||n===undefined?'—':new Intl.NumberFormat('es-CL',{maximumFractionDigits:1}).format(n)+'%';
 let client=null,products=[],rows=[],selected=null,dirty=false,busy=false,ready=false,revision=0,importRows=null;
 function status(id,text,kind=''){$(id).textContent=text;$(id).className=kind;}
 function product(id){return products.find(row=>row.id===id)?.data;}
 function name(data){return product(data.product_id)?.name||data.product_id;}
 function mayLeave(){return (!window.KP_TRIPS||window.KP_TRIPS.mayLeave())&&!busy&&(!dirty||window.confirm('Tienes cambios de costos sin guardar. ¿Quieres descartarlos?'));}
 function rowResult(row){try{return calc.calculate(row.data);}catch(error){return {complete:false,invalid:true};}}
 function stats(){
  $('summary-costs').textContent=ready?rows.length:'—';$('summary-reviewed').textContent=ready?rows.filter(row=>rowResult(row).complete).length:'—';
 }
 function setBusy(value){busy=value;window.KP_PANEL?.busy(value);for(const input of $('fin-form').elements)input.disabled=value;for(const id of ['fin-new','fin-reload','fin-import','fin-export'])$(id).disabled=value||!ready||(id==='fin-import'&&!importRows);if(!value&&selected){$('fin-product_id').disabled=!selected.isNew;printingState();}}
 function render(){
  const query=$('fin-search').value.trim().toLocaleLowerCase('es');$('fin-rows').replaceChildren();
  for(const row of rows.filter(row=>[name(row.data),row.data.variant,row.data.supplier].join(' ').toLocaleLowerCase('es').includes(query))){
   const result=rowResult(row),tr=document.createElement('tr');const values=[name(row.data)+' · '+row.data.variant,currency(row.data.base),currency(row.data.printing*row.data.prints),currency(result.complete?result.cost:null),percent(result.complete?result.margin:null),result.complete?result.status:result.invalid?'Revisar importes':'Costos pendientes'];
   for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}
   const td=document.createElement('td'),button=document.createElement('button');button.className='secondary';button.type='button';button.textContent='Revisar';button.disabled=busy;button.addEventListener('click',()=>{if(mayLeave())select(row);});td.append(button);tr.append(td);$('fin-rows').append(tr);
  }
  if(!rows.length&&ready){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.textContent='Todavía no hay fichas. Importa tus costos o crea una ficha por producto y medida.';tr.append(td);$('fin-rows').append(tr);}stats();
 }
 async function load(){
  if(!client||busy)return;const current=revision,session=client;$('fin-reload').disabled=true;status('fin-status','Cargando costos privados…');
  try{const result=await session.from('kp_finance').select('id,data,version,updated_at').order('id');if(current!==revision)return;if(result.error)throw result.error;if(!Array.isArray(result.data))throw new Error('Respuesta inválida');for(const row of result.data)calc.validate(row.data);rows=result.data;ready=true;$('fin-setup').hidden=true;status('fin-status',rows.length+' fichas privadas. Completa las pendientes para evaluar su margen.');render();}
  catch(error){if(current!==revision)return;ready=false;rows=[];render();$('fin-setup').hidden=false;status('fin-status','No se pudieron cargar los costos. Si es tu primera vez, activa el archivo 09. Si ya lo hiciste, revisa conexión y sesión.','error');}
  finally{if(current===revision){$('fin-reload').disabled=false;for(const id of ['fin-new','fin-export'])$(id).disabled=!ready;}}
 }
 function variants(id){$('fin-variants').replaceChildren();for(const value of product(id)?.variants||[]){const option=document.createElement('option');option.value=value.split(' · $')[0];$('fin-variants').append(option);}}
 function printingState(){const beer=product($('fin-product_id').value)?.category==='cerveza';for(const key of ['printing','prints']){$('fin-'+key).readOnly=beer;if(beer)$('fin-'+key).value='0';}}
 function populateProducts(id){$('fin-product_id').replaceChildren();for(const row of products){const option=new Option(row.data.name,row.id);$('fin-product_id').add(option);}if(id&&!product(id))$('fin-product_id').add(new Option(id+' · sin producto activo',id));$('fin-product_id').value=id;variants(id);}
 function select(row){
  selected=structuredClone(row);dirty=false;$('fin-editor').hidden=false;populateProducts(row.data.product_id);$('fin-product_id').disabled=!row.isNew;
  for(const key of [...numeric,'variant','supplier','note'])$('fin-'+key).value=row.data[key]??'';$('fin-reviewed').checked=row.data.reviewed;
  printingState();$('fin-title').textContent=name(row.data)+' · '+row.data.variant;status('fin-save-status','');preview();
 }
 function read(){const data={};data.product_id=$('fin-product_id').value;for(const key of ['variant','supplier','note'])data[key]=$('fin-'+key).value.trim();for(const key of numeric){const raw=$('fin-'+key).value.trim();data[key]=raw===''?null:Number(raw);}data.reviewed=$('fin-reviewed').checked;calc.validate(data);calc.calculate(data);return data;}
 function resultRow(label,value,emphasis=false){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;if(emphasis)div.className='emphasis';div.append(dt,dd);$('fin-results').append(div);}
 function preview(){
  $('fin-results').replaceChildren();
  try{const data=read(),result=calc.calculate(data),sale=calc.catalogSale(product(data.product_id),data.variant);$('fin-catalog-price').textContent='Catálogo: '+(sale===null?'precio unitario no identificado; revisa pack o medida.':currency(sale)+' netos/u. El análisis usa el precio que ingreses abajo.');
   resultRow('Base + impresión/u',currency(result.baseSubtotal));
   resultRow('Preparación por pedido',currency(data.preparation));resultRow('Embalaje por pedido',currency(data.packaging));
   if(!result.complete){status('fin-result-status','Pendiente: completa compra, mano de obra, otros costos, merma, comisión, preparación, embalaje y otros gastos por pedido; después confirma la revisión.','warning');return;}
   status('fin-result-status',result.status,result.profit<0?'error':result.margin>=data.target?'success':'warning');
   for(const [label,value,emphasis]of [['Fabricación con merma/u',currency(result.production)],['Gastos por pedido / unidad',currency(result.orderCosts/data.quantity)],['Costo completo/u',currency(result.cost)],['Venta con descuento/u',currency(result.sale)],['Ganancia sobre costos/u',currency(result.profit)],['Margen sobre venta',percent(result.margin),true],['Venta para '+data.target+'%',currency(result.targetPrice)],['Venta mínima '+data.floor+'%',currency(result.floorPrice)],['Punto de equilibrio/u',currency(result.breakEven)],['Descuento máx. a '+data.target+'%',percent(result.maxDiscount)],['Ganancia del pedido',currency(result.totalProfit)],['Subtotal neto del pedido',currency(result.revenue)],['IVA 19% del pedido',currency(result.iva)],['Total a facturar',currency(result.total)]])resultRow(label,value,emphasis);
  }catch(error){status('fin-result-status',error.message,'error');}
 }
 $('fin-search').addEventListener('input',render);
 $('fin-reload').addEventListener('click',()=>{if(mayLeave()){selected=null;dirty=false;$('fin-editor').hidden=true;load();}});
 $('fin-new').addEventListener('click',()=>{if(!ready||!products.length||!mayLeave())return;const data=calc.blank(products[0].data);data.sale=calc.catalogSale(products[0].data,data.variant);select({id:'cost-'+crypto.randomUUID(),data,isNew:true});dirty=true;});
 $('fin-product_id').addEventListener('change',()=>{if(!selected?.isNew)return;const data=calc.blank(product($('fin-product_id').value));data.sale=calc.catalogSale(product(data.product_id),data.variant);select({...selected,data});dirty=true;});
 $('fin-variant').addEventListener('change',()=>{const sale=calc.catalogSale(product($('fin-product_id').value),$('fin-variant').value);if(sale!==null)$('fin-sale').value=sale;preview();});
 $('fin-from-pack').addEventListener('click',()=>{const total=Number($('fin-purchase_total').value),units=Number($('fin-purchase_units').value);if($('fin-purchase_total').value===''||!Number.isFinite(total)||total<0||!Number.isInteger(units)||units<1){status('fin-save-status','Completa compra total y unidades válidas.','error');return;}$('fin-base').value=total/units;dirty=true;preview();});
 $('fin-form').addEventListener('input',()=>{dirty=true;status('fin-save-status','Cambios de costos pendientes.');preview();});
 $('fin-cancel').addEventListener('click',()=>{if(selected&&mayLeave()){if(selected.isNew){selected=null;dirty=false;$('fin-editor').hidden=true;}else select(rows.find(row=>row.id===selected.id));}});
 $('fin-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!client||!ready||!selected||busy)return;let data;try{data=read();}catch(error){status('fin-save-status',error.message,'error');return;}
  const current=revision,row=selected,session=client;setBusy(true);status('fin-save-status','Guardando ficha privada…');
  try{const request=row.isNew?session.from('kp_finance').insert({id:row.id,data}):session.from('kp_finance').update({data}).eq('id',row.id).eq('version',row.version);const result=await request.select('id,data,version,updated_at').maybeSingle();if(current!==revision)return;if(result.error)throw result.error;if(!result.data){status('fin-save-status','La ficha cambió en otra sesión. Conserva tus datos y actualiza antes de guardar.','error');return;}rows=row.isNew?[...rows,result.data]:rows.map(item=>item.id===row.id?result.data:item);select(result.data);render();status('fin-save-status','Costos guardados de forma privada. Los precios de la tienda no se modificaron.','success');}
  catch(error){if(current===revision)status('fin-save-status','No se guardó la ficha. Conserva tus cambios y revisa conexión, sesión o conflicto.','error');}
  finally{if(current===revision)setBusy(false);}
 });
 $('fin-file').addEventListener('change',async()=>{
  importRows=null;$('fin-import').disabled=true;const file=$('fin-file').files[0];if(!file)return;const current=revision;
  try{if(file.size>2e6)throw new Error('El archivo supera 2 MB.');const payload=JSON.parse(await file.text());if(current!==revision)return;if(!payload||payload.format!=='kartonpaper-finance-v1'||!Array.isArray(payload.rows)||payload.rows.length>1000)throw new Error('Formato de respaldo inválido.');const ids=new Set();for(const row of payload.rows){if(!/^[a-z0-9-]{1,120}$/.test(row.id)||ids.has(row.id))throw new Error('Hay fichas repetidas o inválidas.');ids.add(row.id);calc.validate(row.data);calc.calculate(row.data);}importRows=payload.rows.map(({id,data})=>({id,data}));const missing=importRows.filter(row=>!rows.some(existing=>existing.id===row.id)).length;status('fin-import-status',missing+' fichas nuevas; '+(importRows.length-missing)+' existentes se conservarán. Pulsa Agregar para guardarlas.');$('fin-import').disabled=!ready||!missing;}
  catch(error){if(current===revision)status('fin-import-status',error.message,'error');}
 });
 $('fin-import').addEventListener('click',async()=>{
  if(!client||!ready||busy||!importRows||!mayLeave())return;const current=revision,session=client;setBusy(true);status('fin-import-status','Guardando fichas faltantes…');
  try{const result=await session.rpc('kp_import_finance',{items:importRows});if(current!==revision)return;if(result.error)throw result.error;status('fin-import-status',result.data+' fichas agregadas. Las existentes se conservaron.','success');importRows=null;$('fin-file').value='';selected=null;dirty=false;$('fin-editor').hidden=true;setBusy(false);await load();}
  catch(error){if(current===revision)status('fin-import-status','No se importaron los datos. Revisa el archivo, conexión y archivo 09 de Supabase.','error');}
  finally{if(current===revision)setBusy(false);}
 });
 $('fin-export').addEventListener('click',()=>{if(!ready||busy)return;const blob=new Blob([JSON.stringify({format:'kartonpaper-finance-v1',rows:rows.map(({id,data})=>({id,data}))},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='KartonPaper_costos_privados.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);});
 window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
 window.KP_FINANCE=Object.freeze({mayLeave,connect(value){revision++;client=value;load();},clear(){revision++;client=null;products=[];rows=[];selected=null;dirty=false;busy=false;ready=false;importRows=null;$('fin-rows').replaceChildren();$('fin-form').reset();$('fin-editor').hidden=true;$('fin-file').value='';$('fin-results').replaceChildren();$('fin-search').value='';setBusy(false);for(const id of ['fin-status','fin-save-status','fin-import-status','fin-result-status'])status(id,'');},setCatalog(value){products=value;render();if(selected)preview();}});
 for(const id of ['fin-new','fin-export','fin-import'])$(id).disabled=true;
})();
