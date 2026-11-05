(function(){
 'use strict';const $=id=>document.getElementById('art-'+id);
 const valid=path=>/^posavasos\/[a-f0-9-]{36}--[a-zA-Z0-9_-]{1,60}\.(pdf|png|jpg|jpeg|svg|ai|eps)$/.test(path);
 let client=null,generation=0,loading=false;
 function status(text){$('status').textContent=text;}
 async function download(path){
  if(!client)return;if(!valid(path)){status('Pega la referencia completa del archivo, comenzando por posavasos/.');return;}
  const session=client,current=generation;status('Preparando descarga privada…');
  try{
   const result=await session.storage.from('kp-logos').createSignedUrl(path,60,{download:true});if(current!==generation)return;
   if(result.error||!result.data?.signedUrl)throw new Error('Descarga no disponible');
   const url=new URL(result.data.signedUrl);if(url.protocol!=='https:')throw new Error('URL inválida');
   const link=document.createElement('a');link.href=url.href;link.download=path.split('/').at(-1);link.rel='noopener';link.click();status('Descarga preparada. El enlace privado vence en un minuto.');
  }catch(error){if(current===generation)status('No se pudo descargar. Revisa la referencia, tu sesión y vuelve a intentarlo.');}
 }
 async function load(){
  if(!client||loading)return;const current=generation,session=client;loading=true;$('reload').disabled=true;status('Cargando archivos privados…');$('rows').replaceChildren();
  try{
   const result=await session.storage.from('kp-logos').list('posavasos',{limit:100,sortBy:{column:'created_at',order:'desc'}});if(current!==generation)return;if(result.error||!Array.isArray(result.data))throw new Error('No se cargaron archivos');
   for(const row of result.data){const path='posavasos/'+row.name;if(!valid(path))continue;const tr=document.createElement('tr');for(const value of [row.name.split('--').slice(1).join('--'),row.created_at?new Date(row.created_at).toLocaleString('es-CL',{timeZone:'America/Santiago'}):'—',path]){const td=document.createElement('td');td.textContent=value;tr.append(td);}const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Descargar';button.addEventListener('click',()=>download(path));td.append(button);tr.append(td);$('rows').append(tr);}
   status($('rows').children.length?'Se muestran hasta 100 archivos recientes. Para uno anterior, pega su referencia.':'Todavía no hay archivos de clientes. Aparecerán cuando un cliente adjunte su logo y agregue la solicitud.');$('setup').hidden=true;
  }catch(error){if(current===generation){status('No se cargaron los archivos. Si aún no activaste la carga privada, ejecuta el archivo 23; si ya lo hiciste, revisa la conexión y actualiza.');$('setup').hidden=false;}}
  finally{if(current===generation){loading=false;$('reload').disabled=false;}}
 }
 $('reload').addEventListener('click',load);$('find-form').addEventListener('submit',event=>{event.preventDefault();download($('reference').value.trim());});
 window.KP_CUSTOMER_FILES_ADMIN=Object.freeze({connect(value){generation++;client=value;loading=false;$('find').disabled=false;load();},clear(){generation++;client=null;loading=false;$('rows').replaceChildren();$('reference').value='';$('setup').hidden=true;$('reload').disabled=true;$('find').disabled=true;status('');}});
 $('reload').disabled=true;$('find').disabled=true;
})();
