(function () {
 'use strict';
 const $=id=>document.getElementById(id),categories={general:'General',cerveza:'Cerveza',reposteria:'Repostería',gastronomia:'Gastronomía',bolsas:'Bolsas',doypack:'Doypack',posavasos:'Posavasos'};
 let client,options,assets=[],sources=[],repository=[],busy=false,uploading=false,pending=null,generation=0,loadError=false,loadRevision=0,repositoryError=false,repositoryRevision=0;
 const status=(id,message,kind='')=>{$(id).textContent=message;$(id).className=kind;};
 function safeURL(url){if(typeof url!=='string')return false;if((/^images\/[a-zA-Z0-9._-]+\.(webp|png|jpe?g)$/.test(url)||/^images\/campanas\/(?:[a-z0-9][a-z0-9-]*\/){1,4}[a-zA-Z0-9][a-zA-Z0-9_-]*\.(webp|png|jpe?g)$/.test(url)))return true;const c=window.KP_CATALOG.configuration(),prefix=c?.supabaseUrl.replace(/\/$/,'')+'/storage/v1/object/public/';return !!prefix&&url.startsWith(prefix)&&/^kp-(heroes|productos)\/[a-z0-9-]+\.webp$/.test(url.slice(prefix.length));}
 function entries(){const seen=new Map();for(const asset of [...assets,...sources,...repository])if(safeURL(asset.url)&&!seen.has(asset.url))seen.set(asset.url,asset);return [...seen.values()];}
 function render(){
  const query=$('library-search').value.trim().toLocaleLowerCase('es'),category=$('library-filter').value,all=entries(),visible=all.filter(a=>(category==='all'||a.category===category)&&a.name.toLocaleLowerCase('es').includes(query));
  $('library-grid').replaceChildren();
  for(const asset of visible){const button=document.createElement('button');button.type='button';button.className='library-item';button.disabled=busy;button.setAttribute('aria-label','Usar imagen: '+asset.name);const img=document.createElement('img');img.src=asset.url.startsWith('images/')?'../'+asset.url:asset.url;img.alt='';img.loading='lazy';img.width=180;img.height=130;const name=document.createElement('strong'),note=document.createElement('small');name.textContent=asset.name;note.textContent=(categories[asset.category]||'General')+' · '+(asset.bytes?Math.ceil(asset.bytes/1024)+' KB':asset.source);button.append(img,name,note);button.addEventListener('click',()=>{if(!busy&&options?.apply(asset)){$('library-panel').open=false;status('library-status','Imagen seleccionada. Guarda la campaña para aplicar el cambio.','success');}});$('library-grid').append(button);}
  status('library-status',loadError?'Fotos actuales disponibles. Para guardar imágenes nuevas, ejecuta 07-biblioteca-heroes.sql y actualiza la lista.':`${visible.length} de ${all.length} imágenes`+(visible.length?'':' · No hay coincidencias.'),loadError?'error':'');
  if(repositoryError)$('library-status').textContent+=' · No se pudo cargar la carpeta de campañas. Pulsa Actualizar para reintentar.';
 }
 async function load(){const rev=generation,request=++loadRevision;try{const result=await client.from('kp_hero_assets').select('url,name,category,bytes').order('created_at',{ascending:false});if(rev!==generation||request!==loadRevision)return;if(result.error)throw result.error;assets=result.data||[];loadError=false;}catch(error){if(rev!==generation||request!==loadRevision)return;loadError=true;}render();}
 async function loadRepository(){
  const rev=generation,request=++repositoryRevision;
  try{
   const response=await fetch('../images/campanas/catalogo.json',{cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw Error('catalogo');
   const data=await response.json();
   if(!Array.isArray(data.campanas))throw Error('formato');
   const next=[];
   for(const campaign of data.campanas)for(const item of campaign.imagenes||[]){
    const url='images/campanas/'+item.archivo;
    if(safeURL(url))next.push({url,name:item.nombre||item.id,category:categories[item.categoria]?item.categoria:'general',bytes:item.bytes,source:'Carpeta de campañas'});
   }
   if(rev!==generation||request!==repositoryRevision)return;
   repository=next;repositoryError=false;
  }catch(error){if(rev!==generation||request!==repositoryRevision)return;repositoryError=true;}
  render();
 }
 function updateSources(products,campaigns){sources=[...products.map(p=>({url:p.data.image,name:p.data.name,category:p.data.category,source:'Catálogo'})),...campaigns.map(r=>({url:r.data.image,name:r.data.title,category:'general',source:'Campaña'}))];render();if(client){load();loadRepository();}}
 function setBusy(value){busy=value;for(const el of $('library-form').elements)el.disabled=value;$('library-search').disabled=value;$('library-filter').disabled=value;render();}
 function clear(){generation++;loadRevision++;assets=[];sources=[];repository=[];repositoryError=false;repositoryRevision++;pending=null;loadError=false;client=null;options=null;busy=false;uploading=false;$('library-grid').replaceChildren();$('library-form').reset();$('library-panel').open=false;status('library-status','');status('library-upload-status','');}
 $('library-search').addEventListener('input',render);$('library-filter').addEventListener('change',render);
 $('choose-library').addEventListener('click',()=>{$('library-panel').open=true;$('library-search').focus();});
 $('library-file').addEventListener('change',()=>{pending=null;status('library-upload-status','');});
 $('library-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!client)return;
  const name=$('library-name').value.trim(),category=$('library-category').value,file=$('library-file').files[0];
  if(!name||name.length>120||!categories[category]||!file){status('library-upload-status','Completa nombre, categoría e imagen.','error');return;}
  uploading=true;const rev=generation;options?.onBusy(true);setBusy(true);status('library-upload-status','Optimizando imagen…');
  try{
   if(!pending){const blob=await window.KP_IMAGES.prepare(file,{hero:true});if(rev!==generation)return;const filename=crypto.randomUUID()+'.webp',url=window.KP_CATALOG.configuration().supabaseUrl.replace(/\/$/,'')+'/storage/v1/object/public/kp-heroes/'+filename;pending={blob,filename,url,uploaded:false};}
   if(!pending.uploaded){status('library-upload-status','Subiendo imagen…');const result=await client.storage.from('kp-heroes').upload(pending.filename,pending.blob,{contentType:'image/webp',cacheControl:'31536000',upsert:false});if(rev!==generation)return;if(result.error)throw result.error;pending.uploaded=true;}
   const value={url:pending.url,name,category,bytes:pending.blob.size};
   const result=await client.from('kp_hero_assets').insert(value).select('url,name,category,bytes').single();if(rev!==generation)return;if(result.error&&result.error.code!=='23505')throw result.error;
   loadRevision++;assets=[result.data||value,...assets.filter(a=>a.url!==value.url)];loadError=false;pending=null;$('library-form').reset();status('library-upload-status','Imagen guardada. Ya puedes elegirla para una campaña.','success');render();
  }catch(error){if(rev===generation)status('library-upload-status','No se guardó la imagen: '+(error.message||'revisa conexión y sesión')+'. Puedes reintentar; la foto subida se reutilizará.','error');}
  finally{if(rev===generation){uploading=false;options?.onBusy(false);setBusy(false);}}
 });
 window.KP_LIBRARY=Object.freeze({init:(api,callbacks)=>{client=api;options=callbacks;},updateSources,setBusy,clear,isUploading:()=>uploading});
})();
