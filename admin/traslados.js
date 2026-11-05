(function(){
 'use strict';
 const $=id=>document.getElementById('trip-'+id);
 const money=n=>'$'+new Intl.NumberFormat('es-CL',{maximumFractionDigits:2}).format(n);
 const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let client=null,rows=[],selected=null,dirty=false,busy=false,ready=false,generation=0,request=0;
 function status(text,kind=''){$('status').textContent=text;$('status').className=kind;}
 function mayLeave(){return !busy&&(!dirty||window.confirm('Hay un traslado sin guardar. ¿Quieres descartarlo?'));}
 function lock(value){busy=value;for(const button of $('rows').querySelectorAll('button'))button.disabled=value||!ready;for(const el of $('form').elements)el.disabled=value||!ready;$('reload').disabled=value||!client;$('month').disabled=value||!client;window.KP_PANEL?.busy(value);}
 function reset(){selected=null;dirty=false;$('form').reset();$('date').value=today();$('cost').value='1500';$('orders').value='1';$('title').textContent='Registrar un viaje';$('save').textContent='Guardar viaje';preview();}
 function read(){
  const data={trip_date:$('date').value,cost:Number($('cost').value),orders:Number($('orders').value),reference:$('reference').value.trim(),voided:$('voided').checked};
  const parsed=new Date(data.trip_date+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data.trip_date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==data.trip_date||data.trip_date<'2000-01-01'||data.trip_date>'2100-12-31')throw new Error('Completa una fecha válida.');
  if($('cost').value===''||!Number.isSafeInteger(data.cost)||data.cost<0||data.cost>1e9)throw new Error('Ingresa el costo del viaje en pesos enteros, desde $0.');
  if(!Number.isSafeInteger(data.orders)||data.orders<1||data.orders>10000)throw new Error('Ingresa entre 1 y 10.000 pedidos transportados.');
  if(data.reference.length>1000)throw new Error('Las referencias deben tener hasta 1.000 caracteres.');return data;
 }
 function preview(){try{const data=read();$('allocation').textContent=data.voided?'Viaje anulado: no suma al gasto.':money(data.cost)+' por viaje ÷ '+data.orders+' pedido(s) = '+money(data.cost/data.orders)+' por pedido, en promedio.';}catch(error){$('allocation').textContent=error.message;}}
 function render(){
  $('rows').replaceChildren();let cost=0,orders=0,count=0;
  for(const row of rows){
   if(!row.voided){cost+=row.cost;orders+=row.orders;count++;}
   const tr=document.createElement('tr');
   for(const value of [row.trip_date.split('-').reverse().join('/'),money(row.cost),row.orders,money(row.cost/row.orders),row.reference||'Sin referencia',row.voided?'Anulado':'Registrado']){const td=document.createElement('td');td.textContent=value;tr.append(td);}
   const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Editar';button.disabled=busy;
   button.addEventListener('click',()=>{if(!mayLeave())return;selected={...row};for(const key of ['date','cost','orders','reference'])$(key).value=row[key==='date'?'trip_date':key];$('voided').checked=row.voided;dirty=false;$('title').textContent='Editar viaje';$('save').textContent='Guardar cambios';preview();$('date').focus();});td.append(button);tr.append(td);$('rows').append(tr);
  }
  if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=7;td.textContent=ready?'Sin viajes en este mes. Registra un viaje cuando entregues paquetes en Starken.':'Los viajes aparecerán al activar o actualizar el registro.';tr.append(td);$('rows').append(tr);}
  $('summary').textContent=ready?count+' viajes · '+money(cost)+' de gasto · '+orders+' pedidos · '+(orders?money(cost/orders):'$0')+' por pedido en promedio.':'Gasto del mes pendiente de cargar.';
 }
 async function load(){
  if(!client||busy)return;const current=generation,token=++request,session=client;
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test($('month').value)){status('Selecciona un mes válido.','error');return;}
  const from=$('month').value+'-01',end=new Date(from+'T00:00:00Z');end.setUTCMonth(end.getUTCMonth()+1);
  ready=false;rows=[];render();lock(true);status('Cargando viajes privados…');
  try{
   const loaded=[];
   for(let offset=0;;offset+=500){
    const result=await session.from('kp_dispatch_trips').select('id,trip_date,cost,orders,reference,voided,version').gte('trip_date',from).lt('trip_date',end.toISOString().slice(0,10)).order('trip_date',{ascending:false}).order('id').range(offset,offset+499);
    if(current!==generation||token!==request)return;if(result.error)throw result.error;
    if(!Array.isArray(result.data))throw new Error('Respuesta inválida');loaded.push(...result.data);
    if(loaded.length>1000)throw new Error('El mes supera 1.000 registros');if(result.data.length<500)break;
   }
   rows=loaded;ready=true;$('month').dataset.loadedMonth=$('month').value;$('setup').hidden=true;status('Viajes del mes cargados. Los anulados se conservan y no suman al gasto.');render();
  }catch(error){if(current!==generation||token!==request)return;rows=[];ready=false;render();$('setup').hidden=false;status('No se cargaron los viajes. Activa el archivo 15 si aún no lo hiciste; si ya está activo, revisa la conexión y pulsa Actualizar viajes.','error');}
  finally{if(current===generation&&token===request)lock(false);}
 }
 $('form').addEventListener('input',()=>{dirty=true;preview();});
 $('new').addEventListener('click',()=>{if(mayLeave()){reset();status('Nuevo viaje: ajusta la fecha y los pedidos antes de guardar.');}});
 $('month').addEventListener('change',()=>{if(mayLeave()){reset();load();}else $('month').value=$('month').dataset.loadedMonth||today().slice(0,7);});
 $('reload').addEventListener('click',()=>{if(mayLeave()){reset();load();}});
 $('form').addEventListener('submit',async event=>{
  event.preventDefault();if(!client||busy||!ready)return;let data;try{data=read();}catch(error){status(error.message,'error');return;}
  const current=generation,session=client;selected??={id:crypto.randomUUID(),isNew:true};const row={...selected};lock(true);status('Guardando viaje…');
  try{
   const query=row.isNew?session.from('kp_dispatch_trips').insert({id:row.id,...data}):session.from('kp_dispatch_trips').update(data).eq('id',row.id).eq('version',row.version);
   const result=await query.select('id,trip_date,cost,orders,reference,voided,version').maybeSingle();if(current!==generation)return;if(result.error)throw result.error;
   if(!result.data){status('El viaje cambió en otra sesión. Conserva tus datos y pulsa Actualizar viajes para revisar la última versión.','error');return;}
   reset();$('month').value=data.trip_date.slice(0,7);lock(false);await load();if(current===generation&&ready)status('Viaje guardado. El gasto se cuenta una sola vez y el promedio se reparte entre los pedidos.','success');
  }catch(error){if(current===generation)status('No se confirmó el guardado. Conserva los datos y actualiza el registro para comprobar si el viaje quedó guardado antes de volver a ingresarlo.','error');}
  finally{if(current===generation)lock(false);}
 });
 window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
 window.KP_TRIPS=Object.freeze({mayLeave,connect(value){generation++;busy=false;ready=false;rows=[];client=value;reset();$('month').value=today().slice(0,7);load();},clear(){generation++;request++;client=null;rows=[];ready=false;busy=false;reset();$('reference').value='';$('month').value='';$('setup').hidden=true;status('');render();lock(false);}});
 reset();render();lock(false);
})();
